import { Plus } from 'lucide-react';
import { getGarantias } from '../../services/api';
import { useAsync } from '../../hooks/useAsync';
import { PageLoading, ErrorMessage, SkeletonRows } from '../../components/UI';
import { formatDate, getDaysUntil, padId } from '../../utils/helpers';
import { Garantia } from '../../types/types';

function DaysLeftBadge({ fecha }: { fecha: string }) {
    const days = getDaysUntil(fecha);
    const color = days <= 7 ? 'var(--danger)' : days <= 30 ? 'var(--warning)' : 'var(--success)';
    return <span style={{ fontWeight: 700, color }}>{days} días</span>;
}

function EstadoBadge({ estado }: { estado: Garantia['estado'] }) {
    const map = {
        abierta:    'badge-warning',
        en_proceso: 'badge-accent',
        resuelta:   'badge-success',
        rechazada:  'badge-muted',
    } as const;
    return (
        <span className={`badge ${map[estado] ?? 'badge-muted'}`}>
            {estado.replace('_', ' ')}
        </span>
    );
}

export default function Garantias() {
    const { data: garantias, isLoading, isError, error, refetch } = useAsync(getGarantias);

    if (isLoading) return <PageLoading message="Cargando garantías..." />;
    if (isError) return <ErrorMessage message={error ?? undefined} onRetry={refetch} />;

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h2 className="page-title">Garantías</h2>
                    <p className="page-subtitle">{garantias?.length ?? 0} garantías registradas</p>
                </div>
                <button className="btn btn-primary">
                    <Plus size={16} aria-hidden="true" /> Nueva garantía
                </button>
            </div>

            <div className="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Cliente</th>
                            <th>Repuesto</th>
                            <th>Falla reportada</th>
                            <th>Apertura</th>
                            <th>Vencimiento</th>
                            <th>Días restantes</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {garantias?.map(g => (
                            <tr key={g.id}>
                                <td style={{ fontFamily: 'monospace', color: 'var(--accent)', fontSize: '0.82rem' }}>
                                    GAR-{padId(g.id)}
                                </td>
                                <td style={{ fontWeight: 600 }}>{g.cliente?.nombre}</td>
                                <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                    {g.repuesto?.nombre}
                                </td>
                                <td style={{
                                    fontSize: '0.8rem', color: 'var(--muted)',
                                    maxWidth: 200, overflow: 'hidden',
                                    textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                }}>
                                    {g.descripcion_falla}
                                </td>
                                <td style={{ fontSize: '0.8rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                                    {formatDate(g.fecha_apertura)}
                                </td>
                                <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                                    {g.fecha_vencimiento}
                                </td>
                                <td><DaysLeftBadge fecha={g.fecha_vencimiento} /></td>
                                <td><EstadoBadge estado={g.estado} /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
