from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from .database import engine, Base
from .routers import repuestos, ventas, clientes, inventario, garantias, auth, stats, uploads

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

# Ensure uploads directory exists
UPLOAD_DIR = "app/uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Include routers
app.include_router(repuestos.router, prefix="/repuestos", tags=["Repuestos"])
app.include_router(ventas.router, prefix="/ventas", tags=["Ventas"])
app.include_router(clientes.router, prefix="/clientes", tags=["Clientes"])
app.include_router(inventario.router, prefix="/inventario", tags=["Inventario"])
app.include_router(garantias.router, prefix="/garantias", tags=["Garantías"])
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(stats.router, prefix="/stats", tags=["Stats"])
app.include_router(uploads.router, prefix="/uploads-api", tags=["Uploads"])

@app.get("/")
def read_root():
    return {"message": "Moto-Repuestos API is running"}
