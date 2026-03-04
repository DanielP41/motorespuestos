import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { mockVentas } from '../../data/mockData';

export default function Ventas() {
    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h2 className="page-title">Ventas</h2>
                    <p className="page-subtitle">{mockVentas.length} ventas registradas</p>
                </div>
                <button className="btn btn-primary"><Plus size={16} /> Nueva venta</button>
            </div>

            <div className="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Factura</th>
                            <th>Fecha</th>
                            <th>Cliente</th>
                            <th>Método pago</th>
                            <th>Total</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mockVentas.map(v => (
                            <tr key={v.id}>
                                <td style={{ fontFamily: 'monospace', color: 'var(--accent)', fontSize: '0.82rem' }}>{v.numero_factura}</td>
                                <td style={{ fontSize: '0.82rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>{new Date(v.fecha).toLocaleString('es-CO')}</td>
                                <td style={{ fontWeight: 500 }}>{v.cliente?.nombre ?? 'Mostrador'}</td>
                                <td style={{ textTransform: 'capitalize', fontSize: '0.82rem' }}>{v.metodo_pago.replace(/_/g, ' ')}</td>
                                <td style={{ fontWeight: 700 }}>${v.total.toLocaleString('es-CO')}</td>
                                <td>
                                    <span className={`badge ${v.estado === 'pagada' ? 'badge-success' :
                                            v.estado === 'en_credito' ? 'badge-warning' :
                                                v.estado === 'anulada' ? 'badge-danger' : 'badge-muted'
                                        }`}>{v.estado}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
