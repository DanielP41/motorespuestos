/**
 * API Service Layer
 * Abstracts data access — swap mock implementations for real fetch calls
 * when the FastAPI backend is ready, without touching any component.
 */

import {
    Repuesto, Categoria, MarcaMoto, ModeloMoto,
    Cliente, Venta, Garantia, MovimientoInventario
} from '../types/types';

import {
    mockRepuestos, mockCategorias, mockMarcas, mockModelos,
    mockClientes, mockVentas, mockGarantias, mockMovimientos, mockKPIs
} from '../data/mockData';

// ── Simulate network latency in dev ──────────────────────────────────────────
const delay = (ms = 300) => new Promise(res => setTimeout(res, ms));

// ── Repuestos ────────────────────────────────────────────────────────────────
export interface RepuestosFilter {
    q?: string;
    categoriaSlug?: string;
    marcaId?: number;
    soloOriginales?: boolean;
}

export async function getRepuestos(filters: RepuestosFilter = {}): Promise<Repuesto[]> {
    await delay();
    const { q, categoriaSlug, marcaId, soloOriginales } = filters;

    return mockRepuestos.filter(r => {
        if (q) {
            const lower = q.toLowerCase();
            if (!r.nombre.toLowerCase().includes(lower) && !r.sku.toLowerCase().includes(lower)) return false;
        }
        if (categoriaSlug) {
            const cat = mockCategorias.find(c => c.slug === categoriaSlug);
            if (cat && r.categoria_id !== cat.id && r.categoria?.padre_id !== cat.id) return false;
        }
        if (marcaId) {
            const compat = r.compatibilidades?.some(c => c.modelo?.marca_id === marcaId);
            if (!compat) return false;
        }
        if (soloOriginales && !r.es_original) return false;
        return true;
    });
}

export async function getRepuestoById(id: number): Promise<Repuesto | null> {
    await delay(150);
    return mockRepuestos.find(r => r.id === id) ?? null;
}

export async function getRepuestosFeatured(limit = 4): Promise<Repuesto[]> {
    await delay(200);
    return mockRepuestos.slice(0, limit);
}

// ── Categorías ───────────────────────────────────────────────────────────────
export async function getCategorias(): Promise<Categoria[]> {
    await delay(100);
    return mockCategorias;
}

export async function getCategoriasRaiz(): Promise<Categoria[]> {
    await delay(100);
    return mockCategorias.filter(c => !c.padre_id);
}

// ── Marcas ───────────────────────────────────────────────────────────────────
export async function getMarcas(): Promise<MarcaMoto[]> {
    await delay(100);
    return mockMarcas;
}

export async function getModelos(): Promise<ModeloMoto[]> {
    await delay(100);
    return mockModelos;
}

// ── Clientes ─────────────────────────────────────────────────────────────────
export interface ClientesFilter { q?: string; }

export async function getClientes(filters: ClientesFilter = {}): Promise<Cliente[]> {
    await delay();
    const { q } = filters;
    if (!q) return mockClientes;
    const lower = q.toLowerCase();
    return mockClientes.filter(c =>
        c.nombre.toLowerCase().includes(lower) || c.documento_nro.includes(q)
    );
}

// ── Ventas ───────────────────────────────────────────────────────────────────
export async function getVentas(): Promise<Venta[]> {
    await delay();
    return mockVentas;
}

// ── Garantías ────────────────────────────────────────────────────────────────
export async function getGarantias(): Promise<Garantia[]> {
    await delay();
    return mockGarantias;
}

// ── Inventario ───────────────────────────────────────────────────────────────
export async function getMovimientos(): Promise<MovimientoInventario[]> {
    await delay();
    return mockMovimientos;
}

// ── Dashboard KPIs ───────────────────────────────────────────────────────────
export interface DashboardKPIs {
    ventasHoy: number;
    ventasHoyCount: number;
    stockCritico: number;
    garantiasPorVencer: number;
    clientesActivos: number;
    productosActivos: number;
    ventasRecientes: Venta[];
    repuestosStockCritico: Repuesto[];
}

export async function getDashboardKPIs(): Promise<DashboardKPIs> {
    await delay(400);
    const stockCritico = mockRepuestos.filter(r => r.stock_actual < r.stock_minimo);
    const ventasHoy = mockVentas.filter(v => v.fecha.startsWith('2026-03-03'));

    return {
        ...mockKPIs,
        stockCritico: stockCritico.length,
        ventasHoyCount: ventasHoy.length,
        ventasRecientes: mockVentas,
        repuestosStockCritico: stockCritico,
    };
}
