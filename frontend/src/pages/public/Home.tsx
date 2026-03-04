import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Shield, Truck, Star, ChevronRight } from 'lucide-react';
import { mockCategorias, mockRepuestos, mockMarcas } from '../../data/mockData';
import './Home.css';

const rootCats = mockCategorias.filter(c => !c.padre_id);
const featuredProducts = mockRepuestos.slice(0, 4);

const stats = [
    { value: '5,000+', label: 'Repuestos disponibles' },
    { value: '10+', label: 'Marcas' },
    { value: '98%', label: 'Satisfacción' },
    { value: '24h', label: 'Envío local' },
];

const catIcons: Record<string, string> = {
    motor: '⚙️', transmision: '🔗', frenos: '🛑',
    suspension: '🏍️', electrico: '⚡', carroceria: '🔧',
    'lubricantes-fluidos': '🛢️', accesorios: '🎯',
};

export default function Home() {
    return (
        <div className="home">
            {/* ── HERO ── */}
            <section className="hero">
                <div className="hero-bg">
                    <div className="hero-glow" />
                </div>
                <div className="container hero-inner">
                    <div className="hero-content">
                        <div className="hero-badge">
                            <Zap size={12} />
                            <span>Envío en 24 horas</span>
                        </div>
                        <h1>Repuestos de moto<br /><span className="text-accent">originales y alternativos</span></h1>
                        <p>
                            Todo lo que tu moto necesita, en un solo lugar. Honda, Yamaha,
                            Suzuki, Bajaj, Kawasaki y más marcas con garantía garantizada.
                        </p>
                        <div className="hero-actions">
                            <Link to="/catalogo" className="btn btn-primary btn-lg">
                                Ver catálogo <ArrowRight size={18} />
                            </Link>
                            <Link to="/contacto" className="btn btn-secondary btn-lg">
                                Contactar
                            </Link>
                        </div>
                    </div>
                    <div className="hero-visual">
                        <div className="hero-circle">
                            <span>🏍️</span>
                        </div>
                    </div>
                </div>

                {/* Stats bar */}
                <div className="stats-bar">
                    <div className="container stats-inner">
                        {stats.map(s => (
                            <div key={s.label} className="stat-item">
                                <span className="stat-value">{s.value}</span>
                                <span className="stat-label">{s.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CATEGORÍAS ── */}
            <section className="section">
                <div className="container">
                    <div className="section-title">
                        <div className="accent-line" />
                        <h2>Categorías</h2>
                        <p className="text-muted">Encontrá lo que buscás por tipo de repuesto</p>
                    </div>
                    <div className="categories-grid">
                        {rootCats.map(cat => (
                            <Link key={cat.id} to={`/catalogo?categoria=${cat.slug}`} className="cat-card">
                                <span className="cat-icon">{catIcons[cat.slug] || '🔧'}</span>
                                <span className="cat-name">{cat.nombre}</span>
                                <ChevronRight size={14} className="cat-arrow" />
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── PRODUCTOS DESTACADOS ── */}
            <section className="section" style={{ paddingTop: 0 }}>
                <div className="container">
                    <div className="section-title">
                        <div className="accent-line" />
                        <h2>Más vendidos</h2>
                        <p className="text-muted">Los repuestos que más buscan nuestros clientes</p>
                    </div>
                    <div className="grid-products">
                        {featuredProducts.map(rep => (
                            <Link key={rep.id} to={`/catalogo/${rep.id}`} className="product-card card card-hover">
                                <div className="product-img-wrap">
                                    <img src={rep.imagenes?.[0]?.url} alt={rep.nombre} className="product-img" loading="lazy" />
                                    {rep.es_original && <span className="badge badge-original product-badge">Original</span>}
                                </div>
                                <div className="product-info">
                                    <span className="product-category">{rep.categoria?.nombre}</span>
                                    <h4 className="product-name">{rep.nombre}</h4>
                                    <div className="product-footer">
                                        <span className="product-price">${rep.precio_venta.toLocaleString('es-CO')}</span>
                                        <span className="product-stock">
                                            {rep.stock_actual > 0
                                                ? `${rep.stock_actual} en stock`
                                                : <span className="text-danger">Agotado</span>}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                    <div style={{ textAlign: 'center', marginTop: 32 }}>
                        <Link to="/catalogo" className="btn btn-secondary btn-lg">
                            Ver todos los repuestos <ArrowRight size={18} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── MARCAS ── */}
            <section className="section brands-section">
                <div className="container">
                    <div className="section-title" style={{ alignItems: 'center', textAlign: 'center' }}>
                        <div className="accent-line" style={{ margin: '0 auto' }} />
                        <h2>Marcas que manejamos</h2>
                    </div>
                    <div className="brands-row">
                        {mockMarcas.map(m => (
                            <Link key={m.id} to={`/catalogo?marca=${m.id}`} className="brand-chip">
                                {m.nombre}
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── WHY US ── */}
            <section className="section">
                <div className="container">
                    <div className="why-grid">
                        <div className="why-card">
                            <Zap size={28} className="why-icon" />
                            <h4>Envío rápido</h4>
                            <p className="text-muted">Despachamos en 24 horas. Envíos a todo el país con seguimiento en tiempo real.</p>
                        </div>
                        <div className="why-card">
                            <Shield size={28} className="why-icon" />
                            <h4>Garantía asegurada</h4>
                            <p className="text-muted">90 días de garantía en todos nuestros repuestos originales y alternativos.</p>
                        </div>
                        <div className="why-card">
                            <Truck size={28} className="why-icon" />
                            <h4>Distribuidores oficiales</h4>
                            <p className="text-muted">Trabajamos directamente con distribuidores oficiales de las principales marcas.</p>
                        </div>
                        <div className="why-card">
                            <Star size={28} className="why-icon" />
                            <h4>Atención experta</h4>
                            <p className="text-muted">Nuestros asesores conocen cada modelo. Te ayudamos a elegir el repuesto correcto.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── CTA ── */}
            <section className="cta-section">
                <div className="container cta-inner">
                    <div>
                        <h2>¿No encontrás lo que buscás?</h2>
                        <p className="text-muted">Contanos el modelo de tu moto y te conseguimos el repuesto.</p>
                    </div>
                    <Link to="/contacto" className="btn btn-primary btn-lg">
                        Hacer una consulta <ArrowRight size={18} />
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="site-footer">
                <div className="container footer-inner">
                    <div className="footer-logo">
                        <Zap size={18} className="text-accent" />
                        <span>MOTO<span className="text-accent">REPUESTOS</span></span>
                    </div>
                    <p className="text-muted" style={{ fontSize: '0.82rem' }}>
                        © {new Date().getFullYear()} Moto-Repuestos. Todos los derechos reservados.
                    </p>
                    <div className="footer-links">
                        <Link to="/catalogo">Catálogo</Link>
                        <Link to="/contacto">Contacto</Link>
                        <Link to="/admin">Admin</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
