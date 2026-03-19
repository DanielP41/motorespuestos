import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Check, ArrowLeft, Package, Shield, Star, Loader2 } from 'lucide-react';
import { getRepuestoById } from '../../services/api';
import { useCart } from '../../context/CartContext';
import './ProductoDetalle.css';

export default function ProductoDetalle() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addItem, isInCart, getQuantity } = useCart();
    const [qty, setQty] = useState(1);
    const [added, setAdded] = useState(false);

    const [rep, setRep] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        getRepuestoById(Number(id))
            .then(setRep)
            .catch(() => setError('Repuesto no encontrado'))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
                <Loader2 className="spinner" size={48} />
                <p className="text-muted" style={{ marginTop: 16 }}>Cargando...</p>
            </div>
        );
    }

    if (error || !rep) {
        return (
            <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
                <h2>Repuesto no encontrado</h2>
                <Link to="/catalogo" className="btn btn-secondary" style={{ marginTop: 16 }}>
                    Volver al catálogo
                </Link>
            </div>
        );
    }

    const inCart = isInCart(rep.id);
    const cartQty = getQuantity(rep.id);
    const imgUrl = rep.imagen_url
        ?? rep.imagenes?.[0]?.url
        ?? 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600';

    const handleAdd = () => {
        addItem(rep, qty);
        setAdded(true);
        setTimeout(() => setAdded(false), 1600);
    };

    return (
        <div className="detalle-page">
            <div className="container">
                {/* Breadcrumb */}
                <button className="btn btn-ghost btn-sm detalle-back" onClick={() => navigate(-1)}>
                    <ArrowLeft size={16} /> Volver
                </button>

                <div className="detalle-grid">
                    {/* Image */}
                    <div className="detalle-img-col">
                        <div className="detalle-img-wrap">
                            <img src={imgUrl} alt={rep.nombre} className="detalle-img" />
                            {rep.es_original && (
                                <div className="detalle-original-badge">
                                    <Star size={12} /> Repuesto Original
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="detalle-info-col">
                        <div className="detalle-meta">
                            <span className="detalle-cat">{rep.categoria?.nombre ?? rep.categoria}</span>
                            <span className="detalle-sku">SKU: {rep.sku}</span>
                        </div>

                        <h1 className="detalle-name">{rep.nombre}</h1>

                        {rep.descripcion && (
                            <p className="detalle-desc">{rep.descripcion}</p>
                        )}

                        <div className="detalle-price-block">
                            <span className="detalle-price">${rep.precio_venta.toLocaleString('es-CO')}</span>
                            <span className={`badge ${rep.stock_actual > 0 ? 'badge-success' : 'badge-danger'}`}>
                                {rep.stock_actual > 0 ? `${rep.stock_actual} en stock` : 'Agotado'}
                            </span>
                        </div>

                        {/* Quantity + add */}
                        <div className="detalle-actions">
                            <div className="qty-control">
                                <button
                                    className="qty-btn"
                                    onClick={() => setQty(q => Math.max(1, q - 1))}
                                    disabled={qty <= 1}
                                >−</button>
                                <span className="qty-val">{qty}</span>
                                <button
                                    className="qty-btn"
                                    onClick={() => setQty(q => Math.min(rep.stock_actual, q + 1))}
                                    disabled={qty >= rep.stock_actual}
                                >+</button>
                            </div>

                            <button
                                className={`btn btn-lg flex-1 ${added || inCart ? 'btn-added' : 'btn-primary'}`}
                                onClick={handleAdd}
                                disabled={rep.stock_actual === 0}
                            >
                                {added || inCart
                                    ? <><Check size={18} /> {inCart ? `En carrito (${cartQty})` : 'Agregado!'}</>
                                    : <><ShoppingCart size={18} /> Agregar al carrito</>
                                }
                            </button>
                        </div>

                        {inCart && (
                            <Link to="/carrito" className="btn btn-secondary" style={{ marginTop: 8, textAlign: 'center' }}>
                                Ver carrito →
                            </Link>
                        )}

                        {/* Features */}
                        <div className="detalle-features">
                            <div className="detalle-feat">
                                <Package size={16} className="feat-icon" />
                                <span>Envío en 24 horas hábiles</span>
                            </div>
                            <div className="detalle-feat">
                                <Shield size={16} className="feat-icon" />
                                <span>90 días de garantía</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Compatibilidad — si la API la retorna */}
                {rep.compatibilidades?.length > 0 && (
                    <div className="detalle-compat">
                        <h3>Compatibilidad</h3>
                        <div className="compat-grid">
                            {rep.compatibilidades.map((c: any, i: number) => (
                                <div key={i} className="compat-card card">
                                    <span className="compat-marca">{c.modelo?.marca?.nombre}</span>
                                    <span className="compat-modelo">{c.modelo?.nombre}</span>
                                    {(c.anio_desde || c.anio_hasta) && (
                                        <span className="compat-anio">
                                            {c.anio_desde} – {c.anio_hasta ?? 'actualidad'}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
