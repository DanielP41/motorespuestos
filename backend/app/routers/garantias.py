from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import Garantia, GarantiaSeguimiento, Cliente
from ..schemas.garantia import GarantiaCreate, GarantiaOut, GarantiaUpdate, GarantiaSeguimientoCreate, GarantiaSeguimientoOut
from .auth import get_current_user

router = APIRouter()


def _require_admin(current_user=Depends(get_current_user)):
    if getattr(current_user, "role", None) not in ["admin", "vendedor"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo admin/vendedor")
    return current_user


def _get_garantia_or_403(id: int, db: Session, current_user) -> Garantia:
    """Devuelve la garantía si el usuario tiene acceso, o lanza 403/404."""
    g = db.query(Garantia).filter(Garantia.id == id).first()
    if not g:
        raise HTTPException(status_code=404, detail="Garantía no encontrada")
    if getattr(current_user, "role", None) not in ["admin", "vendedor"]:
        if not isinstance(current_user, Cliente) or g.cliente_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado")
    return g


@router.get("/", response_model=List[GarantiaOut])
def get_garantias(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    limit = min(limit, 200)
    query = db.query(Garantia)
    # Clientes solo ven sus propias garantías
    if getattr(current_user, "role", None) not in ["admin", "vendedor"]:
        if not isinstance(current_user, Cliente):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado")
        query = query.filter(Garantia.cliente_id == current_user.id)
    return query.order_by(Garantia.creado_en.desc()).offset(skip).limit(limit).all()


@router.post("/", response_model=GarantiaOut)
def create_garantia(
    garantia: GarantiaCreate,
    db: Session = Depends(get_db),
    _=Depends(_require_admin),
):
    db_garantia = Garantia(**garantia.model_dump())
    db.add(db_garantia)
    db.commit()
    db.refresh(db_garantia)
    return db_garantia


@router.get("/{id}", response_model=GarantiaOut)
def get_garantia(id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return _get_garantia_or_403(id, db, current_user)


@router.put("/{id}", response_model=GarantiaOut)
def update_garantia(
    id: int,
    update: GarantiaUpdate,
    db: Session = Depends(get_db),
    _=Depends(_require_admin),
):
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
def add_seguimiento(
    id: int,
    seguimiento: GarantiaSeguimientoCreate,
    db: Session = Depends(get_db),
    _=Depends(_require_admin),
):
    if not db.query(Garantia).filter(Garantia.id == id).first():
        raise HTTPException(status_code=404, detail="Garantía no encontrada")
    db_seg = GarantiaSeguimiento(garantia_id=id, **seguimiento.model_dump())
    db.add(db_seg)
    db.commit()
    db.refresh(db_seg)
    return db_seg
