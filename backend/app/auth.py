# backend/app/auth.py
from datetime import datetime, timedelta
from jose import jwt, JWTError

SECRET_KEY = "APKTIDtCGtKsuRDzP5yI5vRUXpptdNQLMRS8lHokB8oUdS08MiUA"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 7

def create_access_token(data: dict, expires_delta: int|None = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
