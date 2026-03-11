from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models import Repuesto
from ..schemas.repuesto import RepuestoCreate, RepuestoUpdate, RepuestoOut
from .auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[RepuestoOut])
def list_repuestos(
    skip: int = 0, 
    limit: int = 100, 
    categoria_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Repuesto).filter(Repuesto.estado == "activo")
    if categoria_id:
        query = query.filter(Repuesto.categoria_id == categoria_id)
    
    return query.offset(skip).limit(limit).all()

@router.get("/{id}", response_model=RepuestoOut)
def get_repuesto(id: int, db: Session = Depends(get_db)):
    repuesto = db.query(Repuesto).filter(Repuesto.id == id, Repuesto.estado == "activo").first()
    if not repuesto:
        raise HTTPException(status_code=404, detail="Repuesto no encontrado")
    return repuesto

@router.post("/", response_model=RepuestoOut, status_code=status.HTTP_201_CREATED)
def create_repuesto(
    repuesto: RepuestoCreate, 
    db: Session = Depends(get_db)
):
    # Check if sku already exists
    existing = db.query(Repuesto).filter(Repuesto.sku == repuesto.sku).first()
    if existing:
        raise HTTPException(status_code=400, detail="El SKU de repuesto ya existe")
    
    db_repuesto = Repuesto(**repuesto.model_dump())
    db.add(db_repuesto)
    db.commit()
    db.refresh(db_repuesto)
    return db_repuesto

@router.put("/{id}", response_model=RepuestoOut)
def update_repuesto(
    id: int, 
    repuesto_update: RepuestoUpdate, 
    db: Session = Depends(get_db)
):
    db_repuesto = db.query(Repuesto).filter(Repuesto.id == id).first()
    if not db_repuesto:
        raise HTTPException(status_code=404, detail="Repuesto no encontrado")
    
    update_data = repuesto_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_repuesto, key, value)
    
    db.commit()
    db.refresh(db_repuesto)
    return db_repuesto

@router.delete("/{id}")
def delete_repuesto(
    id: int, 
    db: Session = Depends(get_db)
):
    db_repuesto = db.query(Repuesto).filter(Repuesto.id == id).first()
    if not db_repuesto:
        raise HTTPException(status_code=404, detail="Repuesto no encontrado")
    
    # Soft delete
    db_repuesto.estado = "descontinuado"
    db.commit()
    return {"message": "Repuesto desactivado exitosamente"}

