from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import Garantia, GarantiaSeguimiento
from ..schemas.garantia import GarantiaCreate, GarantiaOut, GarantiaUpdate, GarantiaSeguimientoCreate, GarantiaSeguimientoOut

router = APIRouter()

@router.get("/", response_model=List[GarantiaOut])
def get_garantias(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(Garantia).order_by(Garantia.creado_en.desc()).offset(skip).limit(limit).all()

@router.post("/", response_model=GarantiaOut)
def create_garantia(garantia: GarantiaCreate, db: Session = Depends(get_db)):
    db_garantia = Garantia(**garantia.model_dump())
    db.add(db_garantia)
    db.commit()
    db.refresh(db_garantia)
    return db_garantia

@router.get("/{id}", response_model=GarantiaOut)
def get_garantia(id: int, db: Session = Depends(get_db)):
    g = db.query(Garantia).filter(Garantia.id == id).first()
    if not g:
        raise HTTPException(status_code=404, detail="Garantía no encontrada")
    return g

@router.put("/{id}", response_model=GarantiaOut)
def update_garantia(id: int, update: GarantiaUpdate, db: Session = Depends(get_db)):
    db_garantia = db.query(Garantia).filter(Garantia.id == id).first()
    if not db_garantia:
        raise HTTPException(status_code=404, detail="Garantía no encontrada")
    
    update_data = update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_garantia, key, value)
    
    db.commit()
    db.refresh(db_garantia)
    return db_garantia

@router.post("/{id}/seguimiento", response_model=GarantiaSeguimientoOut)
def add_seguimiento(id: int, seguimiento: GarantiaSeguimientoCreate, db: Session = Depends(get_db)):
    db_seg = GarantiaSeguimiento(garantia_id=id, **seguimiento.model_dump())
    db.add(db_seg)
    db.commit()
    db.refresh(db_seg)
    return db_seg
