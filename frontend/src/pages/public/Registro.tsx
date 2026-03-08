import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Lock, Eye, EyeOff, ChevronRight, UserPlus } from 'lucide-react';
import { Spinner } from '../../components/UI';
import './Registro.css';

export default function Registro() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        telefono: '',
        password: ''
    });
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Simulate API registration
        setTimeout(() => {
            setLoading(false);
            // In a real app, we'd register the user
            // For now, let's just simulate success and redirect to login
            navigate('/login');
        }, 1200);
    };

    return (
        <div className="registro-screen">
            <div className="registro-container">
                <header className="registro-header">
                    <h1 className="registro-title">CREAR UNA NUEVA CUENTA</h1>
                    <div className="registro-title-line"></div>
                </header>

                <div className="registro-card card">
                    <form onSubmit={handleSubmit} className="registro-form">
                        <div className="form-group">
                            <label className="form-label">Nombre Completo</label>
                            <div className="input-with-icon">
                                <User size={18} className="input-icon" />
                                <input
                                    type="text"
                                    name="nombre"
                                    className="form-control"
                                    placeholder="Juan Pérez"
                                    value={formData.nombre}
                                    onChange={handleChange}
                                    required
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Correo Electrónico</label>
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
                        </div>

                        <div className="form-group">
                            <label className="form-label">Teléfono / WhatsApp</label>
                            <div className="input-with-icon">
                                <Phone size={18} className="input-icon" />
                                <input
                                    type="tel"
                                    name="telefono"
                                    className="form-control"
                                    placeholder="+54 9 11 1234-5678"
                                    value={formData.telefono}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Contraseña</label>
                            <div className="input-with-icon">
                                <Lock size={18} className="input-icon" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    className="form-control"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <p className="registro-terms">
                            Al registrarse, acepta nuestros <Link to="/terminos">Términos de Servicio</Link> y <Link to="/privacidad">Política de Privacidad</Link>.
                        </p>

                        <button
                            type="submit"
                            className="btn btn-primary btn-block registro-submit"
                            disabled={loading}
                        >
                            {loading ? <Spinner size={20} /> : (
                                <>
                                    <UserPlus size={18} style={{ marginRight: 8 }} />
                                    Registrarse
                                </>
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