@router.post("/seed", status_code=status.HTTP_201_CREATED)
def seed_repuestos(db: Session = Depends(get_db)):
    from ..models import Categoria, UnidadMedida

    rep_count = db.query(Repuesto).count()
    if rep_count > 5:
        return {"message": "Ya tiene datos", "repuestos": rep_count}

    # 1. Ensure categories exist
    cats = [
        ("Motor", "motor"), ("Transmision", "transmision"), ("Frenos", "frenos"),
        ("Suspension", "suspension"), ("Electrico", "electrico"),
        ("Carroceria", "carroceria"), ("Lubricantes", "lubricantes"), ("Filtros", "filtros")
    ]
    cat_ids = {}
    for nombre, slug in cats:
        existing = db.query(Categoria).filter(Categoria.slug == slug).first()
        if not existing:
            c = Categoria(nombre=nombre, slug=slug, activa=True)
            db.add(c)
            db.flush()
            cat_ids[nombre] = c.id
        else:
            cat_ids[nombre] = existing.id

    # 2. Ensure units exist
    units = [("UND","Unidad"),("PAR","Par"),("LT","Litro"),("JGO","Juego")]
    uid = {}
    for codigo, nombre in units:
        existing = db.query(UnidadMedida).filter(UnidadMedida.codigo == codigo).first()
        if not existing:
            u = UnidadMedida(codigo=codigo, nombre=nombre)
            db.add(u)
            db.flush()
            uid[codigo] = u.id
        else:
            uid[codigo] = existing.id

    def c(n): return cat_ids.get(n, cat_ids.get("Motor"))
    def u(k): return uid.get(k, uid.get("UND"))

    # 3. Create products
    products = [
        {"sku":"P-CB125-STD","nombre":"Piston STD Honda CB 125F","categoria_id":c("Motor"),"unidad_medida_id":u("UND"),"precio_compra":45000,"precio_venta":85000,"precio_venta_min":75000,"stock_actual":12,"stock_minimo":3,"es_original":True},
        {"sku":"P-CG150-STD","nombre":"Piston STD Honda CG 150","categoria_id":c("Motor"),"unidad_medida_id":u("UND"),"precio_compra":52000,"precio_venta":95000,"precio_venta_min":85000,"stock_actual":8,"stock_minimo":2,"es_original":True},
        {"sku":"P-NS200-STD","nombre":"Piston STD Bajaj NS 200","categoria_id":c("Motor"),"unidad_medida_id":u("UND"),"precio_compra":65000,"precio_venta":120000,"precio_venta_min":108000,"stock_actual":5,"stock_minimo":2,"es_original":True},
        {"sku":"ANI-CB125","nombre":"Juego Anillos Honda CB 125F","categoria_id":c("Motor"),"unidad_medida_id":u("JGO"),"precio_compra":18000,"precio_venta":38000,"precio_venta_min":33000,"stock_actual":20,"stock_minimo":5,"es_original":True},
        {"sku":"CIL-CG150","nombre":"Cilindro Honda CG 150","categoria_id":c("Motor"),"unidad_medida_id":u("UND"),"precio_compra":120000,"precio_venta":220000,"precio_venta_min":195000,"stock_actual":4,"stock_minimo":1,"es_original":True},
        {"sku":"EMP-CUL-CG","nombre":"Empaque Culata Honda CG 150","categoria_id":c("Motor"),"unidad_medida_id":u("UND"),"precio_compra":22000,"precio_venta":45000,"precio_venta_min":39000,"stock_actual":25,"stock_minimo":5,"es_original":True},
        {"sku":"EMP-CUL-190","nombre":"Empaque Culata Honda CB 190R","categoria_id":c("Motor"),"unidad_medida_id":u("UND"),"precio_compra":28000,"precio_venta":58000,"precio_venta_min":50000,"stock_actual":10,"stock_minimo":3,"es_original":True},
        {"sku":"CAD-428-130","nombre":"Cadena 428 x 130 Eslabones","categoria_id":c("Transmision"),"unidad_medida_id":u("UND"),"precio_compra":35000,"precio_venta":65000,"precio_venta_min":58000,"stock_actual":22,"stock_minimo":5,"es_original":False},
        {"sku":"CAD-520-MX","nombre":"Kit Transmision 520 MX","categoria_id":c("Transmision"),"unidad_medida_id":u("JGO"),"precio_compra":98000,"precio_venta":189000,"precio_venta_min":165000,"stock_actual":8,"stock_minimo":2,"es_original":False},
        {"sku":"PIN-DEL-190","nombre":"Pinon Delantero Honda CB 190 14T","categoria_id":c("Transmision"),"unidad_medida_id":u("UND"),"precio_compra":12000,"precio_venta":22000,"precio_venta_min":19000,"stock_actual":30,"stock_minimo":8,"es_original":False},
        {"sku":"COR-CG150","nombre":"Corona 37T Honda CG 150","categoria_id":c("Transmision"),"unidad_medida_id":u("UND"),"precio_compra":28000,"precio_venta":52000,"precio_venta_min":46000,"stock_actual":15,"stock_minimo":4,"es_original":False},
        {"sku":"KIT-CAD-YBR","nombre":"Kit Cadena Yamaha YBR 125","categoria_id":c("Transmision"),"unidad_medida_id":u("JGO"),"precio_compra":75000,"precio_venta":142000,"precio_venta_min":125000,"stock_actual":6,"stock_minimo":2,"es_original":True},
        {"sku":"DIS-EMB-NS","nombre":"Juego Discos Embrague Bajaj NS200","categoria_id":c("Transmision"),"unidad_medida_id":u("JGO"),"precio_compra":68000,"precio_venta":125000,"precio_venta_min":110000,"stock_actual":7,"stock_minimo":2,"es_original":True},
        {"sku":"CAB-EMB-CG","nombre":"Cable Embrague Honda CG 150","categoria_id":c("Transmision"),"unidad_medida_id":u("UND"),"precio_compra":10000,"precio_venta":18500,"precio_venta_min":16000,"stock_actual":35,"stock_minimo":8,"es_original":False},
        {"sku":"PAS-DEL-190","nombre":"Pastillas Freno Delantero CB 190R","categoria_id":c("Frenos"),"unidad_medida_id":u("PAR"),"precio_compra":28000,"precio_venta":55000,"precio_venta_min":48000,"stock_actual":18,"stock_minimo":4,"es_original":False},
        {"sku":"PAS-CB125","nombre":"Pastillas Freno Honda CB 125F","categoria_id":c("Frenos"),"unidad_medida_id":u("PAR"),"precio_compra":18000,"precio_venta":35000,"precio_venta_min":30000,"stock_actual":25,"stock_minimo":6,"es_original":False},
        {"sku":"DSC-DEL-190","nombre":"Disco Freno Delantero CB 190R","categoria_id":c("Frenos"),"unidad_medida_id":u("UND"),"precio_compra":55000,"precio_venta":105000,"precio_venta_min":92000,"stock_actual":6,"stock_minimo":2,"es_original":False},
        {"sku":"DSC-MT03","nombre":"Disco Freno Delantero Yamaha MT03","categoria_id":c("Frenos"),"unidad_medida_id":u("UND"),"precio_compra":62000,"precio_venta":118000,"precio_venta_min":104000,"stock_actual":4,"stock_minimo":1,"es_original":False},
        {"sku":"BOB-CB125","nombre":"Bobina Encendido Honda CB 125F","categoria_id":c("Electrico"),"unidad_medida_id":u("UND"),"precio_compra":32000,"precio_venta":62000,"precio_venta_min":55000,"stock_actual":9,"stock_minimo":2,"es_original":True},
        {"sku":"REC-CG150","nombre":"Rectificador Regulador CG 150","categoria_id":c("Electrico"),"unidad_medida_id":u("UND"),"precio_compra":28000,"precio_venta":55000,"precio_venta_min":48000,"stock_actual":11,"stock_minimo":3,"es_original":False},
        {"sku":"BAT-YTX7","nombre":"Bateria YTX7A-BS 12V 6Ah","categoria_id":c("Electrico"),"unidad_medida_id":u("UND"),"precio_compra":55000,"precio_venta":98000,"precio_venta_min":85000,"stock_actual":14,"stock_minimo":3,"es_original":False},
        {"sku":"FOC-LED-H4","nombre":"Foco LED H4 Universal 35W","categoria_id":c("Electrico"),"unidad_medida_id":u("UND"),"precio_compra":18000,"precio_venta":35000,"precio_venta_min":30000,"stock_actual":40,"stock_minimo":10,"es_original":False},
        {"sku":"ACE-10W40","nombre":"Aceite Motor 4T 10W-40 1L","categoria_id":c("Lubricantes"),"unidad_medida_id":u("LT"),"precio_compra":12000,"precio_venta":22000,"precio_venta_min":19000,"stock_actual":60,"stock_minimo":15,"es_original":False},
        {"sku":"ACE-20W50","nombre":"Aceite Motor 4T 20W-50 1L","categoria_id":c("Lubricantes"),"unidad_medida_id":u("LT"),"precio_compra":15000,"precio_venta":28000,"precio_venta_min":24000,"stock_actual":50,"stock_minimo":12,"es_original":False},
        {"sku":"GRA-CAD-SP","nombre":"Grasa de Cadena Spray 400ml","categoria_id":c("Lubricantes"),"unidad_medida_id":u("UND"),"precio_compra":18000,"precio_venta":32000,"precio_venta_min":28000,"stock_actual":30,"stock_minimo":8,"es_original":False},
        {"sku":"FIL-ACE-125","nombre":"Filtro de Aceite Honda CB 125F","categoria_id":c("Filtros"),"unidad_medida_id":u("UND"),"precio_compra":8000,"precio_venta":15000,"precio_venta_min":13000,"stock_actual":45,"stock_minimo":10,"es_original":True},
        {"sku":"FIL-ACE-150","nombre":"Filtro de Aceite Honda CG 150","categoria_id":c("Filtros"),"unidad_medida_id":u("UND"),"precio_compra":9000,"precio_venta":17000,"precio_venta_min":15000,"stock_actual":38,"stock_minimo":10,"es_original":True},
        {"sku":"FIL-AIR-125","nombre":"Filtro de Aire Honda CB 125F","categoria_id":c("Filtros"),"unidad_medida_id":u("UND"),"precio_compra":12000,"precio_venta":22000,"precio_venta_min":19000,"stock_actual":28,"stock_minimo":6,"es_original":False},
        {"sku":"FIL-AIR-200","nombre":"Filtro de Aire Bajaj NS 200","categoria_id":c("Filtros"),"unidad_medida_id":u("UND"),"precio_compra":14000,"precio_venta":26000,"precio_venta_min":22000,"stock_actual":20,"stock_minimo":5,"es_original":True},
        {"sku":"KIT-FIL-190","nombre":"Kit Filtros Honda CB 190R","categoria_id":c("Filtros"),"unidad_medida_id":u("JGO"),"precio_compra":28000,"precio_venta":52000,"precio_venta_min":46000,"stock_actual":12,"stock_minimo":3,"es_original":False},
        {"sku":"ESC-CB125L","nombre":"Espadin Izq Honda CB 125","categoria_id":c("Carroceria"),"unidad_medida_id":u("UND"),"precio_compra":35000,"precio_venta":65000,"precio_venta_min":58000,"stock_actual":7,"stock_minimo":2,"es_original":False},
        {"sku":"FAR-CG150","nombre":"Faro Delantero Honda CG 150","categoria_id":c("Carroceria"),"unidad_medida_id":u("UND"),"precio_compra":45000,"precio_venta":88000,"precio_venta_min":78000,"stock_actual":5,"stock_minimo":1,"es_original":False},
        {"sku":"MAL-38L","nombre":"Maleta Trasera Moto 38 Litros","categoria_id":c("Carroceria"),"unidad_medida_id":u("UND"),"precio_compra":85000,"precio_venta":159000,"precio_venta_min":140000,"stock_actual":8,"stock_minimo":2,"es_original":False},
    ]

    created = 0
    for p in products:
        existing = db.query(Repuesto).filter(Repuesto.sku == p["sku"]).first()
        if not existing:
            db.add(Repuesto(**p))
            created += 1

    db.commit()
    total = db.query(Repuesto).count()
    return {"message": "Seed completo", "created": created, "total": total}
