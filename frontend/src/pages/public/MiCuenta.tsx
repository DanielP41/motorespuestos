import { useState } from 'react';
import { User, ShoppingBag, Shield, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAsync } from '../../hooks/useAsync';
import { getMiPerfil, getMisPedidos, getMisGarantias } from '../../services/api';
import { formatCOP } from '../../utils/helpers';
import './MiCuenta.css';

type Tab = 'perfil' | 'pedidos' | 'garantias';

const ESTADO_VENTA_LABEL: Record<string, string> = {
    pendiente: 'Pendiente',
    pagada: 'Pagada',
    anulada: 'Anulada',
    en_credito: 'En crédito',
};

const ESTADO_GARANTIA_LABEL: Record<string, string> = {
    abierta: 'Abierta',
    en_proceso: 'En proceso',
    resuelta: 'Resuelta',
    rechazada: 'Rechazada',
};

const ESTADO_COLOR: Record<string, string> = {
    pendiente: 'badge-warning',
    pagada: 'badge-success',
    anulada: 'badge-danger',
    en_credito: 'badge-info',
    abierta: 'badge-warning',
    en_proceso: 'badge-info',
    resuelta: 'badge-success',
    rechazada: 'badge-danger',
};

export default function MiCuenta() {
    const { user, logout } = useAuth();
    const [tab, setTab] = useState<Tab>('perfil');

    const { data: perfil } = useAsync(getMiPerfil);
    const { data: pedidos, isLoading: loadingPedidos } = useAsync(getMisPedidos);
    const { data: garantias, isLoading: loadingGarantias } = useAsync(getMisGarantias);

    return (
        <div className="mi-cuenta">
            <div className="container">
                <div className="mi-cuenta-header">
                    <div className="mi-cuenta-avatar">
                        {user?.nombre_completo?.[0]?.toUpperCase() ?? 'C'}
                    </div>
                    <div>
                        <h1>{perfil?.nombre ?? user?.nombre_completo ?? 'Mi cuenta'}</h1>
                        <p className="text-muted">{perfil?.email ?? user?.email}</p>
                    </div>
                    <button className="btn btn-ghost btn-sm mi-cuenta-logout" onClick={logout}>
                        <LogOut size={16} /> Cerrar sesión
                    </button>
                </div>

                <div className="mi-cuenta-tabs">
                    <button className={`mi-cuenta-tab${tab === 'perfil' ? ' active' : ''}`} onClick={() => setTab('perfil')}>
                        <User size={16} /> Perfil
                    </button>
                    <button className={`mi-cuenta-tab${tab === 'pedidos' ? ' active' : ''}`} onClick={() => setTab('pedidos')}>
                        <ShoppingBag size={16} /> Mis pedidos
                    </button>
                    <button className={`mi-cuenta-tab${tab === 'garantias' ? ' active' : ''}`} onClick={() => setTab('garantias')}>
                        <Shield size={16} /> Mis garantías
                    </button>
                </div>

                <div className="mi-cuenta-body">
                    {/* ── PERFIL ── */}
                    {tab === 'perfil' && perfil && (
                        <div className="mi-cuenta-section">
                            <h3>Datos personales</h3>
                            <div className="perfil-grid">
                                <div className="perfil-field">
                                    <span className="perfil-label">Nombre</span>
                                    <span className="perfil-value">{perfil.nombre}</span>
                                </div>
                                <div className="perfil-field">
                                    <span className="perfil-label">Email</span>
                                    <span className="perfil-value">{perfil.email}</span>
                                </div>
                                <div className="perfil-field">
                                    <span className="perfil-label">Teléfono</span>
                                    <span className="perfil-value">{perfil.telefono ?? '—'}</span>
                                </div>
                                <div className="perfil-field">
                                    <span className="perfil-label">Documento</span>
                                    <span className="perfil-value">{perfil.documento_tipo} {perfil.documento_nro}</span>
                                </div>
                                <div className="perfil-field">
                                    <span className="perfil-label">Dirección</span>
                                    <span className="perfil-value">{perfil.direccion ?? '—'}</span>
                                </div>
                                <div className="perfil-field">
                                    <span className="perfil-label">Cliente desde</span>
                                    <span className="perfil-value">{new Date(perfil.creado_en).toLocaleDateString('es-AR')}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── PEDIDOS ── */}
                    {tab === 'pedidos' && (
                        <div className="mi-cuenta-section">
                            <h3>Historial de pedidos</h3>
                            {loadingPedidos ? (
                                <p className="text-muted">Cargando...</p>
                            ) : !pedidos?.length ? (
                                <div className="empty-state">
                                    <ShoppingBag size={40} />
                                    <p>Todavía no tenés pedidos registrados.</p>
                                </div>
                            ) : (
                                <div className="pedidos-list">
                                    {pedidos.map((p: any) => (
                                        <div key={p.id} className="pedido-card">
                                            <div className="pedido-card-header">
                                                <span className="pedido-factura">#{p.numero_factura}</span>
                                                <span className={`badge ${ESTADO_COLOR[p.estado]}`}>
                                                    {ESTADO_VENTA_LABEL[p.estado] ?? p.estado}
                                                </span>
                                            </div>
                                            <div className="pedido-card-meta">
                                                <span>{new Date(p.fecha).toLocaleDateString('es-AR')}</span>
                                                <span className="pedido-total">{formatCOP(p.total)}</span>
                                            </div>
                                            {p.items?.length > 0 && (
                                                <ul className="pedido-items">
                                                    {p.items.map((item: any) => (
                                                        <li key={item.id}>
                                                            {item.cantidad}x — {formatCOP(item.precio_unitario)}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── GARANTÍAS ── */}
                    {tab === 'garantias' && (
                        <div className="mi-cuenta-section">
                            <h3>Mis garantías</h3>
                            {loadingGarantias ? (
                                <p className="text-muted">Cargando...</p>
                            ) : !garantias?.length ? (
                                <div className="empty-state">
                                    <Shield size={40} />
                                    <p>No tenés garantías registradas.</p>
                                </div>
                            ) : (
                                <div className="pedidos-list">
                                    {garantias.map((g: any) => (
                                        <div key={g.id} className="pedido-card">
                                            <div className="pedido-card-header">
                                                <span className="pedido-factura">Garantía #{g.id}</span>
                                                <span className={`badge ${ESTADO_COLOR[g.estado]}`}>
                                                    {ESTADO_GARANTIA_LABEL[g.estado] ?? g.estado}
                                                </span>
                                            </div>
                                            <div className="pedido-card-meta">
                                                <span>Vence: {new Date(g.fecha_vencimiento).toLocaleDateString('es-AR')}</span>
                                            </div>
                                            <p className="garantia-falla">{g.descripcion_falla}</p>
                                            {g.notas_resolucion && (
                                                <p className="garantia-resolucion">Resolución: {g.notas_resolucion}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
