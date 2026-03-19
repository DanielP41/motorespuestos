import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';

// Layout components
import Navbar from './components/Navbar';
import AdminLayout from './components/AdminLayout';
import RequireAuth from './components/RequireAuth';

// Public pages
import Home from './pages/public/Home';
import Catalogo from './pages/public/Catalogo';
import ProductoDetalle from './pages/public/ProductoDetalle';
import Carrito from './pages/public/Carrito';
import Checkout from './pages/public/Checkout';
import PedidoExitoso from './pages/public/PedidoExitoso';
import Contacto from './pages/public/Contacto';
import Login from './pages/public/Login';
import Registro from './pages/public/Registro';
import MiCuenta from './pages/public/MiCuenta';
import Terminos from './pages/public/Terminos';
import Privacidad from './pages/public/Privacidad';
import RecuperarPassword from './pages/public/RecuperarPassword';
import ResetPassword from './pages/public/ResetPassword';
import PedidoFallido from './pages/public/PedidoFallido';
import PedidoPendiente from './pages/public/PedidoPendiente';

// Admin pages
import Dashboard from './pages/admin/Dashboard';
import Repuestos from './pages/admin/Repuestos';
import Inventario from './pages/admin/Inventario';
import Ventas from './pages/admin/Ventas';
import Clientes from './pages/admin/Clientes';
import Garantias from './pages/admin/Garantias';

// 404
import NotFound from './pages/NotFound';

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
            <AuthProvider>
                <CartProvider>
                    <Routes>
                        {/* Public routes */}
                        <Route element={<PublicLayout />}>
                            <Route path="/" element={<Home />} />
                            <Route path="/catalogo" element={<Catalogo />} />
                            <Route path="/catalogo/:id" element={<ProductoDetalle />} />
                            <Route path="/carrito" element={<Carrito />} />
                            <Route path="/checkout" element={<Checkout />} />
                            <Route path="/pedido-exitoso" element={<PedidoExitoso />} />
                            <Route path="/contacto" element={<Contacto />} />
                            <Route path="/terminos" element={<Terminos />} />
                            <Route path="/privacidad" element={<Privacidad />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/registro" element={<Registro />} />
                            <Route path="/recuperar-password" element={<RecuperarPassword />} />
                            <Route path="/reset-password" element={<ResetPassword />} />
                            <Route path="/pedido-fallido" element={<PedidoFallido />} />
                            <Route path="/pedido-pendiente" element={<PedidoPendiente />} />
                            <Route path="/mi-cuenta" element={
                                <RequireAuth role="cliente">
                                    <MiCuenta />
                                </RequireAuth>
                            } />
                        </Route>

                        {/* Admin routes — protected */}
                        <Route
                            path="/admin"
                            element={
                                <RequireAuth role="admin">
                                    <AdminLayout />
                                </RequireAuth>
                            }
                        >
                            <Route index element={<Dashboard />} />
                            <Route path="repuestos" element={<Repuestos />} />
                            <Route path="inventario" element={<Inventario />} />
                            <Route path="ventas" element={<Ventas />} />
                            <Route path="clientes" element={<Clientes />} />
                            <Route path="garantias" element={<Garantias />} />
                        </Route>

                        {/* 404 */}
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </CartProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}
