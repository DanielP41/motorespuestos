import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Loader2, RefreshCw, X, Save, Search, Trash2, ShoppingCart } from 'lucide-react';
import { getVentas, crearVenta, getRepuestos, getClientes } from '../../services/api';
import { formatCOP } from '../../utils/helpers';

type Filtro = 'hoy' | 'semana' | 'mes' | 'todos';

type ItemVenta = {
    repuesto_id: number;
    nombre: string;
    sku: string;
    cantidad: number;
    precio_unitario: number;
    stock_actual: number;
};

const METODOS_PAGO = [
    { value: 'efectivo', label: 'Efectivo' },
    { value: 'tarjeta_debito', label: 'Tarjeta débito' },
    { value: 'tarjeta_credito', label: 'Tarjeta crédito' },
    { value: 'transferencia', label: 'Transferencia' },
    { value: 'credito', label: 'Crédito' },
];

/** Returns ISO date strings {desde, hasta} for a given filter tab */
function buildDateRange(filtro: Filtro): { desde?: string; hasta?: string } {
    const now = new Date();
    if (filtro === 'todos') return {};

    const pad = (n: number) => String(n).padStart(2, '0');
    const toISO = (d: Date) =>
        `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (filtro === 'hoy') {
        const today = toISO(now);
        return { desde: today, hasta: today };
    }
    if (filtro === 'semana') {
        const from = new Date(now);
        from.setDate(now.getDate() - 7);
        return { desde: toISO(from), hasta: toISO(now) };
    }
    if (filtro === 'mes') {
        const from = new Date(now.getFullYear(), now.getMonth(), 1);
        return { desde: toISO(from), hasta: toISO(now) };
    }
    return {};
}

export default function Ventas() {
    const [ventas, setVentas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filtro, setFiltro] = useState<Filtro>('todos');

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');

    // Form state
    const [items, setItems] = useState<ItemVenta[]>([]);
    const [clienteId, setClienteId] = useState<number | null>(null);
    const [metodoPago, setMetodoPago] = useState('efectivo');
    const [notas, setNotas] = useState('');

    // Search
    const [repuestosAll, setRepuestosAll] = useState<any[]>([]);
    const [clientesAll, setClientesAll] = useState<any[]>([]);
    const [searchProd, setSearchProd] = useState('');
    const [searchCliente, setSearchCliente] = useState('');
    const [showProdDrop, setShowProdDrop] = useState(false);
    const [showClienteDrop, setShowClienteDrop] = useState(false);
    const prodRef = useRef<HTMLDivElement>(null);

    const loadData = useCallback(async (f: Filtro = filtro) => {
        setLoading(true);
        setError('');
        try {
            const dateRange = buildDateRange(f);
            const data = await getVentas(dateRange);
            setVentas(data);
        } catch (err: any) {
            setError('Error al cargar ventas: ' + (err.message || 'Error desconocido'));
        } finally {
            setLoading(false);
        }
    }, [filtro]);

    useEffect(() => { loadData(filtro); }, [filtro]);

    const handleFiltroChange = (f: Filtro) => {
        setFiltro(f);
    };

    const openModal = async () => {
        setItems([]);
        setClienteId(null);
        setMetodoPago('efectivo');
        setNotas('');
        setSearchProd('');
        setSearchCliente('');
        setSaveError('');
        setShowModal(true);
        try {
            const [reps, clts] = await Promise.all([getRepuestos(), getClientes()]);
            setRepuestosAll(reps);
            setClientesAll(clts);
        } catch { /* ignore */ }
    };

    const filteredProds = searchProd.length >= 2
        ? repuestosAll.filter(r =>
            r.nombre.toLowerCase().includes(searchProd.toLowerCase()) ||
            r.sku.toLowerCase().includes(searchProd.toLowerCase())
        ).slice(0, 8)
        : [];

    const filteredClientes = searchCliente.length >= 1
        ? clientesAll.filter(c =>
            c.nombre.toLowerCase().includes(searchCliente.toLowerCase()) ||
            c.documento_nro.includes(searchCliente)
        ).slice(0, 6)
        : [];

    const addProduct = (rep: any) => {
        setItems(prev => {
            const existing = prev.find(i => i.repuesto_id === rep.id);
            if (existing) {
                return prev.map(i => i.repuesto_id === rep.id
                    ? { ...i, cantidad: Math.min(i.cantidad + 1, i.stock_actual) }
                    : i
                );
            }
            return [...prev, {
                repuesto_id: rep.id,
                nombre: rep.nombre,
                sku: rep.sku,
                cantidad: 1,
                precio_unitario: rep.precio_venta,
                stock_actual: rep.stock_actual,
            }];
        });
        setSearchProd('');
        setShowProdDrop(false);
    };

    const removeItem = (id: number) => setItems(prev => prev.filter(i => i.repuesto_id !== id));

    const updateCantidad = (id: number, cant: number) => {
        setItems(prev => prev.map(i =>
            i.repuesto_id === id ? { ...i, cantidad: Math.max(1, Math.min(cant, i.stock_actual)) } : i
        ));
    };

    const subtotal = items.reduce((sum, i) => sum + i.cantidad * i.precio_unitario, 0);
    const totalFiltrado = ventas.reduce((sum, v) => sum + (v.total || 0), 0);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (items.length === 0) { setSaveError('Agrega al menos un producto.'); return; }
        setSaving(true);
        setSaveError('');
        try {
            await crearVenta({
                metodo_pago: metodoPago,
                cliente_id: clienteId,
                notas,
                impuesto_pct: 0,
                items: items.map(i => ({
                    repuesto_id: i.repuesto_id,
                    cantidad: i.cantidad,
                    precio_unitario: i.precio_unitario,
                    descuento_pct: 0,
                })),
            });
            setShowModal(false);
            loadData(filtro);
        } catch (err: any) {
            setSaveError(err.message || 'Error al registrar la venta.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h2 className="page-title">Ventas</h2>
                    <p className="page-subtitle">{ventas.length} ventas — Total: {formatCOP(totalFiltrado)}</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => loadData(filtro)} disabled={loading}>
                        <RefreshCw size={14} />
                    </button>
                    <button className="btn btn-primary" onClick={openModal}>
                        <Plus size={16} /> Nueva venta
                    </button>
                </div>
            </div>

            {/* Filtros — ahora disparan fetch al servidor */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {(['hoy', 'semana', 'mes', 'todos'] as Filtro[]).map(f => (
                    <button
                        key={f}
                        className={`btn btn-sm ${filtro === f ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => handleFiltroChange(f)}
                        disabled={loading}
                    >
                        {f === 'hoy' ? 'Hoy' : f === 'semana' ? 'Esta semana' : f === 'mes' ? 'Este mes' : 'Todas'}
                    </button>
                ))}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '100px 0' }}>
                    <Loader2 className="spinner" size={40} />
                    <p className="text-muted mt-3">Cargando ventas desde la base de datos...</p>
                </div>
            ) : error ? (
                <div className="alert alert-danger">{error}</div>
            ) : (
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Factura</th>
                                <th>Fecha</th>
                                <th>Cliente</th>
                                <th>Método pago</th>
                                <th>Total</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ventas.map(v => (
                                <tr key={v.id}>
                                    <td style={{ fontFamily: 'monospace', color: 'var(--accent)', fontSize: '0.82rem' }}>
                                        {v.numero_factura || `#${v.id}`}
                                    </td>
                                    <td style={{ fontSize: '0.82rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                                        {new Date(v.fecha || v.creado_en).toLocaleString('es-CO')}
                                    </td>
                                    <td style={{ fontWeight: 500 }}>{v.cliente?.nombre ?? 'Mostrador'}</td>
                                    <td style={{ textTransform: 'capitalize', fontSize: '0.82rem' }}>
                                        {(v.metodo_pago || '').replace(/_/g, ' ')}
                                    </td>
                                    <td style={{ fontWeight: 700 }}>{formatCOP(v.total || 0)}</td>
                                    <td>
                                        <span className={`badge ${v.estado === 'pagada' ? 'badge-success' :
                                            v.estado === 'en_credito' ? 'badge-warning' :
                                                v.estado === 'anulada' ? 'badge-danger' : 'badge-muted'
                                            }`}>{v.estado || 'pendiente'}</span>
                                    </td>
                                </tr>
                            ))}
                            {ventas.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
                                        No hay ventas para el período seleccionado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ── Modal Nueva Venta ── */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div
                        className="modal-box"
                        style={{ maxWidth: 740, maxHeight: '90vh', overflowY: 'auto' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <h3 className="modal-title"><ShoppingCart size={18} /> Nueva Venta</h3>
                            <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSave}>
                            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                                {/* Búsqueda de productos */}
                                <div>
                                    <label className="form-label">Agregar Producto</label>
                                    <div style={{ position: 'relative' }} ref={prodRef}>
                                        <div className="input-icon-wrapper">
                                            <Search size={14} />
                                            <input
                                                className="form-control"
                                                placeholder="Buscar por nombre o SKU..."
                                                value={searchProd}
                                                onChange={e => { setSearchProd(e.target.value); setShowProdDrop(true); }}
                                                onFocus={() => setShowProdDrop(true)}
                                                autoComplete="off"
                                            />
                                        </div>
                                        {showProdDrop && filteredProds.length > 0 && (
                                            <div className="dropdown-list" style={{ position: 'absolute', zIndex: 100, width: '100%' }}>
                                                {filteredProds.map(r => (
                                                    <div key={r.id} className="dropdown-item" onClick={() => addProduct(r)}>
                                                        <span style={{ fontWeight: 600 }}>{r.nombre}</span>
                                                        <span style={{ color: 'var(--muted)', fontSize: '0.78rem', marginLeft: 8 }}>
                                                            {r.sku} · Stock: {r.stock_actual} · {formatCOP(r.precio_venta)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Lista de items */}
                                {items.length > 0 && (
                                    <div>
                                        <label className="form-label">Productos en la venta</label>
                                        <table style={{ width: '100%', fontSize: '0.85rem' }}>
                                            <thead>
                                                <tr style={{ color: 'var(--muted)' }}>
                                                    <th style={{ textAlign: 'left', paddingBottom: 6 }}>Producto</th>
                                                    <th style={{ textAlign: 'center', paddingBottom: 6 }}>Cant.</th>
                                                    <th style={{ textAlign: 'right', paddingBottom: 6 }}>Precio</th>
                                                    <th style={{ textAlign: 'right', paddingBottom: 6 }}>Subtotal</th>
                                                    <th></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {items.map(item => (
                                                    <tr key={item.repuesto_id} style={{ borderTop: '1px solid var(--border)' }}>
                                                        <td style={{ padding: '8px 0' }}>
                                                            <div style={{ fontWeight: 600 }}>{item.nombre}</div>
                                                            <div style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>{item.sku}</div>
                                                        </td>
                                                        <td style={{ textAlign: 'center' }}>
                                                            <input
                                                                type="number"
                                                                min={1}
                                                                max={item.stock_actual}
                                                                value={item.cantidad}
                                                                onChange={e => updateCantidad(item.repuesto_id, parseInt(e.target.value) || 1)}
                                                                style={{ width: 60, textAlign: 'center', padding: '4px', borderRadius: 6, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
                                                            />
                                                        </td>
                                                        <td style={{ textAlign: 'right', color: 'var(--muted)' }}>{formatCOP(item.precio_unitario)}</td>
                                                        <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatCOP(item.cantidad * item.precio_unitario)}</td>
                                                        <td style={{ textAlign: 'right' }}>
                                                            <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeItem(item.repuesto_id)}>
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        <div style={{ textAlign: 'right', marginTop: 12, fontSize: '1rem', fontWeight: 700 }}>
                                            Total: <span style={{ color: 'var(--accent)' }}>{formatCOP(subtotal)}</span>
                                        </div>
                                    </div>
                                )}

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    {/* Cliente */}
                                    <div>
                                        <label className="form-label">Cliente (opcional)</label>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                className="form-control"
                                                placeholder="Buscar cliente..."
                                                value={clienteId
                                                    ? (clientesAll.find(c => c.id === clienteId)?.nombre || `Cliente #${clienteId}`)
                                                    : searchCliente
                                                }
                                                onChange={e => { setSearchCliente(e.target.value); setClienteId(null); setShowClienteDrop(true); }}
                                                onFocus={() => setShowClienteDrop(true)}
                                                autoComplete="off"
                                            />
                                            {clienteId && (
                                                <button
                                                    type="button"
                                                    style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}
                                                    onClick={() => { setClienteId(null); setSearchCliente(''); }}
                                                >
                                                    <X size={14} />
                                                </button>
                                            )}
                                            {showClienteDrop && !clienteId && filteredClientes.length > 0 && (
                                                <div className="dropdown-list" style={{ position: 'absolute', zIndex: 100, width: '100%' }}>
                                                    {filteredClientes.map(c => (
                                                        <div key={c.id} className="dropdown-item"
                                                            onClick={() => { setClienteId(c.id); setShowClienteDrop(false); setSearchCliente(''); }}>
                                                            <span style={{ fontWeight: 600 }}>{c.nombre}</span>
                                                            <span style={{ color: 'var(--muted)', fontSize: '0.78rem', marginLeft: 8 }}>{c.documento_nro}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        {!clienteId && (
                                            <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 4 }}>
                                                Sin cliente = venta de mostrador.
                                            </p>
                                        )}
                                    </div>

                                    {/* Método de pago */}
                                    <div>
                                        <label className="form-label">Método de Pago *</label>
                                        <select className="form-control" value={metodoPago} onChange={e => setMetodoPago(e.target.value)} required>
                                            {METODOS_PAGO.map(m => (
                                                <option key={m.value} value={m.value}>{m.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Notas */}
                                <div>
                                    <label className="form-label">Notas (opcional)</label>
                                    <textarea
                                        className="form-control"
                                        rows={2}
                                        placeholder="Observaciones de la venta..."
                                        value={notas}
                                        onChange={e => setNotas(e.target.value)}
                                        style={{ resize: 'vertical' }}
                                    />
                                </div>

                                {saveError && <div className="alert alert-danger">{saveError}</div>}
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
                                <button type="submit" className="btn btn-primary" disabled={saving || items.length === 0}>
                                    {saving ? <Loader2 size={16} className="spinner" /> : <Save size={16} />}
                                    {saving ? 'Registrando...' : 'Registrar venta'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
