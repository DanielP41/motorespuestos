# Moto-Repuestos

Sistema de gestión para casa de repuestos de motos.

## Stack

- **BD:** PostgreSQL 16
- **Backend:** Python 3.12 + FastAPI *(próxima fase)*
- **Frontend:** React + TypeScript *(próxima fase)*

---

## Levantar la base de datos

### Prerrequisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y corriendo

### Iniciar

```bash
# Desde la raíz del proyecto
docker-compose up -d postgres
```

El archivo `db/init.sql` se aplica automáticamente al primer arranque.

### Verificar que está corriendo

```bash
docker ps                          # debe aparecer moto_postgres
docker logs moto_postgres          # revisar logs de inicio
```

### Conectarse a la BD

```bash
# Usando psql dentro del contenedor
docker exec -it moto_postgres psql -U moto_user -d moto_repuestos

# Comandos útiles dentro de psql
\dt          -- listar tablas
\dv          -- listar vistas
\di          -- listar índices
\df          -- listar funciones/triggers
\q           -- salir
```

### Credenciales

| Campo    | Valor              |
|----------|--------------------|
| Host     | `localhost`        |
| Puerto   | `5432`             |
| Base     | `moto_repuestos`   |
| Usuario  | `moto_user`        |
| Password | `moto_pass_2026`   |

### Detener

```bash
docker-compose down           # detiene y elimina contenedores
docker-compose down -v        # también elimina el volumen (borra los datos)
```

---

## Estructura del proyecto

```
Moto-Repuestos/
├── db/
│   └── init.sql            ← Schema completo (tablas, triggers, vistas, índices)
├── docker-compose.yml
└── README.md
```

## Schema — resumen

| Módulo        | Tablas                                          |
|---------------|-------------------------------------------------|
| Catálogo Base | `marca_moto`, `modelo_moto`, `categoria`, `unidad_medida` |
| Repuestos     | `repuesto`, `repuesto_compatibilidad`, `repuesto_imagen` |
| Inventario    | `movimiento_inventario`                         |
| Clientes      | `cliente`, `cliente_moto`                       |
| Ventas        | `venta`, `venta_detalle`, `pago`                |
| Garantías     | `garantia`, `garantia_seguimiento`              |

**Triggers:** 5 | **Vistas:** 4 | **Índices:** 13
