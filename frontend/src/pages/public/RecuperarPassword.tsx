import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { forgotPassword } from '../../services/api';
import { Spinner } from '../../components/UI';
import './Login.css';

export default function RecuperarPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [enviado, setEnviado] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await forgotPassword(email);
            setEnviado(true);
        } catch {
            // El backend siempre responde 204 — si hay error es de red
            setError('No se pudo enviar el correo. Intentá de nuevo más tarde.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-screen">
            <div className="login-container">
                <header className="login-header">
                    <h1 className="login-title">RECUPERAR CONTRASEÑA</h1>
                    <div className="login-title-line"></div>
                </header>

                <div className="login-card card">
                    {enviado ? (
                        <div style={{ textAlign: 'center', padding: '8px 0' }}>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.6 }}>
                                Si el correo <strong style={{ color: 'var(--text)' }}>{email}</strong> está
                                registrado, recibirás un enlace para restablecer tu contraseña en los
                                próximos minutos. Revisá también tu carpeta de spam.
                            </p>
                            <Link to="/login" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                <ArrowLeft size={16} />
                                Volver al inicio de sesión
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="login-form">
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '4px' }}>
                                Ingresá tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
                            </p>

                            <div className="form-group">
                                <label className="form-label">Correo electrónico</label>
                                <div className="input-with-icon">
                                    <Mail size={18} className="input-icon" />
                                    <input
                                        type="email"
                                        className={`form-control ${error ? 'form-control--error' : ''}`}
                                        placeholder="tu@correo.com"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                </div>
                                {error && <span className="form-error">{error}</span>}
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary btn-block login-submit"
                                disabled={loading || !email}
                            >
                                {loading ? <Spinner size={20} /> : 'Enviar enlace'}
                            </button>

                            <div className="login-footer" style={{ marginTop: '16px' }}>
                                <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--muted)', fontSize: '0.88rem' }}>
                                    <ArrowLeft size={14} />
                                    Volver al inicio de sesión
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
