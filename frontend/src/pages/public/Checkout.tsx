import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { FormField } from '../../components/UI';
import { formatCOP, isValidEmail, isValidPhone } from '../../utils/helpers';
import './Checkout.css';

type MetodoPago = 'tarjeta_debito' | 'tarjeta_credito';

const metodos: { value: MetodoPago; label: string }[] = [
    { value: 'tarjeta_debito', label: 'Tarjeta débito' },
    { value: 'tarjeta_credito', label: 'Tarjeta crédito' },
];

interface FormData {
    nombre: string;
    email: string;
    telefono: string;
    direccion: string;
    notas: string;
}

type FormErrors = Partial<Record<keyof FormData, string>>;

function validateForm(form: FormData): FormErrors {
    const errors: FormErrors = {};
    if (!form.nombre.trim()) errors.nombre = 'El nombre es requerido';
    if (!form.email.trim()) {
        errors.email = 'El email es requerido';
    } else if (!isValidEmail(form.email)) {
        errors.email = 'Ingresá un email válido';
    }
    if (!form.telefono.trim()) {
        errors.telefono = 'El teléfono es requerido';
    } else if (!isValidPhone(form.telefono)) {
        errors.telefono = 'Ingresá un teléfono válido (10 dígitos)';
    }
    return errors;
}

export default function Checkout() {
    const { items, total, clearCart } = useCart();
    const navigate = useNavigate();
    const [metodo, setMetodo] = useState<MetodoPago>('tarjeta_debito');
    const [form, setForm] = useState<FormData>({
        nombre: '', email: '', telefono: '', direccion: '', notas: '',
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [submitting, setSubmitting] = useState(false);

    if (items.length === 0) {
        return (
            <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
                <h2>No hay productos en el carrito</h2>
                <Link to="/catalogo" className="btn btn-primary" style={{ marginTop: 16, display: 'inline-flex' }}>
                    Ir al catálogo
                </Link>
            </div>
        );
    }

    const set = (field: keyof FormData, val: string) => {
        setForm(prev => ({ ...prev, [field]: val }));
        // Clear error on edit
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors = validateForm(form);
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        setSubmitting(true);
        // Simulate API call
        await new Promise(res => setTimeout(res, 800));
        clearCart();
        navigate('/pedido/MRP-2026-0001');
    };

    return (
        <div className="container checkout-page">
            <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 20 }}>
                <ArrowLeft size={16} /> Volver al carrito
            </button>

            <h1>Finalizar pedido</h1>

            <div className="checkout-grid">
                <form className="checkout-form" onSubmit={handleSubmit} noValidate>
                    <div className="form-section">
                        <h3>Datos de contacto</h3>
                        <div className="grid-2">
                            <FormField label="Nombre completo" error={errors.nombre} required>
                                <input
                                    className={`form-control ${errors.nombre ? 'form-control--error' : ''}`}
                                    value={form.nombre}
                                    onChange={e => set('nombre', e.target.value)}
                                    placeholder="Juan García"
                                />
                            </FormField>
                            <FormField label="Teléfono" error={errors.telefono} required>
                                <input
                                    className={`form-control ${errors.telefono ? 'form-control--error' : ''}`}
                                    value={form.telefono}
                                    onChange={e => set('telefono', e.target.value)}
                                    placeholder="300 123 4567"
                                    type="tel"
                                    inputMode="numeric"
                                />
                            </FormField>
                        </div>
                        <FormField label="Email" error={errors.email} required>
                            <input
                                className={`form-control ${errors.email ? 'form-control--error' : ''}`}
                                type="email"
                                value={form.email}
                                onChange={e => set('email', e.target.value)}
                                placeholder="tu@email.com"
                            />
                        </FormField>
                        <FormField label="Dirección de envío" error={errors.direccion}>
                            <input
                                className="form-control"
                                value={form.direccion}
                                onChange={e => set('direccion', e.target.value)}
                                placeholder="Calle 123 #45-67, Ciudad"
                            />
                        </FormField>
                    </div>

                    <div className="form-section">
                        <h3>Método de pago</h3>
                        <div className="pago-grid" role="radiogroup" aria-label="Método de pago">
                            {metodos.map(m => (
                                <button
                                    key={m.value}
                                    type="button"
                                    role="radio"
                                    aria-checked={metodo === m.value}
                                    className={`pago-option ${metodo === m.value ? 'active' : ''}`}
                                    onClick={() => setMetodo(m.value)}
                                >
                                    {metodo === m.value && <CheckCircle size={14} className="pago-check" aria-hidden="true" />}
                                    {m.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="form-section">
                        <FormField label="Notas del pedido (opcional)" error={errors.notas}>
                            <textarea
                                className="form-control"
                                rows={3}
                                value={form.notas}
                                onChange={e => set('notas', e.target.value)}
                                placeholder="Instrucciones especiales, horarios de entrega..."
                            />
                        </FormField>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg"
                        disabled={submitting}
                        style={{ width: '100%', justifyContent: 'center' }}
                    >
                        {submitting ? 'Procesando...' : 'Confirmar pedido'}
                    </button>
                </form>

                {/* Order summary */}
                <div className="checkout-summary card">
                    <h3>Tu pedido</h3>
                    <div className="co-items">
                        {items.map(item => (
                            <div key={item.repuesto.id} className="co-item">
                                <span className="co-item-name">
                                    {item.repuesto.nombre}{' '}
                                    <span className="text-muted">×{item.cantidad}</span>
                                </span>
                                <span className="co-item-price">
                                    {formatCOP(item.repuesto.precio_venta * item.cantidad)}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="divider" style={{ margin: '16px 0' }} />
                    <div className="co-total">
                        <span>Total a pagar</span>
                        <span className="co-total-price">{formatCOP(total)}</span>
                    </div>
                    <p className="co-note">
                        Al confirmar recibirás un email con los detalles de tu pedido.
                    </p>
                </div>
            </div>
        </div>
    );
}
