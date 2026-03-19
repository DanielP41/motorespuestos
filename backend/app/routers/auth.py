import os
import uuid
import smtplib
from email.mime.text import MIMEText
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import JWTError, jwt
from pydantic import BaseModel, EmailStr

from ..database import get_db
from ..models import User, Cliente
from ..schemas.user import UserCreate, UserOut, Token, TokenData
from ..auth_utils import verify_password, get_password_hash, create_access_token, SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from ..limiter import limiter
from ..logger import logger

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")


async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        sub: str = payload.get("sub")
        role: str = payload.get("role")
        iat: int = payload.get("iat")
        if sub is None:
            raise credentials_exception
        token_data = TokenData(username=sub)
    except JWTError:
        raise credentials_exception

    if role in ["admin", "vendedor"]:
        user = db.query(User).filter(User.username == token_data.username).first()
    else:
        user = db.query(Cliente).filter(Cliente.email == token_data.username).first()

    if user is None:
        raise credentials_exception

    # Check if token was issued before logout
    if iat and user.token_invalidated_at:
        token_issued_at = datetime.utcfromtimestamp(iat)
        if token_issued_at < user.token_invalidated_at:
            raise credentials_exception

    return user


@router.post("/registro", response_model=UserOut)
@limiter.limit("5/minute")
def register(request: Request, user: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username already registered")
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        username=user.username,
        email=user.email,
        hashed_password=get_password_hash(user.password),
        nombre_completo=user.nombre_completo,
        role=user.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/token", response_model=Token)
@router.post("/login", response_model=Token)
@limiter.limit("10/minute")
def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if user and verify_password(form_data.password, user.hashed_password):
        role, sub = user.role, user.username
    else:
        cliente = db.query(Cliente).filter(Cliente.email == form_data.username).first()
        if cliente and cliente.hashed_password and verify_password(form_data.password, cliente.hashed_password):
            role, sub = "cliente", cliente.email
        else:
            logger.warning("Login fallido para usuario '{}'", form_data.username)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

    logger.info("Login exitoso — usuario='{}' rol='{}'", sub, role)
    access_token = create_access_token(
        data={"sub": sub, "role": role},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    """Invalida todos los tokens emitidos antes de este momento."""
    current_user.token_invalidated_at = datetime.utcnow()
    db.commit()
    logger.info("Logout — usuario='{}'", getattr(current_user, 'username', getattr(current_user, 'email', '?')))


@router.get("/me", response_model=UserOut)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user


# ── Password Reset ────────────────────────────────────────────────────────────

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


def _send_reset_email(to_email: str, reset_url: str):
    """Envía email con el link de reset. Si no hay SMTP configurado, loguea el link."""
    smtp_host = os.getenv("SMTP_HOST")
    if not smtp_host:
        logger.warning("SMTP no configurado — link de reset para {}: {}", to_email, reset_url)
        return

    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_pass = os.getenv("SMTP_PASS", "")
    smtp_from = os.getenv("SMTP_FROM", smtp_user)

    body = f"""Hola,

Recibimos una solicitud para restablecer tu contraseña.

Hacé clic en el siguiente enlace (válido por 1 hora):
{reset_url}

Si no solicitaste este cambio, ignorá este mensaje.

— Moto Repuestos
"""
    msg = MIMEText(body)
    msg["Subject"] = "Restablecer contraseña — Moto Repuestos"
    msg["From"] = smtp_from
    msg["To"] = to_email

    try:
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            if smtp_user:
                server.login(smtp_user, smtp_pass)
            server.sendmail(smtp_from, [to_email], msg.as_string())
    except Exception as e:
        logger.error("Error enviando email de reset a {}: {}", to_email, e)


@router.post("/forgot-password", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("5/minute")
def forgot_password(request: Request, body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Genera token de reset y envía email. Siempre responde 204 para no revelar si el email existe."""
    token = str(uuid.uuid4())
    expires = datetime.utcnow() + timedelta(hours=1)

    # Busca en usuarios admin/vendedor primero, luego en clientes
    user = db.query(User).filter(User.email == body.email).first()
    if not user:
        user = db.query(Cliente).filter(Cliente.email == body.email).first()

    if user:
        user.password_reset_token = token
        user.password_reset_expires = expires
        db.commit()

        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
        reset_url = f"{frontend_url}/reset-password?token={token}"
        _send_reset_email(body.email, reset_url)
        logger.info("Reset password solicitado para '{}'", body.email)


@router.post("/reset-password", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("5/minute")
def reset_password(request: Request, body: ResetPasswordRequest, db: Session = Depends(get_db)):
    now = datetime.utcnow()

    user = db.query(User).filter(
        User.password_reset_token == body.token,
        User.password_reset_expires > now
    ).first()
    if not user:
        user = db.query(Cliente).filter(
            Cliente.password_reset_token == body.token,
            Cliente.password_reset_expires > now
        ).first()

    if not user:
        raise HTTPException(status_code=400, detail="Token inválido o expirado")

    if len(body.new_password) < 8:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 8 caracteres")

    user.hashed_password = get_password_hash(body.new_password)
    user.password_reset_token = None
    user.password_reset_expires = None
    user.token_invalidated_at = now  # invalida todos los tokens anteriores
    db.commit()
    logger.info("Contraseña restablecida exitosamente")
