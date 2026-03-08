from .database import Base
from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
import datetime

class User(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    nombre_completo = Column(String)
    role = Column(String, default="vendedor") # admin, vendedor
    is_active = Column(Boolean, default=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Repuesto(Base):
    __tablename__ = "repuestos"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String, unique=True, index=True, nullable=False)
    nombre = Column(String, index=True, nullable=False)
    descripcion = Column(String)
    precio = Column(Float, nullable=False)
    stock = Column(Integer, default=0)
    categoria = Column(String, index=True)
    marca = Column(String, index=True)
    compatibilidad = Column(String) # E.g. "Honda CB 190, XR 150"
    imagen_url = Column(String)
    is_active = Column(Boolean, default=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Venta(Base):
    __tablename__ = "ventas"

    id = Column(Integer, primary_key=True, index=True)
    fecha = Column(DateTime, default=datetime.datetime.utcnow)
    cliente_id = Column(Integer, index=True, nullable=True) # Future extension
    vendedor_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    total = Column(Float, nullable=False)
    metodo_pago = Column(String, nullable=False) # efectivo, tarjeta, transferencia
    estado = Column(String, default="completado") # completado, cancelado

    vendedor = relationship("User")
    items = relationship("ItemVenta", back_populates="venta", cascade="all, delete-orphan")

class ItemVenta(Base):
    __tablename__ = "items_venta"

    id = Column(Integer, primary_key=True, index=True)
    venta_id = Column(Integer, ForeignKey("ventas.id"), nullable=False)
    repuesto_id = Column(Integer, ForeignKey("repuestos.id"), nullable=False)
    cantidad = Column(Integer, nullable=False)
    precio_unitario = Column(Float, nullable=False)
    subtotal = Column(Float, nullable=False)

    venta = relationship("Venta", back_populates="items")
    repuesto = relationship("Repuesto")
