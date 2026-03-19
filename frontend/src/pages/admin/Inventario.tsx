import { useState, useEffect, useCallback, useRef } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import { getMovimientos, getRepuestos, registrarMovimiento, getStockCritico } from '../../services/api';
import {
    ArrowUp, ArrowDown, RefreshCw, Loader2, Plus, X, Save,
    Search, AlertTriangle, PackageX, Package, ChevronLeft, ChevronRight, Download
} from 'lucide-react';
import { Toast } from '../../components/UI';
import { exportToCSV } from '../../utils/export';

const TIPOS_MOV = [
    { value: 'entrada', label: 'Entrada', desc: 'Mercancía recibida (suma al stock)', color: '#22c55e', icon: <ArrowUp size={14} /> },
    { value: 'ajuste', label: 'Ajuste', desc: 'Corrección manual (puede ser positiva o negativa)', color: '#f59e0b', icon: <RefreshCw size={14} /> },
    { value: 'devolucion', label: 'Devolución', desc: 'Cliente devuelve un producto', color: '#3b82f6', icon: <ArrowUp size={14} /> },
];

const tipoColor: Record<string, string> = {
    entrada: '#22c55e',
    salida: '#ef4444',
    ajuste: '#f59e0b',
    devolucion: '#3b82f6',
};

const tipoIcon: Record<string, JSX.Element> = {
    entrada: <ArrowUp size={13} />,
    salida: <ArrowDown size={13} />,
    ajuste: <RefreshCw size={13} />,
    devolucion: <ArrowUp size={13} />,
};

type FiltroTipo = 'todos' | 'entrada' | 'salida' | 'ajuste' | 'devolucion';
type FiltroPeriodo = 'todos' | 'hoy' | 'semana' | 'mes' | 'custom';

function toISODate(d: Date) {
    return d.toISOString().split('T')[0];
}

function rangoDesde(periodo: FiltroPeriodo): { desde?: string; hasta?: string } {
    const hoy = new Date();
    if (periodo === 'hoy') return { desde: toISODate(hoy), hasta: toISODate(hoy) };
    if (periodo === 'semana') {
        const d = new Date(hoy); d.setDate(hoy.getDate() - 6);
        return { desde: toISODate(d), hasta: toISODate(hoy) };
    }
    if (periodo === 'mes') {
        const d = new Date(hoy); d.setDate(hoy.getDate() - 29);
        return { desde: toISODate(d), hasta: toISODate(hoy) };
    }
    return {};
}

