from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models import Cliente, ClienteMoto
from ..schemas.cliente import Cliente as ClienteSchema, ClienteCreate, ClienteUpdate, ClienteMoto as ClienteMotoSchema, ClienteMotoCreate, ClienteRegister
from ..auth_utils import get_password_hash
from .auth import get_current_user

router = APIRouter()

def check_admin_role(current_user = Depends(get_current_user)):
    if current_user.role not in ["admin", "vendedor"]:
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
        query = query.filter(Cliente.nombre.ilike(f"%{search}%") | Cliente.documento_nro.ilike(f"%{search}%"))
    return query.offset(skip).limit(limit).all()

@router.get("/{id}", response_model=ClienteSchema)
def get_cliente(id: int, db: Session = Depends(get_db), _ = Depends(check_admin_role)):
    cliente = db.query(Cliente).filter(Cliente.id == id, Cliente.activo == True).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return cliente

@router.post("/register", response_model=ClienteSchema, status_code=status.HTTP_201_CREATED)
def register_public_cliente(cliente: ClienteRegister, db: Session = Depends(get_db)):
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
def add_cliente_moto(id: int, moto: ClienteMotoCreate, db: Session = Depends(get_db)):
    db_cliente = db.query(Cliente).filter(Cliente.id == id).first()
    if not db_cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    
    db_moto = ClienteMoto(**moto.model_dump(), cliente_id=id)
    db.add(db_moto)
    db.commit()
    db.refresh(db_moto)
    return db_moto
