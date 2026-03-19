-- =============================================================
-- Patch 002 — Correcciones de tipos y constraints
-- Aplicar sobre instalaciones existentes
-- =============================================================

-- Fix 1: Email de cliente pasa a ser UNIQUE (si ya hay duplicados, resolverlos antes)
ALTER TABLE cliente
    ALTER COLUMN email TYPE VARCHAR(255),
    ADD CONSTRAINT cliente_email_unique UNIQUE (email);

CREATE INDEX IF NOT EXISTS idx_cliente_email ON cliente (email);

-- Fix 2: Columnas monetarias Float → NUMERIC para evitar errores de redondeo

-- Tabla: cliente
ALTER TABLE cliente
    ALTER COLUMN limite_credito TYPE NUMERIC(14,2),
    ALTER COLUMN saldo_credito  TYPE NUMERIC(14,2);

-- Tabla: repuesto
ALTER TABLE repuesto
    ALTER COLUMN precio_compra    TYPE NUMERIC(14,2),
    ALTER COLUMN precio_venta     TYPE NUMERIC(14,2),
    ALTER COLUMN precio_venta_min TYPE NUMERIC(14,2);

-- Tabla: movimiento_inventario
ALTER TABLE movimiento_inventario
    ALTER COLUMN costo_unitario TYPE NUMERIC(14,2);

-- Tabla: venta
ALTER TABLE venta
    ALTER COLUMN subtotal        TYPE NUMERIC(14,2),
    ALTER COLUMN descuento_total TYPE NUMERIC(14,2),
    ALTER COLUMN impuesto_pct    TYPE NUMERIC(5,2),
    ALTER COLUMN impuesto_monto  TYPE NUMERIC(14,2),
    ALTER COLUMN total           TYPE NUMERIC(14,2);

-- Tabla: venta_detalle
ALTER TABLE venta_detalle
    ALTER COLUMN precio_unitario TYPE NUMERIC(14,2),
    ALTER COLUMN descuento_pct   TYPE NUMERIC(5,2),
    ALTER COLUMN subtotal        TYPE NUMERIC(14,2),
    ALTER COLUMN costo_unitario  TYPE NUMERIC(14,2);

SELECT 'Patch 002 aplicado correctamente' AS resultado;
