import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Shield, Truck, Star, ChevronRight } from 'lucide-react';
import { getCategoriasRaiz, getMarcas, getRepuestosFeatured } from '../../services/api';
import { useAsync } from '../../hooks/useAsync';
import { SkeletonCard } from '../../components/UI';
import { formatCOP } from '../../utils/helpers';
import heroHelmet from '../../assets/hero-helmet.jpg';
import brandLS2 from '../../assets/brands/ls2.jpg';
import brandOnguard from '../../assets/brands/onguard.jpg';
import brandRiffel from '../../assets/brands/riffel.jpg';
import brandMichelin from '../../assets/brands/michelin.png';
import brandHonda from '../../assets/brands/honda.png';
import brandYamaha from '../../assets/brands/yamaha.png';
import brandPirelli from '../../assets/brands/pirelli.png';
import brandCastrol from '../../assets/brands/castrol.png';
import brandKawasaki from '../../assets/brands/kawasaki.png';
import brandSuzuki from '../../assets/brands/suzuki.png';
import brandDucati from '../../assets/brands/ducati.png';
import brandKtm from '../../assets/brands/ktm.png';
import brandBmw from '../../assets/brands/bmw.png';
import brandBajaj from '../../assets/brands/bajaj.png';
import brandTriumph from '../../assets/brands/triumph.png';
import brandHarley from '../../assets/brands/harley.png';
import catMotor from '../../assets/categories/motor.png';
import catTransmision from '../../assets/categories/transmision.png';
import catFrenos from '../../assets/categories/frenos.png';
import catSuspension from '../../assets/categories/suspension.png';
import catElectrico from '../../assets/categories/electrico.png';
import catCarroceria from '../../assets/categories/carroceria.png';
import catLubricantes from '../../assets/categories/lubricantes.png';
import catAccesorios from '../../assets/categories/accesorios.png';
import logoFooter from '../../assets/logo-footer.png';
import slide1 from '../../assets/slides/slide1.png';
import slide2 from '../../assets/slides/slide2.png';
import slide3 from '../../assets/slides/slide3.png';
import slide4 from '../../assets/slides/slide4.png';
import slide5 from '../../assets/slides/slide5.png';
import './Home.css';

const catImages: Record<string, string> = {
    motor: catMotor,
    transmision: catTransmision,
    frenos: catFrenos,
    suspension: catSuspension,
    electrico: catElectrico,
    carroceria: catCarroceria,
    'lubricantes-fluidos': catLubricantes,
    accesorios: catAccesorios,
};


const heroSlides = [
    { src: heroHelmet, alt: 'Casco de moto' },
    { src: slide2, alt: 'Guantes de moto' },
    { src: slide3, alt: 'Chaqueta de moto' },
    { src: slide4, alt: 'Botas de moto' },
    { src: slide5, alt: 'Gafas de moto' },
];

const ANNOUNCEMENTS = [
    "🚚 ENVIO GRATIS | SUPERANDO $240.000",
    "6 CSI con Go Cuotas | Sin mínimo",
    "Entregas en el día en CABA y AMBA"
];

