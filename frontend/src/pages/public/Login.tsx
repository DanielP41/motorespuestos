import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../../components/UI';
import './Login.css';

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Get the redirect path from location state or default to /admin
    const from = (location.state as any)?.from?.pathname || '/admin';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const ok = await login(password, email);
        setLoading(false);

        if (ok) {
            // After successful login, redirect. 
            // If they came from a specific page (like Checkout), go back there.
            // Otherwise, let AuthContext or common sense guide them.
            navigate(from, { replace: true });
        } else {
            setError('Credenciales incorrectas. Verificá tu correo y contraseña.');
        }
    };

    return (
        <div className="login-screen">
            <div className="login-container">
                <header className="login-header">
                    <h1 className="login-title">INICIAR SESIÓN CON SU CUENTA</h1>
                    <div className="login-title-line"></div>
                </header>

                <div className="login-card card">
                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="form-group">
                            <label className="form-label">Dirección de correo electrónico</label>
                            <div className="input-with-icon">
                                <Mail size={18} className="input-icon" />
                                <input
                                    type="email"
                                    className="form-control"
                                    placeholder="ejemplo@correo.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Contraseña</label>
                            <div className="input-with-icon">
                                <Lock size={18} className="input-icon" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className={`form-control ${error ? 'form-control--error' : ''}`}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
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
                            {error && <span className="form-error">{error}</span>}
                        </div>

                        <div className="login-forgot">
                            <Link to="/recuperar-password">¿Olvidó su contraseña?</Link>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-block login-submit"
                            disabled={loading || !password}
                        >
                            {loading ? <Spinner size={20} /> : 'Iniciar sesión'}
                        </button>
                    </form>

                    <div className="login-divider">
                        <span>O</span>
                    </div>

                    <button type="button" className="google-btn">
                        <div className="google-icon-wrapper">
                            <svg width="18" height="18" viewBox="0 0 18 18">
                                <path fill="#4285F4" d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9087c1.7018-1.5668 2.6836-3.874 2.6836-6.615z" />
                                <path fill="#34A853" d="M9 18c2.43 0 4.4673-.8059 5.9564-2.1805l-2.9087-2.2581c-.8059.54-1.8368.859-3.0477.859-2.344 0-4.3282-1.5831-5.0359-3.7104H.9574v2.3318C2.4382 15.9832 5.4818 18 9 18z" />
                                <path fill="#FBBC05" d="M3.9641 10.71c-.18-.54-.2823-1.1168-.2823-1.71s.1023-1.17.2823-1.71V4.9582H.9574C.3477 6.1732 0 7.5477 0 9s.3477 2.8268.9574 4.0418L3.9641 10.71z" />
                                <path fill="#EA4335" d="M9 3.5795c1.3214 0 2.5077.4541 3.4404 1.346l2.5814-2.5814C13.4632.8918 11.4259 0 9 0 5.4818 0 2.4382 2.0168.9574 4.9582L3.9641 7.29C4.6718 5.1627 6.6559 3.5795 9 3.5795z" />
                            </svg>
                        </div>
                        <span className="google-text">Sign in with Google</span>
                    </button>

                    <div className="login-footer">
                        <p>¿No tiene una cuenta? <Link to="/registro">Cree una aquí <ChevronRight size={14} /></Link></p>
                    </div>
                </div>
            </div>
        </div>
    );
}
