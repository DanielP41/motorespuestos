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
    categoria: Optional[str] = None,
    marca: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Repuesto).filter(Repuesto.is_active == True)
    if categoria:
        query = query.filter(Repuesto.categoria == categoria)
    if marca:
        query = query.filter(Repuesto.marca == marca)
    
    return query.offset(skip).limit(limit).all()

@router.get("/{id}", response_model=RepuestoOut)
def get_repuesto(id: int, db: Session = Depends(get_db)):
    repuesto = db.query(Repuesto).filter(Repuesto.id == id, Repuesto.is_active == True).first()
    if not repuesto:
        raise HTTPException(status_code=404, detail="Repuesto no encontrado")
    return repuesto

@router.post("/", response_model=RepuestoOut, status_code=status.HTTP_201_CREATED)
def create_repuesto(
    repuesto: RepuestoCreate, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Check if code already exists
    existing = db.query(Repuesto).filter(Repuesto.codigo == repuesto.codigo).first()
    if existing:
        raise HTTPException(status_code=400, detail="El código de repuesto ya existe")
    
    db_repuesto = Repuesto(**repuesto.model_dump())
    db.add(db_repuesto)
    db.commit()
    db.refresh(db_repuesto)
    return db_repuesto

@router.put("/{id}", response_model=RepuestoOut)
def update_repuesto(
    id: int, 
    repuesto_update: RepuestoUpdate, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
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
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    db_repuesto = db.query(Repuesto).filter(Repuesto.id == id).first()
    if not db_repuesto:
        raise HTTPException(status_code=404, detail="Repuesto no encontrado")
    
    # Soft delete
    db_repuesto.is_active = False
    db.commit()
    return {"message": "Repuesto desactivado exitosamente"}

@router.post("/seed", status_code=status.HTTP_201_CREATED)
def seed_repuestos(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # Check if already seeded
    count = db.query(Repuesto).count()
    if count > 5:
        return {"message": "La base de datos ya tiene datos", "count": count}

    mock_data = [
        {"codigo": "FRE-001", "nombre": "Pastillas de Freno Delantero", "categoria": "Frenos", "marca": "Fras-le", "precio": 15500.0, "stock": 25, "compatibilidad": "Honda CB190, XR150"},
        {"codigo": "TRA-002", "nombre": "Kit de Transmisión Reforzado", "categoria": "Transmisión", "marca": "DID", "precio": 45000.0, "stock": 12, "compatibilidad": "Yamaha FZ16, YS250"},
        {"codigo": "LUB-003", "nombre": "Aceite Motul 7100 10W40", "categoria": "Lubricantes", "marca": "Motul", "precio": 18900.0, "stock": 50, "compatibilidad": "Universal 4T"},
        {"codigo": "FIL-004", "nombre": "Filtro de Aceite Original", "categoria": "Filtros", "marca": "Honda", "precio": 8500.0, "stock": 40, "compatibilidad": "Línea Honda"},
        {"codigo": "BAT-005", "nombre": "Batería Yuasa 12V 7Ah", "categoria": "Eléctrico", "marca": "Yuasa", "precio": 32000.0, "stock": 15, "compatibilidad": "Bajas y Medianas cilindradas"},
        {"codigo": "MOT-006", "nombre": "Pistón y Aros Standard", "categoria": "Motor", "marca": "Mahle", "precio": 28000.0, "stock": 8, "compatibilidad": "Bajaj Rouser 200"},
        {"codigo": "EST-007", "nombre": "Estriberas de Aluminio", "categoria": "Chasis", "marca": "Protaper", "precio": 12500.0, "stock": 10, "compatibilidad": "Cross/Enduro"},
        {"codigo": "NEU-008", "nombre": "Cubierta Pirelli Angel City 100/80", "categoria": "Neumáticos", "marca": "Pirelli", "precio": 75000.0, "stock": 6, "compatibilidad": "Delantera Calle"},
        {"codigo": "ESC-009", "nombre": "Escape Deportivo Akrapovic Réplica", "categoria": "Escape", "marca": "Generic", "precio": 55000.0, "stock": 4, "compatibilidad": "Universal 38-51mm"},
        {"codigo": "BUI-010", "nombre": "Bujía NGK Iridium CR9EIX", "categoria": "Eléctrico", "marca": "NGK", "precio": 9500.0, "stock": 30, "compatibilidad": "Altas prestaciones"},
        {"codigo": "FRE-011", "nombre": "Disco de Freno Lobulado", "categoria": "Frenos", "marca": "Wavy", "precio": 22000.0, "stock": 10, "compatibilidad": "Honda Tornado, XRE300"},
        {"codigo": "TRA-012", "nombre": "Cadena RK 520 con O-Ring", "categoria": "Transmisión", "marca": "RK", "precio": 38000.0, "stock": 14, "compatibilidad": "Universal 520"},
        {"codigo": "CAB-013", "nombre": "Cable de Embrague", "categoria": "Cables", "marca": "Original", "precio": 4500.0, "stock": 35, "compatibilidad": "Yamaha YBR 125"},
        {"codigo": "CAR-014", "nombre": "Carburador Completo 28mm", "categoria": "Motor", "marca": "Keihin", "precio": 42000.0, "stock": 5, "compatibilidad": "Universal 125-250cc"},
        {"codigo": "LUC-015", "nombre": "Faro LED Principal 7 pulg", "categoria": "Iluminación", "marca": "Custom", "precio": 29000.0, "stock": 7, "compatibilidad": "Cafe Racer / Custom"},
        {"codigo": "ESPE-016", "nombre": "Espejos Deportivos Carbon", "categoria": "Accesorios", "marca": "Rizoma Style", "precio": 12000.0, "stock": 20, "compatibilidad": "Naked / Sport"},
        {"codigo": "JUN-017", "nombre": "Kit de Juntas Completo", "categoria": "Motor", "marca": "Athena", "precio": 18000.0, "stock": 12, "compatibilidad": "Honda CG 150 Titan"},
        {"codigo": "TRA-018", "nombre": "Corona de Aluminio 45T", "categoria": "Transmisión", "marca": "Supersprox", "precio": 31000.0, "stock": 6, "compatibilidad": "KTM Duke 200/390"},
        {"codigo": "SUS-019", "nombre": "Retenes de Suspensión (Par)", "categoria": "Suspensión", "marca": "Athena", "precio": 8500.0, "stock": 22, "compatibilidad": "Barras 37mm"},
        {"codigo": "FIL-020", "nombre": "Filtro de Aire K&N Lavable", "categoria": "Filtros", "marca": "K&N", "precio": 48000.0, "stock": 5, "compatibilidad": "Yamaha MT-03"}
    ]

    for item in mock_data:
        db_repuesto = Repuesto(**item)
        db.add(db_repuesto)
    
    db.commit()
    return {"message": "Base de datos poblada exitosamente", "count": len(mock_data)}
