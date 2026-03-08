from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import Venta, ItemVenta, Repuesto, User
from ..schemas.venta import VentaCreate, VentaOut
from .auth import get_current_user

router = APIRouter()

@router.post("/", response_model=VentaOut, status_code=status.HTTP_201_CREATED)
def create_venta(
    venta: VentaCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Start a transaction (implicit in Session)
    # 2. Verify and Update Stock for each item
    db_items = []
    total_calculado = 0
    
    for item in venta.items:
        # Get repuesto and lock for update to prevent concurrent issues
        repuesto = db.query(Repuesto).filter(Repuesto.id == item.repuesto_id).with_for_update().first()
        
        if not repuesto:
            db.rollback()
            raise HTTPException(status_code=404, detail=f"Repuesto ID {item.repuesto_id} no encontrado")
        
        if not repuesto.is_active:
            db.rollback()
            raise HTTPException(status_code=400, detail=f"El repuesto {repuesto.nombre} no está activo")
            
        if repuesto.stock < item.cantidad:
            db.rollback()
            raise HTTPException(
                status_code=400, 
                detail=f"Stock insuficiente para {repuesto.nombre}. Disponible: {repuesto.stock}, Solicitado: {item.cantidad}"
            )
        
        # Calculate subtotal using current unit price if not provided, or provided price
        # Here we use the price from the request to allow manual discounts/adjustments
        subtotal = item.precio_unitario * item.cantidad
        total_calculado += subtotal
        
        # Update stock
        repuesto.stock -= item.cantidad
        
        # Buffer item creation
        db_item = ItemVenta(
            repuesto_id=item.repuesto_id,
            cantidad=item.cantidad,
            precio_unitario=item.precio_unitario,
            subtotal=subtotal
        )
        db_items.append(db_item)

    # 3. Create Venta Header
    # We trust the total from calculating items or matching requested total?
    # Logic: total should match items sum
    if abs(total_calculado - venta.total) > 0.01:
         # Optional: raise error if they don't match, or just use calculated
         pass

    db_venta = Venta(
        vendedor_id=current_user.id,
        cliente_id=venta.cliente_id,
        total=total_calculado,
        metodo_pago=venta.metodo_pago,
        estado="completado"
    )
    
    db.add(db_venta)
    db.flush() # Get ID
    
    # 4. Save items with venta_id
    for db_item in db_items:
        db_item.venta_id = db_venta.id
        db.add(db_item)
    
    try:
        db.commit()
        db.refresh(db_venta)
        return db_venta
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al procesar la venta: {str(e)}")

@router.get("/", response_model=List[VentaOut])
def list_ventas(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(Venta).offset(skip).limit(limit).all()

@router.get("/{id}", response_model=VentaOut)
def get_venta(id: int, db: Session = Depends(get_db)):
    venta = db.query(Venta).filter(Venta.id == id).first()
    if not venta:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    return venta
