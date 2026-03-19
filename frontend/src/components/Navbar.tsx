import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ShoppingCart, Menu, X, Search, User as UserIcon, LogOut } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
// import logo3M from '../assets/logo_xl.png';
import './Navbar.css';

export default function Navbar() {
    const { count } = useCart();
    const { isAuthenticated, user, logout } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [query, setQuery] = useState('');
    const navigate = useNavigate();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            navigate(`/catalogo?q=${encodeURIComponent(query.trim())}`);
            setSearchOpen(false);
            setQuery('');
        }
    };

    return (
        <nav className="navbar">
            <div className="navbar-inner container">
                {/* Nav links - desktop (Left) */}
                <ul className="navbar-links">
                    <li><NavLink to="/catalogo">Catálogo</NavLink></li>
                    <li><NavLink to="/contacto">Contacto</NavLink></li>
                </ul>

                {/* Logo (Center) */}
                <Link to="/" className="navbar-logo">
                    <img src="/logo_xl.png" alt="3M Motos" className="logo-img" />
                </Link>

                {/* Actions (Right) */}
                <div className="navbar-actions">
                    {/* Login Button */}
                    {!isAuthenticated && (
                        <NavLink to="/login" className="nav-login-link desktop-only">
                            ENTRAR
                        </NavLink>
                    )}

                    {/* Search */}
                    <button
                        className="btn btn-icon navbar-action-btn"
                        onClick={() => setSearchOpen(!searchOpen)}
                        aria-label="Buscar"
                    >
                        <Search size={18} />
                    </button>

                    {/* User profile / User Menu */}
                    {isAuthenticated ? (
                        <div className="user-menu-wrapper">
                            <button
                                className="btn btn-icon navbar-action-btn user-profile-btn"
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                            >
                                <UserIcon size={18} />
                            </button>
                            {userMenuOpen && (
                                <div className="user-dropdown-menu">
                                    <div className="user-dropdown-header">
                                        <p className="user-name">{user?.nombre_completo || user?.username || 'Usuario'}</p>
                                        <p className="user-role">{user?.role === 'cliente' ? 'Cliente' : 'Staff'}</p>
                                    </div>
                                    <div className="user-dropdown-divider"></div>
                                    {user?.role === 'cliente' && (
                                        <Link to="/mi-cuenta" className="user-dropdown-item" onClick={() => setUserMenuOpen(false)}>Mi cuenta</Link>
                                    )}
                                    {user?.role !== 'cliente' && (
                                        <Link to="/admin" className="user-dropdown-item" onClick={() => setUserMenuOpen(false)}>Panel Admin</Link>
                                    )}
                                    <button
                                        className="user-dropdown-item logout-btn"
                                        onClick={() => { logout(); setUserMenuOpen(false); }}
                                    >
                                        <LogOut size={14} /> Cerrar Sesión
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link to="/login" className="btn btn-icon navbar-action-btn mobile-only-login" title="Iniciar Sesión">
                            <UserIcon size={18} />
                        </Link>
                    )}

                    {/* Cart */}
                    <Link to="/carrito" className="cart-btn" aria-label="Carrito">
                        <ShoppingCart size={20} />
                        {count > 0 && <span className="cart-badge">{count}</span>}
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

            {/* Search bar dropdown */}
            {searchOpen && (
                <div className="navbar-search-dropdown">
                    <form className="search-bar container-search" onSubmit={handleSearch}>
                        <Search size={16} className="search-icon" />
                        <input
                            autoFocus
                            type="text"
                            placeholder="Buscar repuesto, SKU, marca..."
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                        />
                        <button type="submit" className="btn btn-primary btn-sm">Buscar</button>
                    </form>
                </div>
            )}

            {/* Mobile menu */}
            {menuOpen && (
                <div className="navbar-mobile-menu">
                    <NavLink to="/catalogo" onClick={() => setMenuOpen(false)}>Catálogo</NavLink>
                    <NavLink to="/contacto" onClick={() => setMenuOpen(false)}>Contacto</NavLink>
                    <NavLink to="/login" onClick={() => setMenuOpen(false)}>Iniciar Sesión</NavLink>
                    <NavLink to="/carrito" onClick={() => setMenuOpen(false)}>
                        Carrito {count > 0 && `(${count})`}
                    </NavLink>
                </div>
            )}
        </nav>
    );
}
