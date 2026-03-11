import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    User, Mail, Phone, Lock, Eye, EyeOff, ChevronRight,
    UserPlus, CreditCard, CheckCircle, AlertCircle, Loader2
} from 'lucide-react';
import { registerCliente, login } from '../../services/api';
import './Registro.css';

const TIPOS_DOCUMENTO = [
    { value: 'CC', label: 'Cédula de Ciudadanía' },
    { value: 'NIT', label: 'NIT' },
    { value: 'CE', label: 'Cédula de Extranjería' },
    { value: 'Pasaporte', label: 'Pasaporte' },
    { value: 'RUT', label: 'RUT' },
];

export default function Registro() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        tipo: 'N',
        documento_tipo: 'CC',
        documento_nro: '',
        nombre: '',
        email: '',
        telefono: '',
        direccion: '',
        password: '',
        confirmarPassword: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (formData.password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }
        if (formData.password !== formData.confirmarPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }
        if (!formData.documento_nro.trim()) {
            setError('El número de documento es obligatorio.');
            return;
        }

        setLoading(true);
        try {
            await registerCliente({
                tipo: formData.tipo,
                documento_tipo: formData.documento_tipo,
                documento_nro: formData.documento_nro.trim(),
                nombre: formData.nombre.trim(),
                email: formData.email.trim() || undefined,
                telefono: formData.telefono.trim() || undefined,
                direccion: formData.direccion.trim() || undefined,
                password: formData.password,
            });

            // Auto login after success
            try {
                await login(formData.email.trim(), formData.password);
                setSuccess(true);
                // Redirect after a small delay to show success
                setTimeout(() => {
                    navigate('/');
                }, 2000);
            } catch (loginErr) {
                // If auto-login fails, just show success screen so they can login manually
                setSuccess(true);
            }
        } catch (err: any) {
            setError(err.message || 'Error al registrar. Intente nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    // ── Success screen ──
    if (success) {
        return (
            <div className="registro-screen">
                <div className="registro-container">
                    <div className="registro-card card" style={{ textAlign: 'center', padding: '48px 32px' }}>
                        <CheckCircle size={64} style={{ color: '#22c55e', margin: '0 auto 20px' }} />
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 12 }}>
                            ¡Cuenta creada exitosamente!
                        </h2>
                        <p style={{ color: 'var(--muted)', marginBottom: 32, lineHeight: 1.6 }}>
                            Tu cuenta de cliente fue registrada correctamente.<br />
                            Ya puedes iniciar sesión con tu correo y contraseña.
                        </p>
                        <Link
                            to="/login"
                            className="btn btn-primary btn-block"
                            style={{ maxWidth: 280, margin: '0 auto' }}
                        >
                            Ir a iniciar sesión <ChevronRight size={16} />
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // ── Registration form ──
    return (
        <div className="registro-screen">
            <div className="registro-container">
                <header className="registro-header">
                    <h1 className="registro-title">CREAR UNA NUEVA CUENTA</h1>
                    <div className="registro-title-line"></div>
                </header>

                <div className="registro-card card">
                    <form onSubmit={handleSubmit} className="registro-form">

                        {/* Tipo de persona */}
                        <div className="form-group">
                            <label className="form-label">Tipo de Persona</label>
                            <div style={{ display: 'flex', gap: 12 }}>
                                {[{ v: 'N', l: 'Persona Natural' }, { v: 'J', l: 'Empresa / Jurídica' }].map(op => (
                                    <label
                                        key={op.v}
                                        style={{
                                            flex: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            padding: '10px 16px',
                                            border: `1px solid ${formData.tipo === op.v ? 'var(--accent)' : 'var(--border)'}`,
                                            borderRadius: 'var(--radius)',
                                            cursor: 'pointer',
                                            background: formData.tipo === op.v ? 'rgba(255,106,0,0.08)' : 'transparent',
                                            transition: 'all 0.15s',
                                            fontSize: '0.88rem',
                                            fontWeight: 500,
                                        }}
                                    >
                                        <input
                                            type="radio"
                                            name="tipo"
                                            value={op.v}
                                            checked={formData.tipo === op.v}
                                            onChange={handleChange}
                                            style={{ accentColor: 'var(--accent)' }}
                                        />
                                        {op.l}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Nombre */}
                        <div className="form-group">
                            <label className="form-label">
                                {formData.tipo === 'J' ? 'Razón Social / Nombre empresa' : 'Nombre Completo'} *
                            </label>
                            <div className="input-with-icon">
                                <User size={18} className="input-icon" />
                                <input
                                    type="text"
                                    name="nombre"
                                    className="form-control"
                                    placeholder={formData.tipo === 'J' ? 'Empresa S.A.S.' : 'Juan Pérez'}
                                    value={formData.nombre}
                                    onChange={handleChange}
                                    required
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Documento */}
                        <div className="form-group">
                            <label className="form-label">Documento de Identidad *</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 10 }}>
                                <select
                                    name="documento_tipo"
                                    className="form-control"
                                    value={formData.documento_tipo}
                                    onChange={handleChange}
                                    required
                                >
                                    {TIPOS_DOCUMENTO.map(t => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                                <div className="input-with-icon">
                                    <CreditCard size={18} className="input-icon" />
                                    <input
                                        type="text"
                                        name="documento_nro"
                                        className="form-control"
                                        placeholder="1234567890"
                                        value={formData.documento_nro}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Email */}
                        <div className="form-group">
                            <label className="form-label">Correo Electrónico *</label>
                            <div className="input-with-icon">
                                <Mail size={18} className="input-icon" />
                                <input
                                    type="email"
                                    name="email"
                                    className="form-control"
                                    placeholder="juan@ejemplo.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 4 }}>
                                Usarás este correo para iniciar sesión.
                            </p>
                        </div>

                        {/* Teléfono */}
                        <div className="form-group">
                            <label className="form-label">Teléfono / WhatsApp</label>
                            <div className="input-with-icon">
                                <Phone size={18} className="input-icon" />
                                <input
                                    type="tel"
                                    name="telefono"
                                    className="form-control"
                                    placeholder="300 123 4567"
                                    value={formData.telefono}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Contraseña */}
                        <div className="form-group">
                            <label className="form-label">Contraseña *</label>
                            <div className="input-with-icon">
                                <Lock size={18} className="input-icon" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    className="form-control"
                                    placeholder="Mínimo 6 caracteres"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Confirmar contraseña */}
                        <div className="form-group">
                            <label className="form-label">Confirmar Contraseña *</label>
                            <div className="input-with-icon">
                                <Lock size={18} className="input-icon" />
                                <input
                                    type={showConfirm ? 'text' : 'password'}
                                    name="confirmarPassword"
                                    className="form-control"
                                    placeholder="Repite tu contraseña"
                                    value={formData.confirmarPassword}
                                    onChange={handleChange}
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    tabIndex={-1}
                                >
                                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {formData.confirmarPassword && formData.password !== formData.confirmarPassword && (
                                <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <AlertCircle size={12} /> Las contraseñas no coinciden
                                </p>
                            )}
                        </div>

                        {/* Error global */}
                        {error && (
                            <div style={{
                                background: 'rgba(239,68,68,0.1)',
                                border: '1px solid rgba(239,68,68,0.3)',
                                borderRadius: 'var(--radius)',
                                padding: '12px 16px',
                                color: '#ef4444',
                                fontSize: '0.88rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8
                            }}>
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}

                        <p className="registro-terms">
                            Al registrarse, acepta nuestros <Link to="/terminos">Términos de Servicio</Link> y <Link to="/privacidad">Política de Privacidad</Link>.
                        </p>

                        <button
                            type="submit"
                            className="btn btn-primary btn-block registro-submit"
                            disabled={loading}
                        >
                            {loading ? (
                                <><Loader2 size={18} className="spinner" style={{ marginRight: 8 }} /> Creando cuenta...</>
                            ) : (
                                <><UserPlus size={18} style={{ marginRight: 8 }} /> Crear cuenta</>
                            )}
                        </button>
                    </form>

                    <div className="registro-footer">
                        <p>¿Ya tiene una cuenta? <Link to="/login">Inicie sesión aquí <ChevronRight size={14} /></Link></p>
                    </div>
                </div>
            </div>
        </div>
    );
}
