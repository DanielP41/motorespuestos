from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ItemVentaBase(BaseModel):
    repuesto_id: int
    cantidad: int
    precio_unitario: float

class ItemVentaCreate(ItemVentaBase):
    pass

class ItemVentaOut(ItemVentaBase):
    id: int
    venta_id: int
    subtotal: float

    class Config:
        from_attributes = True

class VentaBase(BaseModel):
    metodo_pago: str
    total: float
    cliente_id: Optional[int] = None

class VentaCreate(VentaBase):
    items: List[ItemVentaCreate]

class VentaOut(VentaBase):
    id: int
    fecha: datetime
    vendedor_id: int
    estado: str
    items: List[ItemVentaOut]

    class Config:
        from_attributes = True
