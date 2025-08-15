from fastapi import APIRouter, Depends, Header, HTTPException
import os, requests
from .auth import verify_token
from .watermark import make_signature, nudge_token_probs  # implement watermark helpers

router = APIRouter()

def get_current_user(authorization: str = Header(None)):
    if not authorization: raise HTTPException(401, "Missing auth")
    token = authorization.split(" ")[1]
    payload = verify_token(token)
    if not payload: raise HTTPException(401, "Invalid token")
    return payload

@router.post("/generate")
def generate(payload: dict, user=Depends(get_current_user)):
    prompt = payload.get("prompt")
    # create signature and store log
    sig, sigdata = make_signature(prompt, user.get("sub"))
    # prepare model call with logit bias (if supported)
    logit_bias = {}  # compute with nudge_token_probs
    model_resp = requests.post(
        os.environ["MODEL_PROXY_URL"],
        json={"prompt": prompt, "logit_bias": logit_bias},
        headers={"Authorization": f"Bearer {os.environ['MODEL_PROXY_KEY']}"}
    )
    if model_resp.status_code != 200:
        raise HTTPException(502, "Model error")
    result = model_resp.json()
    # store log to S3 (boto3) — omitted here; add in production
    return {"output": result, "watermark_sig": sig}
