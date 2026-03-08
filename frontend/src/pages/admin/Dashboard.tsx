import { useState, useEffect } from 'react';
import { TrendingUp, Package, AlertTriangle, ShieldCheck, Users, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getDashboardKPIs } from '../../services/api';

function KPICard({ icon: Icon, label, value, sub, color, to, loading }: {
    icon: React.ElementType; label: string; value: string | number; sub?: string;
    color: string; to: string; loading?: boolean;
}) {
    return (
        <Link to={to} className="card card-hover kpi-card" style={{ textDecoration: 'none' }}>
            <div className="kpi-icon" style={{ background: color + '20', color }}><Icon size={20} /></div>
            <div className="kpi-info">
                <span className="kpi-label">{label}</span>
                {loading ? (
                    <div className="shimmer" style={{ height: 24, width: 80, margin: '4px 0' }} />
                ) : (
                    <span className="kpi-value">{value}</span>
                )}
                {sub && <span className="kpi-sub">{sub}</span>}
            </div>
        </Link>
    );
}

export default function Dashboard() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        async function loadStats() {
            setLoading(true);
            try {
                const data = await getDashboardKPIs();
                setStats(data);
            } catch (err) {
                console.error('Error loading dashboard stats:', err);
                setError('Error al cargar datos reales');
            } finally {
                setLoading(false);
            }
        }
        loadStats();
    }, []);

    // Helper for formatting price
    const formatPrice = (p: number) => `$${p.toLocaleString('es-CO')}`;

    return (
        <div>
            <div className="page-header">
                <div>
                    <h2 className="page-title">Dashboard</h2>
                    <p className="page-subtitle">Panel de Control en Tiempo Real</p>
                </div>
                <div className="text-muted" style={{ fontSize: '0.85rem' }}>
                    {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
            </div>

            {error && (
                <div className="alert alert-danger" style={{ marginBottom: 20 }}>
                    {error}. Mostrando datos locales (offline).
                </div>
            )}

            {/* KPIs */}
            <div className="kpi-grid">
                <KPICard
                    icon={TrendingUp}
                    label="Ventas hoy"
                    value={stats ? formatPrice(stats.ventasHoy) : '$0'}
                    sub={stats ? `${stats.ventasHoyCount} transacciones` : 'Cargando...'}
                    color="#FF6A00"
                    to="/admin/ventas"
                    loading={loading}
                />
                <KPICard
                    icon={Package}
                    label="Stock crítico"
                    value={stats ? stats.stockCritico : 0}
                    sub="niveles bajo mínimo"
                    color="#e74c3c"
                    to="/admin/inventario"
                    loading={loading}
                />
                <KPICard
                    icon={ShieldCheck}
                    label="Garantías"
                    value={stats ? stats.garantiasPorVencer : 0}
                    sub="por vencer pronto"
                    color="#f39c12"
                    to="/admin/garantias"
                    loading={loading}
                />
                <KPICard
                    icon={Users}
                    label="Catálogo"
                    value={stats ? stats.productosActivos : 0}
                    sub="repuestos activos"
                    color="#2ecc71"
                    to="/admin/inventario"
                    loading={loading}
                />
            </div>

            <div className="dashboard-grid">
                {/* Últimas ventas */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h4>Ventas Recientes</h4>
                        <Link to="/admin/ventas" className="btn btn-ghost btn-sm">Ver historial</Link>
                    </div>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 40 }}><Loader2 className="spinner" /></div>
                    ) : (
                        <div className="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Ref</th>
                                        <th>Fecha</th>
                                        <th>Total</th>
                                        <th>Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats?.ventasRecientes?.length > 0 ? (
                                        stats.ventasRecientes.map((v: any) => (
                                            <tr key={v.id}>
                                                <td style={{ fontFamily: 'monospace', color: 'var(--accent)', fontSize: '0.82rem' }}>{v.numero_factura}</td>
                                                <td style={{ fontSize: '0.85rem' }}>{new Date(v.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}hs</td>
                                                <td style={{ fontWeight: 600 }}>{formatPrice(v.total)}</td>
                                                <td>
                                                    <span className="badge badge-success">{v.estado}</span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan={4} style={{ textAlign: 'center', padding: 20, color: 'var(--muted)' }}>Sin ventas hoy</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Stock crítico detail */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <AlertTriangle size={16} color="#e74c3c" /> Alertas de Inventario
                        </h4>
                        <Link to="/admin/inventario" className="btn btn-ghost btn-sm">Gestionar</Link>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {!stats || stats.repuestosStockCritico.length === 0 ? (
                            <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>Todo el stock está en niveles saludables.</p>
                        ) : stats.repuestosStockCritico.map((r: any) => (
                            <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 'var(--radius)', border: '1px solid rgba(231,76,60,0.1)' }}>
                                <div>
                                    <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{r.nombre}</p>
                                    <p style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>SKU: {r.sku}</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ color: '#e74c3c', fontWeight: 700 }}>{r.stock_actual}</p>
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
                .kpi-info {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }
                .kpi-label { font-size: 0.75rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; }
                .kpi-value { font-size: 1.3rem; font-weight: 800; font-family: var(--font-display); color: var(--text); }
                .kpi-sub   { font-size: 0.72rem; color: var(--muted); }
                .dashboard-grid {
                    display: grid;
                    grid-template-columns: 3fr 2fr;
                    gap: 20px;
                }
                .shimmer {
                    background: linear-gradient(90deg, var(--surface-2) 25%, var(--surface-3) 50%, var(--surface-2) 75%);
                    background-size: 200% 100%;
                    animation: shimmer 1.5s infinite;
                    border-radius: 4px;
                }
                @keyframes shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
                @media (max-width: 900px) {
                    .kpi-grid { grid-template-columns: repeat(2, 1fr); }
                    .dashboard-grid { grid-template-columns: 1fr; }
                }
            `}</style>
        </div>
    );
}
