import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Check, ArrowLeft, Package, Shield, Star } from 'lucide-react';
import { getRepuestoById } from '../../services/api';
import { useAsync } from '../../hooks/useAsync';
import { useCart } from '../../context/CartContext';
import { PageLoading, ErrorMessage } from '../../components/UI';
import { formatCOP } from '../../utils/helpers';
import { mockModelos, mockMarcas } from '../../data/mockData';
import './ProductoDetalle.css';

export default function ProductoDetalle() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addItem, isInCart, getQuantity } = useCart();
    const [qty, setQty] = useState(1);
    const [added, setAdded] = useState(false);

    const { data: rep, isLoading, isError, error } = useAsync(
        () => getRepuestoById(Number(id)),
        [id]
    );

    if (isLoading) return <PageLoading message="Cargando repuesto..." />;
    if (isError) return <ErrorMessage message={error ?? undefined} />;
    if (!rep) {
        return (
            <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
                <h2>Repuesto no encontrado</h2>
                <Link to="/catalogo" className="btn btn-secondary" style={{ marginTop: 16, display: 'inline-flex' }}>
                    Volver al catálogo
                </Link>
            </div>
        );
    }

    const inCart = isInCart(rep.id);
    const cartQty = getQuantity(rep.id);
    const imgUrl = rep.imagenes?.[0]?.url ?? 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600';

    const handleAdd = () => {
        addItem(rep, qty);
        setAdded(true);
        setTimeout(() => setAdded(false), 1600);
    };

    const compatibilidades = rep.compatibilidades?.map(c => {
        const modelo = mockModelos.find(m => m.id === c.modelo_moto_id);
        const marca = mockMarcas.find(m => m.id === modelo?.marca_id);
        return { modelo, marca, anio_desde: c.anio_desde, anio_hasta: c.anio_hasta };
    }) ?? [];

    return (
        <div className="detalle-page">
            <div className="container">
                <button
                    className="btn btn-ghost btn-sm detalle-back"
                    onClick={() => navigate(-1)}
                    aria-label="Volver"
                >
                    <ArrowLeft size={16} /> Volver
                </button>

                <div className="detalle-grid">
                    {/* Image */}
                    <div className="detalle-img-col">
                        <div className="detalle-img-wrap">
                            <img src={imgUrl} alt={rep.nombre} className="detalle-img" />
                            {rep.es_original && (
                                <div className="detalle-original-badge">
                                    <Star size={12} aria-hidden="true" /> Repuesto Original
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="detalle-info-col">
                        <div className="detalle-meta">
                            <span className="detalle-cat">{rep.categoria?.nombre}</span>
                            <span className="detalle-sku">SKU: {rep.sku}</span>
                        </div>

                        <h1 className="detalle-name">{rep.nombre}</h1>

                        {rep.descripcion && (
                            <p className="detalle-desc">{rep.descripcion}</p>
                        )}

                        <div className="detalle-price-block">
                            <span className="detalle-price">{formatCOP(rep.precio_venta)}</span>
                            <span className={`badge ${rep.stock_actual > 0 ? 'badge-success' : 'badge-danger'}`}>
                                {rep.stock_actual > 0 ? `${rep.stock_actual} en stock` : 'Agotado'}
                            </span>
                        </div>

                        {/* Quantity + add */}
                        <div className="detalle-actions">
                            <div className="qty-control" role="group" aria-label="Cantidad">
                                <button
                                    className="qty-btn"
                                    onClick={() => setQty(q => Math.max(1, q - 1))}
                                    disabled={qty <= 1}
                                    aria-label="Reducir cantidad"
                                >−</button>
                                <span className="qty-val" aria-live="polite">{qty}</span>
                                <button
                                    className="qty-btn"
                                    onClick={() => setQty(q => Math.min(rep.stock_actual, q + 1))}
                                    disabled={qty >= rep.stock_actual}
                                    aria-label="Aumentar cantidad"
                                >+</button>
                            </div>

                            <button
                                className={`btn btn-lg flex-1 ${added || inCart ? 'btn-added' : 'btn-primary'}`}
                                onClick={handleAdd}
                                disabled={rep.stock_actual === 0}
                                aria-label={inCart ? `Ya en carrito (${cartQty} unidades)` : 'Agregar al carrito'}
                            >
                                {added || inCart
                                    ? <><Check size={18} aria-hidden="true" /> {inCart ? `En carrito (${cartQty})` : '¡Agregado!'}</>
                                    : <><ShoppingCart size={18} aria-hidden="true" /> Agregar al carrito</>
                                }
                            </button>
                        </div>

                        {inCart && (
                            <Link to="/carrito" className="btn btn-secondary" style={{ marginTop: 8, textAlign: 'center', justifyContent: 'center' }}>
                                Ver carrito →
                            </Link>
                        )}

                        {/* Features */}
                        <div className="detalle-features">
                            <div className="detalle-feat">
                                <Package size={16} className="feat-icon" aria-hidden="true" />
                                <span>Envío en 24 horas hábiles</span>
                            </div>
                            <div className="detalle-feat">
                                <Shield size={16} className="feat-icon" aria-hidden="true" />
                                <span>90 días de garantía</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Compatibilidad */}
                {compatibilidades.length > 0 && (
                    <div className="detalle-compat">
                        <h3>Compatibilidad</h3>
                        <div className="compat-grid">
                            {compatibilidades.map((c, i) => (
                                <div key={i} className="compat-card card">
                                    <span className="compat-marca">{c.marca?.nombre}</span>
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
