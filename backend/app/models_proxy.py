# backend/app/models_proxy.py
from fastapi import APIRouter, Depends, HTTPException
import requests, os

router = APIRouter()

@router.post("/generate")
def generate(prompt: dict, user=Depends(get_current_user)):
    # server-side: authenticate, rate-limit, watermark, log
    payload = {"prompt": prompt["text"], "max_tokens": 512}
    # Example: call your SageMaker endpoint (or OpenAI)
    resp = requests.post(
        os.environ["SAGEMAKER_ENDPOINT_URL"],
        json=payload,
        headers={"Authorization": f"Bearer {os.environ['INTERNAL_MODEL_KEY']}"}
    )
    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail="Model error")
    generated = resp.json()
    # store log: prompt hash, timestamp, user_id, model_version
    return {"output": generated}
