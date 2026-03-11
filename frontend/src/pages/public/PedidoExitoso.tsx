import { useLocation, Link } from 'react-router-dom';
import { CheckCircle, ShoppingBag, ArrowRight } from 'lucide-react';
import './PedidoExitoso.css';

export default function PedidoExitoso() {
    const location = useLocation();
    const { numeroPedido, total, metodo } = (location.state as any) || {};

    return (
        <div className="pedido-exitoso-page">
            <div className="pedido-exitoso-card">
                <div className="pedido-check-circle">
                    <CheckCircle size={56} />
                </div>
                <h1>¡Pedido confirmado!</h1>
                <p className="pedido-subtitle">
                    Tu pedido ha sido registrado exitosamente. Nos comunicaremos con vos pronto para coordinar la entrega.
                </p>

                {numeroPedido && (
                    <div className="pedido-info-box">
                        <div className="pedido-info-row">
                            <span>N° de pedido</span>
                            <span className="pedido-numero">{numeroPedido}</span>
                        </div>
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