export default function Inventario() {
    const [movimientos, setMovimientos] = useState<any[]>([]);
    const [stockCritico, setStockCritico] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>('todos');
    const [filtroPeriodo, setFiltroPeriodo] = useState<FiltroPeriodo>('todos');
    const [customDesde, setCustomDesde] = useState('');
    const [customHasta, setCustomHasta] = useState('');
    const [page, setPage] = useState(0);
    const [toast, setToast] = useState('');

    // Filtro por producto (tabla)
    const [filtroRepuesto, setFiltroRepuesto] = useState<any | null>(null);
    const [tableSearch, setTableSearch] = useState('');
    const [tableSearchResults, setTableSearchResults] = useState<any[]>([]);
    const [tableSearchLoading, setTableSearchLoading] = useState(false);
    const [showTableDrop, setShowTableDrop] = useState(false);
    const debouncedTableSearch = useDebounce(tableSearch, 300);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');

    // Form
    const [searchProd, setSearchProd] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [showDrop, setShowDrop] = useState(false);
    const [selectedRep, setSelectedRep] = useState<any | null>(null);
    const debouncedSearch = useDebounce(searchProd, 300);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [tipo, setTipo] = useState('entrada');
    const [cantidad, setCantidad] = useState<number>(1);
    const [costo, setCosto] = useState<number | ''>('');
    const [notas, setNotas] = useState('');

    // Búsqueda lazy para el filtro de tabla
    useEffect(() => {
        if (filtroRepuesto || debouncedTableSearch.length < 2) {
            setTableSearchResults([]);
            return;
        }
        setTableSearchLoading(true);
        getRepuestos({ search: debouncedTableSearch })
            .then(r => setTableSearchResults(r.slice(0, 8)))
            .catch(() => setTableSearchResults([]))
            .finally(() => setTableSearchLoading(false));
    }, [debouncedTableSearch, filtroRepuesto]);

    // Búsqueda lazy para el modal
    useEffect(() => {
        if (selectedRep || debouncedSearch.length < 2) {
            setSearchResults([]);
            return;
        }
        setSearchLoading(true);
        getRepuestos({ search: debouncedSearch })
            .then(r => setSearchResults(r.slice(0, 8)))
            .catch(() => setSearchResults([]))
            .finally(() => setSearchLoading(false));
    }, [debouncedSearch, selectedRep]);

    const loadData = useCallback(async (
        t: FiltroTipo = filtroTipo,
        p: number = page,
        periodo: FiltroPeriodo = filtroPeriodo,
        cDesde: string = customDesde,
        cHasta: string = customHasta,
        repId?: number,
    ) => {
        setLoading(true);
        setError('');
        try {
            const rango = periodo === 'custom'
                ? { desde: cDesde || undefined, hasta: cHasta || undefined }
                : rangoDesde(periodo);
            const filters = {
                ...(t !== 'todos' ? { tipo: t } : {}),
                page: p,
                ...(rango.desde ? { fecha_desde: rango.desde } : {}),
                ...(rango.hasta ? { fecha_hasta: rango.hasta } : {}),
                ...(repId ? { repuesto_id: repId } : {}),
            };
            const [movs, critico] = await Promise.all([
                getMovimientos(filters),
                getStockCritico(),
            ]);
            setMovimientos(movs);
            setStockCritico(critico);
        } catch (err: any) {
            setError('Error al cargar datos: ' + (err.message || 'Error desconocido'));
        } finally {
            setLoading(false);
        }
    }, [filtroTipo, page, filtroPeriodo, customDesde, customHasta]);

    useEffect(() => {
        loadData(filtroTipo, page, filtroPeriodo, customDesde, customHasta, filtroRepuesto?.id);
    }, [filtroTipo, page, filtroPeriodo, filtroRepuesto]);

    const openModal = () => {
        setSelectedRep(null);
        setSearchProd('');
        setSearchResults([]);
        setTipo('entrada');
        setCantidad(1);
        setCosto('');
        setNotas('');
        setSaveError('');
        setShowModal(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRep) { setSaveError('Selecciona un producto.'); return; }
        if (!cantidad || cantidad === 0) { setSaveError('La cantidad no puede ser cero.'); return; }

        setSaving(true);
        setSaveError('');
        try {
            await registrarMovimiento({
                repuesto_id: selectedRep.id,
                tipo,
                cantidad: tipo === 'ajuste' ? cantidad : Math.abs(cantidad),
                costo_unitario: costo !== '' ? Number(costo) : undefined,
                notas,
            });
            setShowModal(false);
            setToast('Movimiento registrado correctamente');
            setPage(0);
            loadData(filtroTipo, 0);
        } catch (err: any) {
            setSaveError(err.message || 'Error al registrar movimiento.');
        } finally {
            setSaving(false);
        }
    };

    const handleExport = () => {
        const rows = movimientos.map(m => ({
            'Fecha': new Date(m.creado_en).toLocaleString('es-CO'),
            'Tipo': m.tipo,
            'Producto': m.repuesto ? (typeof m.repuesto === 'object' ? m.repuesto.nombre : m.repuesto) : `#${m.repuesto_id}`,
            'Cantidad': m.cantidad,
            'Stock anterior': m.stock_anterior,
            'Stock posterior': m.stock_posterior,
            'Costo unitario': m.costo_unitario ?? '',
            'Referencia': m.referencia_tipo ? `${m.referencia_tipo}${m.referencia_id ? ` #${m.referencia_id}` : ''}` : '',
            'Usuario': m.usuario ?? '',
            'Notas': m.notas ?? '',
        }));
        const fecha = new Date().toISOString().split('T')[0];
        exportToCSV(rows, `inventario_${fecha}.csv`);
    };

    const agotados = stockCritico.filter(r => r.stock_actual === 0).length;
    const bajos = stockCritico.filter(r => r.stock_actual > 0).length;

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h2 className="page-title">Inventario</h2>
                    <p className="page-subtitle">
                        {movimientos.length} movimientos registrados
                        {stockCritico.length > 0 && (
                            <span style={{ color: '#f59e0b', marginLeft: 12 }}>
                                · ⚠ {agotados} agotados, {bajos} stock bajo
                            </span>
                        )}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => loadData(filtroTipo)} disabled={loading}>
                        <RefreshCw size={14} />
                    </button>
                    <button
                        className="btn btn-ghost btn-sm"
                        onClick={handleExport}
                        disabled={loading || movimientos.length === 0}
                        title="Exportar a CSV"
                    >
                        <Download size={14} /> CSV
                    </button>
                    <button className="btn btn-primary" onClick={openModal}>
                        <Plus size={16} /> Registrar movimiento
                    </button>
                </div>
            </div>

            {/* Stock crítico banner */}
            {stockCritico.length > 0 && (
                <div style={{
                    background: 'rgba(245,158,11,0.08)',
                    border: '1px solid rgba(245,158,11,0.3)',
                    borderRadius: 'var(--radius)',
                    padding: '14px 18px',
                    marginBottom: 20,
                    display: 'flex',
                    gap: 16,
                    flexWrap: 'wrap',
                    alignItems: 'flex-start',
                }}>
                    <AlertTriangle size={18} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 2 }} />
                    <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 700, color: '#f59e0b', fontSize: '0.88rem', marginBottom: 8 }}>
                            Productos con stock crítico
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {stockCritico.slice(0, 10).map(r => (
                                <span key={r.id} style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 5,
                                    background: r.critico ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                                    border: `1px solid ${r.critico ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`,
                                    borderRadius: 20, padding: '3px 10px', fontSize: '0.78rem',
                                }}>
                                    {r.critico ? <PackageX size={11} color="#ef4444" /> : <Package size={11} color="#f59e0b" />}
                                    <span style={{ color: 'var(--text)', fontWeight: 600 }}>{r.nombre}</span>
                                    <span style={{ color: r.critico ? '#ef4444' : '#f59e0b', fontWeight: 700 }}>
                                        {r.stock_actual}
                                    </span>
                                </span>
                            ))}
                            {stockCritico.length > 10 && (
                                <span style={{ fontSize: '0.78rem', color: 'var(--muted)', padding: '3px 4px' }}>
                                    +{stockCritico.length - 10} más
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Filtro por producto */}
            <div style={{ position: 'relative', maxWidth: 360, marginBottom: 12 }}>
                <div className="input-icon-wrapper">
                    <Search size={14} />
                    <input
                        className="form-control"
                        placeholder="Filtrar por producto o SKU..."
                        value={filtroRepuesto ? `${filtroRepuesto.nombre} (${filtroRepuesto.sku})` : tableSearch}
                        onChange={e => {
                            if (filtroRepuesto) setFiltroRepuesto(null);
                            setTableSearch(e.target.value);
                            setShowTableDrop(true);
                        }}
                        onFocus={() => !filtroRepuesto && setShowTableDrop(true)}
                        onBlur={() => setTimeout(() => setShowTableDrop(false), 150)}
                        autoComplete="off"
                    />
                    {filtroRepuesto && (
                        <button
                            type="button"
                            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}
                            onClick={() => { setFiltroRepuesto(null); setTableSearch(''); setPage(0); }}
                        ><X size={14} /></button>
                    )}
                </div>
                {showTableDrop && !filtroRepuesto && (tableSearchLoading || tableSearchResults.length > 0) && (
                    <div className="dropdown-list" style={{ position: 'absolute', zIndex: 50, width: '100%' }}>
                        {tableSearchLoading ? (
                            <div className="dropdown-item" style={{ color: 'var(--muted)', justifyContent: 'center' }}>
                                <Loader2 size={14} className="spinner" /> Buscando...
                            </div>
                        ) : tableSearchResults.map(r => (
                            <div key={r.id} className="dropdown-item"
                                onClick={() => { setFiltroRepuesto(r); setShowTableDrop(false); setTableSearch(''); setPage(0); }}>
                                <span style={{ fontWeight: 600 }}>{r.nombre}</span>
                                <span style={{ color: 'var(--muted)', fontSize: '0.78rem', marginLeft: 8 }}>
                                    {r.sku} · Stock: {r.stock_actual}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Filtros por período */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                {([
                    { value: 'todos', label: 'Todos' },
                    { value: 'hoy', label: 'Hoy' },
                    { value: 'semana', label: 'Últimos 7d' },
                    { value: 'mes', label: 'Últimos 30d' },
                    { value: 'custom', label: 'Personalizado' },
                ] as { value: FiltroPeriodo; label: string }[]).map(f => (
                    <button
                        key={f.value}
                        className={`btn btn-sm ${filtroPeriodo === f.value ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => { setFiltroPeriodo(f.value); setPage(0); }}
                        disabled={loading}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Rango personalizado */}
            {filtroPeriodo === 'custom' && (
                <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                        type="date"
                        className="form-control"
                        style={{ width: 160 }}
                        value={customDesde}
                        onChange={e => setCustomDesde(e.target.value)}
                    />
                    <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>hasta</span>
                    <input
                        type="date"
                        className="form-control"
                        style={{ width: 160 }}
                        value={customHasta}
                        onChange={e => setCustomHasta(e.target.value)}
                    />
                    <button
                        className="btn btn-primary btn-sm"
                        onClick={() => { setPage(0); loadData(filtroTipo, 0, 'custom', customDesde, customHasta); }}
                        disabled={loading || (!customDesde && !customHasta)}
                    >
                        Buscar
                    </button>
                </div>
            )}

            {/* Filtros por tipo */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                {(['todos', 'entrada', 'salida', 'ajuste', 'devolucion'] as FiltroTipo[]).map(f => (
                    <button
                        key={f}
                        className={`btn btn-sm ${filtroTipo === f ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => { setFiltroTipo(f); setPage(0); }}
                        disabled={loading}
                        style={filtroTipo !== f && f !== 'todos' ? { color: tipoColor[f], borderColor: `${tipoColor[f]}44` } : {}}
                    >
                        {f === 'todos' ? 'Todos' : f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '100px 0' }}>
                    <Loader2 className="spinner" size={40} />
                    <p className="text-muted mt-3">Cargando movimientos...</p>
                </div>
            ) : error ? (
                <div className="alert alert-danger">{error}</div>
            ) : (
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Tipo</th>
                                <th>Producto</th>
                                <th>Cantidad</th>
                                <th>Stock ant.</th>
                                <th>Stock post.</th>
                                <th>Referencia</th>
                                <th>Usuario</th>
                                <th>Notas</th>
                            </tr>
                        </thead>
                        <tbody>
                            {movimientos.map(m => (
                                <tr key={m.id}>
                                    <td style={{ fontSize: '0.8rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                                        {new Date(m.creado_en).toLocaleString('es-CO')}
                                    </td>
                                    <td>
                                        <span style={{
                                            display: 'inline-flex', alignItems: 'center', gap: 5,
                                            color: tipoColor[m.tipo] || 'var(--muted)',
                                            fontWeight: 600, textTransform: 'capitalize', fontSize: '0.82rem'
                                        }}>
                                            {tipoIcon[m.tipo]}
                                            {m.tipo}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: 500, fontSize: '0.85rem' }}>
                                        {m.repuesto ? (typeof m.repuesto === 'object' ? (m.repuesto as any).nombre : m.repuesto) : `#${m.repuesto_id}`}
                                    </td>
                                    <td style={{ fontWeight: 700, color: m.cantidad > 0 ? '#22c55e' : '#ef4444' }}>
                                        {m.cantidad > 0 ? `+${m.cantidad}` : m.cantidad}
                                    </td>
                                    <td style={{ color: 'var(--muted)' }}>{m.stock_anterior}</td>
                                    <td style={{ fontWeight: 600 }}>{m.stock_posterior}</td>
                                    <td style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                                        {m.referencia_tipo ?? '—'}
                                        {m.referencia_id ? ` #${m.referencia_id}` : ''}
                                    </td>
                                    <td style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                                        {m.usuario || '—'}
                                    </td>
                                    <td style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{m.notas || '—'}</td>
                                </tr>
                            ))}
                            {movimientos.length === 0 && (
                                <tr>
                                    <td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
                                        No hay movimientos para el filtro seleccionado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Paginación */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, marginTop: 16 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0 || loading}>
                    <ChevronLeft size={16} />
                </button>
                <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Página {page + 1}</span>
                <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => p + 1)} disabled={movimientos.length < 50 || loading}>
                    <ChevronRight size={16} />
                </button>
            </div>

            {toast && <Toast message={toast} onClose={() => setToast('')} />}

            {/* ── Modal Registrar Movimiento ── */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div
                        className="modal-box"
                        style={{ maxWidth: 560 }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <h3 className="modal-title"><Package size={18} /> Registrar Movimiento</h3>
                            <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSave}>
                            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                                {/* Tipo de movimiento */}
                                <div>
                                    <label className="form-label">Tipo de Movimiento *</label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {TIPOS_MOV.map(t => (
                                            <label
                                                key={t.value}
                                                style={{
                                                    display: 'flex', alignItems: 'flex-start', gap: 10,
                                                    padding: '10px 14px', borderRadius: 'var(--radius)',
                                                    border: `1px solid ${tipo === t.value ? t.color : 'var(--border)'}`,
                                                    background: tipo === t.value ? `${t.color}11` : 'transparent',
                                                    cursor: 'pointer', transition: 'all 0.12s',
                                                }}
                                            >
                                                <input
                                                    type="radio"
                                                    name="tipo"
                                                    value={t.value}
                                                    checked={tipo === t.value}
                                                    onChange={() => setTipo(t.value)}
                                                    style={{ accentColor: t.color, marginTop: 2 }}
                                                />
                                                <div>
                                                    <span style={{ fontWeight: 700, color: t.color, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 5 }}>
                                                        {t.icon} {t.label}
                                                    </span>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t.desc}</span>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Producto */}
                                <div>
                                    <label className="form-label">Producto *</label>
                                    <div style={{ position: 'relative' }}>
                                        <div className="input-icon-wrapper">
                                            <Search size={14} />
                                            <input
                                                className="form-control"
                                                placeholder="Buscar por nombre o SKU..."
                                                value={selectedRep ? `${selectedRep.nombre} (${selectedRep.sku})` : searchProd}
                                                onChange={e => {
                                                    if (selectedRep) setSelectedRep(null);
                                                    setSearchProd(e.target.value);
                                                    setShowDrop(true);
                                                }}
                                                onFocus={() => !selectedRep && setShowDrop(true)}
                                                autoComplete="off"
                                            />
                                            {selectedRep && (
                                                <button
                                                    type="button"
                                                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}
                                                    onClick={() => { setSelectedRep(null); setSearchProd(''); }}
                                                ><X size={14} /></button>
                                            )}
                                        </div>
                                        {showDrop && !selectedRep && (searchLoading || searchResults.length > 0) && (
                                            <div ref={dropdownRef} className="dropdown-list" style={{ position: 'absolute', zIndex: 100, width: '100%' }}>
                                                {searchLoading ? (
                                                    <div className="dropdown-item" style={{ color: 'var(--muted)', justifyContent: 'center' }}>
                                                        <Loader2 size={14} className="spinner" /> Buscando...
                                                    </div>
                                                ) : searchResults.map(r => (
                                                    <div key={r.id} className="dropdown-item"
                                                        onClick={() => { setSelectedRep(r); setShowDrop(false); setSearchProd(''); }}>
                                                        <span style={{ fontWeight: 600 }}>{r.nombre}</span>
                                                        <span style={{ color: 'var(--muted)', fontSize: '0.78rem', marginLeft: 8 }}>
                                                            {r.sku} · Stock: {r.stock_actual}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {selectedRep && (
                                        <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 6 }}>
                                            Stock actual: <strong style={{ color: selectedRep.stock_actual === 0 ? '#ef4444' : 'var(--text)' }}>
                                                {selectedRep.stock_actual}
                                            </strong> unidades
                                        </p>
                                    )}
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                    {/* Cantidad */}
                                    <div>
                                        <label className="form-label">
                                            Cantidad * {tipo === 'ajuste' && <span style={{ color: 'var(--muted)', fontSize: '0.72rem' }}>(negativo para reducir)</span>}
                                        </label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            value={cantidad}
                                            min={tipo === 'ajuste' ? undefined : 1}
                                            onChange={e => setCantidad(parseInt(e.target.value) || 0)}
                                            required
                                        />
                                    </div>

                                    {/* Costo unitario */}
                                    <div>
                                        <label className="form-label">Costo unitario</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            placeholder="Opcional"
                                            value={costo}
                                            min={0}
                                            onChange={e => setCosto(e.target.value ? Number(e.target.value) : '')}
                                        />
                                    </div>
                                </div>

                                {/* Notas */}
                                <div>
                                    <label className="form-label">Motivo / Notas</label>
                                    <textarea
                                        className="form-control"
                                        rows={2}
                                        placeholder="Motivo del movimiento..."
                                        value={notas}
                                        onChange={e => setNotas(e.target.value)}
                                        style={{ resize: 'vertical' }}
                                    />
                                </div>

                                {saveError && (
                                    <div className="alert alert-danger">{saveError}</div>
                                )}
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={saving || !selectedRep || cantidad === 0}>
                                    {saving ? <Loader2 size={16} className="spinner" /> : <Save size={16} />}
                                    {saving ? 'Registrando...' : 'Registrar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
