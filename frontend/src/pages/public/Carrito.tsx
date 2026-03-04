import { Link } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight, ShoppingCart } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import './Carrito.css';

export default function Carrito() {
    const { items, total, removeItem, updateQuantity, clearCart } = useCart();

    if (items.length === 0) {
        return (
            <div className="container carrito-empty">
                <ShoppingCart size={56} className="cart-empty-icon" />
                <h2>Tu carrito está vacío</h2>
                <p className="text-muted">Explorá el catálogo y agregá los repuestos que necesitás.</p>
                <Link to="/catalogo" className="btn btn-primary btn-lg">
                    <ShoppingBag size={18} /> Ir al catálogo
                </Link>
            </div>
        );
    }

    return (
        <div className="container carrito-page">
            <h1>Tu carrito</h1>
            <p className="text-muted" style={{ marginBottom: 32 }}>{items.length} producto{items.length !== 1 ? 's' : ''}</p>

            <div className="carrito-grid">
                {/* Items */}
                <div className="carrito-items">
                    {items.map(item => (
                        <div key={item.repuesto.id} className="cart-item card">
                            <div className="cart-item-img-wrap">
                                <img
                                    src={item.repuesto.imagenes?.[0]?.url ?? ''}
                                    alt={item.repuesto.nombre}
                                    className="cart-item-img"
                                />
                            </div>
                            <div className="cart-item-info">
                                <span className="cart-item-cat">{item.repuesto.categoria?.nombre}</span>
                                <p className="cart-item-name">{item.repuesto.nombre}</p>
                                <span className="cart-item-sku">SKU: {item.repuesto.sku}</span>
                            </div>
                            <div className="cart-item-controls">
                                <div className="qty-control">
                                    <button
                                        className="qty-btn"
                                        onClick={() => updateQuantity(item.repuesto.id, item.cantidad - 1)}
                                    >−</button>
                                    <span className="qty-val">{item.cantidad}</span>
                                    <button
                                        className="qty-btn"
                                        onClick={() => updateQuantity(item.repuesto.id, item.cantidad + 1)}
                                        disabled={item.cantidad >= item.repuesto.stock_actual}
                                    >+</button>
                                </div>
                                <span className="cart-item-price">
                                    ${(item.repuesto.precio_venta * item.cantidad).toLocaleString('es-CO')}
                                </span>
                                <button
                                    className="btn btn-icon remove-btn"
                                    onClick={() => removeItem(item.repuesto.id)}
                                    aria-label="Eliminar"
                                >
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        </div>
                    ))}

                    <div style={{ textAlign: 'right' }}>
                        <button className="btn btn-ghost btn-sm" onClick={clearCart}>
                            <Trash2 size={13} /> Vaciar carrito
                        </button>
                    </div>
                </div>

                {/* Summary */}
                <div className="carrito-summary card">
                    <h3>Resumen del pedido</h3>
                    <div className="summary-rows">
                        {items.map(item => (
                            <div key={item.repuesto.id} className="summary-row">
                                <span>{item.repuesto.nombre} × {item.cantidad}</span>
                                <span>${(item.repuesto.precio_venta * item.cantidad).toLocaleString('es-CO')}</span>
                            </div>
                        ))}
                    </div>
                    <div className="divider" style={{ margin: '16px 0' }} />
                    <div className="summary-total">
                        <span>Total</span>
                        <span className="total-price">${total.toLocaleString('es-CO')}</span>
                    </div>
                    <Link to="/checkout" className="btn btn-primary btn-lg" style={{ marginTop: 20, justifyContent: 'center' }}>
                        Finalizar pedido <ArrowRight size={18} />
                    </Link>
                    <Link to="/catalogo" className="btn btn-ghost btn-sm" style={{ marginTop: 8, justifyContent: 'center' }}>
                        Seguir comprando
                    </Link>
                </div>
            </div>
        </div>
    );
}
