from pydantic import BaseModel
from typing import Optional, List

class RepuestoBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    precio: float
    stock: int

class RepuestoCreate(RepuestoBase):
    pass

class Repuesto(RepuestoBase):
    id: int

    class Config:
        from_attributes = True
