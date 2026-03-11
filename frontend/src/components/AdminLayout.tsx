import { useState } from 'react';
import { NavLink, Link, Outlet } from 'react-router-dom';
import {
    LayoutDashboard, Package, BarChart2, ShoppingBag,
    Users, ShieldCheck, ChevronLeft, ChevronRight,
    Zap, LogOut, Bell
} from 'lucide-react';
import './AdminLayout.css';

const navItems = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/repuestos', label: 'Repuestos', icon: Package },
    { to: '/admin/inventario', label: 'Inventario', icon: BarChart2 },
    { to: '/admin/ventas', label: 'Ventas', icon: ShoppingBag },
    { to: '/admin/clientes', label: 'Clientes', icon: Users },
    { to: '/admin/garantias', label: 'Garantías', icon: ShieldCheck },
];

export default function AdminLayout() {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className="admin-shell">
            {/* Sidebar */}
            <aside className={`admin-sidebar ${collapsed ? 'collapsed' : ''}`}>
                <div
                    className="sidebar-header"
                    style={!collapsed ? { height: '160px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' } : {}}
                >
                    <Link to="/admin" className="sidebar-logo">
                        <img
                            src="/logo_xl.png?v=3"
                            alt="3M Motos"
                            className="sidebar-logo-img"
                            style={!collapsed ? { height: '120px', width: 'auto', objectFit: 'contain', display: 'block' } : {}}
                        />
                    </Link>
                    <button
                        className="collapse-btn"
                        onClick={() => setCollapsed(!collapsed)}
                        aria-label="Toggle sidebar"
                    >
                        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map(({ to, label, icon: Icon, end }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={end}
                            className={({ isActive }) =>
                                `sidebar-link ${isActive ? 'active' : ''}`
                            }
                        >
                            <Icon size={18} className="sidebar-link-icon" />
                            {!collapsed && <span>{label}</span>}
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <Link to="/" className="sidebar-link sidebar-link-sm">
                        <LogOut size={16} />
                        {!collapsed && <span>Ir al sitio</span>}
                    </Link>
                </div>
            </aside>

            {/* Main content */}
            <div className="admin-main">
                {/* Top bar */}
                <header className="admin-topbar">
                    <div className="topbar-left">
                        <span className="topbar-greeting">Panel de administración</span>
                    </div>
                    <div className="topbar-right">
                        <button className="btn btn-icon topbar-btn" aria-label="Notificaciones">
                            <Bell size={18} />
                        </button>
                        <div className="topbar-user">
                            <div className="user-avatar">A</div>
                            <span className="user-name">Admin</span>
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="admin-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
