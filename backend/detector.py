# backend/detector.py
import base64, hmac, hashlib
def detect_watermark(text, tokenization_func, stored_sig):
    # tokenization_func -> list of token ids
    token_ids = tokenization_func(text)
    seed_bytes = base64.urlsafe_b64decode(stored_sig)
    # compute expected bias pattern and compare distribution across tokens
    # (This is conceptual — actual detector computes statistical correlation)
    # For a quick check, compute detection score by re-running nudge and seeing alignment
    return detection_score  # float
