/**
 * API Service Layer
 * Connects the frontend to the FastAPI backend.
 */

const BASE_URL = 'http://localhost:8000';

async function apiFetch(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('moto_token');
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(error.detail || 'API request failed');
    }

    return response.json();
}

// ── Repuestos ────────────────────────────────────────────────────────────────

export async function getRepuestos(params: any = {}): Promise<any[]> {
    const query = new URLSearchParams();
    if (params.categoria) query.append('categoria', params.categoria);
    if (params.marca) query.append('marca', params.marca);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const data = await apiFetch(`/repuestos/${queryString}`);

    // Map backend response to frontend expectations if needed
    return data.map((r: any) => ({
        ...r,
        sku: r.codigo, // Backend calls it 'codigo', frontend expects 'sku'
        precio_venta: r.precio,
        stock_actual: r.stock,
    }));
}

export async function getRepuestoById(id: number): Promise<any> {
    const r = await apiFetch(`/repuestos/${id}`);
    return {
        ...r,
        sku: r.codigo,
        precio_venta: r.precio,
        stock_actual: r.stock,
    };
}

export async function getRepuestosFeatured(limit = 4): Promise<any[]> {
    const data = await apiFetch(`/repuestos/?limit=${limit}`);
    return data.map((r: any) => ({
        ...r,
        sku: r.codigo,
        precio_venta: r.precio,
        stock_actual: r.stock,
    }));
}

// ── Ventas ───────────────────────────────────────────────────────────────────

export async function crearVenta(ventaData: any): Promise<any> {
    return apiFetch('/ventas/', {
        method: 'POST',
        body: JSON.stringify(ventaData),
    });
}

export async function getVentas(): Promise<any[]> {
    return apiFetch('/ventas/');
}

// ── Stats / Dashboard (Stubs for now) ────────────────────────────────────────

export async function getDashboardKPIs(): Promise<any> {
    // For now, we manually calculate or call a simple sum if implemented
    // Let's keep it minimal until real stats endpoint is ready
    const repuestos = await getRepuestos();
    const ventas = await getVentas();

    return {
        ventasHoy: ventas.reduce((acc, v) => acc + v.total, 0),
        ventasHoyCount: ventas.length,
        stockCritico: repuestos.filter(r => r.stock_actual < 5).length,
        garantiasPorVencer: 0,
        clientesActivos: 0,
        productosActivos: repuestos.length,
        ventasRecientes: ventas.slice(-5).reverse(),
        repuestosStockCritico: repuestos.filter(r => r.stock_actual < 5),
    };
}
