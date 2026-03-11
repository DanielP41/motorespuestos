from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ItemVentaBase(BaseModel):
    repuesto_id: int
    cantidad: int
    precio_unitario: float
    descuento_pct: float = 0.0

class ItemVentaCreate(ItemVentaBase):
    pass

class ItemVentaOut(ItemVentaBase):
    id: int
    venta_id: int
    subtotal: float
    creado_en: datetime

    class Config:
        from_attributes = True

class VentaBase(BaseModel):
    numero_factura: Optional[str] = None
    metodo_pago: str
    cliente_id: Optional[int] = None
    notas: Optional[str] = None
    impuesto_pct: float = 0.0

class VentaCreate(VentaBase):
    items: List[ItemVentaCreate]

class VentaOut(BaseModel):
    id: int
    numero_factura: str
    fecha: datetime
    usuario: Optional[str] = None
    cliente_id: Optional[int] = None
    metodo_pago: str
    notas: Optional[str] = None
    impuesto_pct: float
    estado: str
    subtotal: float
    descuento_total: float
    impuesto_monto: float
    total: float
    items: List[ItemVentaOut]

    class Config:
        from_attributes = True
