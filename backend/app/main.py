# backend/app/main.py
import os, requests, hashlib, json
from fastapi import FastAPI, HTTPException, Depends, Header, Request
from pydantic import BaseModel
from .auth import create_access_token, decode_token, hash_password, verify_password
from .watermark import make_signature, store_record
from .rate_limiter import check_rate_limit

app = FastAPI(title="ChatGPT-5 Secure API")

OPENAI_KEY = os.environ.get("OPENAI_API_KEY")
MODEL_NAME = os.environ.get("LLM_MODEL", "gpt-4o-mini")

# --- very small in-memory user store for demo; replace with DB in prod ----
_USERS = {"admin": {"password_hash": hash_password("change_this_pass")}}

class LoginIn(BaseModel):
    username: str
    password: str

class Prompt(BaseModel):
    prompt: str

@app.post("/auth/login")
def login(data: LoginIn):
    user = _USERS.get(data.username)
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(data.username)
    return {"access_token": token}

def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    token = authorization.split(" ")[1]
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    return payload.get("sub")

@app.post("/api/generate")
def generate(payload: Prompt, user=Depends(get_current_user)):
    # rate limit per-user
    check_rate_limit(user, limit_per_minute=int(os.environ.get("RATE_LIMIT_PER_MIN", "30")))

    # watermark signature + store log
    sig, record = make_signature(payload.prompt, user)
    record["prompt_text"] = payload.prompt
    log_location = store_record(record)

    # forward to OpenAI (server-side)
    if not OPENAI_KEY:
        raise HTTPException(status_code=500, detail="Missing model key")
    resp = requests.post(
        "https://api.openai.com/v1/chat/completions",
        headers={"Authorization": f"Bearer {OPENAI_KEY}", "Content-Type": "application/json"},
        json={
            "model": MODEL_NAME,
            "messages": [{"role":"system","content":"You are ChatGPT-5 (proxy)."}, {"role":"user","content": payload.prompt}],
            "max_tokens": 512
        },
        timeout=30
    )
    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail="Model provider error")
    data = resp.json()
    # attach watermark meta to response
    return {"output": data, "watermark": {"signature": sig, "log": log_location}}
