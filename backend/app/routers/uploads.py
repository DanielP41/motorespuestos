from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, status
from PIL import Image
import io
import os
import uuid
from .auth import get_current_user

router = APIRouter()

UPLOAD_DIR = "app/uploads"
MAX_SIZE = 5 * 1024 * 1024  # 5 MB
WEBP_QUALITY = 85
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")
ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP", "GIF"}


def _require_admin(current_user=Depends(get_current_user)):
    if getattr(current_user, "role", None) not in ["admin", "vendedor"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo admin/vendedor")
    return current_user


@router.post("/")
async def upload_image(file: UploadFile = File(...), _=Depends(_require_admin)):
    contents = await file.read()
    if len(contents) > MAX_SIZE:
        raise HTTPException(status_code=413, detail="La imagen no puede superar 5 MB")

    # Validar el contenido real con PIL — ignora el Content-Type header (puede ser falsificado)
    try:
        image = Image.open(io.BytesIO(contents))
        if image.format not in ALLOWED_FORMATS:
            raise HTTPException(status_code=400, detail="Formato no permitido. Usá JPEG, PNG, WEBP o GIF")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=400, detail="El archivo no es una imagen válida")

    try:
        # RGBA (PNG con transparencia) necesita fondo blanco antes de convertir a WebP
        if image.mode in ("RGBA", "P"):
            background = Image.new("RGB", image.size, (255, 255, 255))
            background.paste(image, mask=image.split()[-1] if image.mode == "RGBA" else None)
            image = background
        elif image.mode != "RGB":
            image = image.convert("RGB")

        webp_buffer = io.BytesIO()
        image.save(webp_buffer, format="WEBP", quality=WEBP_QUALITY)
        webp_bytes = webp_buffer.getvalue()
    except Exception:
        raise HTTPException(status_code=400, detail="No se pudo procesar la imagen")

    unique_filename = f"{uuid.uuid4()}.webp"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    try:
        with open(file_path, "wb") as buffer:
            buffer.write(webp_bytes)
    except Exception:
        raise HTTPException(status_code=500, detail="Error al guardar la imagen")

    return {"url": f"{API_BASE_URL}/uploads/{unique_filename}"}
