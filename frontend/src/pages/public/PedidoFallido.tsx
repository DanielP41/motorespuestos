import { useSearchParams, Link } from 'react-router-dom';
import { XCircle, ShoppingCart, ArrowLeft } from 'lucide-react';
import './PedidoExitoso.css';

export default function PedidoFallido() {
    const [searchParams] = useSearchParams();
    const externalRef = searchParams.get('external_reference');

    return (
        <div className="pedido-exitoso-page">
            <div className="pedido-exitoso-card">
                <div className="pedido-check-circle" style={{ color: 'var(--danger, #e53e3e)' }}>
                    <XCircle size={56} />
                </div>
                <h1>Pago no completado</h1>
                <p className="pedido-subtitle">
                    No pudimos procesar tu pago. Podés intentarlo de nuevo o elegir otro método de pago.
                </p>

                {externalRef && (
                    <div className="pedido-info-box">
                        <div className="pedido-info-row">
                            <span>N° de pedido</span>
                            <span className="pedido-numero">#{externalRef}</span>
                        </div>
                    </div>
                )}

                <div className="pedido-actions">
                    <Link to="/carrito" className="btn btn-primary btn-lg">
                        <ShoppingCart size={18} /> Volver al carrito
                    </Link>
                    <Link to="/catalogo" className="btn btn-ghost btn-lg">
                        <ArrowLeft size={18} /> Ver catálogo
                    </Link>
                </div>
            </div>
        </div>
    );
}
