from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models import Cliente, ClienteMoto, Venta, Garantia
from ..schemas.cliente import Cliente as ClienteSchema, ClienteCreate, ClienteUpdate, ClienteMoto as ClienteMotoSchema, ClienteMotoCreate, ClienteRegister
from ..schemas.venta import VentaOut
from ..schemas.garantia import GarantiaOut
from ..auth_utils import get_password_hash
from ..limiter import limiter
from .auth import get_current_user

router = APIRouter()


def get_current_cliente(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    if not isinstance(current_user, Cliente):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo accesible para clientes")
    return current_user


@router.get("/me", response_model=ClienteSchema)
def get_my_profile(current_cliente: Cliente = Depends(get_current_cliente)):
    return current_cliente


@router.get("/me/pedidos", response_model=List[VentaOut])
def get_my_pedidos(current_cliente: Cliente = Depends(get_current_cliente), db: Session = Depends(get_db)):
    return db.query(Venta).filter(Venta.cliente_id == current_cliente.id).order_by(Venta.fecha.desc()).all()


@router.get("/me/garantias", response_model=List[GarantiaOut])
def get_my_garantias(current_cliente: Cliente = Depends(get_current_cliente), db: Session = Depends(get_db)):
    return db.query(Garantia).filter(Garantia.cliente_id == current_cliente.id).order_by(Garantia.fecha_apertura.desc()).all()

def check_admin_role(current_user = Depends(get_current_user)):
    if getattr(current_user, "role", None) not in ["admin", "vendedor"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para realizar esta acción"
        )
    return current_user

@router.get("/", response_model=List[ClienteSchema])
def list_clientes(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    _ = Depends(check_admin_role)
):
    query = db.query(Cliente).filter(Cliente.activo == True)
    if search:
        from sqlalchemy import func, or_
        term = search.strip()
        search_query = func.plainto_tsquery('spanish', func.unaccent(term))
        text_match = func.to_tsvector('spanish', func.unaccent(Cliente.nombre)).op('@@')(search_query)
        doc_match = Cliente.documento_nro.ilike(f"%{term}%")
        query = query.filter(or_(text_match, doc_match))
        
    return query.offset(skip).limit(limit).all()

@router.get("/{id}", response_model=ClienteSchema)
def get_cliente(id: int, db: Session = Depends(get_db), _ = Depends(check_admin_role)):
    cliente = db.query(Cliente).filter(Cliente.id == id, Cliente.activo == True).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return cliente

@router.post("/register", response_model=ClienteSchema, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
def register_public_cliente(request: Request, cliente: ClienteRegister, db: Session = Depends(get_db)):
    # Check if document already exists
    existing = db.query(Cliente).filter(Cliente.documento_nro == cliente.documento_nro).first()
    if existing:
        raise HTTPException(status_code=400, detail="El número de documento ya está registrado")
    
    existing_email = db.query(Cliente).filter(Cliente.email == cliente.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="El correo electrónico ya está registrado")

    cliente_data = cliente.model_dump()
    password = cliente_data.pop("password")
    hashed_password = get_password_hash(password)
    
    # Registration is always for a standard client, no credit by default
    db_cliente = Cliente(**cliente_data, hashed_password=hashed_password, credito_habilitado=False, limite_credito=0.0)
    db.add(db_cliente)
    db.commit()
    db.refresh(db_cliente)
    return db_cliente

@router.post("/", response_model=ClienteSchema, status_code=status.HTTP_201_CREATED)
def create_cliente(cliente: ClienteCreate, db: Session = Depends(get_db), _ = Depends(check_admin_role)):
    # Check if document already exists
    existing = db.query(Cliente).filter(Cliente.documento_nro == cliente.documento_nro).first()
    if existing:
        raise HTTPException(status_code=400, detail="El número de documento ya está registrado")
    
    cliente_data = cliente.model_dump()
    password = cliente_data.pop("password")
    hashed_password = get_password_hash(password)
    
    db_cliente = Cliente(**cliente_data, hashed_password=hashed_password)
    db.add(db_cliente)
    db.commit()
    db.refresh(db_cliente)
    return db_cliente

@router.put("/{id}", response_model=ClienteSchema)
def update_cliente(id: int, cliente_update: ClienteUpdate, db: Session = Depends(get_db), _ = Depends(check_admin_role)):
    db_cliente = db.query(Cliente).filter(Cliente.id == id).first()
    if not db_cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    
    update_data = cliente_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_cliente, key, value)
    
    db.commit()
    db.refresh(db_cliente)
    return db_cliente

@router.delete("/{id}")
def delete_cliente(id: int, db: Session = Depends(get_db), _ = Depends(check_admin_role)):
    db_cliente = db.query(Cliente).filter(Cliente.id == id).first()
    if not db_cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    
    # Soft delete
    db_cliente.activo = False
    db.commit()
    return {"message": "Cliente desactivado exitosamente"}

@router.post("/{id}/motos", response_model=ClienteMotoSchema, status_code=status.HTTP_201_CREATED)
def add_cliente_moto(id: int, moto: ClienteMotoCreate, db: Session = Depends(get_db),
                     current_user=Depends(get_current_user)):
    # Admin/vendedor pueden agregar motos a cualquier cliente;
    # un cliente solo puede agregar motos a su propia cuenta
    if getattr(current_user, "role", None) not in ["admin", "vendedor"]:
        if not isinstance(current_user, Cliente) or current_user.id != id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado")

    db_cliente = db.query(Cliente).filter(Cliente.id == id).first()
    if not db_cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    db_moto = ClienteMoto(**moto.model_dump(), cliente_id=id)
    db.add(db_moto)
    db.commit()
    db.refresh(db_moto)
    return db_moto
