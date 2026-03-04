import { mockMovimientos } from '../../data/mockData';
import { ArrowUp, ArrowDown, RefreshCw } from 'lucide-react';

const tipoIcon = {
    entrada: <ArrowUp size={14} color="#2ecc71" />,
    salida: <ArrowDown size={14} color="#e74c3c" />,
    ajuste: <RefreshCw size={14} color="#f39c12" />,
    devolucion: <ArrowUp size={14} color="#3498db" />,
};

export default function Inventario() {
    return (
        <div>
            <div className="page-header">
                <h2 className="page-title">Inventario</h2>
                <p className="page-subtitle">Historial de movimientos de stock</p>
            </div>

            <div className="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Repuesto</th>
                            <th>SKU</th>
                            <th>Tipo</th>
                            <th>Cantidad</th>
                            <th>Stock anterior</th>
                            <th>Stock posterior</th>
                            <th>Referencia</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mockMovimientos.map(m => (
                            <tr key={m.id}>
                                <td style={{ fontSize: '0.8rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                                    {new Date(m.creado_en).toLocaleString('es-CO')}
                                </td>
                                <td style={{ fontWeight: 600, color: 'var(--text)' }}>{m.repuesto?.nombre}</td>
                                <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--accent)' }}>{m.repuesto?.sku}</td>
                                <td>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, textTransform: 'capitalize' }}>
                                        {tipoIcon[m.tipo]}
                                        {m.tipo}
                                    </span>
                                </td>
                                <td style={{ fontWeight: 700, color: m.cantidad > 0 ? '#2ecc71' : '#e74c3c' }}>
                                    {m.cantidad > 0 ? `+${m.cantidad}` : m.cantidad}
                                </td>
                                <td>{m.stock_anterior}</td>
                                <td style={{ fontWeight: 600 }}>{m.stock_posterior}</td>
                                <td style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                                    {m.referencia_tipo ?? '—'}
                                    {m.referencia_id ? ` #${m.referencia_id}` : ''}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
