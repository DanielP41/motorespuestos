import { useState, useEffect } from 'react';
import { getGarantias, crearGarantia } from '../../services/api';
import { Plus, Loader2, X, Save } from 'lucide-react';

function getDaysLeft(fecha: string) {
    const diff = new Date(fecha).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function Garantias() {
    const [garantias, setGarantias] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newGarantia, setNewGarantia] = useState({
        venta_detalle_id: '',
        cliente_id: '',
        repuesto_id: '',
        fecha_vencimiento: '',
        descripcion_falla: '',
    });
    const [saving, setSaving] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getGarantias();
            setGarantias(data);
        } catch (err) {
            console.error('Error loading warranties:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await crearGarantia({
                ...newGarantia,
                venta_detalle_id: parseInt(newGarantia.venta_detalle_id),
                cliente_id: parseInt(newGarantia.cliente_id),
                repuesto_id: parseInt(newGarantia.repuesto_id),
                dias_garantia: 90
            });
            setShowModal(false);
            setNewGarantia({
                venta_detalle_id: '',
                cliente_id: '',
                repuesto_id: '',
                fecha_vencimiento: '',
                descripcion_falla: '',
            });
            loadData();
        } catch (err) {
            console.error('Error creating warranty:', err);
            alert('Error al crear la garantía. Verificá que los IDs existan.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h2 className="page-title">Garantías</h2>
                    <p className="page-subtitle">{garantias.length} garantías en el sistema real</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={16} /> Nueva garantía
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '100px 0' }}>
                    <Loader2 className="spinner" size={40} />
                    <p className="text-muted mt-3">Consultando base de datos...</p>
                </div>
            ) : (
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>ID Detalle</th>
                                <th>Apertura</th>
                                <th>Vencimiento</th>
                                <th>Días restantes</th>
                                <th>Estado</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {garantias.map(g => {
                                const daysLeft = getDaysLeft(g.fecha_vencimiento);
                                return (
                                    <tr key={g.id}>
                                        <td style={{ fontFamily: 'monospace', color: 'var(--accent)', fontSize: '0.82rem' }}>GAR-{String(g.id).padStart(4, '0')}</td>
                                        <td>#{g.venta_detalle_id} {g.descripcion_falla && <span className="text-muted">— {g.descripcion_falla}</span>}</td>
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
                                        <td></td>
                                    </tr>
                                );
                            })}
                            {garantias.length === 0 && (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
                                        No hay garantías activas.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: 500 }}>
                        <div className="modal-header">
                            <h3>Nueva Garantía</h3>
                            <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSave} className="modal-body">
                            <div className="grid-2">
                                <div className="form-group">
                                    <label className="form-label">ID Venta Detalle *</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        required
                                        value={newGarantia.venta_detalle_id}
                                        onChange={e => setNewGarantia({ ...newGarantia, venta_detalle_id: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">ID Cliente *</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        required
                                        value={newGarantia.cliente_id}
                                        onChange={e => setNewGarantia({ ...newGarantia, cliente_id: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid-2">
                                <div className="form-group">
                                    <label className="form-label">ID Repuesto *</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        required
                                        value={newGarantia.repuesto_id}
                                        onChange={e => setNewGarantia({ ...newGarantia, repuesto_id: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Fecha Vencimiento *</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        required
                                        value={newGarantia.fecha_vencimiento}
                                        onChange={e => setNewGarantia({ ...newGarantia, fecha_vencimiento: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Descripción de la falla *</label>
                                <textarea
                                    className="form-control"
                                    required
                                    rows={3}
                                    value={newGarantia.descripcion_falla}
                                    onChange={e => setNewGarantia({ ...newGarantia, descripcion_falla: e.target.value })}
                                    placeholder="Detalle el problema reportado por el cliente..."
                                />
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? <Loader2 className="spinner" size={16} /> : <Save size={16} />}
                                    {saving ? ' Guardando...' : ' Registrar Garantía'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.7);
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    padding: 20px;
                }
                .modal-content {
                    background: var(--surface);
                    border-radius: var(--radius-lg);
                    width: 100%;
                    max-height: 90vh;
                    display: flex;
                    flex-direction: column;
                    border: 1px solid var(--surface-3);
                    box-shadow: 0 20px 50px rgba(0,0,0,0.5);
                }
                .modal-header {
                    padding: 20px;
                    border-bottom: 1px solid var(--surface-3);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .modal-body {
                    padding: 20px;
                    overflow-y: auto;
                }
                .modal-footer {
                    padding: 20px;
                    border-top: 1px solid var(--surface-3);
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                }
                .grid-2 {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                }
            `}</style>
        </div>
    );
}
