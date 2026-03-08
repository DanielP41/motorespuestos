import { useState } from 'react';
import { Search, Plus, Edit, AlertTriangle } from 'lucide-react';
import { getRepuestos } from '../../services/api';
import { useAsync } from '../../hooks/useAsync';
import { useDebounce } from '../../hooks/useDebounce';
import { PageLoading, ErrorMessage, SkeletonRows, EmptyState } from '../../components/UI';
import { formatCOP } from '../../utils/helpers';
import { Repuesto } from '../../types/types';

function getStockClass(r: Repuesto) {
    if (r.stock_actual === 0) return 'badge-danger';
    if (r.stock_actual < r.stock_minimo) return 'badge-warning';
    return 'badge-success';
}

function getStockLabel(r: Repuesto) {
    if (r.stock_actual === 0) return 'Agotado';
    if (r.stock_actual < r.stock_minimo) return 'Stock bajo';
    return 'En stock';
}

export default function Repuestos() {
    const [q, setQ] = useState('');
    const debouncedQ = useDebounce(q, 300);

    const { data: repuestos, isLoading, isError, error, refetch } = useAsync(
        () => getRepuestos({ q: debouncedQ }),
        [debouncedQ]
    );

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h2 className="page-title">Repuestos</h2>
                    <p className="page-subtitle">
                        {repuestos ? `${repuestos.length} productos en el catálogo` : 'Cargando...'}
                    </p>
                </div>
                <button className="btn btn-primary">
                    <Plus size={16} aria-hidden="true" /> Nuevo repuesto
                </button>
            </div>

            <div className="search-bar" style={{ maxWidth: 360, marginBottom: 20 }}>
                <Search size={16} className="text-muted" aria-hidden="true" />
                <input
                    type="text"
                    placeholder="Buscar por nombre o SKU..."
                    value={q}
                    onChange={e => setQ(e.target.value)}
                    aria-label="Buscar repuestos"
                />
            </div>

            {isError && <ErrorMessage message={error ?? undefined} onRetry={refetch} />}

            <div className="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>SKU</th>
                            <th>Nombre</th>
                            <th>Categoría</th>
                            <th>Precio venta</th>
                            <th>Stock</th>
                            <th>Estado</th>
                            <th>Tipo</th>
                            <th><span className="sr-only">Acciones</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <SkeletonRows rows={6} cols={8} />
                        ) : !repuestos || repuestos.length === 0 ? (
                            <tr>
                                <td colSpan={8}>
                                    <EmptyState
                                        icon="🔍"
                                        title="Sin resultados"
                                        description="Probá con otro nombre o SKU."
                                    />
                                </td>
                            </tr>
                        ) : repuestos.map(r => (
                            <tr key={r.id}>
                                <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--accent)' }}>
                                    {r.sku}
                                </td>
                                <td style={{ fontWeight: 600, color: 'var(--text)' }}>{r.nombre}</td>
                                <td>{r.categoria?.nombre}</td>
                                <td style={{ fontWeight: 600 }}>{formatCOP(r.precio_venta)}</td>
                                <td>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        {r.stock_actual < r.stock_minimo && (
                                            <AlertTriangle size={13} color="var(--warning)" aria-label="Stock bajo" />
                                        )}
                                        {r.stock_actual}
                                    </span>
                                </td>
                                <td>
                                    <span className={`badge ${getStockClass(r)}`}>{getStockLabel(r)}</span>
                                </td>
                                <td>
                                    <span className={`badge ${r.es_original ? 'badge-original' : 'badge-muted'}`}>
                                        {r.es_original ? 'Original' : 'Alternativo'}
                                    </span>
                                </td>
                                <td>
                                    <button className="btn btn-icon btn-ghost" aria-label={`Editar ${r.nombre}`}>
                                        <Edit size={14} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
