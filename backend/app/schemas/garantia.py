from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional, List

class GarantiaBase(BaseModel):
    venta_detalle_id: int
    cliente_id: int
    repuesto_id: int
    fecha_vencimiento: date
    dias_garantia: Optional[int] = 90
    descripcion_falla: str
    notas_resolucion: Optional[str] = None

class GarantiaCreate(GarantiaBase):
    pass

class GarantiaUpdate(BaseModel):
    estado: Optional[str] = None
    resolucion: Optional[str] = None
    notas_resolucion: Optional[str] = None
    cerrado_en: Optional[datetime] = None

class GarantiaSeguimientoBase(BaseModel):
    descripcion: str
    usuario: Optional[str] = None

class GarantiaSeguimientoCreate(GarantiaSeguimientoBase):
    pass

class GarantiaSeguimientoOut(GarantiaSeguimientoBase):
    id: int
    garantia_id: int
    fecha: datetime

    class Config:
        from_attributes = True

class GarantiaOut(GarantiaBase):
    id: int
    fecha_apertura: datetime
    estado: str
    usuario: Optional[str] = None
    creado_en: datetime
    actualizado_en: datetime
    seguimientos: List[GarantiaSeguimientoOut] = []

    class Config:
        from_attributes = True
