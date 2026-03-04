import { useState } from 'react';
import { Search, Plus, Edit, AlertTriangle } from 'lucide-react';
import { mockRepuestos } from '../../data/mockData';
import { Repuesto } from '../../types/types';

function getStockClass(r: Repuesto) {
    if (r.stock_actual === 0) return 'badge-danger';
    if (r.stock_actual < r.stock_minimo) return 'badge-warning';
    return 'badge-success';
}

function getStockLabel(r: Repuesto) {
    if (r.stock_actual === 0) return 'Agotado';
    if (r.stock_actual < r.stock_minimo) return 'Stock bajo';
    return 'En stock';
}

export default function Repuestos() {
    const [q, setQ] = useState('');

    const results = mockRepuestos.filter(r =>
        r.nombre.toLowerCase().includes(q.toLowerCase()) ||
        r.sku.toLowerCase().includes(q.toLowerCase())
    );

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h2 className="page-title">Repuestos</h2>
                    <p className="page-subtitle">{mockRepuestos.length} productos en el catálogo</p>
                </div>
                <button className="btn btn-primary">
                    <Plus size={16} /> Nuevo repuesto
                </button>
            </div>

            {/* Search */}
            <div className="search-bar" style={{ maxWidth: 360, marginBottom: 20 }}>
                <Search size={16} className="text-muted" />
                <input
                    type="text"
                    placeholder="Buscar por nombre o SKU..."
                    value={q}
                    onChange={e => setQ(e.target.value)}
                />
            </div>

            <div className="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>SKU</th>
                            <th>Nombre</th>
                            <th>Categoría</th>
                            <th>Precio venta</th>
                            <th>Stock</th>
                            <th>Estado</th>
                            <th>Tipo</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {results.map(r => (
                            <tr key={r.id}>
                                <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--accent)' }}>{r.sku}</td>
                                <td style={{ fontWeight: 600, color: 'var(--text)' }}>{r.nombre}</td>
                                <td>{r.categoria?.nombre}</td>
                                <td style={{ fontWeight: 600 }}>${r.precio_venta.toLocaleString('es-CO')}</td>
                                <td>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        {r.stock_actual < r.stock_minimo && <AlertTriangle size={13} color="#f39c12" />}
                                        {r.stock_actual}
                                    </span>
                                </td>
                                <td><span className={`badge ${getStockClass(r)}`}>{getStockLabel(r)}</span></td>
                                <td>
                                    <span className={`badge ${r.es_original ? 'badge-original' : 'badge-muted'}`}>
                                        {r.es_original ? 'Original' : 'Alternativo'}
                                    </span>
                                </td>
                                <td>
                                    <button className="btn btn-icon btn-ghost">
                                        <Edit size={14} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
