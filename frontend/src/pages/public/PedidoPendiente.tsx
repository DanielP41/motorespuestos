import { useSearchParams, Link } from 'react-router-dom';
import { Clock, ShoppingBag } from 'lucide-react';
import './PedidoExitoso.css';

export default function PedidoPendiente() {
    const [searchParams] = useSearchParams();
    const paymentId = searchParams.get('payment_id');
    const externalRef = searchParams.get('external_reference');

    return (
        <div className="pedido-exitoso-page">
            <div className="pedido-exitoso-card">
                <div className="pedido-check-circle" style={{ color: 'var(--warning, #d69e2e)' }}>
                    <Clock size={56} />
                </div>
                <h1>Pago en proceso</h1>
                <p className="pedido-subtitle">
                    Tu pago está siendo procesado. Te notificaremos por email cuando se confirme. Esto puede demorar algunos minutos.
                </p>

                {(externalRef || paymentId) && (
                    <div className="pedido-info-box">
                        {externalRef && (
                            <div className="pedido-info-row">
                                <span>N° de pedido</span>
                                <span className="pedido-numero">#{externalRef}</span>
                            </div>
                        )}
                        {paymentId && (
                            <div className="pedido-info-row">
                                <span>N° de pago MP</span>
                                <span className="pedido-numero">{paymentId}</span>
                            </div>
                        )}
                    </div>
                )}

                <div className="pedido-actions">
                    <Link to="/catalogo" className="btn btn-primary btn-lg">
                        <ShoppingBag size={18} /> Seguir comprando
                    </Link>
                </div>
            </div>
        </div>
    );
}
