import { useState } from 'react';
import { Plus, Search, CreditCard } from 'lucide-react';
import { mockClientes } from '../../data/mockData';

export default function Clientes() {
    const [q, setQ] = useState('');

    const results = mockClientes.filter(c =>
        c.nombre.toLowerCase().includes(q.toLowerCase()) ||
        c.documento_nro.includes(q)
    );

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h2 className="page-title">Clientes</h2>
                    <p className="page-subtitle">{mockClientes.length} clientes registrados</p>
                </div>
                <button className="btn btn-primary"><Plus size={16} /> Nuevo cliente</button>
            </div>

            <div className="search-bar" style={{ maxWidth: 360, marginBottom: 20 }}>
                <Search size={16} className="text-muted" />
                <input type="text" placeholder="Buscar por nombre o documento..." value={q} onChange={e => setQ(e.target.value)} />
            </div>

            <div className="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Documento</th>
                            <th>Nombre</th>
                            <th>Tipo</th>
                            <th>Teléfono</th>
                            <th>Crédito</th>
                            <th>Saldo deuda</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {results.map(c => (
                            <tr key={c.id}>
                                <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--muted)' }}>{c.documento_tipo} {c.documento_nro}</td>
                                <td style={{ fontWeight: 600, color: 'var(--text)' }}>{c.nombre}</td>
                                <td><span className="badge badge-muted">{c.tipo === 'N' ? 'Natural' : 'Jurídico'}</span></td>
                                <td>{c.telefono ?? '—'}</td>
                                <td>
                                    {c.credito_habilitado
                                        ? <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><CreditCard size={13} color="var(--accent)" /> ${c.limite_credito.toLocaleString('es-CO')}</span>
                                        : <span style={{ color: 'var(--muted)' }}>—</span>}
                                </td>
                                <td style={{ fontWeight: c.saldo_credito > 0 ? 700 : 400, color: c.saldo_credito > 0 ? '#e74c3c' : 'var(--muted)' }}>
                                    {c.saldo_credito > 0 ? `$${c.saldo_credito.toLocaleString('es-CO')}` : '—'}
                                </td>
                                <td><span className={`badge ${c.activo ? 'badge-success' : 'badge-muted'}`}>{c.activo ? 'Activo' : 'Inactivo'}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
