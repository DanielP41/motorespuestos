from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, date
from typing import List, Dict, Any

from ..database import get_db
from ..models import Venta, ItemVenta, Repuesto
from .auth import get_current_user

router = APIRouter()

@router.get("/kpis")
def get_dashboard_kpis(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    today = date.today()
    
    # 1. Ventas hoy (Total and Count)
    ventas_hoy_query = db.query(
        func.sum(Venta.total).label("total"),
        func.count(Venta.id).label("count")
    ).filter(func.date(Venta.fecha) == today).first()
    
    ventas_hoy_monto = ventas_hoy_query.total or 0.0
    ventas_hoy_count = ventas_hoy_query.count or 0
    
    # 2. Stock Crítico (items with stock < 5)
    # Using a threshold of 5 for 'critical' until we have per-item thresholds
    stock_critico_items = db.query(Repuesto).filter(Repuesto.stock < 5, Repuesto.is_active == True).all()
    stock_critico_count = len(stock_critico_items)
    
    # 3. Productos Activos
    productos_activos = db.query(Repuesto).filter(Repuesto.is_active == True).count()
    
    # 4. Ventas Recientes (last 5)
    # Note: We manually map to include some detail for the dashboard
    ventas_recientes_db = db.query(Venta).order_by(Venta.fecha.desc()).limit(5).all()
    ventas_recientes = []
    for v in ventas_recientes_db:
        ventas_recientes.append({
            "id": v.id,
            "numero_factura": f"FAC-{v.id:04d}",
            "fecha": v.fecha,
            "total": v.total,
            "estado": v.estado,
            "cliente": "Consumidor Final" # Placeholder until Clientes is implemented
        })

    # mapping to the format the frontend expects
    return {
        "ventasHoy": ventas_hoy_monto,
        "ventasHoyCount": ventas_hoy_count,
        "stockCritico": stock_critico_count,
        "garantiasPorVencer": 0, # Future implementation
        "clientesActivos": 0,    # Future implementation
        "productosActivos": productos_activos,
        "ventasRecientes": ventas_recientes,
        "repuestosStockCritico": [
            {"id": r.id, "nombre": r.nombre, "sku": r.codigo, "stock_actual": r.stock, "stock_minimo": 5}
            for r in stock_critico_items[:5] # limit for dashboard view
        ]
    }
