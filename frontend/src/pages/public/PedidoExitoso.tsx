import { useLocation, useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, ShoppingBag, ArrowRight } from 'lucide-react';
import './PedidoExitoso.css';

export default function PedidoExitoso() {
    const location = useLocation();
    const [searchParams] = useSearchParams();

    // Flujo estándar (efectivo, transferencia): datos vienen en location.state
    const stateData = (location.state as any) || {};

    // Flujo MercadoPago: datos vienen como query params del redirect de MP
    const paymentId = searchParams.get('payment_id');
    const externalRef = searchParams.get('external_reference'); // es el venta_id
    const mpStatus = searchParams.get('status');

    const esMercadoPago = !!paymentId;

    const numeroPedido = stateData.numeroPedido ?? (externalRef ? `#${externalRef}` : null);
    const total = stateData.total ?? null;
    const metodo = stateData.metodo ?? (esMercadoPago ? 'mercadopago' : null);

    return (
        <div className="pedido-exitoso-page">
            <div className="pedido-exitoso-card">
                <div className="pedido-check-circle">
                    <CheckCircle size={56} />
                </div>
                <h1>¡Pedido confirmado!</h1>
                <p className="pedido-subtitle">
                    {esMercadoPago
                        ? 'Tu pago fue procesado. Nos comunicaremos con vos para coordinar la entrega.'
                        : 'Tu pedido fue registrado. Nos comunicaremos con vos para coordinar la entrega.'
                    }
                </p>

                {(numeroPedido || paymentId) && (
                    <div className="pedido-info-box">
                        {numeroPedido && (
                            <div className="pedido-info-row">
                                <span>N° de pedido</span>
                                <span className="pedido-numero">{numeroPedido}</span>
                            </div>
                        )}
                        {paymentId && (
                            <div className="pedido-info-row">
                                <span>N° de pago MP</span>
                                <span className="pedido-numero">{paymentId}</span>
                            </div>
                        )}
                        {total && (
                            <div className="pedido-info-row">
                                <span>Total</span>
                                <span className="pedido-total">${total.toLocaleString('es-CO')}</span>
                            </div>
                        )}
                        {metodo && (
                            <div className="pedido-info-row">
                                <span>Método de pago</span>
                                <span style={{ textTransform: 'capitalize' }}>{metodo.replace(/_/g, ' ')}</span>
                            </div>
                        )}
                    </div>
                )}

                <div className="pedido-actions">
                    <Link to="/catalogo" className="btn btn-primary btn-lg">
                        <ShoppingBag size={18} /> Seguir comprando
                    </Link>
                    <Link to="/" className="btn btn-ghost btn-lg">
                        Ir al inicio <ArrowRight size={18} />
                    </Link>
                </div>
            </div>
        </div>
    );
}
