-- =============================================================
-- MOTO-REPUESTOS — Seed de Datos de Prueba
-- Ejecutar: docker exec -i moto_db psql -U moto_user -d moto_repuestos < db/seed.sql
-- =============================================================

-- Limpiar datos existentes (en orden por FK) sin borrar el admin
TRUNCATE TABLE
    repuesto_imagen,
    repuesto_compatibilidad,
    movimiento_inventario,
    venta_detalle,
    venta,
    garantia_seguimiento,
    garantia,
    cliente_moto,
    cliente,
    repuesto,
    modelo_moto,
    marca_moto,
    categoria,
    unidad_medida
RESTART IDENTITY CASCADE;

-- =============================================================
-- UNIDADES DE MEDIDA
-- =============================================================
INSERT INTO unidad_medida (codigo, nombre) VALUES
    ('UND', 'Unidad'),
    ('PAR', 'Par'),
    ('LT',  'Litro'),
    ('KG',  'Kilogramo'),
    ('MT',  'Metro'),
    ('JGO', 'Juego');

-- =============================================================
-- CATEGORÍAS (árbol de 2 niveles)
-- =============================================================
INSERT INTO categoria (padre_id, nombre, slug) VALUES
    (NULL, 'Motor',          'motor'),
    (NULL, 'Transmisión',    'transmision'),
    (NULL, 'Frenos',         'frenos'),
    (NULL, 'Suspensión',     'suspension'),
    (NULL, 'Eléctrico',      'electrico'),
    (NULL, 'Carrocería',     'carroceria'),
    (NULL, 'Lubricantes',    'lubricantes'),
    (NULL, 'Filtros',        'filtros');

-- Subcategorías Motor (padre_id = 1)
INSERT INTO categoria (padre_id, nombre, slug) VALUES
    (1, 'Pistones y Cilindros',  'motor-pistones'),
    (1, 'Culata y Válvulas',     'motor-culata'),
    (1, 'Cárter y Cigüeñal',     'motor-carter'),
    (1, 'Carburador / Inyección','motor-carburador');

-- Subcategorías Transmisión (padre_id = 2)
INSERT INTO categoria (padre_id, nombre, slug) VALUES
    (2, 'Cadenas y Piñones', 'trans-cadenas'),
    (2, 'Embrague',          'trans-embrague'),
    (2, 'Caja de Cambios',   'trans-caja');

-- Subcategorías Frenos (padre_id = 3)
INSERT INTO categoria (padre_id, nombre, slug) VALUES
    (3, 'Pastillas de Freno', 'frenos-pastillas'),
    (3, 'Discos de Freno',    'frenos-discos'),
    (3, 'Líquido de Frenos',  'frenos-liquido');

-- =============================================================
-- MARCAS Y MODELOS DE MOTO
-- =============================================================
INSERT INTO marca_moto (nombre, pais_origen) VALUES
    ('Honda',   'Japón'),
    ('Yamaha',  'Japón'),
    ('Suzuki',  'Japón'),
    ('Kawasaki','Japón'),
    ('Bajaj',   'India'),
    ('KTM',     'Austria'),
    ('Auteco',  'Colombia');

-- Modelos Honda
INSERT INTO modelo_moto (marca_id, nombre, anio_inicio, anio_fin, cilindraje, tipo) VALUES
    (1, 'CB 125F',     2018, 2026, 125,  'urbana'),
    (1, 'CG 150 Titan',2015, 2026, 150,  'urbana'),
    (1, 'CB 190R',     2016, 2026, 190,  'naked'),
    (1, 'CB 500F',     2019, 2026, 471,  'naked'),
    (1, 'XR 190L',     2019, 2026, 190,  'trail');

-- Modelos Yamaha
INSERT INTO modelo_moto (marca_id, nombre, anio_inicio, anio_fin, cilindraje, tipo) VALUES
    (2, 'YBR 125',     2010, 2026, 125, 'urbana'),
    (2, 'MT-03',       2015, 2026, 321, 'naked'),
    (2, 'FZ 150',      2016, 2026, 150, 'naked'),
    (2, 'R3',          2015, 2026, 321, 'deportiva');

-- Modelos Bajaj
INSERT INTO modelo_moto (marca_id, nombre, anio_inicio, anio_fin, cilindraje, tipo) VALUES
    (5, 'Pulsar NS 200',    2013, 2026, 200, 'naked'),
    (5, 'Dominar 400',      2018, 2026, 373, 'touring'),
    (5, 'Platina 100 ES',   2015, 2026, 100, 'urbana');

-- =============================================================
-- REPUESTOS (40 productos realistas)
-- =============================================================
-- categoria_id: 9=Pistones, 10=Culata, 13=Cadenas, 14=Embrague, 
--               16=Pastillas, 17=Discos, 6=Carrocería, 5=Eléctrico,
--               7=Lubricantes, 8=Filtros, 11=Cárter, 12=Carburador
-- unidad_medida_id: 1=UND, 2=PAR, 3=LT, 4=KG, 5=MT, 6=JGO

