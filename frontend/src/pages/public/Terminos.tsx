import { ShieldCheck } from 'lucide-react';

export default function Terminos() {
    return (
        <div style={{ padding: '60px 0 100px' }}>
            <div className="container" style={{ maxWidth: 800 }}>
                <div style={{ marginBottom: 40, textAlign: 'center' }}>
                    <div className="accent-line" style={{ margin: '0 auto 16px' }} />
                    <h1>Términos de Servicio</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: 12 }}>Última actualización: 7 de marzo, 2026</p>
                </div>

                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 24, lineHeight: 1.7 }}>
                    <section>
                        <h3>1. Aceptación de los Términos</h3>
                        <p>Al acceder y utilizar este sitio web (3M Motos), usted acepta estar sujeto a estos Términos de Servicio. Si no está de acuerdo con alguna parte de estos términos, le rogamos que no utilice nuestro sitio.</p>
                    </section>

                    <section>
                        <h3>2. Uso del Sitio</h3>
                        <p>El contenido de este sitio es para su información general y uso personal. Está sujeto a cambios sin previo aviso. Queda prohibido el uso no autorizado de este sitio web, lo que puede dar lugar a una reclamación por daños y perjuicios.</p>
                    </section>

                    <section>
                        <h3>3. Propiedad Intelectual</h3>
                        <p>Todo el contenido, marcas comerciales, logotipos y gráficos en este sitio son propiedad de 3M Motos o se utilizan con permiso. La reproducción de cualquier parte está prohibida salvo previo acuerdo por escrito.</p>
                    </section>

                    <section>
                        <h3>4. Productos y Precios</h3>
                        <p>Nos esforzamos por mostrar con precisión los productos y sus precios. Sin embargo, nos reservamos el derecho de corregir errores tipográficos, inexactitudes u omisiones relacionadas con la disponibilidad y el precio en cualquier momento.</p>
                    </section>

                    <section>
                        <h3>5. Envíos y Garantías</h3>
                        <p>Los términos de envío y las garantías específicas se rigen por nuestras políticas comerciales vigentes. Los repuestos originales cuentan con las garantías oficiales de sus respectivos fabricantes.</p>
                    </section>

                    <section>
                        <h3>6. Limitación de Responsabilidad</h3>
                        <p>3M Motos no será responsable de ningún daño directo o indirecto resultante del uso o la imposibilidad de usar los productos adquiridos a través de este sitio, más allá de la garantía legal de los mismos.</p>
                    </section>

                    <div style={{ marginTop: 24, padding: 20, background: 'rgba(255,106,0,0.05)', borderRadius: 'var(--radius)', border: '1px solid rgba(255,106,0,0.1)' }}>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                            <ShieldCheck size={24} color="var(--accent)" />
                            <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 500 }}>Sus derechos como consumidor están protegidos bajo las leyes vigentes de defensa del consumidor.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
