# Moto-Repuestos

Sistema de gestión para casa de repuestos de motos — MVP funcional.

## Stack

| Capa | Tecnología |
|---|---|
| Base de datos | PostgreSQL 16 |
| Backend | Python 3.12 + FastAPI |
| Frontend | React + TypeScript (Vite) |
| Contenedores | Docker + Docker Compose |

---

## Levantar el proyecto completo

### Prerrequisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y corriendo

### Iniciar todos los servicios

```bash
docker-compose up -d
```

| Servicio | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8001 |
| Docs interactivos | http://localhost:8001/docs |
| Base de datos | localhost:5432 |

El esquema completo (`db/init.sql`) se aplica automáticamente al primer arranque de la BD.
Las migraciones pendientes se ejecutan automáticamente al arrancar el backend (`alembic upgrade head`).

### Detener

```bash
docker-compose down        # detiene contenedores
docker-compose down -v     # también borra los datos (volumen)
```

---

## Desarrollo local (sin Docker)

### Backend

```bash
cd backend
cp .env.example .env       # completar variables
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

### Tests

```bash
cd backend
pytest -v
```

---

## Variables de entorno

Copiar `backend/.env.example` y completar:

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Cadena de conexión PostgreSQL |
| `SECRET_KEY` | Clave para firmar JWT (`openssl rand -hex 32`) |
| `ALLOWED_ORIGINS` | Orígenes CORS permitidos (separados por coma) |
| `API_BASE_URL` | URL pública del backend (para URLs de imágenes) |

---

## Funcionalidades

- **Catálogo** — repuestos con imágenes (WebP), compatibilidad por marca/modelo/año
- **Inventario** — movimientos de stock, alertas de stock crítico
- **Ventas** — registro de facturas con múltiples ítems, descuentos e impuestos
- **Clientes** — gestión de clientes con crédito habilitado
- **Garantías** — seguimiento de garantías por venta
- **Auth** — JWT con roles (admin / vendedor)

---

## Estructura del proyecto

```
motorespuestos-master/
├── backend/
│   ├── alembic/            ← Migraciones de BD
│   ├── app/
│   │   ├── routers/        ← Endpoints por módulo
│   │   ├── schemas/        ← Modelos Pydantic
│   │   └── models.py       ← Modelos SQLAlchemy
│   └── tests/              ← Suite de pruebas (pytest)
├── db/
│   └── init.sql            ← Schema base (tablas, triggers, vistas, índices)
├── frontend/
│   └── src/
│       ├── pages/          ← Vistas públicas y admin
│       └── components/     ← Componentes reutilizables
└── docker-compose.yml
```

## Schema — resumen

| Módulo        | Tablas                                                    |
|---------------|-----------------------------------------------------------|
| Catálogo Base | `marca_moto`, `modelo_moto`, `categoria`, `unidad_medida` |
| Repuestos     | `repuesto`, `repuesto_compatibilidad`, `repuesto_imagen`  |
| Inventario    | `movimiento_inventario`                                   |
| Clientes      | `cliente`, `cliente_moto`                                 |
| Ventas        | `venta`, `venta_detalle`, `pago`                          |
| Garantías     | `garantia`, `garantia_seguimiento`                        |

**Triggers:** 5 | **Vistas:** 4 | **Índices:** 13
