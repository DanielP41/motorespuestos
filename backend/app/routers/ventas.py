from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import Venta, ItemVenta, Repuesto, User, MovimientoInventario
from ..schemas.venta import VentaCreate, VentaOut
from .auth import get_current_user
from ..logger import logger
import uuid

router = APIRouter()

@router.post("/", response_model=VentaOut, status_code=status.HTTP_201_CREATED)
def create_venta(
    venta: VentaCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Generar factura si no viene
    factura_nro = venta.numero_factura if venta.numero_factura else f"FAC-{str(uuid.uuid4())[:8].upper()}"
    
    db_venta = Venta(
        numero_factura=factura_nro,
        usuario=current_user.username,
        cliente_id=venta.cliente_id,
        metodo_pago=venta.metodo_pago,
        notas=venta.notas,
        impuesto_pct=venta.impuesto_pct,
        estado="pendiente",
        total=0 # Trigger T3 will update this
    )
    
    db.add(db_venta)
    db.flush()
    
    for item in venta.items:
        # Lock de fila para evitar race condition en ventas simultáneas
        repuesto = db.query(Repuesto).filter(Repuesto.id == item.repuesto_id).with_for_update().first()
        if not repuesto:
            db.rollback()
            raise HTTPException(status_code=404, detail=f"Repuesto {item.repuesto_id} no encontrado")

        if repuesto.stock_actual < item.cantidad:
            db.rollback()
            raise HTTPException(
                status_code=400,
                detail=f"Stock insuficiente para '{repuesto.nombre}'. Disponible: {repuesto.stock_actual}"
            )

        db_item = ItemVenta(
            venta_id=db_venta.id,
            repuesto_id=item.repuesto_id,
            cantidad=item.cantidad,
            precio_unitario=item.precio_unitario if item.precio_unitario > 0 else repuesto.precio_venta,
            subtotal=0 # Placeholder, will calculate or trigger
        )
        # Calculate matching the DB function
        db_item.subtotal = db_item.cantidad * db_item.precio_unitario * (1 - item.descuento_pct / 100.0)
        db.add(db_item)

    try:
        db.commit()
        db.refresh(db_venta)
        logger.info("Venta creada — factura='{}' usuario='{}' total={}", factura_nro, current_user.username, db_venta.total)
        return db_venta
    except Exception as e:
        db.rollback()
        logger.error("Error al crear venta — usuario='{}' error={}", current_user.username, e)
        raise HTTPException(status_code=500, detail="Error al procesar la venta")

@router.get("/", response_model=List[VentaOut])
def list_ventas(
    page: int = 0,
    limit: int = 50,
    desde: str = None,
    hasta: str = None,
    estado: str = None,
    search: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    limit = min(limit, 100)
    skip = page * limit
    from datetime import datetime, timedelta
    query = db.query(Venta)

    if desde:
        try:
            dt_desde = datetime.fromisoformat(desde)
            query = query.filter(Venta.fecha >= dt_desde)
        except ValueError:
            pass

    if hasta:
        try:
            # Include the full day of `hasta`
            dt_hasta = datetime.fromisoformat(hasta) + timedelta(days=1)
            query = query.filter(Venta.fecha < dt_hasta)
        except ValueError:
            pass

    if estado:
        query = query.filter(Venta.estado == estado)
    if search:
        query = query.filter(Venta.numero_factura.ilike(f"%{search}%"))

    return query.order_by(Venta.fecha.desc()).offset(skip).limit(limit).all()

@router.get("/{id}", response_model=VentaOut)
def get_venta(id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    from ..models import Cliente
    venta = db.query(Venta).filter(Venta.id == id).first()
    if not venta:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    # Admin/vendedor ven cualquier venta; clientes solo las suyas
    if getattr(current_user, "role", None) not in ["admin", "vendedor"]:
        if not isinstance(current_user, Cliente) or venta.cliente_id != current_user.id:
            raise HTTPException(status_code=403, detail="No autorizado")
    return venta


from pydantic import BaseModel as _BaseModel

ESTADOS_VALIDOS = {"pendiente", "pagada", "en_credito", "anulada"}
TRANSICIONES_PERMITIDAS = {
    "pendiente":   {"pagada", "en_credito", "anulada"},
    "pagada":      {"anulada"},
    "en_credito":  {"pagada", "anulada"},
    "anulada":     set(),
}

class EstadoUpdate(_BaseModel):
    estado: str


@router.patch("/{id}/estado", response_model=VentaOut)
def cambiar_estado_venta(
    id: int,
    body: EstadoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if body.estado not in ESTADOS_VALIDOS:
        raise HTTPException(status_code=400, detail=f"Estado inválido: {body.estado}")

    venta = db.query(Venta).filter(Venta.id == id).first()
    if not venta:
        raise HTTPException(status_code=404, detail="Venta no encontrada")

    if body.estado not in TRANSICIONES_PERMITIDAS.get(venta.estado, set()):
        raise HTTPException(
            status_code=400,
            detail=f"No se puede pasar de '{venta.estado}' a '{body.estado}'"
        )

    # Si se anula, revertir stock creando movimientos de devolución
    if body.estado == "anulada":
        for item in venta.items:
            repuesto = db.query(Repuesto).filter(Repuesto.id == item.repuesto_id).with_for_update().first()
            if repuesto:
                stock_anterior = repuesto.stock_actual
                db.add(MovimientoInventario(
                    repuesto_id=item.repuesto_id,
                    tipo="devolucion",
                    cantidad=item.cantidad,
                    stock_anterior=stock_anterior,
                    stock_posterior=stock_anterior + item.cantidad,
                    costo_unitario=item.costo_unitario,
                    referencia_id=venta.id,
                    referencia_tipo="anulacion_venta",
                    usuario=current_user.username,
                    notas=f"Anulación venta {venta.numero_factura}",
                ))
                repuesto.stock_actual = stock_anterior + item.cantidad

    venta.estado = body.estado
    try:
        db.commit()
        db.refresh(venta)
        logger.info("Estado venta actualizado — factura='{}' estado='{}' usuario='{}'",
                    venta.numero_factura, body.estado, current_user.username)
        return venta
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error al actualizar estado")
