import { Lock } from 'lucide-react';

export default function Privacidad() {
    return (
        <div style={{ padding: '60px 0 100px' }}>
            <div className="container" style={{ maxWidth: 800 }}>
                <div style={{ marginBottom: 40, textAlign: 'center' }}>
                    <div className="accent-line" style={{ margin: '0 auto 16px' }} />
                    <h1>Política de Privacidad</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: 12 }}>Última actualización: 7 de marzo, 2026</p>
                </div>

                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 24, lineHeight: 1.7 }}>
                    <section>
                        <h3>1. Información que Recopilamos</h3>
                        <p>Recopilamos información personal que usted nos proporciona voluntariamente, como nombre, correo electrónico, número de teléfono y datos sobre su motocicleta cuando realiza una consulta o crea una cuenta.</p>
                    </section>

                    <section>
                        <h3>2. Uso de la Información</h3>
                        <p>Utilizamos la información recopilada para procesar sus pedidos, responder a sus consultas, enviarle información relevante sobre su compra y mejorar nuestros servicios y experiencia de usuario.</p>
                    </section>

                    <section>
                        <h3>3. Protección de Datos</h3>
                        <p>Implementamos medidas de seguridad para proteger sus datos personales contra el acceso no autorizado, la alteración o la divulgación ilícita. Su información nunca es vendida o compartida con terceros con fines comerciales.</p>
                    </section>

                    <section>
                        <h3>4. Uso de Cookies</h3>
                        <p>Nuestro sitio utiliza cookies para mejorar la navegación y recordar sus preferencias. Usted puede configurar su navegador para rechazar todas las cookies, aunque esto podría afectar algunas funcionalidades del sitio.</p>
                    </section>

                    <section>
                        <h3>5. Enlaces a Terceros</h3>
                        <p>Este sitio puede contener enlaces a otros sitios de interés. Sin embargo, una vez que abandone nuestro sitio, no tenemos control sobre el otro sitio y no somos responsables de la protección y privacidad de cualquier información que proporcione allí.</p>
                    </section>

                    <section>
                        <h3>6. Sus Derechos</h3>
                        <p>Usted tiene derecho a solicitar acceso, corrección o eliminación de sus datos personales que poseemos. Para hacerlo, puede ponerse en contacto con nosotros a través de los canales oficiales.</p>
                    </section>

                    <div style={{ marginTop: 24, padding: 20, background: 'rgba(52,152,219,0.05)', borderRadius: 'var(--radius)', border: '1px solid rgba(52,152,219,0.1)' }}>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                            <Lock size={24} color="#3498db" />
                            <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 500 }}>Su privacidad es nuestra prioridad absoluta. Tratamos sus datos con el máximo cuidado y respeto.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
