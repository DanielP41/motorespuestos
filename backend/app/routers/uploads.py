from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
import shutil
import os
import uuid
from .auth import get_current_user

router = APIRouter()

UPLOAD_DIR = "app/uploads"

@router.post("/")
async def upload_image(file: UploadFile = File(...), current_user = Depends(get_current_user)):
    # Verify file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="El archivo debe ser una imagen")
    
    # Generate unique filename
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    # Save file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al guardar la imagen: {str(e)}")
    
    # Return the URL (assuming frontend can access via /uploads/filename)
    return {"url": f"http://localhost:8000/uploads/{unique_filename}"}
