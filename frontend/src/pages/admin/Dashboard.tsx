import { useState, useEffect } from 'react';
import { TrendingUp, Package, AlertTriangle, ShieldCheck, ShoppingBag, Loader2, BarChart3, PieChart, Coins } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getDashboardKPIs } from '../../services/api';

function KPICard({ icon: Icon, label, value, sub, color, to, loading }: {
    icon: React.ElementType; label: string; value: string | number; sub?: string;
    color: string; to: string; loading?: boolean;
}) {
    return (
        <Link to={to} className="card card-hover kpi-card" style={{ textDecoration: 'none' }}>
            <div className="kpi-icon" style={{ background: color + '15', color }}><Icon size={20} /></div>
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

// Custom CSS Chart Component for Sales Trend
function SalesChart({ data }: { data: any[] }) {
    const max = Math.max(...data.map(d => d.monto), 100);
    return (
        <div className="chart-container">
            <div className="chart-bars">
                {data.map((d, i) => (
                    <div key={i} className="chart-bar-wrapper">
                        <div
                            className="chart-bar"
                            style={{ height: `${(d.monto / max) * 100}%` }}
                            title={`$${d.monto.toLocaleString()}`}
                        />
                        <span className="chart-label">{d.fecha}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Horizontal Category Distribution Chart
function CategoryChart({ data }: { data: any[] }) {
    const max = Math.max(...data.map(d => d.cantidad), 1);
    return (
        <div className="category-chart">
            {data.slice(0, 6).map((cat, i) => (
                <div key={i} className="cat-row">
                    <div className="cat-label">{cat.nombre}</div>
                    <div className="cat-bar-bg">
                        <div className="cat-bar-fill" style={{ width: `${(cat.cantidad / max) * 100}%` }} />
                    </div>
                    <div className="cat-value">{cat.cantidad}</div>
                </div>
            ))}
        </div>
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
                setError('Error al conectar con el servidor');
            } finally {
                setLoading(false);
            }
        }
        loadStats();
    }, []);

    const formatPrice = (p: number) => `$${p.toLocaleString('es-CO')}`;

    return (
        <div className="dashboard-container">
            <div className="page-header">
                <div>
                    <h2 className="page-title">Panel de Control</h2>
                    <p className="page-subtitle">Gestión estratégica de Moto-Repuestos</p>
                </div>
                <div className="header-date">
                    {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
            </div>

            {error && <div className="alert alert-danger mb-4">{error}</div>}

            <div className="kpi-grid">
                <KPICard
                    icon={TrendingUp}
                    label="Ventas hoy"
                    value={stats ? formatPrice(stats.ventasHoy) : '$0'}
                    sub={stats ? `${stats.ventasHoyCount} pedidos` : '—'}
                    color="#FF6A00"
                    to="/admin/ventas"
                    loading={loading}
                />
                <KPICard
                    icon={Coins}
                    label="Ingresos (30d)"
                    value={stats ? formatPrice(stats.ingresosMensuales) : '$0'}
                    sub={stats ? `Utilidad: ${formatPrice(stats.utilidadMensual)}` : '—'}
                    color="#f1c40f"
                    to="/admin/ventas"
                    loading={loading}
                />
                <KPICard
                    icon={Package}
                    label="Stock crítico"
                    value={stats ? stats.stockCritico : 0}
                    sub="niveles bajos"
                    color="#e74c3c"
                    to="/admin/inventario"
                    loading={loading}
                />
                <KPICard
                    icon={ShieldCheck}
                    label="Garantías"
                    value={stats ? stats.garantiasPorVencer : 0}
                    sub="activas esta semana"
                    color="#3498db"
                    to="/admin/garantias"
                    loading={loading}
                />
                <KPICard
                    icon={ShoppingBag}
                    label="Catálogo"
                    value={stats ? stats.productosActivos : 0}
                    sub="ítems disponibles"
                    color="#2ecc71"
                    to="/admin/inventario"
                    loading={loading}
                />
            </div>

            <div className="dashboard-main-grid">
                {/* Visual Analytics */}
                <div className="span-2">
                    <div className="card">
                        <div className="card-header">
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <BarChart3 size={18} color="var(--accent)" /> Tendencia de Ventas (7d)
                            </h4>
                            <span className="text-muted small">Monto total diario</span>
                        </div>
                        {loading ? <div className="skeleton-chart" /> : <SalesChart data={stats?.ventasTrend || []} />}
                    </div>
                </div>

                {/* Category distribution */}
                <div className="card">
                    <div className="card-header">
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <PieChart size={18} color="#2ecc71" /> Distribución por Categoría
                        </h4>
                    </div>
                    {loading ? <div className="skeleton-list" /> : <CategoryChart data={stats?.distribucionCategorias || []} />}
                </div>

                {/* Top Products */}
                <div className="card">
                    <div className="card-header">
                        <h4>Top Vendidos</h4>
                        <span className="badge badge-accent">Volumen</span>
                    </div>
                    <div className="list-items">
                        {loading ? [1, 2, 3].map(i => <div key={i} className="shimmer mb-2" style={{ height: 50 }} />) :
                            stats?.topProductos?.map((p: any, i: number) => (
                                <div key={i} className="list-item">
                                    <div className="item-rank">{i + 1}</div>
                                    <div className="item-info">
                                        <p className="item-name">{p.nombre}</p>
                                        <p className="item-sku">{p.sku}</p>
                                    </div>
                                    <div className="item-stat">
                                        <span className="stat-value">{p.vendidos}</span>
                                        <span className="stat-label">uds</span>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>

                {/* Profitability Winners */}
                <div className="card">
                    <div className="card-header">
                        <h4>Más Rentables</h4>
                        <span className="badge" style={{ background: 'rgba(241, 196, 15, 0.1)', color: '#f1c40f' }}>Margen</span>
                    </div>
                    <div className="list-items">
                        {loading ? [1, 2, 3].map(i => <div key={i} className="shimmer mb-2" style={{ height: 50 }} />) :
                            stats?.topRentables?.map((p: any, i: number) => (
                                <div key={i} className="list-item">
                                    <div className="item-rank" style={{ color: '#f1c40f' }}>★</div>
                                    <div className="item-info">
                                        <p className="item-name">{p.nombre}</p>
                                        <p className="item-sku">{p.margen.toFixed(1)}% margen</p>
                                    </div>
                                    <div className="item-stat">
                                        <span className="stat-value" style={{ color: '#2ecc71' }}>+{formatPrice(p.utilidad).replace('$', '')}</span>
                                        <span className="stat-label">utilidad</span>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>

                {/* Inventory Alerts */}
                <div className="card">
                    <div className="card-header">
                        <h4 style={{ color: '#e74c3c', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <AlertTriangle size={18} /> Alertas de Stock
                        </h4>
                        <Link to="/admin/inventario" className="text-link small">Reponer</Link>
                    </div>
                    <div className="list-items">
                        {loading ? [1, 2, 3].map(i => <div key={i} className="shimmer mb-2" style={{ height: 50 }} />) :
                            stats?.repuestosStockCritico?.length > 0 ? stats.repuestosStockCritico.map((r: any) => (
                                <div key={r.id} className="alert-item">
                                    <div className="alert-info">
                                        <p className="alert-name">{r.nombre}</p>
                                        <div className="alert-progress-bg">
                                            <div className="alert-progress-fill" style={{ width: `${(r.stock_actual / r.stock_minimo) * 100}%` }} />
                                        </div>
                                    </div>
                                    <div className="alert-qty">
                                        <span className="qty-current">{r.stock_actual}</span>
                                        <span className="qty-sep">/</span>
                                        <span className="qty-min">{r.stock_minimo}</span>
                                    </div>
                                </div>
                            )) : <p className="empty-state">No hay alertas críticas.</p>}
                    </div>
                </div>

                {/* Recent Sales Table */}
                <div className="span-3 card">
                    <div className="card-header">
                        <h4>Ventas Recientes</h4>
                        <Link to="/admin/ventas" className="btn btn-ghost btn-xs">Historial completo</Link>
                    </div>
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Factura</th>
                                    <th>Fecha/Hora</th>
                                    <th>Monto</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats?.ventasRecientes?.map((v: any) => (
                                    <tr key={v.id}>
                                        <td className="font-mono text-accent">{v.numero_factura}</td>
                                        <td>{new Date(v.fecha).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}hs</td>
                                        <td className="font-bold">{formatPrice(v.total)}</td>
                                        <td><span className="badge badge-success-alt">{v.estado}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <style>{`
                .dashboard-container { animation: fadeIn 0.4s ease-out; }
                .header-date { color: var(--muted); font-size: 0.9rem; font-weight: 500; }
                .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 24px; }
                .kpi-card { display: flex; align-items: center; gap: 16px; padding: 20px !important; }
                .kpi-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
                .kpi-info { display: flex; flex-direction: column; gap: 2px; }
                .kpi-label { font-size: 0.72rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
                .kpi-value { font-size: 1.5rem; font-weight: 800; color: var(--text); line-height: 1.2; }
                .kpi-sub { font-size: 0.75rem; color: var(--muted); }

                .dashboard-main-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
                .span-2 { grid-column: span 2; }
                .span-3 { grid-column: span 3; }
                .card-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 20px; }
                .card-header h4 { margin: 0; font-family: var(--font-display); font-weight: 700; }

                /* Chart Styles */
                .chart-container { height: 200px; display: flex; align-items: flex-end; padding: 20px 10px 10px; border-bottom: 1px solid var(--surface-3); }
                .chart-bars { display: flex; justify-content: space-between; align-items: flex-end; width: 100%; height: 100%; gap: 12px; }
                .chart-bar-wrapper { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; justify-content: flex-end; }
                .chart-bar { width: 100%; min-height: 4px; background: linear-gradient(to top, var(--accent), #ff9a44); border-radius: 4px 4px 0 0; transition: all 0.3s ease; cursor: pointer; }
                .chart-bar:hover { filter: brightness(1.2); transform: scaleX(1.1); }
                .chart-label { font-size: 0.65rem; color: var(--muted); margin-top: 8px; font-weight: 600; }

                /* Category Chart */
                .category-chart { display: flex; flex-direction: column; gap: 14px; }
                .cat-row { display: flex; align-items: center; gap: 12px; }
                .cat-label { width: 80px; font-size: 0.75rem; color: var(--muted); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .cat-bar-bg { flex: 1; height: 8px; background: var(--surface-3); border-radius: 4px; overflow: hidden; }
                .cat-bar-fill { height: 100%; background: #2ecc71; border-radius: 4px; transition: width 0.5s ease-out; }
                .cat-value { width: 20px; font-size: 0.75rem; font-weight: 700; text-align: right; color: var(--text); }

                /* List Styles */
                .list-items { display: flex; flex-direction: column; gap: 12px; }
                .list-item { display: flex; align-items: center; gap: 12px; padding: 10px; background: var(--surface-2); border-radius: 10px; }
                .item-rank { width: 24px; height: 24px; border-radius: 50%; background: var(--surface-3); display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 800; color: var(--muted); }
                .item-info { flex: 1; }
                .item-name { font-size: 0.85rem; font-weight: 600; margin: 0; line-height: 1.2; }
                .item-sku { font-size: 0.7rem; color: var(--muted); margin: 0; }
                .item-stat { text-align: right; }
                .stat-value { display: block; font-weight: 800; color: var(--accent); line-height: 1; }
                .stat-label { font-size: 0.6rem; color: var(--muted); }

                /* Alert Items */
                .alert-item { display: flex; align-items: center; gap: 12px; padding: 10px; border: 1px solid rgba(231,76,60,0.1); border-radius: 10px; }
                .alert-info { flex: 1; }
                .alert-name { font-size: 0.82rem; font-weight: 600; margin: 0 0 6px; }
                .alert-progress-bg { height: 4px; background: var(--surface-3); border-radius: 2px; overflow: hidden; }
                .alert-progress-fill { height: 100%; background: #e74c3c; border-radius: 2px; }
                .alert-qty { text-align: right; font-family: monospace; }
                .qty-current { font-weight: 900; color: #e74c3c; }
                .qty-sep { color: var(--muted); margin: 0 2px; }
                .qty-min { color: var(--muted); font-size: 0.8rem; }

                .badge-success-alt { background: rgba(46, 204, 113, 0.1); color: #2ecc71; border: 1px solid rgba(46, 204, 113, 0.2); }
                .skeleton-chart { height: 200px; background: var(--surface-2); border-radius: var(--radius); }
                .skeleton-list { height: 150px; background: var(--surface-2); border-radius: var(--radius); }
                .empty-state { text-align: center; color: var(--muted); padding: 20px; font-size: 0.85rem; }

                @media (max-width: 1100px) {
                    .dashboard-main-grid { grid-template-columns: 1fr 1fr; }
                    .span-3 { grid-column: span 2; }
                }
                @media (max-width: 800px) {
                    .kpi-grid { grid-template-columns: repeat(2, 1fr); }
                    .dashboard-main-grid { grid-template-columns: 1fr; }
                    .span-3 { grid-column: span 1; }
                }
            `}</style>
        </div>
    );
}
