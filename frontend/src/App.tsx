import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { CartProvider } from './context/CartContext';

// Layout components
import Navbar from './components/Navbar';
import AdminLayout from './components/AdminLayout';

// Public pages
import Home from './pages/public/Home';
import Catalogo from './pages/public/Catalogo';
import ProductoDetalle from './pages/public/ProductoDetalle';
import Carrito from './pages/public/Carrito';
import Checkout from './pages/public/Checkout';
import PedidoConfirmado from './pages/public/PedidoConfirmado';
import Contacto from './pages/public/Contacto';

// Admin pages
import Dashboard from './pages/admin/Dashboard';
import Repuestos from './pages/admin/Repuestos';
import Inventario from './pages/admin/Inventario';
import Ventas from './pages/admin/Ventas';
import Clientes from './pages/admin/Clientes';
import Garantias from './pages/admin/Garantias';

// Public wrapper layout (navbar + outlet)
function PublicLayout() {
    return (
        <>
            <Navbar />
            <Outlet />
        </>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <CartProvider>
                <Routes>
                    {/* Public routes */}
                    <Route element={<PublicLayout />}>
                        <Route path="/" element={<Home />} />
                        <Route path="/catalogo" element={<Catalogo />} />
                        <Route path="/catalogo/:id" element={<ProductoDetalle />} />
                        <Route path="/carrito" element={<Carrito />} />
                        <Route path="/checkout" element={<Checkout />} />
                        <Route path="/pedido/:id" element={<PedidoConfirmado />} />
                        <Route path="/contacto" element={<Contacto />} />
                    </Route>

                    {/* Admin routes */}
                    <Route path="/admin" element={<AdminLayout />}>
                        <Route index element={<Dashboard />} />
                        <Route path="repuestos" element={<Repuestos />} />
                        <Route path="inventario" element={<Inventario />} />
                        <Route path="ventas" element={<Ventas />} />
                        <Route path="clientes" element={<Clientes />} />
                        <Route path="garantias" element={<Garantias />} />
                    </Route>
                </Routes>
            </CartProvider>
        </BrowserRouter>
    );
}
