// =============================================
// MOTO-REPUESTOS — TypeScript Interfaces
// Mapean 1:1 con las tablas de la DB
// =============================================

export type EstadoRepuesto = 'activo' | 'descontinuado' | 'agotado';
export type TipoMovimiento = 'entrada' | 'salida' | 'ajuste' | 'devolucion';
export type EstadoVenta = 'pendiente' | 'pagada' | 'anulada' | 'en_credito';
export type MetodoPago = 'efectivo' | 'tarjeta_debito' | 'tarjeta_credito' | 'transferencia' | 'credito';
export type EstadoGarantia = 'abierta' | 'en_proceso' | 'resuelta' | 'rechazada';
export type ResolucionGarantia = 'reemplazo' | 'devolucion_dinero' | 'reparacion' | 'rechazada';
export type EstadoPedido = 'nuevo' | 'confirmado' | 'preparando' | 'enviado' | 'entregado' | 'cancelado';

// ---- Catálogo ----
export interface MarcaMoto {
    id: number;
    nombre: string;
    pais_origen?: string;
    activa: boolean;
}

export interface ModeloMoto {
    id: number;
    marca_id: number;
    marca?: MarcaMoto;
    nombre: string;
    anio_inicio?: number;
    anio_fin?: number;
    cilindraje?: number;
    tipo?: string;
}

export interface Categoria {
    id: number;
    padre_id?: number;
    nombre: string;
    slug: string;
    activa: boolean;
    subcategorias?: Categoria[];
}

export interface UnidadMedida {
    id: number;
    codigo: string;
    nombre: string;
}

// ---- Repuesto / Producto ----
export interface RepuestoImagen {
    id: number;
    repuesto_id: number;
    url: string;
    orden: number;
    es_principal: boolean;
}

export interface RepuestoCompatibilidad {
    repuesto_id: number;
    modelo_moto_id: number;
    modelo?: ModeloMoto;
    anio_desde?: number;
    anio_hasta?: number;
}

export interface Repuesto {
    id: number;
    sku: string;
    nombre: string;
    descripcion?: string;
    categoria_id: number;
    categoria?: Categoria;
    unidad_medida_id?: number;
    precio_compra: number;
    precio_venta: number;
    precio_venta_min: number;
    stock_actual: number;
    stock_minimo: number;
    estado: EstadoRepuesto;
    es_original: boolean;
    imagenes?: RepuestoImagen[];
    compatibilidades?: RepuestoCompatibilidad[];
    imagen_url?: string;
    creado_en: string;
    actualizado_en: string;
}

// ---- Inventario ----
export interface MovimientoInventario {
    id: number;
    repuesto_id: number;
    repuesto?: Pick<Repuesto, 'id' | 'sku' | 'nombre'>;
    tipo: TipoMovimiento;
    cantidad: number;
    stock_anterior: number;
    stock_posterior: number;
    costo_unitario?: number;
    referencia_id?: number;
    referencia_tipo?: string;
    usuario?: string;
    notas?: string;
    creado_en: string;
}

// ---- Clientes ----
export interface ClienteMoto {
    id: number;
    cliente_id: number;
    modelo_moto_id: number;
    modelo?: ModeloMoto;
    placa?: string;
    anio?: number;
    color?: string;
    km_actuales?: number;
}

export interface Cliente {
    id: number;
    tipo: 'N' | 'J';
    documento_tipo: string;
    documento_nro: string;
    nombre: string;
    telefono?: string;
    email?: string;
    direccion?: string;
    credito_habilitado: boolean;
    limite_credito: number;
    saldo_credito: number;
    activo: boolean;
    motos?: ClienteMoto[];
    creado_en: string;
}

// ---- Ventas ----
export interface VentaDetalle {
    id: number;
    venta_id: number;
    repuesto_id: number;
    repuesto?: Pick<Repuesto, 'id' | 'sku' | 'nombre'>;
    cantidad: number;
    precio_unitario: number;
    descuento_pct: number;
    subtotal: number;
}

export interface Venta {
    id: number;
    numero_factura: string;
    cliente_id?: number;
    cliente?: Pick<Cliente, 'id' | 'nombre' | 'documento_nro'>;
    fecha: string;
    subtotal: number;
    descuento_total: number;
    impuesto_pct: number;
    impuesto_monto: number;
    total: number;
    metodo_pago: MetodoPago;
    estado: EstadoVenta;
    notas?: string;
    usuario?: string;
    detalles?: VentaDetalle[];
}

// ---- Garantías ----
export interface Garantia {
    id: number;
    venta_detalle_id: number;
    cliente_id: number;
    cliente?: Pick<Cliente, 'id' | 'nombre' | 'telefono'>;
    repuesto_id: number;
    repuesto?: Pick<Repuesto, 'id' | 'sku' | 'nombre'>;
    fecha_apertura: string;
    fecha_vencimiento: string;
    dias_garantia: number;
    descripcion_falla: string;
    estado: EstadoGarantia;
    resolucion?: ResolucionGarantia;
    notas_resolucion?: string;
    cerrado_en?: string;
    usuario?: string;
}

// ---- Pedidos online ----
export interface PedidoItem {
    repuesto_id: number;
    repuesto?: Pick<Repuesto, 'id' | 'sku' | 'nombre' | 'precio_venta'>;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
}

export interface Pedido {
    id: number;
    numero: string;
    nombre_comprador: string;
    email_comprador: string;
    telefono_comprador: string;
    direccion_entrega?: string;
    items: PedidoItem[];
    subtotal: number;
    total: number;
    estado: EstadoPedido;
    notas?: string;
    creado_en: string;
}

// ---- Carrito (frontend only) ----
export interface CartItem {
    repuesto: Repuesto;
    cantidad: number;
}
