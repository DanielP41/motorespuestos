import { useState, useRef } from 'react';
import { Plus, Loader2, RefreshCw, X, Save, Search, Trash2, ShoppingCart, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { getVentas, crearVenta, getRepuestos, getClientes, cambiarEstadoVenta } from '../../services/api';
import { formatCOP } from '../../utils/helpers';
import { Toast } from '../../components/UI';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDebounce } from 'use-debounce';

type Filtro = 'hoy' | 'semana' | 'mes' | 'todos';

type ItemVenta = {
    repuesto_id: number;
    nombre: string;
    sku: string;
    cantidad: number;
    precio_unitario: number;
    descuento_pct: number;
    stock_actual: number;
};

const TRANSICIONES: Record<string, { label: string; value: string; color: string }[]> = {
    pendiente:  [{ label: 'Marcar pagada', value: 'pagada', color: '#2ecc71' }, { label: 'A crédito', value: 'en_credito', color: '#f1c40f' }, { label: 'Anular', value: 'anulada', color: '#e74c3c' }],
    pagada:     [{ label: 'Anular', value: 'anulada', color: '#e74c3c' }],
    en_credito: [{ label: 'Marcar pagada', value: 'pagada', color: '#2ecc71' }, { label: 'Anular', value: 'anulada', color: '#e74c3c' }],
    anulada:    [],
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
    const queryClient = useQueryClient();
    const [filtro, setFiltro] = useState<Filtro>('todos');
    const [page, setPage] = useState(0);
    const [toast, setToast] = useState('');

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [saveError, setSaveError] = useState('');

    // Form state
    const [items, setItems] = useState<ItemVenta[]>([]);
    const [clienteId, setClienteId] = useState<number | null>(null);
    const [metodoPago, setMetodoPago] = useState('efectivo');
    const [notas, setNotas] = useState('');

    // Search state for autocomplete (debounced)
    const [searchProdRaw, setSearchProd] = useState('');
    const [searchProd] = useDebounce(searchProdRaw, 300);
    const [showProdDrop, setShowProdDrop] = useState(false);
    const prodRef = useRef<HTMLDivElement>(null);

    const [searchClienteRaw, setSearchCliente] = useState('');
    const [searchCliente] = useDebounce(searchClienteRaw, 400);
    const [showClienteDrop, setShowClienteDrop] = useState(false);

    // Queries
    const { data: ventas = [], isLoading: loadingVentas, isError: errorVentas, refetch } = useQuery({
        queryKey: ['ventas', filtro, page],
        queryFn: () => getVentas({ ...buildDateRange(filtro), page }),
        staleTime: 60 * 1000,
        placeholderData: (prev) => prev
    });

    const { data: filteredProds = [], isFetching: loadingProds } = useQuery({
        queryKey: ['repuestos_search', searchProd],
        queryFn: () => getRepuestos({ search: searchProd, limit: 10 }),
        enabled: searchProd.length >= 2,
        staleTime: 5 * 60 * 1000,
    });

    const { data: filteredClientes = [], isFetching: loadingClientes } = useQuery({
        queryKey: ['clientes_search', searchCliente],
        queryFn: () => getClientes(searchCliente),
        enabled: searchCliente.length >= 2,
        staleTime: 5 * 60 * 1000,
    });

    const [openDropId, setOpenDropId] = useState<number | null>(null);

    const estadoMutation = useMutation({
        mutationFn: ({ id, estado }: { id: number; estado: string }) => cambiarEstadoVenta(id, estado),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ventas'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard_kpis'] });
            setOpenDropId(null);
            setToast('Estado actualizado correctamente');
        },
        onError: (err: any) => setToast('Error: ' + (err.message || 'No se pudo actualizar el estado')),
    });

    const crearVentaMutation = useMutation({
        mutationFn: crearVenta,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ventas'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard_kpis'] });
            setShowModal(false);
            setToast('Venta registrada correctamente');
            setPage(0);
        },
        onError: (err: any) => {
            setSaveError(err.message || 'Error al registrar la venta.');
        }
    });

    const handleFiltroChange = (f: Filtro) => {
        setPage(0);
        setFiltro(f);
    };

    const openModal = () => {
        setItems([]);
        setClienteId(null);
        setMetodoPago('efectivo');
        setNotas('');
        setSearchProd('');
        setSearchCliente('');
        setSaveError('');
        setShowModal(true);
    };

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
                descuento_pct: 0,
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

    const updateDescuento = (id: number, pct: number) => {
        setItems(prev => prev.map(i =>
            i.repuesto_id === id ? { ...i, descuento_pct: Math.max(0, Math.min(100, pct)) } : i
        ));
    };

    const subtotal = items.reduce((sum, i) => sum + i.cantidad * i.precio_unitario * (1 - i.descuento_pct / 100), 0);
    const totalFiltrado = ventas.reduce((sum: number, v: any) => sum + (v.total || 0), 0);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (items.length === 0) { setSaveError('Agrega al menos un producto.'); return; }
        setSaveError('');
        
        crearVentaMutation.mutate({
            metodo_pago: metodoPago,
            cliente_id: clienteId,
            notas,
            impuesto_pct: 0,
            items: items.map(i => ({
                repuesto_id: i.repuesto_id,
                cantidad: i.cantidad,
                precio_unitario: i.precio_unitario,
                descuento_pct: i.descuento_pct,
            })),
        });
    };

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h2 className="page-title">Ventas</h2>
                    {loadingVentas ? (
                         <div className="shimmer mt-2" style={{ height: 20, width: 200 }} />
                    ) : (
                        <p className="page-subtitle">{ventas.length} ventas — Total: {formatCOP(totalFiltrado)}</p>
                    )}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => refetch()} disabled={loadingVentas}>
                        <RefreshCw size={14} className={loadingVentas ? 'spinner' : ''} />
                    </button>
                    <button className="btn btn-primary" onClick={openModal}>
                        <Plus size={16} /> Nueva venta
                    </button>
                </div>
            </div>

            {/* Filtros — ahora cacheables via url keys */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {(['hoy', 'semana', 'mes', 'todos'] as Filtro[]).map(f => (
                    <button
                        key={f}
                        className={`btn btn-sm ${filtro === f ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => handleFiltroChange(f)}
                        disabled={loadingVentas && filtro === f}
                    >
                        {f === 'hoy' ? 'Hoy' : f === 'semana' ? 'Esta semana' : f === 'mes' ? 'Este mes' : 'Todas'}
                    </button>
                ))}
            </div>

            {loadingVentas && ventas.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '100px 0' }}>
                    <Loader2 className="spinner mx-auto mb-2" size={40} color="var(--accent)" />
                    <p className="text-muted mt-3">Cargando ventas...</p>
                </div>
            ) : errorVentas ? (
                <div className="alert alert-danger">Error al cargar las ventas. Verifique su conexión y recargue.</div>
            ) : (
                <div className="table-wrapper" style={{ opacity: loadingVentas ? 0.6 : 1, transition: 'opacity 0.2s' }}>
                    <table>
                        <thead>
                            <tr>
                                <th>Factura</th>
                                <th>Fecha</th>
                                <th>Cliente</th>
                                <th>Método pago</th>
                                <th>Total</th>
                                <th>Estado</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {ventas.map((v: any) => (
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
                                    <td style={{ position: 'relative' }}>
                                        {(TRANSICIONES[v.estado] ?? []).length > 0 && (
                                            <>
                                                <button
                                                    className="btn btn-ghost btn-xs"
                                                    onClick={() => setOpenDropId(openDropId === v.id ? null : v.id)}
                                                    disabled={estadoMutation.isPending}
                                                >
                                                    <ChevronDown size={14} />
                                                </button>
                                                {openDropId === v.id && (
                                                    <div className="dropdown-list" style={{ position: 'absolute', right: 0, zIndex: 50, width: 170 }}>
                                                        {(TRANSICIONES[v.estado] ?? []).map(t => (
                                                            <div
                                                                key={t.value}
                                                                className="dropdown-item"
                                                                style={{ color: t.color }}
                                                                onClick={() => {
                                                                    if (t.value === 'anulada' && !confirm(`¿Anular la venta ${v.numero_factura}? Se revertirá el stock.`)) return;
                                                                    estadoMutation.mutate({ id: v.id, estado: t.value });
                                                                }}
                                                            >
                                                                {t.label}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {ventas.length === 0 && (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
                                        No hay ventas para el período seleccionado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Paginación */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, marginTop: 16 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0 || loadingVentas}>
                    <ChevronLeft size={16} />
                </button>
                <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Página {page + 1}</span>
                <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => p + 1)} disabled={ventas.length < 50 || loadingVentas}>
                    <ChevronRight size={16} />
                </button>
            </div>

            {toast && <Toast message={toast} onClose={() => setToast('')} />}

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
                                                placeholder="Buscar por nombre o SKU... (aplique zoom)"
                                                value={searchProdRaw}
                                                onChange={e => { setSearchProd(e.target.value); setShowProdDrop(true); }}
                                                onFocus={() => setShowProdDrop(true)}
                                                autoComplete="off"
                                            />
                                            {loadingProds && <Loader2 size={14} className="spinner" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />}
                                        </div>
                                        {showProdDrop && searchProdRaw.length >= 2 && (
                                            <div className="dropdown-list" style={{ position: 'absolute', zIndex: 100, width: '100%' }}>
                                                {filteredProds.length > 0 ? filteredProds.map((r: any) => (
                                                    <div key={r.id} className="dropdown-item" onClick={() => addProduct(r)}>
                                                        <span style={{ fontWeight: 600 }}>{r.nombre}</span>
                                                        <span style={{ color: 'var(--muted)', fontSize: '0.78rem', marginLeft: 8 }}>
                                                            {r.sku} · Stock: {r.stock_actual} · {formatCOP(r.precio_venta)}
                                                        </span>
                                                    </div>
                                                )) : !loadingProds && (
                                                    <div className="dropdown-item" style={{ color: 'var(--muted)', cursor: 'default' }}>
                                                        No se encontraron resultados
                                                    </div>
                                                )}
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
                                                    <th style={{ textAlign: 'center', paddingBottom: 6 }}>Desc.%</th>
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
                                                                style={{ width: 55, textAlign: 'center', padding: '4px', borderRadius: 6, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
                                                            />
                                                        </td>
                                                        <td style={{ textAlign: 'center' }}>
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                max={100}
                                                                value={item.descuento_pct}
                                                                onChange={e => updateDescuento(item.repuesto_id, parseFloat(e.target.value) || 0)}
                                                                style={{ width: 55, textAlign: 'center', padding: '4px', borderRadius: 6, background: 'var(--surface)', border: '1px solid var(--border)', color: item.descuento_pct > 0 ? '#f1c40f' : 'var(--text)' }}
                                                            />
                                                        </td>
                                                        <td style={{ textAlign: 'right', color: 'var(--muted)' }}>{formatCOP(item.precio_unitario)}</td>
                                                        <td style={{ textAlign: 'right', fontWeight: 700 }}>
                                                            {item.descuento_pct > 0 && (
                                                                <span style={{ fontSize: '0.7rem', color: '#f1c40f', display: 'block' }}>
                                                                    -{item.descuento_pct}%
                                                                </span>
                                                            )}
                                                            {formatCOP(item.cantidad * item.precio_unitario * (1 - item.descuento_pct / 100))}
                                                        </td>
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
                                            <div className="input-icon-wrapper">
                                                <input
                                                    className="form-control"
                                                    placeholder="Buscar celular, nombre o DNI..."
                                                    value={clienteId && !showClienteDrop
                                                        ? `Cliente #${clienteId} (Activo)`
                                                        : searchClienteRaw
                                                    }
                                                    onChange={e => { setSearchCliente(e.target.value); setShowClienteDrop(true); setClienteId(null); }}
                                                    onFocus={() => setShowClienteDrop(true)}
                                                    autoComplete="off"
                                                />
                                                {loadingClientes && <Loader2 size={14} className="spinner" style={{ position: 'absolute', right: 30, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />}
                                                {clienteId && !showClienteDrop && (
                                                    <button
                                                        type="button"
                                                        style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}
                                                        onClick={() => { setClienteId(null); setSearchCliente(''); }}
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                )}
                                            </div>
                                            {showClienteDrop && searchClienteRaw.length >= 2 && (
                                                <div className="dropdown-list" style={{ position: 'absolute', zIndex: 100, width: '100%' }}>
                                                    {filteredClientes.length > 0 ? filteredClientes.map((c: any) => (
                                                        <div key={c.id} className="dropdown-item"
                                                            onClick={() => { setClienteId(c.id); setShowClienteDrop(false); }}>
                                                            <span style={{ fontWeight: 600 }}>{c.nombre}</span>
                                                            <span style={{ color: 'var(--muted)', fontSize: '0.78rem', marginLeft: 8 }}>{c.documento_nro}</span>
                                                        </div>
                                                    )) : !loadingClientes && (
                                                        <div className="dropdown-item" style={{ color: 'var(--muted)', cursor: 'default' }}>
                                                            No se encontraron clientes.
                                                        </div>
                                                    )}
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
                                <button type="submit" className="btn btn-primary" disabled={crearVentaMutation.isPending || items.length === 0}>
                                    {crearVentaMutation.isPending ? <Loader2 size={16} className="spinner" /> : <Save size={16} />}
                                    {crearVentaMutation.isPending ? 'Registrando...' : 'Registrar venta'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
