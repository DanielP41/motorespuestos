import { TrendingUp, Package, AlertTriangle, ShieldCheck, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getDashboardKPIs, DashboardKPIs } from '../../services/api';
import { useAsync } from '../../hooks/useAsync';
import { PageLoading, ErrorMessage, SkeletonRows } from '../../components/UI';
import { formatCOP, formatDateTime } from '../../utils/helpers';
import { Venta, Repuesto } from '../../types/types';

function KPICard({ icon: Icon, label, value, sub, color, to }: {
    icon: React.ElementType; label: string; value: string | number; sub?: string;
    color: string; to: string;
}) {
    return (
        <Link to={to} className="card card-hover kpi-card" style={{ textDecoration: 'none' }}>
            <div className="kpi-icon" style={{ background: color + '20', color }}>
                <Icon size={20} />
            </div>
            <div className="kpi-info">
                <span className="kpi-label">{label}</span>
                <span className="kpi-value">{value}</span>
                {sub && <span className="kpi-sub">{sub}</span>}
            </div>
        </Link>
    );
}

function VentasBadge({ estado }: { estado: Venta['estado'] }) {
    const map = {
        pagada: 'badge-success',
        en_credito: 'badge-warning',
        anulada: 'badge-danger',
        pendiente: 'badge-muted',
    } as const;
    return <span className={`badge ${map[estado] ?? 'badge-muted'}`}>{estado}</span>;
}

export default function Dashboard() {
    const { data, isLoading, isError, error, refetch } = useAsync<DashboardKPIs>(getDashboardKPIs);

    if (isLoading) return <PageLoading message="Cargando dashboard..." />;
    if (isError || !data) return <ErrorMessage message={error ?? undefined} onRetry={refetch} />;

    const today = new Date().toLocaleDateString('es-CO', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    return (
        <div>
            <div className="page-header">
                <h2 className="page-title">Dashboard</h2>
                <p className="page-subtitle">Resumen del día — {today}</p>
            </div>

            {/* KPIs */}
            <div className="kpi-grid">
                <KPICard
                    icon={TrendingUp} label="Ventas hoy"
                    value={formatCOP(data.ventasHoy)}
                    sub={`${data.ventasHoyCount} transacciones`}
                    color="#FF6A00" to="/admin/ventas"
                />
                <KPICard
                    icon={Package} label="Stock crítico"
                    value={data.stockCritico}
                    sub="productos bajo mínimo"
                    color="var(--danger)" to="/admin/inventario"
                />
                <KPICard
                    icon={ShieldCheck} label="Garantías activas"
                    value={data.garantiasPorVencer}
                    sub="por vencer esta semana"
                    color="var(--warning)" to="/admin/garantias"
                />
                <KPICard
                    icon={Users} label="Clientes"
                    value={data.clientesActivos}
                    sub="registrados"
                    color="var(--success)" to="/admin/clientes"
                />
            </div>

            <div className="dashboard-grid">
                {/* Últimas ventas */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h4>Últimas ventas</h4>
                        <Link to="/admin/ventas" className="btn btn-ghost btn-sm">Ver todas</Link>
                    </div>
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Factura</th>
                                    <th>Cliente</th>
                                    <th>Fecha</th>
                                    <th>Total</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.ventasRecientes.map(v => (
                                    <tr key={v.id}>
                                        <td style={{ fontFamily: 'monospace', color: 'var(--accent)', fontSize: '0.82rem' }}>
                                            {v.numero_factura}
                                        </td>
                                        <td>{v.cliente?.nombre ?? 'Mostrador'}</td>
                                        <td style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                                            {formatDateTime(v.fecha)}
                                        </td>
                                        <td style={{ fontWeight: 600 }}>{formatCOP(v.total)}</td>
                                        <td><VentasBadge estado={v.estado} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Stock crítico */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <AlertTriangle size={16} color="var(--danger)" /> Stock crítico
                        </h4>
                        <Link to="/admin/inventario" className="btn btn-ghost btn-sm">Ver inventario</Link>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {data.repuestosStockCritico.length === 0 ? (
                            <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
                                Todo el stock está en niveles saludables.
                            </p>
                        ) : data.repuestosStockCritico.map((r: Repuesto) => (
                            <div key={r.id} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 'var(--radius)',
                                border: '1px solid rgba(231,76,60,0.2)'
                            }}>
                                <div>
                                    <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{r.nombre}</p>
                                    <p style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>SKU: {r.sku}</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ color: 'var(--danger)', fontWeight: 700 }}>{r.stock_actual}</p>
                                    <p style={{ color: 'var(--muted)', fontSize: '0.72rem' }}>mín: {r.stock_minimo}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <style>{`
                .kpi-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 16px;
                    margin-bottom: 24px;
                }
                .kpi-card {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    padding: 18px !important;
                    text-decoration: none !important;
                }
                .kpi-icon {
                    width: 44px;
                    height: 44px;
                    border-radius: var(--radius);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                .kpi-info { display: flex; flex-direction: column; gap: 2px; }
                .kpi-label { font-size: 0.75rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; }
                .kpi-value { font-size: 1.3rem; font-weight: 800; font-family: var(--font-display); color: var(--text); }
                .kpi-sub   { font-size: 0.72rem; color: var(--muted); }
                .dashboard-grid {
                    display: grid;
                    grid-template-columns: 3fr 2fr;
                    gap: 20px;
                }
                @media (max-width: 900px) {
                    .kpi-grid { grid-template-columns: repeat(2, 1fr); }
                    .dashboard-grid { grid-template-columns: 1fr; }
                }
            `}</style>
        </div>
    );
}
