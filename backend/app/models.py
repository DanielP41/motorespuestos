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

class MarcaMoto(Base):
    __tablename__ = "marca_moto"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, unique=True, nullable=False)
    pais_origen = Column(String)
    activa = Column(Boolean, default=True)
    creado_en = Column(DateTime, default=datetime.datetime.utcnow)

class ModeloMoto(Base):
    __tablename__ = "modelo_moto"
    id = Column(Integer, primary_key=True, index=True)
    marca_id = Column(Integer, ForeignKey("marca_moto.id"), nullable=False)
    nombre = Column(String, nullable=False)
    anio_inicio = Column(Integer)
    anio_fin = Column(Integer)
    cilindraje = Column(Integer)
    tipo = Column(String)
    activo = Column(Boolean, default=True)
    creado_en = Column(DateTime, default=datetime.datetime.utcnow)

class Categoria(Base):
    __tablename__ = "categoria"
    id = Column(Integer, primary_key=True, index=True)
    padre_id = Column(Integer, ForeignKey("categoria.id"), nullable=True)
    nombre = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=False)
    activa = Column(Boolean, default=True)
    creado_en = Column(DateTime, default=datetime.datetime.utcnow)

class UnidadMedida(Base):
    __tablename__ = "unidad_medida"
    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String, unique=True, nullable=False)
    nombre = Column(String, nullable=False)

class Cliente(Base):
    __tablename__ = "cliente"

    id = Column(Integer, primary_key=True, index=True)
    tipo = Column(String, nullable=False) # 'N' / 'J'
    documento_tipo = Column(String, nullable=False)
    documento_nro = Column(String, unique=True, index=True, nullable=False)
    nombre = Column(String, nullable=False)
    telefono = Column(String)
    email = Column(String)
    hashed_password = Column(String)
    direccion = Column(String)
    credito_habilitado = Column(Boolean, default=False)
    limite_credito = Column(Float, default=0.0)
    saldo_credito = Column(Float, default=0.0)
    activo = Column(Boolean, default=True)
    creado_en = Column(DateTime, default=datetime.datetime.utcnow)
    actualizado_en = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    motos = relationship("ClienteMoto", back_populates="cliente")
    ventas = relationship("Venta", back_populates="cliente")

class ClienteMoto(Base):
    __tablename__ = "cliente_moto"

    id = Column(Integer, primary_key=True, index=True)
    cliente_id = Column(Integer, ForeignKey("cliente.id"), nullable=False)
    modelo_moto_id = Column(Integer, ForeignKey("modelo_moto.id"), nullable=False)
    placa = Column(String)
    anio = Column(Integer)
    color = Column(String)
    km_actuales = Column(Integer)
    activa = Column(Boolean, default=True)
    creado_en = Column(DateTime, default=datetime.datetime.utcnow)

    cliente = relationship("Cliente", back_populates="motos")

class Repuesto(Base):
    __tablename__ = "repuesto"

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String, unique=True, index=True, nullable=False)
    nombre = Column(String, index=True, nullable=False)
    descripcion = Column(String)
    categoria_id = Column(Integer, ForeignKey("categoria.id"), nullable=False)
    unidad_medida_id = Column(Integer, ForeignKey("unidad_medida.id"))
    precio_compra = Column(Float, default=0.0)
    precio_venta = Column(Float, nullable=False)
    precio_venta_min = Column(Float, default=0.0)
    stock_actual = Column(Integer, default=0)
    stock_minimo = Column(Integer, default=0)
    es_original = Column(Boolean, default=True)
    estado = Column(String, default="activo")
    actualizado_en = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    creado_en = Column(DateTime, default=datetime.datetime.utcnow)

    categoria = relationship("Categoria")
    unidad_medida = relationship("UnidadMedida")

class MovimientoInventario(Base):
    __tablename__ = "movimiento_inventario"
    id = Column(Integer, primary_key=True, index=True)
    repuesto_id = Column(Integer, ForeignKey("repuesto.id"), nullable=False)
    tipo = Column(String, nullable=False) # entrada, salida, ajuste, devolucion
    cantidad = Column(Integer, nullable=False)
    stock_anterior = Column(Integer, nullable=False)
    stock_posterior = Column(Integer, nullable=False)
    costo_unitario = Column(Float)
    referencia_id = Column(Integer)
    referencia_tipo = Column(String)
    usuario = Column(String)
    notas = Column(String)
    creado_en = Column(DateTime, default=datetime.datetime.utcnow)

    repuesto = relationship("Repuesto")

class Venta(Base):
    __tablename__ = "venta"

    id = Column(Integer, primary_key=True, index=True)
    numero_factura = Column(String, unique=True, index=True, nullable=False)
    fecha = Column(DateTime, default=datetime.datetime.utcnow)
    cliente_id = Column(Integer, ForeignKey("cliente.id"), nullable=True)
    cliente_moto_id = Column(Integer, ForeignKey("cliente_moto.id"), nullable=True)
    subtotal = Column(Float, default=0.0)
    descuento_total = Column(Float, default=0.0)
    impuesto_pct = Column(Float, default=0.0)
    impuesto_monto = Column(Float, default=0.0)
    total = Column(Float, nullable=False)
    metodo_pago = Column(String, nullable=False)
    estado = Column(String, default="pendiente")
    notas = Column(String)
    usuario = Column(String)
    actualizado_en = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    creado_en = Column(DateTime, default=datetime.datetime.utcnow)

    cliente = relationship("Cliente", back_populates="ventas")
    items = relationship("ItemVenta", back_populates="venta", cascade="all, delete-orphan")

class ItemVenta(Base):
    __tablename__ = "venta_detalle"

    id = Column(Integer, primary_key=True, index=True)
    venta_id = Column(Integer, ForeignKey("venta.id"), nullable=False)
    repuesto_id = Column(Integer, ForeignKey("repuesto.id"), nullable=False)
    cantidad = Column(Integer, nullable=False)
    precio_unitario = Column(Float, nullable=False)
    descuento_pct = Column(Float, default=0.0)
    subtotal = Column(Float, nullable=False)
    costo_unitario = Column(Float)

    venta = relationship("Venta", back_populates="items")
    repuesto = relationship("Repuesto")

class Garantia(Base):
    __tablename__ = "garantia"
    id = Column(Integer, primary_key=True, index=True)
    venta_detalle_id = Column(Integer, ForeignKey("venta_detalle.id"), nullable=False)
    cliente_id = Column(Integer, ForeignKey("cliente.id"), nullable=False)
    repuesto_id = Column(Integer, ForeignKey("repuesto.id"), nullable=False)
    fecha_apertura = Column(DateTime, default=datetime.datetime.utcnow)
    fecha_vencimiento = Column(DateTime, nullable=False)
    dias_garantia = Column(Integer, default=90)
    descripcion_falla = Column(String, nullable=False)
    estado = Column(String, default="abierta") # abierta, en_proceso, resuelta, rechazada
    notas_resolucion = Column(String)
    usuario = Column(String)
    creado_en = Column(DateTime, default=datetime.datetime.utcnow)
    actualizado_en = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    seguimientos = relationship("GarantiaSeguimiento", back_populates="garantia")

class GarantiaSeguimiento(Base):
    __tablename__ = "garantia_seguimiento"
    id = Column(Integer, primary_key=True, index=True)
    garantia_id = Column(Integer, ForeignKey("garantia.id"), nullable=False)
    fecha = Column(DateTime, default=datetime.datetime.utcnow)
    descripcion = Column(String, nullable=False)
    usuario = Column(String)

    garantia = relationship("Garantia", back_populates="seguimientos")