INSERT INTO repuesto (sku, nombre, descripcion, categoria_id, unidad_medida_id, precio_compra, precio_venta, precio_venta_min, stock_actual, stock_minimo, es_original) VALUES

-- MOTOR — Pistones y Cilindros
('P-CB125-STD',  'Pistón STD Honda CB 125F', 'Pistón estándar con anillos. Medida STD. Incluye pasador y seguro.', 9, 1, 45000, 85000, 75000, 12, 3, true),
('P-CG150-STD',  'Pistón STD Honda CG 150',  'Pistón completo con pin y anillos. Diámetro 57.4 mm.', 9, 1, 52000, 95000, 85000, 8, 2, true),
('P-NS200-STD',  'Pistón STD Bajaj NS 200',   'Pistón con anillos para Bajaj Pulsar NS 200, medida estándar.', 9, 1, 65000, 120000, 108000, 5, 2, true),
('ANI-CB125',    'Juego de Anillos CB 125F',  'Juego de 3 anillos (compresión x2 + aceite) para Honda CB 125F.', 9, 6, 18000, 38000, 33000, 20, 5, true),
('CIL-CG150',    'Cilindro Honda CG 150',     'Cilindro de hierro fundido. Diámetro 57.4 mm. Incluye empaque.', 9, 1, 120000, 220000, 195000, 4, 1, true),

-- MOTOR — Culata y Válvulas
('VAL-ADM-CB125', 'Válvula de Admisión CB 125',  'Válvula de admisión de acero inoxidable para Honda CB 125F.', 10, 1, 15000, 28000, 24000, 18, 4, true),
('VLV-ESC-CG150', 'Válvula de Escape CG 150',    'Válvula de escape especial térmico para Honda CG 150.', 10, 1, 18000, 35000, 30000, 14, 4, true),
('EMP-CUL-CG150', 'Empaque Culata Honda CG 150', 'Empaque de culata multicapa de acero. 100% original. Previene fugas de aceite.', 10, 1, 22000, 45000, 39000, 25, 5, true),
('EMP-CUL-CB190', 'Empaque Culata Honda CB 190R','Empaque multicapa de acero para Honda CB 190R. Original Honda.', 10, 1, 28000, 58000, 50000, 10, 3, true),

-- TRANSMISIÓN — Cadenas y Piñones
('CAD-428-130',  'Cadena 428 x 130 Eslabones',  'Cadena de transmisión 428H 130 eslabones. Incluye unión. Para motos 100-150cc.', 13, 1, 35000, 65000, 58000, 22, 5, false),
('CAD-520-MX',   'Kit Transmisión 520 MX',       'Kit completo: cadena 520 x 118 eslabones + piñón delantero + corona trasera.', 13, 6, 98000, 189000, 165000, 8, 2, false),
('PIN-DEL-CB190', 'Piñón Delantero Honda CB 190', '14T. Acero templado. Piñón delantero para Honda CB 190R. Medida 520.', 13, 1, 12000, 22000, 19000, 30, 8, false),
('COR-TRA-CG150', 'Corona 37T Honda CG 150',     'Corona trasera 37 dientes aleación de aluminio con acero. Para Honda CG 150.', 13, 1, 28000, 52000, 46000, 15, 4, false),
('KIT-CAD-YBR',   'Kit Cadena Yamaha YBR 125',   'Kit transmisión completo original Yamaha: cadena 428H + piñones.', 13, 6, 75000, 142000, 125000, 6, 2, true),

-- TRANSMISIÓN — Embrague
('DIS-EMB-NS200', 'Juego Discos Embrague Bajaj NS 200','Juego de 6 discos de fricción + 6 discos de acero para embrague. NS200.', 14, 6, 68000, 125000, 110000, 7, 2, true),
('MUE-EMB-CB190', 'Muelles de Embrague Honda CB 190', 'Juego de 4 muelles de embrague de alta resistencia. Honda CB 190R.', 14, 6, 22000, 42000, 37000, 12, 3, true),
('CAB-EMB-CG150', 'Cable de Embrague Honda CG 150',   'Cable de embrague reforzado con forro interior de nailon. L=120cm.', 14, 1, 10000, 18500, 16000, 35, 8, false),

