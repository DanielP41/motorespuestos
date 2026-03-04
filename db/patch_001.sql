-- Parche: función IMMUTABLE wrapper para unaccent + índices FTS + triggers + vistas

-- Función wrapper IMMUTABLE para unaccent (necesario para índices GIN)
CREATE OR REPLACE FUNCTION immutable_unaccent(text)
RETURNS text AS $$
  SELECT unaccent($1);
$$ LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE;

-- Índices FTS corregidos
CREATE INDEX IF NOT EXISTS idx_repuesto_nombre_fts
    ON repuesto USING GIN (to_tsvector('spanish', immutable_unaccent(nombre)));

CREATE INDEX IF NOT EXISTS idx_cliente_nombre
    ON cliente USING GIN (to_tsvector('spanish', immutable_unaccent(nombre)));

-- Índices B-Tree
CREATE INDEX IF NOT EXISTS idx_cliente_documento     ON cliente (documento_nro);
CREATE INDEX IF NOT EXISTS idx_venta_fecha           ON venta (fecha DESC);
CREATE INDEX IF NOT EXISTS idx_repuesto_categoria    ON repuesto (categoria_id);
CREATE INDEX IF NOT EXISTS idx_repuesto_estado       ON repuesto (estado);
CREATE INDEX IF NOT EXISTS idx_modelo_moto_marca     ON modelo_moto (marca_id);
CREATE INDEX IF NOT EXISTS idx_venta_cliente         ON venta (cliente_id);
CREATE INDEX IF NOT EXISTS idx_venta_estado          ON venta (estado);
CREATE INDEX IF NOT EXISTS idx_venta_detalle_venta   ON venta_detalle (venta_id);
CREATE INDEX IF NOT EXISTS idx_venta_detalle_repuesto ON venta_detalle (repuesto_id);
CREATE INDEX IF NOT EXISTS idx_movimiento_repuesto   ON movimiento_inventario (repuesto_id, creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_garantia_cliente      ON garantia (cliente_id);
CREATE INDEX IF NOT EXISTS idx_garantia_estado       ON garantia (estado);

-- Función auxiliar
CREATE OR REPLACE FUNCTION calcular_subtotal_linea(
    p_cantidad        INTEGER,
    p_precio_unitario NUMERIC,
    p_descuento_pct   NUMERIC
) RETURNS NUMERIC AS $$
BEGIN
    RETURN ROUND(p_cantidad * p_precio_unitario * (1 - p_descuento_pct / 100.0), 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- T1: Actualizar stock_actual tras insertar movimiento
CREATE OR REPLACE FUNCTION fn_after_movimiento_inventario()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE repuesto
       SET stock_actual   = NEW.stock_posterior,
           actualizado_en = now()
     WHERE id = NEW.repuesto_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER after_movimiento_inventario
    AFTER INSERT ON movimiento_inventario
    FOR EACH ROW
    EXECUTE FUNCTION fn_after_movimiento_inventario();

-- T2: Al insertar línea de venta → validar stock y generar movimiento
CREATE OR REPLACE FUNCTION fn_after_venta_detalle_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_stock_actual INTEGER;
    v_costo        NUMERIC;
BEGIN
    SELECT stock_actual, precio_compra
      INTO v_stock_actual, v_costo
      FROM repuesto
     WHERE id = NEW.repuesto_id
       FOR UPDATE;

    IF v_stock_actual < NEW.cantidad THEN
        RAISE EXCEPTION
            'Stock insuficiente para repuesto_id=%. Disponible: %, Solicitado: %',
            NEW.repuesto_id, v_stock_actual, NEW.cantidad;
    END IF;

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

CREATE OR REPLACE TRIGGER after_venta_detalle_insert
    AFTER INSERT ON venta_detalle
    FOR EACH ROW
    EXECUTE FUNCTION fn_after_venta_detalle_insert();

-- T3: Recalcular totales de la venta al cambiar líneas
CREATE OR REPLACE FUNCTION fn_after_venta_detalle_change()
RETURNS TRIGGER AS $$
DECLARE
    v_venta_id     BIGINT;
    v_subtotal     NUMERIC;
    v_desc_total   NUMERIC;
    v_impuesto_pct NUMERIC;
    v_impuesto_mto NUMERIC;
    v_total        NUMERIC;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_venta_id := OLD.venta_id;
    ELSE
        v_venta_id := NEW.venta_id;
    END IF;

    SELECT
        COALESCE(SUM(cantidad * precio_unitario), 0),
        COALESCE(SUM(cantidad * precio_unitario * descuento_pct / 100.0), 0)
      INTO v_subtotal, v_desc_total
      FROM venta_detalle
     WHERE venta_id = v_venta_id;

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

CREATE OR REPLACE TRIGGER after_venta_detalle_change
    AFTER INSERT OR UPDATE OR DELETE ON venta_detalle
    FOR EACH ROW
    EXECUTE FUNCTION fn_after_venta_detalle_change();

-- T4: Gestionar saldo de crédito del cliente al cambiar estado de venta
CREATE OR REPLACE FUNCTION fn_after_venta_estado()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.estado = NEW.estado THEN RETURN NEW; END IF;

    IF NEW.estado = 'en_credito' AND OLD.estado != 'en_credito' AND NEW.cliente_id IS NOT NULL THEN
        UPDATE cliente
           SET saldo_credito  = saldo_credito + NEW.total,
               actualizado_en = now()
         WHERE id = NEW.cliente_id;
    ELSIF NEW.estado = 'anulada' AND OLD.estado = 'en_credito' AND NEW.cliente_id IS NOT NULL THEN
        UPDATE cliente
           SET saldo_credito  = saldo_credito - NEW.total,
               actualizado_en = now()
         WHERE id = NEW.cliente_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER after_venta_estado
    AFTER UPDATE OF estado ON venta
    FOR EACH ROW
    EXECUTE FUNCTION fn_after_venta_estado();

-- T5: Descontar saldo de crédito al registrar pago
CREATE OR REPLACE FUNCTION fn_after_pago_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_cliente_id INTEGER;
    v_estado     estado_venta;
BEGIN
    SELECT cliente_id, estado
      INTO v_cliente_id, v_estado
      FROM venta WHERE id = NEW.venta_id;

    IF v_estado = 'en_credito' AND v_cliente_id IS NOT NULL THEN
        UPDATE cliente
           SET saldo_credito  = GREATEST(saldo_credito - NEW.monto, 0),
               actualizado_en = now()
         WHERE id = v_cliente_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER after_pago_insert
    AFTER INSERT ON pago
    FOR EACH ROW
    EXECUTE FUNCTION fn_after_pago_insert();

-- Vistas
CREATE OR REPLACE VIEW v_stock_critico AS
SELECT r.id, r.sku, r.nombre, c.nombre AS categoria,
       r.stock_actual, r.stock_minimo,
       r.stock_minimo - r.stock_actual AS faltante, r.precio_compra
FROM repuesto r
JOIN categoria c ON c.id = r.categoria_id
WHERE r.stock_actual < r.stock_minimo AND r.estado = 'activo'
ORDER BY faltante DESC;

CREATE OR REPLACE VIEW v_rentabilidad_repuestos AS
SELECT r.id, r.sku, r.nombre,
       SUM(vd.cantidad) AS unidades_vendidas,
       SUM(vd.subtotal) AS ingresos,
       SUM(vd.costo_unitario * vd.cantidad) AS costo_total,
       SUM(vd.subtotal) - SUM(vd.costo_unitario * vd.cantidad) AS utilidad,
       ROUND((SUM(vd.subtotal) - SUM(vd.costo_unitario * vd.cantidad))
             / NULLIF(SUM(vd.subtotal), 0) * 100, 2) AS margen_pct
FROM venta_detalle vd
JOIN repuesto r ON r.id = vd.repuesto_id
JOIN venta v ON v.id = vd.venta_id
WHERE v.fecha >= now() - INTERVAL '30 days' AND v.estado != 'anulada'
GROUP BY r.id, r.sku, r.nombre
ORDER BY utilidad DESC;

CREATE OR REPLACE VIEW v_garantias_por_vencer AS
SELECT g.id, g.fecha_apertura, g.fecha_vencimiento,
       g.fecha_vencimiento - CURRENT_DATE AS dias_restantes,
       g.descripcion_falla, g.estado,
       c.nombre AS cliente, c.telefono AS telefono_cliente,
       r.sku AS sku_repuesto, r.nombre AS nombre_repuesto
FROM garantia g
JOIN cliente c ON c.id = g.cliente_id
JOIN repuesto r ON r.id = g.repuesto_id
WHERE g.estado IN ('abierta', 'en_proceso')
  AND g.fecha_vencimiento BETWEEN CURRENT_DATE AND CURRENT_DATE + 7
ORDER BY g.fecha_vencimiento;

CREATE OR REPLACE VIEW v_cartera_clientes AS
SELECT c.id, c.documento_nro, c.nombre, c.telefono, c.email,
       c.limite_credito, c.saldo_credito,
       c.limite_credito - c.saldo_credito AS credito_disponible,
       ROUND(c.saldo_credito / NULLIF(c.limite_credito, 0) * 100, 2) AS uso_credito_pct
FROM cliente c
WHERE c.credito_habilitado = true AND c.activo = true
ORDER BY c.saldo_credito DESC;

SELECT 'Schema completo aplicado correctamente' AS resultado;
