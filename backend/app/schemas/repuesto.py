from pydantic import BaseModel, computed_field
from typing import Optional, List
from datetime import datetime


class RepuestoImagenOut(BaseModel):
    id: int
    url: str
    orden: int
    es_principal: bool

    class Config:
        from_attributes = True


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
    imagen_url: Optional[str] = None


class RepuestoUpdate(BaseModel):
    sku: Optional[str] = None
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    precio_venta: Optional[float] = None
    precio_compra: Optional[float] = None
    precio_venta_min: Optional[float] = None
    stock_actual: Optional[int] = None
    stock_minimo: Optional[int] = None
    categoria_id: Optional[int] = None
    es_original: Optional[bool] = None
    estado: Optional[str] = None
    imagen_url: Optional[str] = None


class RepuestoOut(RepuestoBase):
    id: int
    creado_en: datetime
    actualizado_en: datetime
    imagenes: List[RepuestoImagenOut] = []

    @computed_field
    @property
    def imagen_url(self) -> Optional[str]:
        """URL de la imagen principal, o la primera disponible."""
        for img in self.imagenes:
            if img.es_principal:
                return img.url
        if self.imagenes:
            return self.imagenes[0].url
        return None

    class Config:
        from_attributes = True
