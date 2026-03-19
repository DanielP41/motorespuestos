from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from ..database import get_db
from ..models import MovimientoInventario, Repuesto, User
from ..schemas.inventario import MovimientoInventarioOut, MovimientoInventarioCreate
from .auth import get_current_user

router = APIRouter()


def _require_admin(current_user=Depends(get_current_user)):
    if getattr(current_user, "role", None) not in ["admin", "vendedor"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo admin/vendedor")
    return current_user


@router.get("/", response_model=List[MovimientoInventarioOut])
def get_inventario(
    page: int = 0,
    limit: int = 50,
    tipo: Optional[str] = None,
    repuesto_id: Optional[int] = None,
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    db: Session = Depends(get_db),
    _=Depends(_require_admin),
):
    limit = min(limit, 100)
    skip = page * limit
    query = db.query(MovimientoInventario)
    if tipo:
        query = query.filter(MovimientoInventario.tipo == tipo)
    if repuesto_id:
        query = query.filter(MovimientoInventario.repuesto_id == repuesto_id)
    if fecha_desde:
        query = query.filter(MovimientoInventario.creado_en >= fecha_desde)
    if fecha_hasta:
        from datetime import datetime, timedelta
        hasta_fin_dia = datetime.combine(fecha_hasta, datetime.max.time())
        query = query.filter(MovimientoInventario.creado_en <= hasta_fin_dia)
    return query.order_by(MovimientoInventario.creado_en.desc()).offset(skip).limit(limit).all()


@router.post("/", response_model=MovimientoInventarioOut, status_code=status.HTTP_201_CREATED)
def registrar_movimiento(
    mov: MovimientoInventarioCreate,
    db: Session = Depends(get_db),
    current_user=Depends(_require_admin),
):
    """
    Registers a manual inventory movement and updates the repuesto's stock directly.
    Types allowed: entrada, ajuste, devolucion
    (salida is auto-registered by ventas trigger)
    """
    if mov.tipo not in ("entrada", "ajuste", "devolucion"):
        raise HTTPException(
            status_code=400,
            detail="Tipo de movimiento inválido. Use: entrada, ajuste, devolucion"
        )

    repuesto = db.query(Repuesto).filter(Repuesto.id == mov.repuesto_id).first()
    if not repuesto:
        raise HTTPException(status_code=404, detail=f"Repuesto {mov.repuesto_id} no encontrado")

    stock_anterior = repuesto.stock_actual

    # For adjustments, cantidad can be negative (downward correction)
    nuevo_stock = stock_anterior + mov.cantidad
    if nuevo_stock < 0:
        raise HTTPException(
            status_code=400,
            detail=f"El stock no puede quedar negativo. Stock actual: {stock_anterior}, movimiento: {mov.cantidad}"
        )

    # Update repuesto stock
    repuesto.stock_actual = nuevo_stock

    db_mov = MovimientoInventario(
        repuesto_id=mov.repuesto_id,
        tipo=mov.tipo,
        cantidad=mov.cantidad,
        stock_anterior=stock_anterior,
        stock_posterior=nuevo_stock,
        costo_unitario=mov.costo_unitario,
        referencia_tipo="manual",
        usuario=current_user.username,
        notas=mov.notas,
    )

    db.add(db_mov)
    try:
        db.commit()
        db.refresh(db_mov)
        return db_mov
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error al registrar movimiento")


@router.get("/stock-critico", response_model=List[dict])
def stock_critico(db: Session = Depends(get_db), _=Depends(_require_admin)):
    """Returns repuestos where stock_actual <= stock_minimo."""
    repuestos = db.query(Repuesto).filter(
        Repuesto.stock_actual <= Repuesto.stock_minimo,
        Repuesto.estado == "activo"
    ).order_by(Repuesto.stock_actual.asc()).limit(50).all()

    return [
        {
            "id": r.id,
            "nombre": r.nombre,
            "sku": r.sku,
            "stock_actual": r.stock_actual,
            "stock_minimo": r.stock_minimo,
            "critico": r.stock_actual == 0,
        }
        for r in repuestos
    ]
