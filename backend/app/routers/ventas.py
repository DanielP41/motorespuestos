from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import Venta, ItemVenta, Repuesto, User
from ..schemas.venta import VentaCreate, VentaOut
from .auth import get_current_user
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
        # Repuesto check for basic info
        repuesto = db.query(Repuesto).filter(Repuesto.id == item.repuesto_id).first()
        if not repuesto:
            db.rollback()
            raise HTTPException(status_code=404, detail=f"Repuesto {item.repuesto_id} no encontrado")
        
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
        return db_venta
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al procesar la venta: {str(e)}")

@router.get("/", response_model=List[VentaOut])
def list_ventas(
    skip: int = 0,
    limit: int = 200,
    desde: str = None,       # ISO date string e.g. "2026-03-01"
    hasta: str = None,       # ISO date string e.g. "2026-03-31"
    estado: str = None,      # pendiente | pagada | anulada | en_credito
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
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

    return query.order_by(Venta.fecha.desc()).offset(skip).limit(limit).all()

@router.get("/{id}", response_model=VentaOut)
def get_venta(id: int, db: Session = Depends(get_db)):
    venta = db.query(Venta).filter(Venta.id == id).first()
    if not venta:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    return venta
