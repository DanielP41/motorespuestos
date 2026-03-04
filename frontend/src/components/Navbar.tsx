import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ShoppingCart, Menu, X, Zap, Search } from 'lucide-react';
import { useCart } from '../context/CartContext';
import './Navbar.css';

export default function Navbar() {
    const { count } = useCart();
    const [menuOpen, setMenuOpen] = useState(false);
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
                {/* Logo */}
                <Link to="/" className="navbar-logo">
                    <Zap size={22} className="logo-icon" />
                    <span className="logo-text">MOTO<span>REPUESTOS</span></span>
                </Link>

                {/* Nav links - desktop */}
                <ul className="navbar-links">
                    <li><NavLink to="/catalogo">Catálogo</NavLink></li>
                    <li><NavLink to="/contacto">Contacto</NavLink></li>
                </ul>

                {/* Actions */}
                <div className="navbar-actions">
                    {/* Search */}
                    <button
                        className="btn btn-icon navbar-action-btn"
                        onClick={() => setSearchOpen(!searchOpen)}
                        aria-label="Buscar"
                    >
                        <Search size={18} />
                    </button>

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
                    <NavLink to="/carrito" onClick={() => setMenuOpen(false)}>
                        Carrito {count > 0 && `(${count})`}
                    </NavLink>
                </div>
            )}
        </nav>
    );
}
