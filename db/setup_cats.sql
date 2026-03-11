-- Minimal setup: categories and units only
INSERT INTO categoria (nombre, slug) VALUES
('Motor','motor'),('Transmision','transmision'),
('Frenos','frenos'),('Suspension','suspension'),
('Electrico','electrico'),('Carroceria','carroceria'),
('Lubricantes','lubricantes'),('Filtros','filtros')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO unidad_medida (codigo, nombre) VALUES
('UND','Unidad'),('PAR','Par'),('LT','Litro'),('JGO','Juego')
ON CONFLICT (codigo) DO NOTHING;

SELECT 'cats', count(*) FROM categoria UNION ALL SELECT 'unds', count(*) FROM unidad_medida;
