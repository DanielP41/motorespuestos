import { ArrowUp, ArrowDown, RefreshCw } from 'lucide-react';
import { getMovimientos } from '../../services/api';
import { useAsync } from '../../hooks/useAsync';
import { PageLoading, ErrorMessage, SkeletonRows } from '../../components/UI';
import { formatDateTime } from '../../utils/helpers';
import { TipoMovimiento } from '../../types/types';

const tipoConfig: Record<TipoMovimiento, { icon: React.ReactNode; label: string; color: string }> = {
    entrada:    { icon: <ArrowUp size={14} />,    label: 'Entrada',    color: 'var(--success)' },
    salida:     { icon: <ArrowDown size={14} />,  label: 'Salida',     color: 'var(--danger)' },
    ajuste:     { icon: <RefreshCw size={14} />,  label: 'Ajuste',     color: 'var(--warning)' },
    devolucion: { icon: <ArrowUp size={14} />,    label: 'Devolución', color: '#3498db' },
};

export default function Inventario() {
    const { data: movimientos, isLoading, isError, error, refetch } = useAsync(getMovimientos);

    if (isLoading) return <PageLoading message="Cargando movimientos..." />;
    if (isError) return <ErrorMessage message={error ?? undefined} onRetry={refetch} />;

    return (
        <div>
            <div className="page-header">
                <h2 className="page-title">Inventario</h2>
                <p className="page-subtitle">
                    {movimientos?.length ?? 0} movimientos registrados
                </p>
            </div>

            <div className="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Repuesto</th>
                            <th>SKU</th>
                            <th>Tipo</th>
                            <th>Cantidad</th>
                            <th>Stock anterior</th>
                            <th>Stock posterior</th>
                            <th>Referencia</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <SkeletonRows rows={5} cols={8} />
                        ) : movimientos?.map(m => {
                            const config = tipoConfig[m.tipo];
                            return (
                                <tr key={m.id}>
                                    <td style={{ fontSize: '0.8rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                                        {formatDateTime(m.creado_en)}
                                    </td>
                                    <td style={{ fontWeight: 600, color: 'var(--text)' }}>{m.repuesto?.nombre}</td>
                                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--accent)' }}>
                                        {m.repuesto?.sku}
                                    </td>
                                    <td>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: config.color }}>
                                            {config.icon} {config.label}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: 700, color: m.cantidad > 0 ? 'var(--success)' : 'var(--danger)' }}>
                                        {m.cantidad > 0 ? `+${m.cantidad}` : m.cantidad}
                                    </td>
                                    <td>{m.stock_anterior}</td>
                                    <td style={{ fontWeight: 600 }}>{m.stock_posterior}</td>
                                    <td style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                                        {m.referencia_tipo ?? '—'}
                                        {m.referencia_id ? ` #${m.referencia_id}` : ''}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
