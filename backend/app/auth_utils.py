import os
import bcrypt
from datetime import datetime, timedelta
from typing import Optional
from jose import jwt
from dotenv import load_dotenv

load_dotenv()

_secret_key = os.getenv("SECRET_KEY")
if not _secret_key:
    raise RuntimeError(
        "La variable de entorno SECRET_KEY no está configurada. "
        "Generá una con: openssl rand -hex 32"
    )
SECRET_KEY: str = _secret_key
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    now = datetime.utcnow()
    expire = now + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "iat": now})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
