import { Repuesto, Categoria, MarcaMoto, ModeloMoto, Cliente, Venta, Garantia, MovimientoInventario } from '../types/types';

// =============================================
// CATEGORÍAS
// =============================================
export const mockCategorias: Categoria[] = [
    { id: 1, nombre: 'Motor', slug: 'motor', activa: true },
    { id: 2, nombre: 'Transmisión', slug: 'transmision', activa: true },
    { id: 3, nombre: 'Frenos', slug: 'frenos', activa: true },
    { id: 4, nombre: 'Suspensión', slug: 'suspension', activa: true },
    { id: 5, nombre: 'Eléctrico', slug: 'electrico', activa: true },
    { id: 6, nombre: 'Carrocería', slug: 'carroceria', activa: true },
    { id: 7, nombre: 'Lubricantes y Fluidos', slug: 'lubricantes-fluidos', activa: true },
    { id: 8, nombre: 'Accesorios', slug: 'accesorios', activa: true },
    // Subcategorías Motor
    { id: 9, padre_id: 1, nombre: 'Pistones', slug: 'motor-pistones', activa: true },
    { id: 10, padre_id: 1, nombre: 'Anillos', slug: 'motor-anillos', activa: true },
    { id: 11, padre_id: 1, nombre: 'Válvulas', slug: 'motor-valvulas', activa: true },
    { id: 12, padre_id: 1, nombre: 'Filtros de Aire', slug: 'motor-filtros-aire', activa: true },
    { id: 13, padre_id: 1, nombre: 'Carburador', slug: 'motor-carburador', activa: true },
    // Subcategorías Frenos
    { id: 14, padre_id: 3, nombre: 'Pastillas de Freno', slug: 'frenos-pastillas', activa: true },
    { id: 15, padre_id: 3, nombre: 'Discos de Freno', slug: 'frenos-discos', activa: true },
    // Subcategorías Transmisión
    { id: 16, padre_id: 2, nombre: 'Cadenas', slug: 'transmision-cadenas', activa: true },
    { id: 17, padre_id: 2, nombre: 'Clutch', slug: 'transmision-clutch', activa: true },
];

// =============================================
// MARCAS DE MOTO
// =============================================
export const mockMarcas: MarcaMoto[] = [
    { id: 1, nombre: 'Honda', pais_origen: 'Japón', activa: true },
    { id: 2, nombre: 'Yamaha', pais_origen: 'Japón', activa: true },
    { id: 3, nombre: 'Suzuki', pais_origen: 'Japón', activa: true },
    { id: 4, nombre: 'Kawasaki', pais_origen: 'Japón', activa: true },
    { id: 5, nombre: 'Bajaj', pais_origen: 'India', activa: true },
    { id: 6, nombre: 'KTM', pais_origen: 'Austria', activa: true },
    { id: 7, nombre: 'AKT', pais_origen: 'Colombia', activa: true },
];

// =============================================
// MODELOS DE MOTO
// =============================================
export const mockModelos: ModeloMoto[] = [
    { id: 1, marca_id: 1, nombre: 'CBR 600RR', anio_inicio: 2003, anio_fin: 2023, cilindraje: 600, tipo: 'deportiva' },
    { id: 2, marca_id: 1, nombre: 'CG 150', anio_inicio: 2005, anio_fin: 2024, cilindraje: 150, tipo: 'urbana' },
    { id: 3, marca_id: 1, nombre: 'CB 190R', anio_inicio: 2015, anio_fin: 2024, cilindraje: 190, tipo: 'naked' },
    { id: 4, marca_id: 2, nombre: 'YZF-R3', anio_inicio: 2015, anio_fin: 2024, cilindraje: 321, tipo: 'deportiva' },
    { id: 5, marca_id: 2, nombre: 'FZ 150', anio_inicio: 2010, anio_fin: 2024, cilindraje: 150, tipo: 'naked' },
    { id: 6, marca_id: 5, nombre: 'Pulsar NS 200', anio_inicio: 2012, anio_fin: 2024, cilindraje: 200, tipo: 'naked' },
    { id: 7, marca_id: 5, nombre: 'Discover 125', anio_inicio: 2004, anio_fin: 2024, cilindraje: 125, tipo: 'urbana' },
    { id: 8, marca_id: 6, nombre: 'Duke 200', anio_inicio: 2012, anio_fin: 2024, cilindraje: 200, tipo: 'naked' },
];

