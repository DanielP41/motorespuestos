from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class RepuestoBase(BaseModel):
    codigo: str
    nombre: str
    descripcion: Optional[str] = None
    precio: float
    stock: int = 0
    categoria: Optional[str] = None
    marca: Optional[str] = None
    compatibilidad: Optional[str] = None
    imagen_url: Optional[str] = None
    is_active: Optional[bool] = True

class RepuestoCreate(RepuestoBase):
    pass

class RepuestoUpdate(BaseModel):
    codigo: Optional[str] = None
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    precio: Optional[float] = None
    stock: Optional[int] = None
    categoria: Optional[str] = None
    marca: Optional[str] = None
    compatibilidad: Optional[str] = None
    imagen_url: Optional[str] = None
    is_active: Optional[bool] = None

class RepuestoOut(RepuestoBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
