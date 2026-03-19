import sys
import os
from loguru import logger

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
LOG_DIR = "logs"

# Remove default handler
logger.remove()

# Console handler — colorized, human-readable
logger.add(
    sys.stdout,
    level=LOG_LEVEL,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{line}</cyan> — <level>{message}</level>",
    colorize=True,
)

# File handler — rotación diaria, retención 30 días, comprimido
os.makedirs(LOG_DIR, exist_ok=True)
logger.add(
    f"{LOG_DIR}/app.log",
    level=LOG_LEVEL,
    format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{line} — {message}",
    rotation="00:00",       # rota a medianoche
    retention="30 days",    # guarda 30 días
    compression="zip",
    encoding="utf-8",
)

# Archivo separado solo para errores
logger.add(
    f"{LOG_DIR}/errors.log",
    level="ERROR",
    format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{line} — {message}\n{exception}",
    rotation="00:00",
    retention="60 days",
    compression="zip",
    encoding="utf-8",
)
