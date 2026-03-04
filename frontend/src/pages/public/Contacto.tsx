import { useState } from 'react';
import { MessageCircle, Phone, MapPin, Send, CheckCircle } from 'lucide-react';

export default function Contacto() {
    const [form, setForm] = useState({ nombre: '', email: '', telefono: '', moto: '', mensaje: '' });
    const [sent, setSent] = useState(false);

    const set = (field: string, val: string) => setForm(p => ({ ...p, [field]: val }));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSent(true);
    };

    return (
        <div style={{ padding: '60px 0 80px' }}>
            <div className="container">
                {/* Header */}
                <div style={{ marginBottom: 48, maxWidth: 520 }}>
                    <div className="accent-line" style={{ marginBottom: 16 }} />
                    <h1>Contacto</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: 12, lineHeight: 1.7 }}>
                        ¿Necesitás un repuesto que no encontrás en el catálogo? ¿Tenés dudas sobre compatibilidad?
                        Escribinos y te respondemos rápido.
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 32, alignItems: 'start' }}>
                    {/* Form */}
                    {sent ? (
                        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: 48, textAlign: 'center' }}>
                            <CheckCircle size={48} color="#2ecc71" />
                            <h3>¡Mensaje enviado!</h3>
                            <p style={{ color: 'var(--text-secondary)' }}>Te respondemos en menos de 24 horas.</p>
                            <button className="btn btn-secondary" onClick={() => setSent(false)}>Enviar otro</button>
                        </div>
                    ) : (
                        <form className="card" style={{ display: 'flex', flexDirection: 'column', gap: 18 }} onSubmit={handleSubmit}>
                            <div className="grid-2">
                                <div className="form-group">
                                    <label className="form-label">Nombre *</label>
                                    <input className="form-control" required value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Juan García" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Teléfono</label>
                                    <input className="form-control" value={form.telefono} onChange={e => set('telefono', e.target.value)} placeholder="300 123 4567" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email *</label>
                                <input className="form-control" type="email" required value={form.email} onChange={e => set('email', e.target.value)} placeholder="tu@email.com" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Moto (marca y modelo)</label>
                                <input className="form-control" value={form.moto} onChange={e => set('moto', e.target.value)} placeholder="Honda CG 150 2020" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Mensaje *</label>
                                <textarea className="form-control" required rows={5} value={form.mensaje}
                                    onChange={e => set('mensaje', e.target.value)}
                                    placeholder="Describí el repuesto que buscás, el problema de tu moto, etc." />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                                <Send size={16} /> Enviar mensaje
                            </button>
                        </form>
                    )}

                    {/* Info */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <h4>Medios de contacto</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <a href="https://wa.me/573001234567" target="_blank" rel="noreferrer" className="contact-info-row">
                                    <div className="contact-info-icon" style={{ background: 'rgba(39,174,96,0.15)', color: '#2ecc71', border: '1px solid rgba(39,174,96,0.3)' }}>
                                        <MessageCircle size={18} />
                                    </div>
                                    <div>
                                        <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>WhatsApp</p>
                                        <p style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>+57 300 123 4567</p>
                                    </div>
                                </a>
                                <div className="contact-info-row">
                                    <div className="contact-info-icon">
                                        <Phone size={18} />
                                    </div>
                                    <div>
                                        <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>Teléfono fijo</p>
                                        <p style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>601 234 5678</p>
                                    </div>
                                </div>
                                <div className="contact-info-row">
                                    <div className="contact-info-icon">
                                        <MapPin size={18} />
                                    </div>
                                    <div>
                                        <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>Local</p>
                                        <p style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>Carrera 40 #15-20, Bogotá</p>
                                        <p style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>Lun–Sáb 8:00 am – 6:00 pm</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card" style={{ background: 'rgba(255,106,0,0.05)', borderColor: 'rgba(255,106,0,0.2)' }}>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                <strong style={{ color: 'var(--accent)' }}>Respuesta rápida:</strong> En horario de atención respondemos en menos de 1 hora por WhatsApp.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
        .contact-info-row {
          display: flex;
          align-items: center;
          gap: 14px;
          text-decoration: none;
          color: inherit;
          transition: var(--transition);
        }
        .contact-info-row:hover { opacity: 0.8; }
        .contact-info-icon {
          width: 40px;
          height: 40px;
          border-radius: var(--radius);
          background: var(--surface-2);
          border: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent);
          flex-shrink: 0;
        }
      `}</style>
        </div>
    );
}
