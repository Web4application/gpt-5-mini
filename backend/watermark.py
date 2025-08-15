# backend/watermark.py
import hmac, hashlib, json, os, base64
from datetime import datetime

SECRET = os.environ.get("WATERMARK_KEY", "SECRET_KEY_CHANGE_ME")

def make_signature(prompt_text, user_id):
    data = f"{hashlib.sha256(prompt_text.encode()).hexdigest()}|{user_id}|{int(datetime.utcnow().timestamp())}"
    sig = hmac.new(SECRET.encode(), data.encode(), hashlib.sha256).digest()
    token = base64.urlsafe_b64encode(sig).decode()
    return token, data

def nudge_token_probs(token_ids, seed_bytes):
    # token_ids: candidate token ids for next token
    # seed_bytes deterministic bytes from signature
    # we'll score tokens with a pseudo-random deterministic function
    out = {}
    for i, tid in enumerate(token_ids):
        d = int.from_bytes(hmac.new(seed_bytes, str(tid).encode(), hashlib.sha256).digest()[:4], 'big')
        # compute small bias in -12..+12 logits (tiny)
        bias = (d % 25) - 12
        out[tid] = bias
    return out  # use this as logit_bias: {token_id: bias}
