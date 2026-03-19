import { useState, useEffect } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import { Search, Plus, Edit, AlertTriangle, Loader2, X, Save } from 'lucide-react';
import { getRepuestos, crearRepuesto, actualizarRepuesto, getCategoriasRaiz, getMarcas } from '../../services/api';
import { Repuesto } from '../../types/types';
import ImageUpload from '../../components/common/ImageUpload';
import { Toast } from '../../components/UI';

function getStockClass(r: Repuesto) {
    if (r.stock_actual === 0) return 'badge-danger';
    if (r.stock_actual < 5) return 'badge-warning';
    return 'badge-success';
}

function getStockLabel(r: Repuesto) {
    if (r.stock_actual === 0) return 'Agotado';
    if (r.stock_actual < 5) return 'Stock bajo';
    return 'En stock';
}

export default function Repuestos() {
    const [q, setQ] = useState('');
    const debouncedQ = useDebounce(q, 350);
    const [repuestos, setRepuestos] = useState<Repuesto[]>([]);
    const [categorias, setCategorias] = useState<{ id: number; nombre: string }[]>([]);
    const [marcas, setMarcas] = useState<{ id: number; nombre: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [toast, setToast] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingRepuesto, setEditingRepuesto] = useState<Partial<Repuesto> | null>(null);

    const loadData = async (search?: string) => {
        setLoading(true);
        try {
            const [data, cats, marcasList] = await Promise.all([
                getRepuestos(search ? { search } : {}),
                getCategoriasRaiz(),
                getMarcas(),
            ]);
            setRepuestos(data);
            setCategorias(cats);
            setMarcas(marcasList);
        } catch (err) {
            console.error('Error loading repuestos:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData(debouncedQ || undefined);
    }, [debouncedQ]);

    const handleOpenModal = (rep?: Repuesto) => {
        setEditingRepuesto(rep || {
            nombre: '',
            sku: '',
            precio_venta: 0,
            stock_actual: 0,
            categoria_id: categorias[0]?.id,
            marca_id: marcas[0]?.id as any,
            es_original: true,
            imagen_url: ''
        } as Partial<Repuesto>);
        setSaveError('');
        setShowModal(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingRepuesto) return;
        setSaving(true);
        setSaveError('');

        try {
            if (editingRepuesto.id) {
                await actualizarRepuesto(editingRepuesto.id, editingRepuesto);
            } else {
                await crearRepuesto(editingRepuesto);
            }
            setShowModal(false);
            setToast(editingRepuesto.id ? 'Repuesto actualizado correctamente' : 'Repuesto creado correctamente');
            loadData();
        } catch (err: any) {
            setSaveError(err.message || 'Error al guardar el producto.');
        } finally {
            setSaving(false);
        }
    };

    const results = repuestos;

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h2 className="page-title">Inventario de Repuestos</h2>
                    <p className="page-subtitle">{repuestos.length} productos en el sistema físico</p>
                </div>
                <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                    <Plus size={16} /> Nuevo repuesto
                </button>
            </div>

            <div className="search-bar" style={{ maxWidth: 360, marginBottom: 20 }}>
                <Search size={16} className="text-muted" />
                <input
                    type="text"
                    placeholder="Buscar por nombre o SKU..."
                    value={q}
                    onChange={e => setQ(e.target.value)}
                />
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '100px 0' }}>
                    <Loader2 className="spinner" size={40} />
                    <p className="text-muted mt-3">Consultando inventario real...</p>
                </div>
            ) : (
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Foto</th>
                                <th>SKU</th>
                                <th>Nombre</th>
                                <th>Precio</th>
                                <th>Stock</th>
                                <th>Estado</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.map(r => (
                                <tr key={r.id}>
                                    <td>
                                        <img
                                            src={r.imagen_url || 'https://via.placeholder.com/40'}
                                            alt=""
                                            style={{ width: 40, height: 40, borderRadius: 4, objectFit: 'cover' }}
                                        />
                                    </td>
                                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--accent)' }}>{r.sku}</td>
                                    <td style={{ fontWeight: 600, color: 'var(--text)' }}>{r.nombre}</td>
                                    <td style={{ fontWeight: 600 }}>${(r.precio_venta || 0).toLocaleString('es-CO')}</td>
                                    <td>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            {r.stock_actual < 5 && <AlertTriangle size={13} color="#f39c12" />}
                                            {r.stock_actual}
                                        </span>
                                    </td>
                                    <td><span className={`badge ${getStockClass(r)}`}>{getStockLabel(r)}</span></td>
                                    <td>
                                        <button className="btn btn-icon btn-ghost" onClick={() => handleOpenModal(r)}>
                                            <Edit size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && editingRepuesto && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: 600 }}>
                        <div className="modal-header">
                            <h3>{editingRepuesto.id ? 'Editar Repuesto' : 'Nuevo Repuesto'}</h3>
                            <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSave} className="modal-body">
                            <div className="grid-2">
                                <div className="form-group">
                                    <label className="form-label">Nombre del producto</label>
                                    <input
                                        className="form-control"
                                        required
                                        value={editingRepuesto.nombre || ''}
                                        onChange={e => setEditingRepuesto({ ...editingRepuesto, nombre: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">SKU / Código</label>
                                    <input
                                        className="form-control"
                                        required
                                        value={editingRepuesto.sku || ''}
                                        onChange={e => setEditingRepuesto({ ...editingRepuesto, sku: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid-2">
                                <div className="form-group">
                                    <label className="form-label">Categoría</label>
                                    <select
                                        className="form-control"
                                        required
                                        value={editingRepuesto.categoria_id || ''}
                                        onChange={e => setEditingRepuesto({ ...editingRepuesto, categoria_id: Number(e.target.value) })}
                                    >
                                        <option value="">Seleccionar...</option>
                                        {categorias.map(c => (
                                            <option key={c.id} value={c.id}>{c.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Marca</label>
                                    <select
                                        className="form-control"
                                        value={editingRepuesto.marca_id || ''}
                                        onChange={e => setEditingRepuesto({ ...editingRepuesto, marca_id: Number(e.target.value) })}
                                    >
                                        <option value="">Sin marca</option>
                                        {marcas.map(m => (
                                            <option key={m.id} value={m.id}>{m.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid-2">
                                <div className="form-group">
                                    <label className="form-label">Precio de Venta</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        required
                                        value={editingRepuesto.precio_venta || 0}
                                        onChange={e => setEditingRepuesto({ ...editingRepuesto, precio_venta: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Stock Actual</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        required
                                        value={editingRepuesto.stock_actual || 0}
                                        onChange={e => setEditingRepuesto({ ...editingRepuesto, stock_actual: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div style={{ marginTop: 20 }}>
                                <label className="form-label" style={{ marginBottom: 10, display: 'block' }}>Imagen del Producto</label>
                                <ImageUpload
                                    value={editingRepuesto.imagen_url || ''}
                                    onChange={(url) => setEditingRepuesto({ ...editingRepuesto, imagen_url: url })}
                                />
                            </div>

                            {saveError && <div className="alert alert-danger" style={{ marginTop: 20, marginBottom: 0 }}>{saveError}</div>}
                            
                            <div className="modal-footer" style={{ marginTop: 20 }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? <Loader2 className="spinner" size={16} /> : <Save size={16} />}
                                    {' '}{saving ? 'Guardando...' : 'Guardar cambios'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {toast && <Toast message={toast} onClose={() => setToast('')} />}

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
