import { useState } from 'react';
import { Plus, Search, CreditCard } from 'lucide-react';
import { getClientes } from '../../services/api';
import { useAsync } from '../../hooks/useAsync';
import { useDebounce } from '../../hooks/useDebounce';
import { PageLoading, ErrorMessage, SkeletonRows, EmptyState } from '../../components/UI';
import { formatCOP } from '../../utils/helpers';

export default function Clientes() {
    const [q, setQ] = useState('');
    const debouncedQ = useDebounce(q, 300);

    const { data: clientes, isLoading, isError, error, refetch } = useAsync(
        () => getClientes({ q: debouncedQ }),
        [debouncedQ]
    );

    if (isLoading && !clientes) return <PageLoading message="Cargando clientes..." />;
    if (isError) return <ErrorMessage message={error ?? undefined} onRetry={refetch} />;

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h2 className="page-title">Clientes</h2>
                    <p className="page-subtitle">
                        {clientes ? `${clientes.length} clientes encontrados` : 'Cargando...'}
                    </p>
                </div>
                <button className="btn btn-primary">
                    <Plus size={16} aria-hidden="true" /> Nuevo cliente
                </button>
            </div>

            <div className="search-bar" style={{ maxWidth: 360, marginBottom: 20 }}>
                <Search size={16} className="text-muted" aria-hidden="true" />
                <input
                    type="text"
                    placeholder="Buscar por nombre o documento..."
                    value={q}
                    onChange={e => setQ(e.target.value)}
                    aria-label="Buscar clientes"
                />
            </div>

            <div className="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Documento</th>
                            <th>Nombre</th>
                            <th>Tipo</th>
                            <th>Teléfono</th>
                            <th>Límite crédito</th>
                            <th>Saldo deuda</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <SkeletonRows rows={4} cols={7} />
                        ) : !clientes || clientes.length === 0 ? (
                            <tr>
                                <td colSpan={7}>
                                    <EmptyState icon="👤" title="Sin resultados" description="Probá con otro nombre o documento." />
                                </td>
                            </tr>
                        ) : clientes.map(c => (
                            <tr key={c.id}>
                                <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--muted)' }}>
                                    {c.documento_tipo} {c.documento_nro}
                                </td>
                                <td style={{ fontWeight: 600, color: 'var(--text)' }}>{c.nombre}</td>
                                <td>
                                    <span className="badge badge-muted">
                                        {c.tipo === 'N' ? 'Natural' : 'Jurídico'}
                                    </span>
                                </td>
                                <td>{c.telefono ?? '—'}</td>
                                <td>
                                    {c.credito_habilitado ? (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                            <CreditCard size={13} color="var(--accent)" aria-hidden="true" />
                                            {formatCOP(c.limite_credito)}
                                        </span>
                                    ) : <span className="text-muted">—</span>}
                                </td>
                                <td style={{
                                    fontWeight: c.saldo_credito > 0 ? 700 : 400,
                                    color: c.saldo_credito > 0 ? 'var(--danger)' : 'var(--muted)'
                                }}>
                                    {c.saldo_credito > 0 ? formatCOP(c.saldo_credito) : '—'}
                                </td>
                                <td>
                                    <span className={`badge ${c.activo ? 'badge-success' : 'badge-muted'}`}>
                                        {c.activo ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
