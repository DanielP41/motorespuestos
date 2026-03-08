from pydantic import BaseModel
from typing import Optional, List

class RepuestoBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    precio: float
    stock: int

class RepuestoCreate(RepuestoBase):
    pass

class RepuestoUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    precio: Optional[float] = None
    stock: Optional[int] = None

class RepuestoOut(RepuestoBase):
    id: int

    class Config:
        from_attributes = True
