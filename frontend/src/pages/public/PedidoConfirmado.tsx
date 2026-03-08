import { Link, useParams } from 'react-router-dom';
import { CheckCircle, Package, Home } from 'lucide-react';

export default function PedidoConfirmado() {
    const { id } = useParams();

    return (
        <div className="container" style={{ padding: '80px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(39,174,96,0.15)', border: '1px solid rgba(39,174,96,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle size={40} color="#2ecc71" />
            </div>

            <div>
                <h1 style={{ marginBottom: 8 }}>¡Pedido confirmado!</h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Tu pedido <strong style={{ color: 'var(--accent)' }}>#{id}</strong> fue recibido correctamente.
                </p>
            </div>

            <div className="card" style={{ maxWidth: 480, width: '100%', textAlign: 'left' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <Package size={20} color="var(--accent)" style={{ flexShrink: 0, marginTop: 2 }} />
                        <div>
                            <p style={{ fontWeight: 600, marginBottom: 4 }}>¿Qué pasa ahora?</p>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6 }}>
                                Te contactaremos a la brevedad para coordinar el pago y el envío. Revisá tu email
                                y teléfono para recibir las instrucciones.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                <Link to="/" className="btn btn-secondary">
                    <Home size={16} /> Ir al inicio
                </Link>
                <Link to="/catalogo" className="btn btn-primary">
                    Seguir comprando
                </Link>
            </div>
        </div>
    );
}
