from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, date, timedelta
from typing import List, Dict, Any

from ..database import get_db
from ..models import Venta, ItemVenta, Repuesto, Garantia, Categoria
from .auth import get_current_user

router = APIRouter()

@router.get("/kpis")
def get_dashboard_kpis(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    today = date.today()
    last_7_days = today - timedelta(days=6)
    
    # 1. Ventas hoy (Total and Count)
    ventas_hoy_query = db.query(
        func.sum(Venta.total).label("total"),
        func.count(Venta.id).label("count")
    ).filter(func.date(Venta.fecha) == today).first()
    
    ventas_hoy_monto = ventas_hoy_query.total or 0.0
    ventas_hoy_count = ventas_hoy_query.count or 0
    
    # 2. Stock Crítico (items with stock_actual < stock_minimo)
    stock_critico_items = db.query(Repuesto).filter(Repuesto.stock_actual < Repuesto.stock_minimo, Repuesto.estado == "activo").all()
    stock_critico_count = len(stock_critico_items)
    
    # 3. Productos Activos
    productos_activos = db.query(Repuesto).filter(Repuesto.estado == "activo").count()
    
    # 4. Garantías por vencer (next 7 days)
    garantias_por_vencer = db.query(Garantia).filter(
        Garantia.estado.in_(["abierta", "en_proceso"]),
        Garantia.fecha_vencimiento >= today,
        Garantia.fecha_vencimiento <= today + timedelta(days=7)
    ).count()

    # 5. Ventas Recientes (last 5)
    ventas_recientes_db = db.query(Venta).order_by(Venta.fecha.desc()).limit(5).all()
    ventas_recientes = []
    for v in ventas_recientes_db:
        ventas_recientes.append({
            "id": v.id,
            "numero_factura": v.numero_factura,
            "fecha": v.fecha,
            "total": v.total,
            "estado": v.estado,
            "cliente": "Consumidor Final"
        })

    # 6. Tendencia Semanal (Ventas por día últimos 7 días)
    ventas_semana = db.query(
        func.date(Venta.fecha).label("dia"),
        func.sum(Venta.total).label("monto")
    ).filter(Venta.fecha >= last_7_days).group_by(func.date(Venta.fecha)).all()
    
    # Fill gaps for days with zero sales
    trend_dict = { (last_7_days + timedelta(days=i)): 0.0 for i in range(7) }
    for v in ventas_semana:
        trend_dict[v.dia] = float(v.monto)
    
    ventas_trend = [
        {"fecha": d.strftime("%d/%m"), "monto": m} 
        for d, m in sorted(trend_dict.items())
    ]

    # 7. Top 5 Productos más vendidos (histórico)
    top_items = db.query(
        Repuesto.nombre,
        Repuesto.sku,
        func.sum(ItemVenta.cantidad).label("vendidos")
    ).join(ItemVenta, Repuesto.id == ItemVenta.repuesto_id)\
     .group_by(Repuesto.id)\
     .order_by(desc("vendidos"))\
     .limit(5).all()

    # 8. Distribución por Categoría (Total de repuestos por categoría)
    dist_cat = db.query(
        Categoria.nombre,
        func.count(Repuesto.id).label("cantidad")
    ).join(Repuesto, Categoria.id == Repuesto.categoria_id)\
     .filter(Repuesto.estado == "activo")\
     .group_by(Categoria.id).all()

    # 9. Rentabilidad (Desde la vista v_rentabilidad_repuestos)
    # Usando text() para mayor seguridad y compatibilidad
    from sqlalchemy import text
    rentabilidad_rows = db.execute(text("SELECT nombre, unidades_vendidas, utilidad, margen_pct FROM v_rentabilidad_repuestos ORDER BY utilidad DESC LIMIT 5")).all()
    
    top_rentables = [
        {"nombre": r.nombre, "vendidos": int(r.unidades_vendidas), "utilidad": float(r.utilidad), "margen": float(r.margen_pct)}
        for r in rentabilidad_rows
    ]

    # 10. Totales Mensuales (Ingresos vs Utilidad)
    totales_mes = db.execute(text("SELECT SUM(ingresos) as ingresos, SUM(utilidad) as utilidad FROM v_rentabilidad_repuestos")).first()
    ingresos_mensuales = float(totales_mes.ingresos or 0)
    utilidad_mensual = float(totales_mes.utilidad or 0)

    return {
        "ventasHoy": ventas_hoy_monto,
        "ventasHoyCount": ventas_hoy_count,
        "stockCritico": stock_critico_count,
        "garantiasPorVencer": garantias_por_vencer,
        "productosActivos": productos_activos,
        "ingresosMensuales": ingresos_mensuales,
        "utilidadMensual": utilidad_mensual,
        "ventasRecientes": ventas_recientes,
        "ventasTrend": ventas_trend,
        "topProductos": [{"nombre": r.nombre, "sku": r.sku, "vendidos": int(r.vendidos)} for r in top_items],
        "topRentables": top_rentables,
        "distribucionCategorias": [{"nombre": c.nombre, "cantidad": c.cantidad} for c in dist_cat],
        "repuestosStockCritico": [
            {"id": r.id, "nombre": r.nombre, "sku": r.sku, "stock_actual": r.stock_actual, "stock_minimo": r.stock_minimo}
            for r in stock_critico_items[:5]
        ]
    }
