import { useState, useEffect } from 'react';
import { Plus, Search, CreditCard, Loader2, X, Save, Edit } from 'lucide-react';
import { getClientes, crearCliente, actualizarCliente } from '../../services/api';
import { Toast } from '../../components/UI';

type Cliente = {
    id?: number;
    nombre: string;
    tipo: 'N' | 'J';
    documento_tipo: string;
    documento_nro: string;
    email?: string;
    telefono?: string;
    credito_habilitado: boolean;
    limite_credito: number;
    saldo_credito: number;
    activo: boolean;
    password?: string;
};

const DEFAULT_CLIENTE: Cliente = {
    nombre: '',
    tipo: 'N',
    documento_tipo: 'CC',
    documento_nro: '',
    email: '',
    telefono: '',
    credito_habilitado: false,
    limite_credito: 0,
    saldo_credito: 0,
    activo: true,
    password: '12345678',
};

export default function Clientes() {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [q, setQ] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Cliente | null>(null);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [toast, setToast] = useState('');

    const loadData = async (search?: string) => {
        setLoading(true);
        setError('');
        try {
            const data = await getClientes(search);
            setClientes(data);
        } catch (err: any) {
            setError('Error al cargar clientes: ' + (err.message || 'Error desconocido'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const handleSearch = (val: string) => {
        setQ(val);
        if (val.length > 1 || val.length === 0) {
            loadData(val || undefined);
        }
    };

    const handleOpenModal = (c?: Cliente) => {
        setEditing(c ? { ...c } : { ...DEFAULT_CLIENTE });
        setSaveError('');
        setShowModal(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editing) return;
        setSaving(true);
        setSaveError('');
        try {
            if (editing.id) {
                await actualizarCliente(editing.id, editing);
            } else {
                await crearCliente(editing);
            }
            setShowModal(false);
            setToast(editing.id ? 'Cliente actualizado correctamente' : 'Cliente creado correctamente');
            loadData();
        } catch (err: any) {
            setSaveError(err.message || 'Error al guardar el cliente.');
        } finally {
            setSaving(false);
        }
    };

    const set = (field: keyof Cliente, val: any) =>
        setEditing(prev => prev ? { ...prev, [field]: val } : prev);

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h2 className="page-title">Clientes</h2>
                    <p className="page-subtitle">{clientes.length} clientes registrados</p>
                </div>
                <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                    <Plus size={16} /> Nuevo cliente
                </button>
            </div>

            <div className="search-bar" style={{ maxWidth: 360, marginBottom: 20 }}>
                <Search size={16} className="text-muted" />
                <input
                    type="text"
                    placeholder="Buscar por nombre o documento..."
                    value={q}
                    onChange={e => handleSearch(e.target.value)}
                />
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '100px 0' }}>
                    <Loader2 className="spinner" size={40} />
                    <p className="text-muted mt-3">Cargando clientes...</p>
                </div>
            ) : error ? (
                <div className="alert alert-danger">{error}</div>
            ) : (
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
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {clientes.map(c => (
                                <tr key={c.id}>
                                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--muted)' }}>
                                        {c.documento_tipo} {c.documento_nro}
                                    </td>
                                    <td style={{ fontWeight: 600, color: 'var(--text)' }}>{c.nombre}</td>
                                    <td><span className="badge badge-muted">{c.tipo === 'N' ? 'Natural' : 'Jurídico'}</span></td>
                                    <td>{c.telefono ?? '—'}</td>
                                    <td>
                                        {c.credito_habilitado
                                            ? <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                                <CreditCard size={13} color="var(--accent)" />
                                                ${(c.limite_credito || 0).toLocaleString('es-CO')}
                                            </span>
                                            : <span style={{ color: 'var(--muted)' }}>—</span>}
                                    </td>
                                    <td style={{ fontWeight: c.saldo_credito > 0 ? 700 : 400, color: c.saldo_credito > 0 ? '#e74c3c' : 'var(--muted)' }}>
                                        {c.saldo_credito > 0 ? `$${c.saldo_credito.toLocaleString('es-CO')}` : '—'}
                                    </td>
                                    <td>
                                        <span className={`badge ${c.activo ? 'badge-success' : 'badge-muted'}`}>
                                            {c.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td>
                                        <button className="btn btn-icon btn-ghost" onClick={() => handleOpenModal(c)}>
                                            <Edit size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {clientes.length === 0 && (
                                <tr>
                                    <td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
                                        No hay clientes registrados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {showModal && editing && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: 560 }}>
                        <div className="modal-header">
                            <h3>{editing.id ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
                            <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSave} className="modal-body">
                            <div className="grid-2">
                                <div className="form-group">
                                    <label className="form-label">Nombre completo *</label>
                                    <input className="form-control" required value={editing.nombre}
                                        onChange={e => set('nombre', e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Tipo de persona</label>
                                    <select className="form-control" value={editing.tipo} onChange={e => set('tipo', e.target.value)}>
                                        <option value="N">Natural</option>
                                        <option value="J">Jurídica</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid-2">
                                <div className="form-group">
                                    <label className="form-label">Tipo documento</label>
                                    <select className="form-control" value={editing.documento_tipo} onChange={e => set('documento_tipo', e.target.value)}>
                                        <option value="CC">CC</option>
                                        <option value="NIT">NIT</option>
                                        <option value="CE">CE</option>
                                        <option value="PAS">PAS</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Número documento *</label>
                                    <input className="form-control" required value={editing.documento_nro}
                                        onChange={e => set('documento_nro', e.target.value)} />
                                </div>
                            </div>
                            <div className="grid-2">
                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <input className="form-control" type="email" value={editing.email || ''}
                                        onChange={e => set('email', e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Teléfono</label>
                                    <input className="form-control" value={editing.telefono || ''}
                                        onChange={e => set('telefono', e.target.value)} />
                                </div>
                            </div>
                            {!editing.id && (
                                <div className="form-group">
                                    <label className="form-label">Contraseña inicial</label>
                                    <input className="form-control" value={editing.password || ''}
                                        onChange={e => set('password', e.target.value)} />
                                </div>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                <input type="checkbox" id="credito" checked={editing.credito_habilitado}
                                    onChange={e => set('credito_habilitado', e.target.checked)} />
                                <label htmlFor="credito" className="form-label" style={{ margin: 0 }}>Habilitar crédito</label>
                            </div>
                            {editing.credito_habilitado && (
                                <div className="form-group">
                                    <label className="form-label">Límite de crédito ($)</label>
                                    <input className="form-control" type="number" value={editing.limite_credito}
                                        onChange={e => set('limite_credito', Number(e.target.value))} />
                                </div>
                            )}
                            {saveError && <div className="alert alert-danger" style={{ marginBottom: 12 }}>{saveError}</div>}
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? <Loader2 className="spinner" size={16} /> : <Save size={16} />}
                                    {' '}{editing.id ? 'Guardar cambios' : 'Crear cliente'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {toast && <Toast message={toast} onClose={() => setToast('')} />}

            <style>{`
                .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
                .modal-content { background: var(--surface); border-radius: var(--radius-lg); width: 100%; max-height: 90vh; display: flex; flex-direction: column; border: 1px solid var(--surface-3); box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
                .modal-header { padding: 20px; border-bottom: 1px solid var(--surface-3); display: flex; justify-content: space-between; align-items: center; }
                .modal-body { padding: 20px; overflow-y: auto; }
                .modal-footer { padding: 20px; border-top: 1px solid var(--surface-3); display: flex; justify-content: flex-end; gap: 12px; }
                .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 4px; }
            `}</style>
        </div>
    );
}
