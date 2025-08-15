# backend/app/watermark.py
import os, hmac, hashlib, base64, json, time
import boto3

WATERMARK_KEY = os.environ.get("WATERMARK_KEY", None)  # must be long & rotated
S3_BUCKET = os.environ.get("WATERMARK_S3_BUCKET", None)

def make_signature(prompt_text: str, user_id: str):
    prompt_hash = hashlib.sha256(prompt_text.encode("utf-8")).hexdigest()
    timestamp = int(time.time())
    payload = f"{prompt_hash}|{user_id}|{timestamp}"
    sig = hmac.new(WATERMARK_KEY.encode("utf-8"), payload.encode("utf-8"), hashlib.sha256).digest()
    token = base64.urlsafe_b64encode(sig).decode("utf-8")
    record = {
        "prompt_hash": prompt_hash,
        "user_id": user_id,
        "timestamp": timestamp,
        "signature": token,
        "algo": "HMAC-SHA256-v1",
    }
    return token, record

def store_record(record: dict):
    if not S3_BUCKET:
        path = f"/tmp/wm_{record['timestamp']}_{record['user_id']}.json"
        with open(path, "w") as f:
            json.dump(record, f)
        return path
    s3 = boto3.client("s3")
    key = f"watermarks/{record['timestamp']}_{record['user_id']}.json"
    s3.put_object(Bucket=S3_BUCKET, Key=key, Body=json.dumps(record).encode("utf-8"))
    return f"s3://{S3_BUCKET}/{key}"

def nudge_logit_bias_from_signature(sig_token: str, token_ids):
    seed = base64.urlsafe_b64decode(sig_token.encode("utf-8"))
    biases = {}
    for tid in token_ids:
        d = int.from_bytes(hashlib.sha256(seed + str(tid).encode('utf-8')).digest()[:4], "big")
        biases[str(tid)] = (d % 11) - 5  # bias in -5..+5
    return biases
