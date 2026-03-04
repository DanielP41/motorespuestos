import { mockGarantias } from '../../data/mockData';
import { Plus } from 'lucide-react';

function getDaysLeft(fecha: string) {
    const diff = new Date(fecha).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function Garantias() {
    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h2 className="page-title">Garantías</h2>
                    <p className="page-subtitle">{mockGarantias.length} garantías registradas</p>
                </div>
                <button className="btn btn-primary"><Plus size={16} /> Nueva garantía</button>
            </div>

            <div className="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Cliente</th>
                            <th>Repuesto</th>
                            <th>Falla reportada</th>
                            <th>Apertura</th>
                            <th>Vencimiento</th>
                            <th>Días restantes</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mockGarantias.map(g => {
                            const daysLeft = getDaysLeft(g.fecha_vencimiento);
                            return (
                                <tr key={g.id}>
                                    <td style={{ fontFamily: 'monospace', color: 'var(--accent)', fontSize: '0.82rem' }}>GAR-{String(g.id).padStart(4, '0')}</td>
                                    <td style={{ fontWeight: 600 }}>{g.cliente?.nombre}</td>
                                    <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{g.repuesto?.nombre}</td>
                                    <td style={{ fontSize: '0.8rem', color: 'var(--muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.descripcion_falla}</td>
                                    <td style={{ fontSize: '0.8rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>{new Date(g.fecha_apertura).toLocaleDateString('es-CO')}</td>
                                    <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{g.fecha_vencimiento}</td>
                                    <td>
                                        <span style={{ fontWeight: 700, color: daysLeft <= 7 ? '#e74c3c' : daysLeft <= 30 ? '#f39c12' : '#2ecc71' }}>
                                            {daysLeft} días
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge ${g.estado === 'abierta' ? 'badge-warning' :
                                                g.estado === 'en_proceso' ? 'badge-accent' :
                                                    g.estado === 'resuelta' ? 'badge-success' : 'badge-muted'
                                            }`}>{g.estado.replace('_', ' ')}</span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
