import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
    return (
        <div style={{
            minHeight: '100vh', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 24,
            padding: 24, textAlign: 'center', background: 'var(--bg)'
        }}>
            <div style={{
                fontFamily: 'var(--font-display)', fontSize: 'clamp(6rem, 20vw, 12rem)',
                fontWeight: 900, lineHeight: 1, color: 'var(--surface-2)',
                textShadow: '0 0 80px rgba(255,106,0,0.15)',
                letterSpacing: '-0.05em',
            }}>
                404
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 400 }}>
                <h2>Página no encontrada</h2>
                <p className="text-muted" style={{ lineHeight: 1.6 }}>
                    La página que buscás no existe o fue movida.
                </p>
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                <button className="btn btn-ghost" onClick={() => history.back()}>
                    <ArrowLeft size={16} /> Volver
                </button>
                <Link to="/" className="btn btn-primary">
                    <Home size={16} /> Ir al inicio
                </Link>
            </div>
        </div>
    );
}