-- FRENOS — Pastillas
('PAS-DEL-CB190', 'Pastillas Freno Delantero CB 190R', 'Pastillas sinterizadas de alto desempeño. Resistentes al calor. Par delantero.', 16, 2, 28000, 55000, 48000, 18, 4, false),
('PAS-TRA-NMAX',  'Pastillas Freno Trasero Yamaha',    'Pastillas semi-metálicas traseras compatibles con Yamaha MT-03 y FZ 150.', 16, 2, 22000, 42000, 37000, 20, 5, false),
('PAS-CB125',     'Pastillas Freno Honda CB 125F',     'Pastillas orgánicas para freno de disco. Par delantero. Honda CB 125.', 16, 2, 18000, 35000, 30000, 25, 6, false),

-- FRENOS — Discos
('DSC-DEL-CB190', 'Disco Freno Delantero CB 190R', 'Disco ondulado de 276mm acero inoxidable. Para Honda CB 190R. Calidad OEM.', 17, 1, 55000, 105000, 92000, 6, 2, false),
('DSC-DEL-MT03',  'Disco Freno Delantero MT-03',   'Disco de freno delantero 267mm. Acero inoxidable. Yamaha MT-03 / R3.', 17, 1, 62000, 118000, 104000, 4, 1, false),

-- ELÉCTRICO
('BOB-ENC-CB125', 'Bobina de Encendido CB 125F',  'Bobina de encendido de alta energía. 100% compatible Honda CB 125F.', 5, 1, 32000, 62000, 55000, 9, 2, true),
('REC-REG-CG150', 'Rectificador Regulador CG 150','Rectificador-regulador de voltaje. Previene sobrecarga de batería.', 5, 1, 28000, 55000, 48000, 11, 3, false),
('BAT-YTX7',      'Batería YTX7A-BS 12V 6Ah',    'Batería de gel VRLA, 12V 6AH. Compatible con motos de 125 a 200cc.', 5, 1, 55000, 98000, 85000, 14, 3, false),
('FOC-LED-58MM',  'Foco LED H4 Moto Universal',   'Foco LED H4 35W 6000K luz blanca fría. Reemplaza bombillas halógenas.', 5, 1, 18000, 35000, 30000, 40, 10, false),

-- LUBRICANTES
('ACE-4T-10W40',  'Aceite Motor 4T 10W-40 1L',   'Aceite mineral multigrado 10W-40 para motores 4 tiempos hasta 200cc.', 7, 3, 12000, 22000, 19000, 60, 15, false),
('ACE-4T-20W50',  'Aceite Motor 4T 20W-50 1L',   'Aceite semi-sintético 20W-50 para motores 4 tiempos alta temperatura.', 7, 3, 15000, 28000, 24000, 50, 12, false),
('GRA-CAD-250G',  'Grasa de Cadena Spray 400ml', 'Lubricante específico para cadenas de transmisión en spray. Caja de 12.', 7, 1, 18000, 32000, 28000, 30, 8, false),

-- FILTROS
('FIL-ACE-CB125', 'Filtro de Aceite Honda CB 125', 'Filtro de aceite original Honda para CB 125F. Cambio cada 3000 km.', 8, 1, 8000, 15000, 13000, 45, 10, true),
('FIL-ACE-CG150', 'Filtro de Aceite Honda CG 150', 'Filtro de aceite Honda CG 150 / CB 190R / XR 190L. Original Honda.', 8, 1, 9000, 17000, 15000, 38, 10, true),
('FIL-AIR-CB125', 'Filtro de Aire Honda CB 125F',  'Filtro de aire esponja. Ultra-Flow. Reemplaza al original. CB 125F 2018+.', 8, 1, 12000, 22000, 19000, 28, 6, false),
('FIL-AIR-NS200', 'Filtro de Aire Bajaj NS 200',   'Elemento de filtro de aire de papel plisado para Bajaj Pulsar NS 200.', 8, 1, 14000, 26000, 22000, 20, 5, true),
('FIL-COM-CB190', 'Kit Filtros Honda CB 190R',     'Kit completo: filtro de aceite + filtro de aire + bujía. Para CB 190R.', 8, 6, 28000, 52000, 46000, 12, 3, false),

-- CARROCERÍA
('ESC-CB125-IZQ', 'Espadín Izquierdo Honda CB 125','Cubierta lateral izquierda plástico ABS. Negro mate. Honda CB 125F.', 6, 1, 35000, 65000, 58000, 7, 2, false),
('FAR-CB150',     'Faro Delantero Honda CB 150',   'Faro delantero completo con bisel cromado. Honda CG 150 2018+.', 6, 1, 45000, 88000, 78000, 5, 1, false),
('MAL-TRASERA-38', 'Maleta Trasera Moto 38L',      'Caja trasera rígida 38 litros con cerradura y base universal adaptable.', 6, 1, 85000, 159000, 140000, 8, 2, false);

-- =============================================================
-- IMÁGENES DE REPUESTOS (placeholder URLs)
-- =============================================================
INSERT INTO repuesto_imagen (repuesto_id, url, orden, es_principal)
SELECT id, 
       'https://placehold.co/600x600/1a1a1a/ff6a00?text=' || REPLACE(sku, '-', '+'),
       0, true