function AnnouncementBar() {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setIndex(prev => (prev + 1) % ANNOUNCEMENTS.length);
        }, 4000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="announcement-bar">
            <div className="announcement-track" style={{ transform: `translateY(-${index * 32}px)` }}>
                {ANNOUNCEMENTS.map((msg, i) => (
                    <div key={i} className="announcement-item">
                        {msg}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function Home() {
    const { data: rootCats } = useAsync(getCategoriasRaiz);
    const { data: marcas } = useAsync(getMarcas);
    const { data: featured, isLoading: featuredLoading } = useAsync(getRepuestosFeatured);
    const [slideIdx, setSlideIdx] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setSlideIdx(i => (i + 1) % heroSlides.length);
        }, 3000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const observerOptions = {
            threshold: 0.15,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('reveal-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        const revealedElements = document.querySelectorAll('.reveal');
        revealedElements.forEach(el => observer.observe(el));

        return () => observer.disconnect();
    }, []);

    return (
        <div className="home">
            <AnnouncementBar />
            {/* ── HERO ── */}
            <section className="hero">
                <div className="hero-bg">
                    <div className="hero-glow" />
                </div>
                <div className="container hero-inner">
                    <div className="hero-content">
                        <h1>Repuestos de moto<br /><span className="text-accent">originales y alternativos</span></h1>
                        <p>
                            Todo lo que tu moto necesita, en un solo lugar. Honda, Yamaha,
                            Suzuki, Bajaj, Kawasaki y más marcas con garantía garantizada.
                        </p>
                        <div className="hero-actions">
                            <Link to="/catalogo" className="btn btn-primary btn-lg">
                                Ver catálogo <ArrowRight size={18} aria-hidden="true" />
                            </Link>
                            <Link to="/contacto" className="btn btn-secondary btn-lg">
                                Contactar
                            </Link>
                        </div>
                    </div>
                    <div className="hero-visual" aria-label="Accesorios de moto">
                        <div className="hero-slideshow">
                            {heroSlides.map((s, i) => (
                                <img
                                    key={i}
                                    src={s.src}
                                    alt={s.alt}
                                    className={`hero-slide-img${i === slideIdx ? ' active' : ''}`}
                                />
                            ))}
                            <div className="slide-dots">
                                {heroSlides.map((_, i) => (
                                    <button
                                        key={i}
                                        className={`slide-dot${i === slideIdx ? ' active' : ''}`}
                                        onClick={() => setSlideIdx(i)}
                                        aria-label={`Slide ${i + 1}`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

            </section>

            {/* ── CATEGORÍAS ── */}
            <section className="section reveal">
                <div className="container">
                    <div className="section-title">
                        <div className="accent-line" />
                        <h2>Categorías</h2>
                        <p className="text-muted">Encontrá lo que buscás por tipo de repuesto</p>
                    </div>
                    <div className="categories-grid">
                        {rootCats?.map(cat => (
                            <Link key={cat.id} to={`/catalogo?categoria=${cat.slug}`} className="cat-card">
                                <div className="cat-img-wrap">
                                    <img src={catImages[cat.slug] || catMotor} alt={cat.nombre} className="cat-img" />
                                </div>
                                <span className="cat-name">{cat.nombre}</span>
                                <ChevronRight size={14} className="cat-arrow" aria-hidden="true" />
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── PRODUCTOS DESTACADOS ── */}
            <section className="section reveal" style={{ paddingTop: 0 }}>
                <div className="container">
                    <div className="section-title">
                        <div className="accent-line" />
                        <h2>Más vendidos</h2>
                        <p className="text-muted">Los repuestos que más buscan nuestros clientes</p>
                    </div>
                    <div className="grid-products">
                        {featuredLoading
                            ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
                            : featured?.map(rep => (
                                <Link key={rep.id} to={`/catalogo/${rep.id}`} className="product-card card card-hover">
                                    <div className="product-img-wrap">
                                        <img
                                            src={rep.imagenes?.[0]?.url}
                                            alt={rep.nombre}
                                            className="product-img"
                                            loading="lazy"
                                        />
                                        {rep.es_original && (
                                            <span className="badge badge-original product-badge">Original</span>
                                        )}
                                    </div>
                                    <div className="product-info">
                                        <span className="product-category">{rep.categoria?.nombre}</span>
                                        <h4 className="product-name">{rep.nombre}</h4>
                                        <div className="product-footer">
                                            <span className="product-price">{formatCOP(rep.precio_venta)}</span>
                                            <span className="product-stock">
                                                {rep.stock_actual > 0
                                                    ? `${rep.stock_actual} en stock`
                                                    : <span className="text-danger">Agotado</span>
                                                }
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        }
                    </div>
                    <div style={{ textAlign: 'center', marginTop: 32 }}>
                        <Link to="/catalogo" className="btn btn-secondary btn-lg">
                            Ver todos los repuestos <ArrowRight size={18} aria-hidden="true" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── MARCAS ── */}
            <section className="section brands-section reveal">
                <div className="container">
                    <div className="section-title" style={{ alignItems: 'center', textAlign: 'center' }}>
                        <div className="accent-line" style={{ margin: '0 auto' }} />
                        <h2>Nuestras marcas de confianza</h2>
                    </div>
                    <div className="brands-logo-row">
                        <div className="brand-logo-item"><img src={brandLS2} alt="LS2 Helmets" /></div>
                        <div className="brand-logo-item"><img src={brandOnguard} alt="OnGuard" /></div>
                        <div className="brand-logo-item"><img src={brandRiffel} alt="Riffel" /></div>
                        <div className="brand-logo-item"><img src={brandMichelin} alt="Michelin" /></div>
                        <div className="brand-logo-item"><img src={brandHonda} alt="Honda" /></div>
                        <div className="brand-logo-item"><img src={brandYamaha} alt="Yamaha" /></div>
                        <div className="brand-logo-item"><img src={brandPirelli} alt="Pirelli" /></div>
                        <div className="brand-logo-item"><img src={brandCastrol} alt="Castrol" /></div>
                        <div className="brand-logo-item"><img src={brandKawasaki} alt="Kawasaki" /></div>
                        <div className="brand-logo-item"><img src={brandSuzuki} alt="Suzuki" /></div>
                        <div className="brand-logo-item"><img src={brandDucati} alt="Ducati" /></div>
                        <div className="brand-logo-item"><img src={brandKtm} alt="KTM" /></div>
                        <div className="brand-logo-item"><img src={brandBmw} alt="BMW" /></div>
                        <div className="brand-logo-item"><img src={brandBajaj} alt="Bajaj" /></div>
                        <div className="brand-logo-item"><img src={brandTriumph} alt="Triumph" /></div>
                        <div className="brand-logo-item"><img src={brandHarley} alt="Harley" /></div>
                    </div>
                </div>
            </section>

            {/* ── WHY US ── */}
            <section className="section reveal">
                <div className="container">
                    <div className="why-grid">
                        <div className="why-card">
                            <Zap size={28} className="why-icon" aria-hidden="true" />
                            <h4>Envío rápido</h4>
                            <p className="text-muted">Despachamos en 24 horas. Envíos a todo el país con seguimiento en tiempo real.</p>
                        </div>
                        <div className="why-card">
                            <Shield size={28} className="why-icon" aria-hidden="true" />
                            <h4>Garantía asegurada</h4>
                            <p className="text-muted">90 días de garantía en todos nuestros repuestos originales y alternativos.</p>
                        </div>
                        <div className="why-card">
                            <Star size={28} className="why-icon" aria-hidden="true" />
                            <h4>Atención experta</h4>
                            <p className="text-muted">Nuestros asesores conocen cada modelo. Te ayudamos a elegir el repuesto correcto.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── CTA ── */}
            <section className="cta-section reveal">
                <div className="container cta-inner">
                    <div>
                        <h2>¿No encontrás lo que buscás?</h2>
                        <p className="text-muted">Contanos el modelo de tu moto y te conseguimos el repuesto.</p>
                    </div>
                    <Link to="/contacto" className="btn btn-primary btn-lg">
                        Hacer una consulta <ArrowRight size={18} aria-hidden="true" />
                    </Link>
                </div>
            </section>

            {/* ── SOCIAL ── */}
            <section className="social-section reveal">
                <div className="container">
                    <h2>Síguenos en nuestras redes sociales</h2>
                    <div className="social-links-large">
                        <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram" className="social-large-btn ig">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
                        </a>
                        <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook" className="social-large-btn fb">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                        </a>
                        <a href="https://wa.me/549XXXXXXXXXX" target="_blank" rel="noreferrer" aria-label="WhatsApp" className="social-large-btn wa">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                        </a>
                        <a href="https://tiktok.com/@3mmotos" target="_blank" rel="noreferrer" aria-label="TikTok" className="social-large-btn tt">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.79 1.54V6.78a4.85 4.85 0 01-1.02-.09z" /></svg>
                        </a>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="site-footer">
                <div className="container footer-grid">
                    {/* Nosotros */}
                    <div className="footer-col">
                        <h4 className="footer-col-title">Nosotros</h4>
                        <ul className="footer-col-links">
                            <li><Link to="/contacto">Quiénes somos</Link></li>
                            <li><Link to="/catalogo">Dónde adquirir nuestros productos</Link></li>
                            <li><Link to="/contacto">Contacto</Link></li>
                        </ul>
                    </div>

                    {/* Nuestras Marcas */}
                    <div className="footer-col">
                        <h4 className="footer-col-title">Nuestras Marcas</h4>
                        <ul className="footer-col-links">
                            <li><Link to="/catalogo?marca=ls2">LS2</Link></li>
                            <li><Link to="/catalogo?marca=onguard">OnGuard</Link></li>
                            <li><Link to="/catalogo?marca=riffel">Riffel</Link></li>
                            <li><Link to="/catalogo?marca=michelin">Michelin</Link></li>
                        </ul>
                    </div>

                    {/* Ayuda */}
                    <div className="footer-col">
                        <h4 className="footer-col-title">Ayuda</h4>
                        <ul className="footer-col-links">
                            <li><Link to="/privacidad">Políticas de Privacidad</Link></li>
                            <li><Link to="/terminos">Términos y condiciones</Link></li>
                            <li><Link to="/contacto">Cambios y Devoluciones</Link></li>
                            <li><Link to="/contacto">Libro de Quejas Online</Link></li>
                        </ul>
                    </div>

                    {/* Map column */}
                    <div className="footer-col footer-map-col">
                        <h4 className="footer-col-title">Ubicación</h4>
                        <div className="footer-map-wrap">
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1134.4048473181816!2d-58.455648!3d-34.588631!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95bcb59549f31a27%3A0xc3c6b29d47935401!2sAv.%20C%C3%B3rdoba%205600%2C%20C1414%20Cdad.%20Aut%C3%B3noma%20de%20Buenos%20Aires!5e0!3m2!1ses-419!2sar!4v1700000000000!5m2!1ses-419!2sar"
                                width="100%"
                                style={{ border: 0 }}
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                title="Nuestra Ubicación"
                            ></iframe>
                        </div>
                        <p className="footer-copy-left">© {new Date().getFullYear()} 3M Motos. Todos los derechos reservados.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
