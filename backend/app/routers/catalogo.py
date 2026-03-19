from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import Categoria, MarcaMoto

router = APIRouter()

@router.get("/categorias/", response_model=List[dict])
def list_categorias(db: Session = Depends(get_db)):
    """Devuelve todas las categorías activas (raíz y subcategorías) con padre_id."""
    cats = (
        db.query(Categoria)
        .filter(Categoria.activa == True)
        .order_by(Categoria.padre_id.nullsfirst(), Categoria.nombre)
        .all()
    )
    return [{"id": c.id, "nombre": c.nombre, "slug": c.slug, "padre_id": c.padre_id} for c in cats]

@router.get("/marcas/", response_model=List[dict])
def list_marcas(db: Session = Depends(get_db)):
    marcas = db.query(MarcaMoto).filter(MarcaMoto.activa == True).order_by(MarcaMoto.nombre).all()
    return [{"id": m.id, "nombre": m.nombre} for m in marcas]
