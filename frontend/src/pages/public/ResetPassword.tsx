import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Lock, CheckCircle } from 'lucide-react';
import { resetPassword } from '../../services/api';
import { Spinner } from '../../components/UI';
import './Login.css';

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token') ?? '';

    const [password, setPassword] = useState('');
    const [confirmar, setConfirmar] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [exito, setExito] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!token) {
            navigate('/recuperar-password', { replace: true });
        }
    }, [token, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }
        if (password !== confirmar) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        setLoading(true);
        try {
            await resetPassword(token, password);
            setExito(true);
        } catch (err: any) {
            setError(err.message || 'El enlace es inválido o ya expiró. Solicitá uno nuevo.');
        } finally {
            setLoading(false);
        }
    };

    if (exito) {
        return (
            <div className="login-screen">
                <div className="login-container">
                    <div className="login-card card" style={{ textAlign: 'center', padding: '48px 40px' }}>
                        <CheckCircle size={52} style={{ color: 'var(--accent)', margin: '0 auto 20px' }} />
                        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '12px' }}>
                            ¡Contraseña actualizada!
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', lineHeight: 1.6 }}>
                            Tu contraseña fue restablecida correctamente. Ya podés iniciar sesión con tu nueva contraseña.
                        </p>
                        <Link to="/login" className="btn btn-primary" style={{ display: 'inline-flex', justifyContent: 'center' }}>
                            Ir al inicio de sesión
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="login-screen">
            <div className="login-container">
                <header className="login-header">
                    <h1 className="login-title">NUEVA CONTRASEÑA</h1>
                    <div className="login-title-line"></div>
                </header>

                <div className="login-card card">
                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="form-group">
                            <label className="form-label">Nueva contraseña</label>
                            <div className="input-with-icon">
                                <Lock size={18} className="input-icon" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className={`form-control ${error ? 'form-control--error' : ''}`}
                                    placeholder="Mínimo 6 caracteres"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Confirmar contraseña</label>
                            <div className="input-with-icon">
                                <Lock size={18} className="input-icon" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="form-control"
                                    placeholder="Repetí la contraseña"
                                    value={confirmar}
                                    onChange={e => setConfirmar(e.target.value)}
                                    required
                                />
                            </div>
                            {error && <span className="form-error">{error}</span>}
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-block login-submit"
                            disabled={loading || !password || !confirmar}
                        >
                            {loading ? <Spinner size={20} /> : 'Restablecer contraseña'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
