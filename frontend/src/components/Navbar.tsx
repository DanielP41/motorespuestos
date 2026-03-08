import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ShoppingCart, Menu, X, Search, User, ChevronDown, Zap } from 'lucide-react';
import logo from '../assets/logo.png';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
    const { count } = useCart();
    const { isAuthenticated, user, logout } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const [loginOpen, setLoginOpen] = useState(false);
    const [query, setQuery] = useState('');
    const navigate = useNavigate();
    const loginRef = useRef<HTMLDivElement>(null);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            navigate(`/catalogo?q=${encodeURIComponent(query.trim())}`);
            setQuery('');
        }
    };

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (loginRef.current && !loginRef.current.contains(e.target as Node)) {
                setLoginOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <nav className="navbar">
            <div className="navbar-inner container">
                {/* Left: Nav links */}
                <ul className="navbar-links navbar-left">
                    <li><NavLink to="/catalogo">Catálogo</NavLink></li>
                    <li><NavLink to="/contacto">Contacto</NavLink></li>
                </ul>

                {/* Center: Logo */}
                <Link to="/" className="navbar-logo navbar-center">
                    <img src={logo} alt="3M Motos" className="navbar-logo-img" />
                </Link>

                {/* Right: compact search + actions */}
                <div className="navbar-right-group">
                    {/* Compact search */}
                    <form className="navbar-search-compact" onSubmit={handleSearch}>
                        <input
                            type="text"
                            className="navbar-search-compact-input"
                            placeholder="¿Qué estás buscando?"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            aria-label="Buscar productos"
                        />
                        <button type="submit" className="navbar-search-compact-btn" aria-label="Buscar">
                            <Search size={16} />
                        </button>
                    </form>

                    {/* Login dropdown */}
                    <div className="login-dropdown-wrap" ref={loginRef}>
                        <button className="nav-icon-btn" aria-label="Mi Cuenta" onClick={() => setLoginOpen(!loginOpen)}>
                            <div className="nav-icon-wrap">
                                {isAuthenticated ? <div className="user-initials">{user?.name[0]}</div> : <User size={22} />}
                            </div>
                            <span className="nav-icon-label">
                                {isAuthenticated ? user?.name : 'Mi Cuenta'} <ChevronDown size={12} className={`login-chevron ${loginOpen ? 'open' : ''}`} />
                            </span>
                        </button>
                        {loginOpen && (
                            <div className="login-dropdown">
                                {isAuthenticated ? (
                                    <>
                                        {user?.role === 'admin' && <Link to="/admin" className="login-dropdown-item" onClick={() => setLoginOpen(false)}>Panel Admin</Link>}
                                        <button className="login-dropdown-item" onClick={() => { logout(); setLoginOpen(false); }}>Cerrar Sesión</button>
                                    </>
                                ) : (
                                    <>
                                        <Link to="/registro" className="login-dropdown-item" onClick={() => setLoginOpen(false)}>Registrarse</Link>
                                        <Link to="/login" className="login-dropdown-item" onClick={() => setLoginOpen(false)}>Acceder</Link>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Cart */}
                    <Link to="/carrito" className="nav-icon-btn" aria-label="Carrito">
                        <div className="nav-icon-wrap">
                            <ShoppingCart size={22} />
                            {count > 0 && <span className="cart-badge">{count}</span>}
                        </div>
                        <span className="nav-icon-label">Carrito</span>
                    </Link>

                    {/* Mobile toggle */}
                    <button
                        className="btn btn-icon navbar-action-btn mobile-menu-toggle"
                        onClick={() => setMenuOpen(!menuOpen)}
                        aria-label="Menú"
                    >
                        {menuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>

            {/* Mobile menu */}
            {menuOpen && (
                <div className="navbar-mobile-menu">
                    <NavLink to="/catalogo" onClick={() => setMenuOpen(false)}>Catálogo</NavLink>
                    <NavLink to="/contacto" onClick={() => setMenuOpen(false)}>Contacto</NavLink>
                    {isAuthenticated ? (
                        <>
                            {user?.role === 'admin' && <NavLink to="/admin" onClick={() => setMenuOpen(false)}>Panel Admin</NavLink>}
                            <a href="#" onClick={(e) => { e.preventDefault(); logout(); setMenuOpen(false); }}>Cerrar Sesión</a>
                        </>
                    ) : (
                        <>
                            <NavLink to="/registro" onClick={() => setMenuOpen(false)}>Registrarse</NavLink>
                            <NavLink to="/login" onClick={() => setMenuOpen(false)}>Acceder</NavLink>
                        </>
                    )}
                    <NavLink to="/carrito" onClick={() => setMenuOpen(false)}>
                        Carrito {count > 0 && `(${count})`}
                    </NavLink>
                </div>
            )}
        </nav>
    );
}
