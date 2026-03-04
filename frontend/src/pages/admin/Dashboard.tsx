import { TrendingUp, Package, AlertTriangle, ShieldCheck, ShoppingBag, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { mockKPIs, mockVentas, mockRepuestos } from '../../data/mockData';

function KPICard({ icon: Icon, label, value, sub, color, to }: {
    icon: React.ElementType; label: string; value: string | number; sub?: string;
    color: string; to: string;
}) {
    return (
        <Link to={to} className="card card-hover kpi-card" style={{ textDecoration: 'none' }}>
            <div className="kpi-icon" style={{ background: color + '20', color }}><Icon size={20} /></div>
            <div className="kpi-info">
                <span className="kpi-label">{label}</span>
                <span className="kpi-value">{value}</span>
                {sub && <span className="kpi-sub">{sub}</span>}
            </div>
        </Link>
    );
}

export default function Dashboard() {
    const ventasHoy = mockVentas.filter(v => v.fecha.startsWith('2026-03-03'));
    const stockCritico = mockRepuestos.filter(r => r.stock_actual < r.stock_minimo);

    return (
        <div>
            <div className="page-header">
                <h2 className="page-title">Dashboard</h2>
                <p className="page-subtitle">Resumen del día — {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>

            {/* KPIs */}
            <div className="kpi-grid">
                <KPICard icon={TrendingUp} label="Ventas hoy" value={`$${mockKPIs.ventasHoy.toLocaleString('es-CO')}`} sub={`${mockKPIs.ventasHoyCount} transacciones`} color="#FF6A00" to="/admin/ventas" />
                <KPICard icon={Package} label="Stock crítico" value={stockCritico.length} sub="productos bajo mínimo" color="#e74c3c" to="/admin/inventario" />
                <KPICard icon={ShieldCheck} label="Garantías activas" value={mockKPIs.garantiasPorVencer} sub="por vencer esta semana" color="#f39c12" to="/admin/garantias" />
                <KPICard icon={Users} label="Clientes" value={mockKPIs.clientesActivos} sub="registrados" color="#2ecc71" to="/admin/clientes" />
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
                                    <th>Total</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {mockVentas.map(v => (
                                    <tr key={v.id}>
                                        <td style={{ fontFamily: 'monospace', color: 'var(--accent)', fontSize: '0.82rem' }}>{v.numero_factura}</td>
                                        <td>{v.cliente?.nombre ?? 'Mostrador'}</td>
                                        <td style={{ fontWeight: 600 }}>${v.total.toLocaleString('es-CO')}</td>
                                        <td>
                                            <span className={`badge ${v.estado === 'pagada' ? 'badge-success' :
                                                    v.estado === 'en_credito' ? 'badge-warning' :
                                                        v.estado === 'anulada' ? 'badge-danger' : 'badge-muted'
                                                }`}>{v.estado}</span>
                                        </td>
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
                            <AlertTriangle size={16} color="#e74c3c" /> Stock crítico
                        </h4>
                        <Link to="/admin/inventario" className="btn btn-ghost btn-sm">Ver inventario</Link>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {stockCritico.length === 0 ? (
                            <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>Todo el stock está en niveles saludables.</p>
                        ) : stockCritico.map(r => (
                            <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 'var(--radius)', border: '1px solid rgba(231,76,60,0.2)' }}>
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
        @media (max-width: 900px) {
          .kpi-grid { grid-template-columns: repeat(2, 1fr); }
          .dashboard-grid { grid-template-columns: 1fr; }
        }
      `}</style>
        </div>
    );
}
