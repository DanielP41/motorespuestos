import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { crearVenta, crearPreferenciaMp } from '../../services/api';
import './Checkout.css';

type MetodoPago = 'efectivo' | 'tarjeta_debito' | 'tarjeta_credito' | 'transferencia' | 'mercadopago';

const metodos: { value: MetodoPago; label: string }[] = [
    { value: 'efectivo', label: 'Efectivo' },
    { value: 'tarjeta_debito', label: 'Tarjeta débito' },
    { value: 'tarjeta_credito', label: 'Tarjeta crédito' },
    { value: 'transferencia', label: 'Transferencia bancaria' },
    { value: 'mercadopago', label: 'MercadoPago' },
];

export default function Checkout() {
    const { items, total, clearCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [metodo, setMetodo] = useState<MetodoPago>('efectivo');
    const [form, setForm] = useState({
        nombre: '', email: '', telefono: '', direccion: '', notas: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [submitted, setSubmitted] = useState(false);

    if (items.length === 0 && !submitted) {
        return (
            <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
                <h2>No hay productos en el carrito</h2>
                <Link to="/catalogo" className="btn btn-primary" style={{ marginTop: 16 }}>Ir al catálogo</Link>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (metodo === 'mercadopago') {
                // Flujo MercadoPago: crear preferencia y redirigir al checkout de MP
                const result = await crearPreferenciaMp({
                    items: items.map(item => ({
                        repuesto_id: item.repuesto.id,
                        cantidad: item.cantidad,
                        precio_unitario: item.repuesto.precio_venta,
                    })),
                    payer_email: form.email,
                    payer_name: form.nombre,
                    notas: form.notas || undefined,
                    cliente_id: (user as any)?.id ?? null,
                });
                // Limpiar carrito antes de salir — el pago se confirma vía webhook
                clearCart();
                // Redirección completa al checkout de MercadoPago
                window.location.href = result.init_point;
            } else {
                // Flujo estándar (efectivo, transferencia, tarjeta en local)
                const ventaData = {
                    metodo_pago: metodo,
                    total: total,
                    cliente_id: (user as any)?.id ?? null,
                    items: items.map(item => ({
                        repuesto_id: item.repuesto.id,
                        cantidad: item.cantidad,
                        precio_unitario: item.repuesto.precio_venta,
                    })),
                    notas: form.notas || undefined,
                };
                const result = await crearVenta(ventaData);
                setSubmitted(true);
                clearCart();
                navigate('/pedido-exitoso', {
                    state: {
                        numeroPedido: result.numero_factura || `MRP-${result.id.toString().padStart(4, '0')}`,
                        total: total,
                        metodo: metodo,
                    }
                });
            }
        } catch (err: any) {
            console.error('Checkout error:', err);
            setError(err.message || 'Error al procesar el pedido. Intentá de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    const set = (field: string, val: string) =>
        setForm(prev => ({ ...prev, [field]: val }));

    return (
        <div className="container checkout-page">
            <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 20 }}>
                <ArrowLeft size={16} /> Volver al carrito
            </button>

            <h1>Finalizar pedido</h1>

            <div className="checkout-grid">
                {/* Form */}
                <form className="checkout-form" onSubmit={handleSubmit}>
                    <div className="form-section">
                        <h3>Datos de contacto</h3>
                        <div className="grid-2">
                            <div className="form-group">
                                <label className="form-label">Nombre completo *</label>
                                <input className="form-control" required value={form.nombre}
                                    onChange={e => set('nombre', e.target.value)} placeholder="Juan García" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Teléfono *</label>
                                <input className="form-control" required value={form.telefono}
                                    onChange={e => set('telefono', e.target.value)} placeholder="300 123 4567" />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email *</label>
                            <input className="form-control" type="email" required value={form.email}
                                onChange={e => set('email', e.target.value)} placeholder="tu@email.com" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Dirección de envío</label>
                            <input className="form-control" value={form.direccion}
                                onChange={e => set('direccion', e.target.value)} placeholder="Calle 123 #45-67, Ciudad" />
                        </div>
                    </div>

                    <div className="form-section">
                        <h3>Método de pago</h3>
                        <div className="pago-grid">
                            {metodos.map(m => (
                                <button
                                    key={m.value}
                                    type="button"
                                    className={`pago-option ${metodo === m.value ? 'active' : ''}`}
                                    onClick={() => setMetodo(m.value)}
                                    disabled={loading}
                                >
                                    {metodo === m.value && <CheckCircle size={14} className="pago-check" />}
                                    {m.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="form-section">
                        <div className="form-group">
                            <label className="form-label">Notas del pedido (opcional)</label>
                            <textarea className="form-control" rows={3} value={form.notas}
                                onChange={e => set('notas', e.target.value)}
                                placeholder="Instrucciones especiales, horarios de entrega..."
                                disabled={loading} />
                        </div>
                    </div>

                    {error && <div className="alert alert-danger" style={{ marginBottom: 16 }}>{error}</div>}

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg"
                        style={{ width: '100%', justifyContent: 'center' }}
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="spinner" size={20} /> : 'Confirmar pedido'}
                    </button>
                </form>

                {/* Order summary */}
                <div className="checkout-summary card">
                    <h3>Tu pedido</h3>
                    <div className="co-items">
                        {items.map(item => (
                            <div key={item.repuesto.id} className="co-item">
                                <span className="co-item-name">{item.repuesto.nombre} <span className="text-muted">×{item.cantidad}</span></span>
                                <span className="co-item-price">${(item.repuesto.precio_venta * item.cantidad).toLocaleString('es-CO')}</span>
                            </div>
                        ))}
                    </div>
                    <div className="divider" style={{ margin: '16px 0' }} />
                    <div className="co-total">
                        <span>Total a pagar</span>
                        <span className="co-total-price">${total.toLocaleString('es-CO')}</span>
                    </div>
                    <p className="co-note">Al confirmar recibirás un email con los detalles de tu pedido.</p>
                </div>
            </div>
        </div>
    );
}
