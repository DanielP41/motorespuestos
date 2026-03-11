from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class RepuestoBase(BaseModel):
    sku: str
    nombre: str
    descripcion: Optional[str] = None
    precio_venta: float
    precio_compra: Optional[float] = None
    precio_venta_min: Optional[float] = None
    stock_actual: int = 0
    stock_minimo: int = 0
    categoria_id: Optional[int] = None
    unidad_medida_id: Optional[int] = None
    es_original: bool = True
    estado: str = "activo"

class RepuestoCreate(RepuestoBase):
    pass

class RepuestoUpdate(BaseModel):
    sku: Optional[str] = None
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    precio_venta: Optional[float] = None
    stock_actual: Optional[int] = None
    categoria_id: Optional[int] = None
    es_original: Optional[bool] = None
    estado: Optional[str] = None

class RepuestoOut(RepuestoBase):
    id: int
    creado_en: datetime
    actualizado_en: datetime

    class Config:
        from_attributes = True
