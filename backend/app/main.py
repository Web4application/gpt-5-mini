# backend/app/main.py
from fastapi import FastAPI, HTTPException, Depends, Header
import os, requests
from pydantic import BaseModel

app = FastAPI()

OPENAI_KEY = os.environ.get("OPENAI_API_KEY")  # rotate now if leaked

class Prompt(BaseModel):
    prompt: str

def verify_token(auth: str = Header(None)):
    # very simple; replace with JWT verify
    if not auth or not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing auth")
    token = auth.split(" ")[1]
    # TODO: verify JWT
    return {"sub": "tester"}

@app.post("/api/generate")
def generate(payload: Prompt, user=Depends(verify_token)):
    # watermark + log: create signature (store later)
    # For now: forward to OpenAI
    resp = requests.post(
        "https://api.openai.com/v1/chat/completions",
        headers={"Authorization": f"Bearer {OPENAI_KEY}"},
        json={
            "model": "gpt-4o-mini",  # replace with target
            "messages": [{"role":"system","content":"You are ChatGPT-5 (proxy)."},
                         {"role":"user","content":payload.prompt}],
            "max_tokens": 512
        },
        timeout=30
    )
    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail="Model error")
    data = resp.json()
    # store logs: prompt_hash, user, timestamp, output -> S3 or DB (omitted here)
    return {"output": data}