// =============================================
// REPUESTOS
// =============================================
export const mockRepuestos: Repuesto[] = [
    {
        id: 1, sku: 'HON-PISC-150', nombre: 'Pistón Completo Honda CG 150',
        descripcion: 'Pistón original Honda para CG 150. Incluye pistón, pasador, seguro y anillos.',
        categoria_id: 9, categoria: mockCategorias[8],
        precio_compra: 45000, precio_venta: 89900, precio_venta_min: 75000,
        stock_actual: 12, stock_minimo: 5, estado: 'activo', es_original: true,
        imagenes: [{ id: 1, repuesto_id: 1, url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500', orden: 0, es_principal: true }],
        compatibilidades: [{ repuesto_id: 1, modelo_moto_id: 2, modelo: mockModelos[1], anio_desde: 2010, anio_hasta: 2024 }],
        creado_en: '2024-01-15T00:00:00Z', actualizado_en: '2024-01-15T00:00:00Z',
    },
    {
        id: 2, sku: 'GEN-FREP-USD', nombre: 'Pastillas de Freno Delanteras Universales',
        descripcion: 'Pastillas de freno de alta fricción compatibles con múltiples modelos. Rendimiento sport.',
        categoria_id: 14, categoria: mockCategorias[13],
        precio_compra: 18000, precio_venta: 38500, precio_venta_min: 32000,
        stock_actual: 28, stock_minimo: 10, estado: 'activo', es_original: false,
        imagenes: [{ id: 2, repuesto_id: 2, url: 'https://images.unsplash.com/photo-1609630875171-b1321ff9a4e5?w=500', orden: 0, es_principal: true }],
        compatibilidades: [],
        creado_en: '2024-01-15T00:00:00Z', actualizado_en: '2024-01-15T00:00:00Z',
    },
    {
        id: 3, sku: 'YAM-CADA-R3', nombre: 'Cadena de Transmisión Yamaha R3 520',
        descripcion: 'Cadena 520 x 110 eslabones reforzada. Ideal para motos deportivas. Incluye remache.',
        categoria_id: 16, categoria: mockCategorias[15],
        precio_compra: 35000, precio_venta: 69900, precio_venta_min: 60000,
        stock_actual: 3, stock_minimo: 8, estado: 'activo', es_original: false,
        imagenes: [{ id: 3, repuesto_id: 3, url: 'https://images.unsplash.com/photo-1558618047-3c8c76ca0e5e?w=500', orden: 0, es_principal: true }],
        compatibilidades: [{ repuesto_id: 3, modelo_moto_id: 4, modelo: mockModelos[3] }],
        creado_en: '2024-01-15T00:00:00Z', actualizado_en: '2024-01-15T00:00:00Z',
    },
    {
        id: 4, sku: 'GEN-FILT-AIR', nombre: 'Filtro de Aire K&N Universal',
        descripcion: 'Filtro de aire de alto flujo lavable y reutilizable. Mejora la respuesta del motor hasta un 15%.',
        categoria_id: 12, categoria: mockCategorias[11],
        precio_compra: 24000, precio_venta: 49900, precio_venta_min: 42000,
        stock_actual: 15, stock_minimo: 5, estado: 'activo', es_original: false,
        imagenes: [{ id: 4, repuesto_id: 4, url: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=500', orden: 0, es_principal: true }],
        compatibilidades: [],
        creado_en: '2024-02-10T00:00:00Z', actualizado_en: '2024-02-10T00:00:00Z',
    },
    {
        id: 5, sku: 'BAJ-CLUT-NS2', nombre: 'Kit Clutch Bajaj Pulsar NS 200',
        descripcion: 'Kit completo de clutch original Bajaj. Incluye disco, plato, resortes y tenedor.',
        categoria_id: 17, categoria: mockCategorias[16],
        precio_compra: 52000, precio_venta: 105000, precio_venta_min: 90000,
        stock_actual: 7, stock_minimo: 3, estado: 'activo', es_original: true,
        imagenes: [{ id: 5, repuesto_id: 5, url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500', orden: 0, es_principal: true }],
        compatibilidades: [{ repuesto_id: 5, modelo_moto_id: 6, modelo: mockModelos[5] }],
        creado_en: '2024-02-15T00:00:00Z', actualizado_en: '2024-02-15T00:00:00Z',
    },
    {
        id: 6, sku: 'GEN-DISC-FREN', nombre: 'Disco de Freno Delantero 260mm',
        descripcion: 'Disco de freno acero inoxidable con perforaciones para mejor disipación de calor.',
        categoria_id: 15, categoria: mockCategorias[14],
        precio_compra: 38000, precio_venta: 79900, precio_venta_min: 68000,
        stock_actual: 9, stock_minimo: 4, estado: 'activo', es_original: false,
        imagenes: [{ id: 6, repuesto_id: 6, url: 'https://images.unsplash.com/photo-1609630875171-b1321ff9a4e5?w=500', orden: 0, es_principal: true }],
        compatibilidades: [],
        creado_en: '2024-03-01T00:00:00Z', actualizado_en: '2024-03-01T00:00:00Z',
    },
    {
        id: 7, sku: 'HON-CARB-CG', nombre: 'Carburador Honda CG 150 Original',
        descripcion: 'Carburador original Honda. Jetting de fábrica, tapas y tornillos de mezcla incluidos.',
        categoria_id: 13, categoria: mockCategorias[12],
        precio_compra: 65000, precio_venta: 139900, precio_venta_min: 120000,
        stock_actual: 4, stock_minimo: 2, estado: 'activo', es_original: true,
        imagenes: [{ id: 7, repuesto_id: 7, url: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=500', orden: 0, es_principal: true }],
        compatibilidades: [{ repuesto_id: 7, modelo_moto_id: 2, modelo: mockModelos[1] }],
        creado_en: '2024-03-01T00:00:00Z', actualizado_en: '2024-03-01T00:00:00Z',
    },
    {
        id: 8, sku: 'GEN-ACEI-10W', nombre: 'Aceite Motor 10W-40 Semi-Sintético 1L',
        descripcion: 'Aceite para motor 4 tiempos. Ideal para motos de alto rendimiento. Botella 1 litro.',
        categoria_id: 7, categoria: mockCategorias[6],
        precio_compra: 12000, precio_venta: 24900, precio_venta_min: 21000,
        stock_actual: 40, stock_minimo: 20, estado: 'activo', es_original: false,
        imagenes: [{ id: 8, repuesto_id: 8, url: 'https://images.unsplash.com/photo-1558618047-3c8c76ca0e5e?w=500', orden: 0, es_principal: true }],
        compatibilidades: [],
        creado_en: '2024-03-10T00:00:00Z', actualizado_en: '2024-03-10T00:00:00Z',
    },
];

// =============================================
// CLIENTES
// =============================================
export const mockClientes: Cliente[] = [
    { id: 1, tipo: 'N', documento_tipo: 'CC', documento_nro: '1234567890', nombre: 'Carlos Andrés López', telefono: '3001234567', email: 'carlos@email.com', credito_habilitado: true, limite_credito: 500000, saldo_credito: 150000, activo: true, creado_en: '2024-01-10T00:00:00Z' },
    { id: 2, tipo: 'N', documento_tipo: 'CC', documento_nro: '9876543210', nombre: 'María Isabel Rodríguez', telefono: '3117654321', email: 'maria@email.com', credito_habilitado: false, limite_credito: 0, saldo_credito: 0, activo: true, creado_en: '2024-02-05T00:00:00Z' },
    { id: 3, tipo: 'J', documento_tipo: 'NIT', documento_nro: '900123456-1', nombre: 'Repuestos El Rápido SAS', telefono: '6011234567', email: 'ventas@elrapido.com', credito_habilitado: true, limite_credito: 2000000, saldo_credito: 780000, activo: true, creado_en: '2024-01-20T00:00:00Z' },
    { id: 4, tipo: 'N', documento_tipo: 'CC', documento_nro: '5555555555', nombre: 'Juan Pablo Torres', telefono: '3205556677', credito_habilitado: false, limite_credito: 0, saldo_credito: 0, activo: true, creado_en: '2024-03-01T00:00:00Z' },
];

// =============================================
// VENTAS
// =============================================
export const mockVentas: Venta[] = [
    {
        id: 1, numero_factura: 'FAC-2026-0001', cliente_id: 1,
        cliente: { id: 1, nombre: 'Carlos Andrés López', documento_nro: '1234567890' },
        fecha: '2026-03-03T10:30:00-03:00', subtotal: 89900, descuento_total: 0,
        impuesto_pct: 0, impuesto_monto: 0, total: 89900,
        metodo_pago: 'efectivo', estado: 'pagada',
        detalles: [{ id: 1, venta_id: 1, repuesto_id: 1, repuesto: { id: 1, sku: 'HON-PISC-150', nombre: 'Pistón Completo Honda CG 150' }, cantidad: 1, precio_unitario: 89900, descuento_pct: 0, subtotal: 89900 }],
    },
    {
        id: 2, numero_factura: 'FAC-2026-0002', cliente_id: 3,
        cliente: { id: 3, nombre: 'Repuestos El Rápido SAS', documento_nro: '900123456-1' },
        fecha: '2026-03-03T14:15:00-03:00', subtotal: 228500, descuento_total: 22850,
        impuesto_pct: 0, impuesto_monto: 0, total: 205650,
        metodo_pago: 'credito', estado: 'en_credito',
        detalles: [
            { id: 2, venta_id: 2, repuesto_id: 2, repuesto: { id: 2, sku: 'GEN-FREP-USD', nombre: 'Pastillas de Freno Delanteras Universales' }, cantidad: 4, precio_unitario: 38500, descuento_pct: 10, subtotal: 138600 },
            { id: 3, venta_id: 2, repuesto_id: 3, repuesto: { id: 3, sku: 'YAM-CADA-R3', nombre: 'Cadena de Transmisión Yamaha R3 520' }, cantidad: 2, precio_unitario: 69900, descuento_pct: 10, subtotal: 125820 },
        ],
    },
    {
        id: 3, numero_factura: 'FAC-2026-0003',
        fecha: '2026-03-03T09:00:00-03:00', subtotal: 49900, descuento_total: 0,
        impuesto_pct: 0, impuesto_monto: 0, total: 49900,
        metodo_pago: 'tarjeta_debito', estado: 'pagada',
        detalles: [{ id: 4, venta_id: 3, repuesto_id: 4, repuesto: { id: 4, sku: 'GEN-FILT-AIR', nombre: 'Filtro de Aire K&N Universal' }, cantidad: 1, precio_unitario: 49900, descuento_pct: 0, subtotal: 49900 }],
    },
];

// =============================================
// GARANTÍAS
// =============================================
export const mockGarantias: Garantia[] = [
    {
        id: 1, venta_detalle_id: 1, cliente_id: 1,
        cliente: { id: 1, nombre: 'Carlos Andrés López', telefono: '3001234567' },
        repuesto_id: 1,
        repuesto: { id: 1, sku: 'HON-PISC-150', nombre: 'Pistón Completo Honda CG 150' },
        fecha_apertura: '2026-02-15T00:00:00Z', fecha_vencimiento: '2026-05-15',
        dias_garantia: 90, descripcion_falla: 'El pistón presenta juego excesivo a los 500km.',
        estado: 'abierta', usuario: 'admin',
        creado_en: '2026-02-15T00:00:00Z', actualizado_en: '2026-02-15T00:00:00Z',
    },
    {
        id: 2, venta_detalle_id: 2, cliente_id: 3,
        cliente: { id: 3, nombre: 'Repuestos El Rápido SAS', telefono: '6011234567' },
        repuesto_id: 2,
        repuesto: { id: 2, sku: 'GEN-FREP-USD', nombre: 'Pastillas de Freno Delanteras Universales' },
        fecha_apertura: '2026-03-01T00:00:00Z', fecha_vencimiento: '2026-03-08',
        dias_garantia: 90, descripcion_falla: 'Las pastillas no tienen agarre, chirrían desde el primer día.',
        estado: 'en_proceso', usuario: 'admin',
        creado_en: '2026-03-01T00:00:00Z', actualizado_en: '2026-03-02T00:00:00Z',
    },
];

// =============================================
// MOVIMIENTOS DE INVENTARIO
// =============================================
export const mockMovimientos: MovimientoInventario[] = [
    { id: 1, repuesto_id: 1, repuesto: { id: 1, sku: 'HON-PISC-150', nombre: 'Pistón Completo Honda CG 150' }, tipo: 'entrada', cantidad: 20, stock_anterior: 0, stock_posterior: 20, costo_unitario: 45000, referencia_tipo: 'compra', usuario: 'admin', creado_en: '2024-01-15T08:00:00Z' },
    { id: 2, repuesto_id: 1, repuesto: { id: 1, sku: 'HON-PISC-150', nombre: 'Pistón Completo Honda CG 150' }, tipo: 'salida', cantidad: -8, stock_anterior: 20, stock_posterior: 12, referencia_id: 1, referencia_tipo: 'venta_detalle', creado_en: '2026-03-03T10:31:00Z' },
    { id: 3, repuesto_id: 3, repuesto: { id: 3, sku: 'YAM-CADA-R3', nombre: 'Cadena de Transmisión Yamaha R3 520' }, tipo: 'salida', cantidad: -2, stock_anterior: 5, stock_posterior: 3, referencia_id: 3, referencia_tipo: 'venta_detalle', creado_en: '2026-03-03T14:16:00Z' },
    { id: 4, repuesto_id: 2, repuesto: { id: 2, sku: 'GEN-FREP-USD', nombre: 'Pastillas de Freno Delanteras Universales' }, tipo: 'entrada', cantidad: 30, stock_anterior: 2, stock_posterior: 32, costo_unitario: 18000, referencia_tipo: 'compra', usuario: 'admin', creado_en: '2026-02-20T09:00:00Z' },
];

// =============================================
// KPIs Dashboard
// =============================================
export const mockKPIs = {
    ventasHoy: 345550,
    ventasHoyCount: 3,
    stockCritico: 1, // repuesto id=3 tiene stock 3 < min 8
    garantiasPorVencer: 1, // garantía id=2 vence el 08/03
    clientesActivos: 4,
    productosActivos: mockRepuestos.filter(r => r.estado === 'activo').length,
};
