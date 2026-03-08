import { Plus } from 'lucide-react';
import { getVentas } from '../../services/api';
import { useAsync } from '../../hooks/useAsync';
import { PageLoading, ErrorMessage, SkeletonRows } from '../../components/UI';
import { formatCOP, formatDateTime } from '../../utils/helpers';
import { Venta } from '../../types/types';

function EstadoBadge({ estado }: { estado: Venta['estado'] }) {
    const map = {
        pagada:     'badge-success',
        en_credito: 'badge-warning',
        anulada:    'badge-danger',
        pendiente:  'badge-muted',
    } as const;
    return (
        <span className={`badge ${map[estado] ?? 'badge-muted'}`}>
            {estado.replace('_', ' ')}
        </span>
    );
}

export default function Ventas() {
    const { data: ventas, isLoading, isError, error, refetch } = useAsync(getVentas);

    if (isLoading) return <PageLoading message="Cargando ventas..." />;
    if (isError) return <ErrorMessage message={error ?? undefined} onRetry={refetch} />;

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h2 className="page-title">Ventas</h2>
                    <p className="page-subtitle">{ventas?.length ?? 0} ventas registradas</p>
                </div>
                <button className="btn btn-primary">
                    <Plus size={16} aria-hidden="true" /> Nueva venta
                </button>
            </div>

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
                        {ventas?.map(v => (
                            <tr key={v.id}>
                                <td style={{ fontFamily: 'monospace', color: 'var(--accent)', fontSize: '0.82rem' }}>
                                    {v.numero_factura}
                                </td>
                                <td style={{ fontSize: '0.82rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                                    {formatDateTime(v.fecha)}
                                </td>
                                <td style={{ fontWeight: 500 }}>{v.cliente?.nombre ?? 'Mostrador'}</td>
                                <td style={{ textTransform: 'capitalize', fontSize: '0.82rem' }}>
                                    {v.metodo_pago.replace(/_/g, ' ')}
                                </td>
                                <td style={{ fontWeight: 700 }}>{formatCOP(v.total)}</td>
                                <td><EstadoBadge estado={v.estado} /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
