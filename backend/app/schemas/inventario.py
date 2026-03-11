from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class RepuestoMini(BaseModel):
    id: int
    nombre: str
    sku: Optional[str] = None

    class Config:
        from_attributes = True


class MovimientoInventarioBase(BaseModel):
    repuesto_id: int
    tipo: str
    cantidad: int
    costo_unitario: Optional[float] = None
    referencia_id: Optional[int] = None
    referencia_tipo: Optional[str] = None
    usuario: Optional[str] = None
    notas: Optional[str] = None


class MovimientoInventarioCreate(MovimientoInventarioBase):
    pass


class MovimientoInventarioOut(MovimientoInventarioBase):
    id: int
    stock_anterior: int
    stock_posterior: int
    creado_en: datetime
    repuesto: Optional[RepuestoMini] = None

    class Config:
        from_attributes = True