FROM repuesto;

-- =============================================================
-- COMPATIBILIDADES (muestra)
-- =============================================================
-- CB 125F → modelo_moto id 1
INSERT INTO repuesto_compatibilidad (repuesto_id, modelo_moto_id, anio_desde, anio_hasta)
SELECT r.id, 1, 2018, 2026
FROM repuesto r
WHERE r.sku IN ('P-CB125-STD','ANI-CB125','VAL-ADM-CB125','EMP-CUL-CG150','FIL-ACE-CB125','FIL-AIR-CB125','PAS-CB125','BOB-ENC-CB125','CAD-428-130');

-- CG 150 → modelo_moto id 2
INSERT INTO repuesto_compatibilidad (repuesto_id, modelo_moto_id, anio_desde, anio_hasta)
SELECT r.id, 2, 2015, 2026
FROM repuesto r
WHERE r.sku IN ('P-CG150-STD','CIL-CG150','VLV-ESC-CG150','EMP-CUL-CG150','CAB-EMB-CG150','FIL-ACE-CG150','COR-TRA-CG150','REC-REG-CG150');

-- CB 190R → modelo_moto id 3
INSERT INTO repuesto_compatibilidad (repuesto_id, modelo_moto_id, anio_desde, anio_hasta)
SELECT r.id, 3, 2016, 2026
FROM repuesto r
WHERE r.sku IN ('EMP-CUL-CB190','MUE-EMB-CB190','PAS-DEL-CB190','DSC-DEL-CB190','FIL-ACE-CG150','FIL-AIR-NS200','FIL-COM-CB190');

-- NS 200 → modelo_moto id 10
INSERT INTO repuesto_compatibilidad (repuesto_id, modelo_moto_id, anio_desde, anio_hasta)
SELECT r.id, 10, 2013, 2026
FROM repuesto r
WHERE r.sku IN ('P-NS200-STD','DIS-EMB-NS200','FIL-AIR-NS200','CAD-520-MX');

-- =============================================================
-- CLIENTES DE PRUEBA
-- =============================================================
INSERT INTO cliente (tipo, documento_tipo, documento_nro, nombre, telefono, email, hashed_password, credito_habilitado, limite_credito, activo) VALUES
    ('N', 'CC',  '10245678',   'Carlos Andrés Méndez',     '3012345678', 'carlos.mendez@email.com',  '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6L6s57gzRTf9Hio6', false, 0, true),
    ('N', 'CC',  '52987654',   'María Fernanda López',       '3109876543', 'mariafe@gmail.com',         '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6L6s57gzRTf9Hio6', true,  500000, true),
    ('J', 'NIT', '900123456-7','Taller Moto Express S.A.S.', '6011234567', 'compras@motoexpress.com',   '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6L6s57gzRTf9Hio6', true,  2000000, true),
    ('N', 'CC',  '71654321',   'Andrés Felipe Gómez',       '3187654321', 'andres.gomez@hotmail.com',  '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6L6s57gzRTf9Hio6', false, 0, true),
    ('J', 'NIT', '830456789-1','Distribuidora Moto Partes',  '6044561234', 'ventas@motopartes.co',      '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6L6s57gzRTf9Hio6', true,  5000000, true);

-- Motos de clientes
INSERT INTO cliente_moto (cliente_id, marca, modelo, anio, placa, cilindraje, vin) VALUES
    (1, 'Honda',  'CB 125F',      2022, 'KLM 123', 125, NULL),
    (1, 'Yamaha', 'YBR 125',      2019, 'MNO 456', 125, NULL),
    (2, 'Honda',  'CB 190R',      2021, 'PQR 789', 190, 'HS1JC3191MG012345'),
    (4, 'Bajaj',  'Pulsar NS 200',2020, 'STU 012', 200, NULL);

-- Usuario vendedor adicional
INSERT INTO usuarios (username, email, hashed_password, role, nombre_completo)
VALUES ('vendedor1', 'vendedor@motorespuestos.com', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6L6s57gzRTf9Hio6', 'vendedor', 'Juan Pablo Vendedor')
ON CONFLICT (username) DO NOTHING;

-- =============================================================
-- RESUMEN
-- =============================================================
SELECT 'Categorías' AS tabla, count(*) FROM categoria
UNION ALL SELECT 'Marcas',     count(*) FROM marca_moto
UNION ALL SELECT 'Modelos',    count(*) FROM modelo_moto
UNION ALL SELECT 'Repuestos',  count(*) FROM repuesto
UNION ALL SELECT 'Imágenes',   count(*) FROM repuesto_imagen
UNION ALL SELECT 'Clientes',   count(*) FROM cliente
UNION ALL SELECT 'Usuarios',   count(*) FROM usuarios;
