from pydantic import BaseModel, EmailStr, field_validator
from typing import List, Optional
from datetime import datetime

class ClienteMotoBase(BaseModel):
    modelo_moto_id: int
    placa: Optional[str] = None
    anio: Optional[int] = None
    color: Optional[str] = None
    km_actuales: Optional[int] = None
    activa: bool = True

class ClienteMotoCreate(ClienteMotoBase):
    pass

class ClienteMoto(ClienteMotoBase):
    id: int
    cliente_id: int
    creado_en: datetime

    class Config:
        from_attributes = True

class ClienteBase(BaseModel):
    tipo: str # 'N' or 'J'
    documento_tipo: str
    documento_nro: str
    nombre: str
    telefono: Optional[str] = None
    email: Optional[EmailStr] = None
    direccion: Optional[str] = None
    credito_habilitado: bool = False
    limite_credito: float = 0.0
    activo: bool = True

class ClienteRegister(BaseModel):
    tipo: str # 'N' or 'J'
    documento_tipo: str
    documento_nro: str
    nombre: str
    telefono: Optional[str] = None
    email: Optional[EmailStr] = None
    direccion: Optional[str] = None
    password: str

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("La contraseña debe tener al menos 8 caracteres")
        return v

class ClienteCreate(ClienteBase):
    password: str

class ClienteUpdate(BaseModel):
    tipo: Optional[str] = None
    documento_tipo: Optional[str] = None
    documento_nro: Optional[str] = None
    nombre: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[EmailStr] = None
    direccion: Optional[str] = None
    credito_habilitado: Optional[bool] = None
    limite_credito: Optional[float] = None
    activo: Optional[bool] = None

class Cliente(ClienteBase):
    id: int
    saldo_credito: float
    creado_en: datetime
    actualizado_en: datetime
    motos: List[ClienteMoto] = []

    class Config:
        from_attributes = True
