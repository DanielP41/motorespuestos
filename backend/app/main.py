from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import repuestos, ventas, clientes, inventario, garantias, auth, stats

# Create tables in DB (for development, better to use migrations in production)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Moto-Repuestos API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(repuestos.router, prefix="/repuestos", tags=["Repuestos"])
app.include_router(ventas.router, prefix="/ventas", tags=["Ventas"])
app.include_router(clientes.router, prefix="/clientes", tags=["Clientes"])
app.include_router(inventario.router, prefix="/inventario", tags=["Inventario"])
app.include_router(garantias.router, prefix="/garantias", tags=["Garantías"])
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(stats.router, prefix="/stats", tags=["Stats"])

@app.get("/")
def read_root():
    return {"message": "Moto-Repuestos API is running"}
