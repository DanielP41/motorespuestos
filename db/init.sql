-- =============================================================
-- MOTO-REPUESTOS — Schema Inicial PostgreSQL 16
-- Versión 1.0 — Marzo 2026
-- =============================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================
-- SECCIÓN 1: ENUMs
-- =============================================================

CREATE TYPE estado_repuesto AS ENUM ('activo', 'descontinuado', 'agotado');

CREATE TYPE tipo_movimiento AS ENUM ('entrada', 'salida', 'ajuste', 'devolucion');

CREATE TYPE estado_venta AS ENUM ('pendiente', 'pagada', 'anulada', 'en_credito');

CREATE TYPE metodo_pago AS ENUM (
    'efectivo',
    'tarjeta_debito',
    'tarjeta_credito',
    'transferencia',
    'credito'
);

CREATE TYPE estado_garantia AS ENUM ('abierta', 'en_proceso', 'resuelta', 'rechazada');

CREATE TYPE resolucion_garantia AS ENUM (
    'reemplazo',
    'devolucion_dinero',
    'reparacion',
    'rechazada'
);

-- =============================================================
-- SECCIÓN 2: MÓDULO 1 — CATÁLOGO BASE
-- =============================================================

-- Marcas de moto
CREATE TABLE marca_moto (
    id          SERIAL PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL UNIQUE,
    pais_origen VARCHAR(100),
    activa      BOOLEAN NOT NULL DEFAULT true,
    creado_en   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Modelos de moto
CREATE TABLE modelo_moto (
    id          SERIAL PRIMARY KEY,
    marca_id    INTEGER NOT NULL REFERENCES marca_moto(id),
    nombre      VARCHAR(150) NOT NULL,
    anio_inicio SMALLINT,
    anio_fin    SMALLINT,
    cilindraje  SMALLINT,   -- cc
    tipo        VARCHAR(80), -- deportiva, naked, scooter, etc.
    activo      BOOLEAN NOT NULL DEFAULT true,
    creado_en   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (marca_id, nombre, anio_inicio)
);

-- Categorías de repuestos (árbol auto-referencial)
CREATE TABLE categoria (
    id        SERIAL PRIMARY KEY,
    padre_id  INTEGER REFERENCES categoria(id),
    nombre    VARCHAR(150) NOT NULL,
    slug      VARCHAR(200) NOT NULL UNIQUE,
    activa    BOOLEAN NOT NULL DEFAULT true,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unidades de medida
CREATE TABLE unidad_medida (
    id        SERIAL PRIMARY KEY,
    codigo    VARCHAR(10) NOT NULL UNIQUE,  -- UND, PAR, LT, KG, etc.
    nombre    VARCHAR(80) NOT NULL,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================
-- SECCIÓN 3: MÓDULO 2 — REPUESTOS / PRODUCTOS
-- =============================================================

CREATE TABLE repuesto (
    id               SERIAL PRIMARY KEY,
    sku              VARCHAR(80)     NOT NULL UNIQUE,
    nombre           VARCHAR(255)    NOT NULL,
    descripcion      TEXT,
    categoria_id     INTEGER         NOT NULL REFERENCES categoria(id),
    unidad_medida_id INTEGER         REFERENCES unidad_medida(id),
    precio_compra    NUMERIC(14, 2)  NOT NULL DEFAULT 0 CHECK (precio_compra >= 0),
    precio_venta     NUMERIC(14, 2)  NOT NULL DEFAULT 0 CHECK (precio_venta >= 0),
    precio_venta_min NUMERIC(14, 2)  NOT NULL DEFAULT 0 CHECK (precio_venta_min >= 0),
    stock_actual     INTEGER         NOT NULL DEFAULT 0,
    stock_minimo     INTEGER         NOT NULL DEFAULT 0 CHECK (stock_minimo >= 0),
    estado           estado_repuesto NOT NULL DEFAULT 'activo',
    es_original      BOOLEAN         NOT NULL DEFAULT true,
    creado_en        TIMESTAMPTZ     NOT NULL DEFAULT now(),
    actualizado_en   TIMESTAMPTZ     NOT NULL DEFAULT now()
);

-- Compatibilidad repuesto ↔ modelo de moto (N:M)
CREATE TABLE repuesto_compatibilidad (
    repuesto_id    INTEGER  NOT NULL REFERENCES repuesto(id) ON DELETE CASCADE,
    modelo_moto_id INTEGER  NOT NULL REFERENCES modelo_moto(id),
    anio_desde     SMALLINT,
    anio_hasta     SMALLINT,
    notas          TEXT,
    PRIMARY KEY (repuesto_id, modelo_moto_id)
);

-- Imágenes de repuestos (almacenadas en Cloudflare R2)
CREATE TABLE repuesto_imagen (
    id          SERIAL PRIMARY KEY,
    repuesto_id INTEGER     NOT NULL REFERENCES repuesto(id) ON DELETE CASCADE,
    url         TEXT        NOT NULL,
    orden       SMALLINT    NOT NULL DEFAULT 0,
    es_principal BOOLEAN    NOT NULL DEFAULT false,
    creado_en   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================
-- SECCIÓN 4: MÓDULO 3 — INVENTARIO
-- =============================================================

CREATE TABLE movimiento_inventario (
    id               BIGSERIAL PRIMARY KEY,
    repuesto_id      INTEGER         NOT NULL REFERENCES repuesto(id),
    tipo             tipo_movimiento NOT NULL,
    cantidad         INTEGER         NOT NULL CHECK (cantidad != 0),
    stock_anterior   INTEGER         NOT NULL,
    stock_posterior  INTEGER         NOT NULL,
    costo_unitario   NUMERIC(14, 2),
    -- referencia polimórfica (venta_detalle_id, garantia_id, etc.)
    referencia_id    BIGINT,
    referencia_tipo  VARCHAR(50),    -- 'venta_detalle', 'garantia', 'ajuste_manual'
    usuario          VARCHAR(150),
    notas            TEXT,
    creado_en        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================
-- SECCIÓN 5: MÓDULO 4 — CLIENTES
-- =============================================================

CREATE TABLE cliente (
    id                  SERIAL PRIMARY KEY,
    tipo                CHAR(1)        NOT NULL CHECK (tipo IN ('N', 'J')), -- Natural / Jurídico
    documento_tipo      VARCHAR(20)    NOT NULL, -- CC, NIT, RUT, Pasaporte, etc.
    documento_nro       VARCHAR(30)    NOT NULL UNIQUE,
    nombre              VARCHAR(255)   NOT NULL,
    telefono            VARCHAR(30),
    email               VARCHAR(255),
    direccion           TEXT,
    credito_habilitado  BOOLEAN        NOT NULL DEFAULT false,
    limite_credito      NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (limite_credito >= 0),
    saldo_credito       NUMERIC(14, 2) NOT NULL DEFAULT 0, -- deuda actual
    activo              BOOLEAN        NOT NULL DEFAULT true,
    creado_en           TIMESTAMPTZ    NOT NULL DEFAULT now(),
    actualizado_en      TIMESTAMPTZ    NOT NULL DEFAULT now()
);

-- Motos registradas del cliente
CREATE TABLE cliente_moto (
    id             SERIAL PRIMARY KEY,
    cliente_id     INTEGER     NOT NULL REFERENCES cliente(id),
    modelo_moto_id INTEGER     NOT NULL REFERENCES modelo_moto(id),
    placa          VARCHAR(20),
    anio           SMALLINT,
    color          VARCHAR(80),
    km_actuales    INTEGER,
    activa         BOOLEAN     NOT NULL DEFAULT true,
    creado_en      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================
-- SECCIÓN 6: MÓDULO 5 — VENTAS Y FACTURACIÓN
-- =============================================================

CREATE TABLE venta (
    id               BIGSERIAL PRIMARY KEY,
    numero_factura   VARCHAR(50)   NOT NULL UNIQUE,
    cliente_id       INTEGER       REFERENCES cliente(id),  -- NULL = venta mostrador
    cliente_moto_id  INTEGER       REFERENCES cliente_moto(id),
    fecha            TIMESTAMPTZ   NOT NULL DEFAULT now(),
    subtotal         NUMERIC(14, 2) NOT NULL DEFAULT 0,
    descuento_total  NUMERIC(14, 2) NOT NULL DEFAULT 0,
    impuesto_pct     NUMERIC(5, 2)  NOT NULL DEFAULT 0,  -- % configurable
    impuesto_monto   NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total            NUMERIC(14, 2) NOT NULL DEFAULT 0,
    metodo_pago      metodo_pago   NOT NULL DEFAULT 'efectivo',
    estado           estado_venta  NOT NULL DEFAULT 'pendiente',
    notas            TEXT,
    usuario          VARCHAR(150),
    creado_en        TIMESTAMPTZ   NOT NULL DEFAULT now(),
    actualizado_en   TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Líneas de la venta
CREATE TABLE venta_detalle (
    id              BIGSERIAL PRIMARY KEY,
    venta_id        BIGINT        NOT NULL REFERENCES venta(id) ON DELETE CASCADE,
    repuesto_id     INTEGER       NOT NULL REFERENCES repuesto(id),
    cantidad        INTEGER       NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(14, 2) NOT NULL,
    descuento_pct   NUMERIC(5, 2)  NOT NULL DEFAULT 0,
    subtotal        NUMERIC(14, 2) NOT NULL,
    costo_unitario  NUMERIC(14, 2),   -- snapshot del costo al momento de la venta
    creado_en       TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Pagos (permite abonos parciales en ventas a crédito)
CREATE TABLE pago (
    id          BIGSERIAL PRIMARY KEY,
    venta_id    BIGINT        NOT NULL REFERENCES venta(id),
    fecha       TIMESTAMPTZ   NOT NULL DEFAULT now(),
    monto       NUMERIC(14, 2) NOT NULL CHECK (monto > 0),
    metodo      metodo_pago   NOT NULL,
    referencia  VARCHAR(100), -- número de transacción, cheque, etc.
    notas       TEXT,
    usuario     VARCHAR(150),
    creado_en   TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- =============================================================
-- SECCIÓN 7: MÓDULO 6 — GARANTÍAS
-- =============================================================

CREATE TABLE garantia (
    id                  BIGSERIAL PRIMARY KEY,
    venta_detalle_id    BIGINT             NOT NULL REFERENCES venta_detalle(id),
    cliente_id          INTEGER            NOT NULL REFERENCES cliente(id),
    repuesto_id         INTEGER            NOT NULL REFERENCES repuesto(id),
    fecha_apertura      TIMESTAMPTZ        NOT NULL DEFAULT now(),
    fecha_vencimiento   DATE               NOT NULL,
    dias_garantia       SMALLINT           NOT NULL DEFAULT 90,
    descripcion_falla   TEXT               NOT NULL,
    estado              estado_garantia    NOT NULL DEFAULT 'abierta',
    resolucion          resolucion_garantia,
    repuesto_nuevo_id   INTEGER            REFERENCES repuesto(id), -- en caso de reemplazo
    notas_resolucion    TEXT,
    cerrado_en          TIMESTAMPTZ,
    usuario             VARCHAR(150),
    creado_en           TIMESTAMPTZ        NOT NULL DEFAULT now(),
    actualizado_en      TIMESTAMPTZ        NOT NULL DEFAULT now()
);

-- Historial de acciones sobre la garantía
CREATE TABLE garantia_seguimiento (
    id          BIGSERIAL PRIMARY KEY,
    garantia_id BIGINT      NOT NULL REFERENCES garantia(id) ON DELETE CASCADE,
    fecha       TIMESTAMPTZ NOT NULL DEFAULT now(),
    descripcion TEXT        NOT NULL,
    usuario     VARCHAR(150),
    creado_en   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================
-- SECCIÓN 8: ÍNDICES DE RENDIMIENTO
-- =============================================================

-- Búsqueda full-text de repuestos (sin tilde, insensible a mayúsculas)
CREATE INDEX idx_repuesto_nombre_fts
    ON repuesto
    USING GIN (to_tsvector('spanish', unaccent(nombre)));

-- Búsqueda full-text de clientes por nombre
CREATE INDEX idx_cliente_nombre
    ON cliente
    USING GIN (to_tsvector('spanish', unaccent(nombre)));

-- Lookup rápido por número de documento
CREATE INDEX idx_cliente_documento
    ON cliente (documento_nro);

-- Consultas de ventas por rango de fechas
CREATE INDEX idx_venta_fecha
    ON venta (fecha DESC);

-- Índices adicionales para FKs frecuentes
CREATE INDEX idx_repuesto_categoria    ON repuesto (categoria_id);
CREATE INDEX idx_repuesto_estado       ON repuesto (estado);
CREATE INDEX idx_modelo_moto_marca     ON modelo_moto (marca_id);
CREATE INDEX idx_venta_cliente         ON venta (cliente_id);
CREATE INDEX idx_venta_estado          ON venta (estado);
CREATE INDEX idx_venta_detalle_venta   ON venta_detalle (venta_id);
CREATE INDEX idx_venta_detalle_repuesto ON venta_detalle (repuesto_id);
CREATE INDEX idx_movimiento_repuesto   ON movimiento_inventario (repuesto_id, creado_en DESC);
CREATE INDEX idx_garantia_cliente      ON garantia (cliente_id);
CREATE INDEX idx_garantia_estado       ON garantia (estado);

-- =============================================================
-- SECCIÓN 9: FUNCIONES AUXILIARES
-- =============================================================

-- Función para calcular subtotal de una línea de venta
CREATE OR REPLACE FUNCTION calcular_subtotal_linea(
    p_cantidad        INTEGER,
    p_precio_unitario NUMERIC,
    p_descuento_pct   NUMERIC
) RETURNS NUMERIC AS $$
BEGIN
    RETURN ROUND(p_cantidad * p_precio_unitario * (1 - p_descuento_pct / 100.0), 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =============================================================
-- SECCIÓN 10: TRIGGERS
-- =============================================================

-- -------------------------------------------------------------------
-- T1: Actualizar stock_actual tras insertar movimiento
-- -------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_after_movimiento_inventario()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE repuesto
       SET stock_actual    = NEW.stock_posterior,
           actualizado_en  = now()
     WHERE id = NEW.repuesto_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_movimiento_inventario
    AFTER INSERT ON movimiento_inventario
    FOR EACH ROW
    EXECUTE FUNCTION fn_after_movimiento_inventario();

-- -------------------------------------------------------------------
-- T2: Al insertar línea de venta → validar stock y generar movimiento
-- -------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_after_venta_detalle_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_stock_actual INTEGER;
    v_costo        NUMERIC;
BEGIN
    -- Obtener stock y costo actuales
    SELECT stock_actual, precio_compra
      INTO v_stock_actual, v_costo
      FROM repuesto
     WHERE id = NEW.repuesto_id
       FOR UPDATE; -- bloqueo a nivel de fila

    -- Validar stock suficiente
    IF v_stock_actual < NEW.cantidad THEN
        RAISE EXCEPTION
            'Stock insuficiente para repuesto_id=%. Disponible: %, Solicitado: %',
            NEW.repuesto_id, v_stock_actual, NEW.cantidad;
    END IF;

    -- Registrar movimiento de salida
    INSERT INTO movimiento_inventario (
        repuesto_id, tipo, cantidad,
        stock_anterior, stock_posterior,
        costo_unitario, referencia_id, referencia_tipo
    ) VALUES (
        NEW.repuesto_id, 'salida', NEW.cantidad,
        v_stock_actual, v_stock_actual - NEW.cantidad,
        COALESCE(NEW.costo_unitario, v_costo),
        NEW.id, 'venta_detalle'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_venta_detalle_insert
    AFTER INSERT ON venta_detalle
    FOR EACH ROW
    EXECUTE FUNCTION fn_after_venta_detalle_insert();

-- -------------------------------------------------------------------
-- T3: Recalcular totales de la venta al cambiar líneas (INSERT/UPDATE/DELETE)
-- -------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_after_venta_detalle_change()
RETURNS TRIGGER AS $$
DECLARE
    v_venta_id      BIGINT;
    v_subtotal      NUMERIC;
    v_desc_total    NUMERIC;
    v_impuesto_pct  NUMERIC;
    v_impuesto_mto  NUMERIC;
    v_total         NUMERIC;
BEGIN
    -- Determinar el venta_id según operación
    IF TG_OP = 'DELETE' THEN
        v_venta_id := OLD.venta_id;
    ELSE
        v_venta_id := NEW.venta_id;
    END IF;

    -- Recalcular desde líneas
    SELECT
        COALESCE(SUM(cantidad * precio_unitario), 0),
        COALESCE(SUM(cantidad * precio_unitario * descuento_pct / 100.0), 0)
      INTO v_subtotal, v_desc_total
      FROM venta_detalle
     WHERE venta_id = v_venta_id;

    -- Obtener porcentaje de impuesto
    SELECT impuesto_pct INTO v_impuesto_pct
      FROM venta WHERE id = v_venta_id;

    v_impuesto_mto := ROUND((v_subtotal - v_desc_total) * v_impuesto_pct / 100.0, 2);
    v_total        := ROUND(v_subtotal - v_desc_total + v_impuesto_mto, 2);

    UPDATE venta
       SET subtotal        = v_subtotal,
           descuento_total = v_desc_total,
           impuesto_monto  = v_impuesto_mto,
           total           = v_total,
           actualizado_en  = now()
     WHERE id = v_venta_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_venta_detalle_change
    AFTER INSERT OR UPDATE OR DELETE ON venta_detalle
    FOR EACH ROW
    EXECUTE FUNCTION fn_after_venta_detalle_change();

-- -------------------------------------------------------------------
-- T4: Gestionar saldo de crédito del cliente al cambiar estado de venta
-- -------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_after_venta_estado()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo actuar si el estado cambió
    IF OLD.estado = NEW.estado THEN
        RETURN NEW;
    END IF;

    -- Venta pasa a crédito → sumar deuda al cliente
    IF NEW.estado = 'en_credito' AND OLD.estado != 'en_credito' AND NEW.cliente_id IS NOT NULL THEN
        UPDATE cliente
           SET saldo_credito   = saldo_credito + NEW.total,
               actualizado_en  = now()
         WHERE id = NEW.cliente_id;

    -- Venta se anula (venía de crédito) → revertir deuda
    ELSIF NEW.estado = 'anulada' AND OLD.estado = 'en_credito' AND NEW.cliente_id IS NOT NULL THEN
        UPDATE cliente
           SET saldo_credito   = saldo_credito - NEW.total,
               actualizado_en  = now()
         WHERE id = NEW.cliente_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_venta_estado
    AFTER UPDATE OF estado ON venta
    FOR EACH ROW
    EXECUTE FUNCTION fn_after_venta_estado();

-- -------------------------------------------------------------------
-- T5: Descontar saldo de crédito al registrar pago en venta a crédito
-- -------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_after_pago_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_cliente_id INTEGER;
    v_estado     estado_venta;
BEGIN
    SELECT cliente_id, estado
      INTO v_cliente_id, v_estado
      FROM venta
     WHERE id = NEW.venta_id;

    IF v_estado = 'en_credito' AND v_cliente_id IS NOT NULL THEN
        UPDATE cliente
           SET saldo_credito  = GREATEST(saldo_credito - NEW.monto, 0),
               actualizado_en = now()
         WHERE id = v_cliente_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_pago_insert
    AFTER INSERT ON pago
    FOR EACH ROW
    EXECUTE FUNCTION fn_after_pago_insert();

-- =============================================================
-- SECCIÓN 11: VISTAS ANALÍTICAS
-- =============================================================

-- V1: Repuestos con stock crítico (stock_actual < stock_minimo)
CREATE OR REPLACE VIEW v_stock_critico AS
SELECT
    r.id,
    r.sku,
    r.nombre,
    c.nombre            AS categoria,
    r.stock_actual,
    r.stock_minimo,
    r.stock_minimo - r.stock_actual AS faltante,
    r.precio_compra
FROM repuesto r
JOIN categoria c ON c.id = r.categoria_id
WHERE r.stock_actual < r.stock_minimo
  AND r.estado = 'activo'
ORDER BY faltante DESC;

-- V2: Rentabilidad de repuestos en los últimos 30 días
CREATE OR REPLACE VIEW v_rentabilidad_repuestos AS
SELECT
    r.id,
    r.sku,
    r.nombre,
    SUM(vd.cantidad)                          AS unidades_vendidas,
    SUM(vd.subtotal)                          AS ingresos,
    SUM(vd.costo_unitario * vd.cantidad)      AS costo_total,
    SUM(vd.subtotal) - SUM(vd.costo_unitario * vd.cantidad) AS utilidad,
    ROUND(
        (SUM(vd.subtotal) - SUM(vd.costo_unitario * vd.cantidad))
        / NULLIF(SUM(vd.subtotal), 0) * 100, 2
    )                                         AS margen_pct
FROM venta_detalle vd
JOIN repuesto r ON r.id = vd.repuesto_id
JOIN venta v     ON v.id = vd.venta_id
WHERE v.fecha >= now() - INTERVAL '30 days'
  AND v.estado != 'anulada'
GROUP BY r.id, r.sku, r.nombre
ORDER BY utilidad DESC;

-- V3: Garantías abiertas que vencen en los próximos 7 días
CREATE OR REPLACE VIEW v_garantias_por_vencer AS
SELECT
    g.id,
    g.fecha_apertura,
    g.fecha_vencimiento,
    g.fecha_vencimiento - CURRENT_DATE AS dias_restantes,
    g.descripcion_falla,
    g.estado,
    c.nombre          AS cliente,
    c.telefono        AS telefono_cliente,
    r.sku             AS sku_repuesto,
    r.nombre          AS nombre_repuesto
FROM garantia g
JOIN cliente  c ON c.id = g.cliente_id
JOIN repuesto r ON r.id = g.repuesto_id
WHERE g.estado IN ('abierta', 'en_proceso')
  AND g.fecha_vencimiento BETWEEN CURRENT_DATE AND CURRENT_DATE + 7
ORDER BY g.fecha_vencimiento;

-- V4: Cartera de clientes con crédito
CREATE OR REPLACE VIEW v_cartera_clientes AS
SELECT
    c.id,
    c.documento_nro,
    c.nombre,
    c.telefono,
    c.email,
    c.limite_credito,
    c.saldo_credito,
    c.limite_credito - c.saldo_credito AS credito_disponible,
    ROUND(c.saldo_credito / NULLIF(c.limite_credito, 0) * 100, 2) AS uso_credito_pct
FROM cliente c
WHERE c.credito_habilitado = true
  AND c.activo = true
ORDER BY c.saldo_credito DESC;

-- =============================================================
-- SECCIÓN 12: DATOS INICIALES
-- =============================================================

-- Unidades de medida básicas
INSERT INTO unidad_medida (codigo, nombre) VALUES
    ('UND',  'Unidad'),
    ('PAR',  'Par'),
    ('JGO',  'Juego'),
    ('LT',   'Litro'),
    ('ML',   'Mililitro'),
    ('KG',   'Kilogramo'),
    ('GR',   'Gramo'),
    ('MT',   'Metro'),
    ('CM',   'Centímetro');

-- Categorías raíz
INSERT INTO categoria (padre_id, nombre, slug) VALUES
    (NULL, 'Motor',                'motor'),
    (NULL, 'Transmisión',          'transmision'),
    (NULL, 'Frenos',               'frenos'),
    (NULL, 'Suspensión',           'suspension'),
    (NULL, 'Eléctrico',            'electrico'),
    (NULL, 'Carrocería',           'carroceria'),
    (NULL, 'Lubricantes y Fluidos','lubricantes-fluidos'),
    (NULL, 'Accesorios',           'accesorios');

-- Subcategorías de Motor
INSERT INTO categoria (padre_id, nombre, slug)
SELECT id, 'Pistones',        'motor-pistones'      FROM categoria WHERE slug = 'motor';
INSERT INTO categoria (padre_id, nombre, slug)
SELECT id, 'Anillos',         'motor-anillos'       FROM categoria WHERE slug = 'motor';
INSERT INTO categoria (padre_id, nombre, slug)
SELECT id, 'Válvulas',        'motor-valvulas'      FROM categoria WHERE slug = 'motor';
INSERT INTO categoria (padre_id, nombre, slug)
SELECT id, 'Juntas y Empaques','motor-juntas'       FROM categoria WHERE slug = 'motor';
INSERT INTO categoria (padre_id, nombre, slug)
SELECT id, 'Filtros de Aire', 'motor-filtros-aire'  FROM categoria WHERE slug = 'motor';
INSERT INTO categoria (padre_id, nombre, slug)
SELECT id, 'Filtros de Aceite','motor-filtros-aceite' FROM categoria WHERE slug = 'motor';
INSERT INTO categoria (padre_id, nombre, slug)
SELECT id, 'Carburador',      'motor-carburador'    FROM categoria WHERE slug = 'motor';

-- Subcategorías de Frenos
INSERT INTO categoria (padre_id, nombre, slug)
SELECT id, 'Pastillas de Freno', 'frenos-pastillas'   FROM categoria WHERE slug = 'frenos';
INSERT INTO categoria (padre_id, nombre, slug)
SELECT id, 'Discos de Freno',    'frenos-discos'      FROM categoria WHERE slug = 'frenos';
INSERT INTO categoria (padre_id, nombre, slug)
SELECT id, 'Bandas de Freno',    'frenos-bandas'      FROM categoria WHERE slug = 'frenos';
INSERT INTO categoria (padre_id, nombre, slug)
SELECT id, 'Cables de Freno',    'frenos-cables'      FROM categoria WHERE slug = 'frenos';

-- Subcategorías de Transmisión
INSERT INTO categoria (padre_id, nombre, slug)
SELECT id, 'Cadenas',        'transmision-cadenas'   FROM categoria WHERE slug = 'transmision';
INSERT INTO categoria (padre_id, nombre, slug)
SELECT id, 'Piñones',        'transmision-pinones'   FROM categoria WHERE slug = 'transmision';
INSERT INTO categoria (padre_id, nombre, slug)
SELECT id, 'Corona',         'transmision-corona'    FROM categoria WHERE slug = 'transmision';
INSERT INTO categoria (padre_id, nombre, slug)
SELECT id, 'Clutch',         'transmision-clutch'    FROM categoria WHERE slug = 'transmision';

-- Marcas de moto populares
INSERT INTO marca_moto (nombre, pais_origen) VALUES
    ('Honda',      'Japón'),
    ('Yamaha',     'Japón'),
    ('Suzuki',     'Japón'),
    ('Kawasaki',   'Japón'),
    ('Bajaj',      'India'),
    ('TVS',        'India'),
    ('AKT',        'Colombia'),
    ('Auteco',     'Colombia'),
    ('Hero',       'India'),
    ('KTM',        'Austria');

-- =============================================================
-- FIN DEL SCHEMA
-- =============================================================
