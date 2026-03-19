/**
 * API Service Layer
 * Connects the frontend to the FastAPI backend.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

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

// ── Catálogo ──

export async function getCategoriasRaiz(): Promise<any[]> {
    return apiFetch('/catalogo/categorias/');
}

export async function getMarcas(): Promise<any[]> {
    return apiFetch('/catalogo/marcas/');
}

// ── Repuestos ────────────────────────────────────────────────────────────────

export async function getRepuestos(params: any = {}): Promise<any[]> {
    const query = new URLSearchParams();
    if (params.categoria) query.append('categoria_slug', params.categoria);
    if (params.es_original) query.append('es_original', 'true');
    if (params.search) query.append('search', params.search);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const data = await apiFetch(`/repuestos/${queryString}`);

    if (!Array.isArray(data)) return [];
    return data;
}

export async function getRepuestoById(id: number): Promise<any> {
    return apiFetch(`/repuestos/${id}`);
}

export async function crearRepuesto(data: any): Promise<any> {
    return apiFetch('/repuestos/', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function actualizarRepuesto(id: number, data: any): Promise<any> {
    return apiFetch(`/repuestos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

export async function uploadImagen(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('moto_token');
    const response = await fetch(`${BASE_URL}/uploads-api/`, {
        method: 'POST',
        headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Error al subir imagen' }));
        throw new Error(error.detail || 'Upload failed');
    }

    return response.json();
}

export async function getRepuestosFeatured(limit = 4): Promise<any[]> {
    const data = await apiFetch(`/repuestos/?limit=${limit}`);
    if (!Array.isArray(data)) return [];

    return data;
}

// ── Ventas ───────────────────────────────────────────────────────────────────

export async function crearVenta(ventaData: any): Promise<any> {
    return apiFetch('/ventas/', {
        method: 'POST',
        body: JSON.stringify(ventaData),
    });
}

export async function logoutApi(): Promise<void> {
    await apiFetch('/auth/logout', { method: 'POST' });
}

export async function forgotPassword(email: string): Promise<void> {
    await apiFetch('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
}

export async function resetPassword(token: string, new_password: string): Promise<void> {
    await apiFetch('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, new_password }) });
}

export async function searchVentas(search: string): Promise<any[]> {
    return apiFetch(`/ventas/?search=${encodeURIComponent(search)}&limit=10`);
}

export async function cambiarEstadoVenta(id: number, estado: string): Promise<any> {
    return apiFetch(`/ventas/${id}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({ estado }),
    });
}

export async function getVentas(filters?: { desde?: string; hasta?: string; estado?: string; page?: number }): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters?.desde) params.set('desde', filters.desde);
    if (filters?.hasta) params.set('hasta', filters.hasta);
    if (filters?.estado) params.set('estado', filters.estado);
    if (filters?.page !== undefined) params.set('page', String(filters.page));
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiFetch(`/ventas/${query}`);
}

// ── Stats / Dashboard (Stubs for now) ────────────────────────────────────────

export async function getDashboardKPIs(): Promise<any> {
    return apiFetch('/stats/kpis');
}
// ── Inventario ──────────────────────────────────────────────────────────────

export async function getMovimientos(filters?: { tipo?: string; repuesto_id?: number; page?: number; fecha_desde?: string; fecha_hasta?: string }): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters?.tipo) params.set('tipo', filters.tipo);
    if (filters?.repuesto_id) params.set('repuesto_id', String(filters.repuesto_id));
    if (filters?.page !== undefined) params.set('page', String(filters.page));
    if (filters?.fecha_desde) params.set('fecha_desde', filters.fecha_desde);
    if (filters?.fecha_hasta) params.set('fecha_hasta', filters.fecha_hasta);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiFetch(`/inventario/${query}`);
}

export async function registrarMovimiento(data: {
    repuesto_id: number;
    tipo: string;
    cantidad: number;
    costo_unitario?: number;
    notas?: string;
}): Promise<any> {
    return apiFetch('/inventario/', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function getStockCritico(): Promise<any[]> {
    return apiFetch('/inventario/stock-critico');
}

// ── Garantías ────────────────────────────────────────────────────────────────

export async function getGarantias(): Promise<any[]> {
    return apiFetch('/garantias/');
}

export async function crearGarantia(data: any): Promise<any> {
    return apiFetch('/garantias/', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function getGarantiaById(id: number): Promise<any> {
    return apiFetch(`/garantias/${id}`);
}

export async function actualizarGarantia(id: number, data: any): Promise<any> {
    return apiFetch(`/garantias/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

export async function addGarantiaSeguimiento(id: number, data: any): Promise<any> {
    return apiFetch(`/garantias/${id}/seguimiento`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

// ── Clientes ─────────────────────────────────────────────────────────────────

export async function getClientes(search?: string): Promise<any[]> {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return apiFetch(`/clientes/${query}`);
}

export async function crearCliente(data: any): Promise<any> {
    return apiFetch('/clientes/', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function registerCliente(data: any): Promise<any> {
    return apiFetch('/clientes/register', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function login(username: string, password: string): Promise<any> {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await fetch(`${BASE_URL}/auth/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Credenciales incorrectas' }));
        throw new Error(error.detail || 'Error al iniciar sesión');
    }

    const data = await response.json();
    localStorage.setItem('moto_token', data.access_token);

    // Fetch and store user data
    try {
        const userData = await apiFetch('/auth/me');
        localStorage.setItem('moto_user', JSON.stringify(userData));
    } catch (e) {
        console.error('Error fetching user data after login', e);
    }

    return data;
}

export async function actualizarCliente(id: number, data: any): Promise<any> {
    return apiFetch(`/clientes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

// ── Mi Cuenta (cliente logueado) ─────────────────────────────────────────────

export async function getMiPerfil(): Promise<any> {
    return apiFetch('/clientes/me');
}

export async function getMisPedidos(): Promise<any[]> {
    return apiFetch('/clientes/me/pedidos');
}

export async function getMisGarantias(): Promise<any[]> {
    return apiFetch('/clientes/me/garantias');
}

// ── MercadoPago ───────────────────────────────────────────────────────────────

export async function crearPreferenciaMp(data: {
    items: { repuesto_id: number; cantidad: number; precio_unitario: number; descuento_pct?: number }[];
    payer_email: string;
    payer_name?: string;
    notas?: string;
    impuesto_pct?: number;
    cliente_id?: number | null;
}): Promise<{ init_point: string; venta_id: number; numero_factura: string }> {
    return apiFetch('/pagos/crear-preferencia', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}
