from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from sqlalchemy import text
import os

from .logger import logger
from .middleware import RequestLoggingMiddleware, SecurityHeadersMiddleware
from .database import SessionLocal
from .routers import repuestos, ventas, clientes, inventario, garantias, auth, stats, uploads, catalogo, pagos
from .limiter import limiter

app = FastAPI(title="Moto-Repuestos API")

# Rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS — configurar ALLOWED_ORIGINS en .env (comma-separated)
_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000")
allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestLoggingMiddleware)

# Ensure uploads directory exists
UPLOAD_DIR = "app/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Include routers
app.include_router(repuestos.router,  prefix="/repuestos",   tags=["Repuestos"])
app.include_router(ventas.router,     prefix="/ventas",      tags=["Ventas"])
app.include_router(clientes.router,   prefix="/clientes",    tags=["Clientes"])
app.include_router(inventario.router, prefix="/inventario",  tags=["Inventario"])
app.include_router(garantias.router,  prefix="/garantias",   tags=["Garantías"])
app.include_router(auth.router,       prefix="/auth",        tags=["Auth"])
app.include_router(stats.router,      prefix="/stats",       tags=["Stats"])
app.include_router(uploads.router,    prefix="/uploads-api", tags=["Uploads"])
app.include_router(catalogo.router,   prefix="/catalogo",    tags=["Catálogo"])
app.include_router(pagos.router,      prefix="/pagos",       tags=["Pagos"])


@app.get("/")
def read_root():
    return {"message": "Moto-Repuestos API is running"}


@app.get("/health", tags=["Health"])
def health_check():
    """Verifica que la API y la base de datos estén operativas."""
    db_status = "ok"
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
    except Exception as e:
        logger.error("Health check — DB connection failed: {}", e)
        db_status = "error"

    status = "ok" if db_status == "ok" else "degraded"
    logger.info("Health check → status={} db={}", status, db_status)
    return {"status": status, "db": db_status}


@app.on_event("startup")
async def on_startup():
    logger.info("🚀 Moto-Repuestos API iniciada — entorno={}", os.getenv("ENV", "development"))


@app.on_event("shutdown")
async def on_shutdown():
    logger.info("🛑 Moto-Repuestos API detenida")
