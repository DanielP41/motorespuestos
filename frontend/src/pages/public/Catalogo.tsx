import { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, ShoppingCart, Check, Loader2 } from 'lucide-react';
import { getRepuestos } from '../../services/api';
import { mockCategorias, mockMarcas } from '../../data/mockData';
import { useCart } from '../../context/CartContext';
import { Repuesto } from '../../types/types';
import './Catalogo.css';

export default function Catalogo() {
    const [params, setParams] = useSearchParams();
    const [filtersOpen, setFiltersOpen] = useState(false);
    const { addItem, isInCart } = useCart();

    const [products, setProducts] = useState<Repuesto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const q = params.get('q') ?? '';
    const catSlug = params.get('categoria') ?? '';
    const marcaId = params.get('marca') ? Number(params.get('marca')) : 0;
    const soloOriginales = params.get('original') === '1';

    const rootCats = useMemo(() => mockCategorias.filter(c => !c.padre_id), []);

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                // Map frontend filter naming to backend expected params
                // Note: getRepuestos in api.ts handles basic filtering
                const data = await getRepuestos({
                    categoria: catSlug,
                    marca: marcaId || undefined
                });

                // Further filter on client side for 'q' and 'soloOriginales' if backend doesn't handle them yet
                let filtered = data;
                if (q) {
                    const lowerQ = q.toLowerCase();
                    filtered = filtered.filter(r =>
                        r.nombre.toLowerCase().includes(lowerQ) ||
                        r.sku.toLowerCase().includes(lowerQ)
                    );
                }
                if (soloOriginales) {
                    filtered = filtered.filter(r => r.es_original);
                }

                setProducts(filtered);
            } catch (err) {
                console.error('Error loading products:', err);
                setError('No se pudieron cargar los repuestos. Verificá tu conexión.');
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [catSlug, marcaId, q, soloOriginales]);

    function setParam(key: string, val: string) {
        const next = new URLSearchParams(params);
        if (val) next.set(key, val);
        else next.delete(key);
        setParams(next);
    }

    function clearFilters() {
        setParams({});
    }

    const hasFilters = !!(q || catSlug || marcaId || soloOriginales);

    return (
        <div className="catalogo-page">
            {/* Header */}
            <div className="catalogo-header-bar">
                <div className="container">
                    <div className="catalogo-top">
                        <div>
                            <h1 className="catalogo-title">Catálogo de repuestos</h1>
                            <p className="text-muted" style={{ fontSize: '0.88rem' }}>
                                {loading ? 'Buscando...' : `${products.length} producto${products.length !== 1 ? 's' : ''} encontrado${products.length !== 1 ? 's' : ''}`}
                            </p>
                        </div>
                        <div className="catalogo-controls">
                            {/* Search */}
                            <div className="search-bar catalogo-search">
                                <Search size={16} className="text-muted" />
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre o SKU..."
                                    value={q}
                                    onChange={e => setParam('q', e.target.value)}
                                />
                                {q && (
                                    <button onClick={() => setParam('q', '')} style={{ color: 'var(--muted)' }}>
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                            <button
                                className={`btn btn-secondary btn-sm ${filtersOpen ? 'btn-accent-border' : ''}`}
                                onClick={() => setFiltersOpen(!filtersOpen)}
                            >
                                <SlidersHorizontal size={14} />
                                Filtros
                                {hasFilters && <span className="filter-dot" />}
                            </button>
                            {hasFilters && (
                                <button className="btn btn-ghost btn-sm" onClick={clearFilters}>
                                    <X size={14} /> Limpiar
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Filter panel */}
                    {filtersOpen && (
                        <div className="filter-panel">
                            {/* Categoría */}
                            <div className="filter-group">
                                <span className="filter-label">Categoría</span>
                                <div className="filter-chips">
                                    <button
                                        className={`filter-chip ${!catSlug ? 'active' : ''}`}
                                        onClick={() => setParam('categoria', '')}
                                    >Todas</button>
                                    {rootCats.map(c => (
                                        <button
                                            key={c.id}
                                            className={`filter-chip ${catSlug === c.slug ? 'active' : ''}`}
                                            onClick={() => setParam('categoria', c.slug)}
                                        >{c.nombre}</button>
                                    ))}
                                </div>
                            </div>

                            {/* Marca moto */}
                            <div className="filter-group">
                                <span className="filter-label">Marca de moto</span>
                                <div className="filter-chips">
                                    <button
                                        className={`filter-chip ${!marcaId ? 'active' : ''}`}
                                        onClick={() => setParam('marca', '')}
                                    >Todas</button>
                                    {mockMarcas.map(m => (
                                        <button
                                            key={m.id}
                                            className={`filter-chip ${marcaId === m.id ? 'active' : ''}`}
                                            onClick={() => setParam('marca', String(m.id))}
                                        >{m.nombre}</button>
                                    ))}
                                </div>
                            </div>

                            {/* Solo originales */}
                            <div className="filter-group">
                                <span className="filter-label">Tipo</span>
                                <div className="filter-chips">
                                    <button
                                        className={`filter-chip ${!soloOriginales ? 'active' : ''}`}
                                        onClick={() => setParam('original', '')}
                                    >Todos</button>
                                    <button
                                        className={`filter-chip ${soloOriginales ? 'active' : ''}`}
                                        onClick={() => setParam('original', '1')}
                                    >Solo originales</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Products grid */}
            <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
                {loading ? (
                    <div className="loading-state" style={{ textAlign: 'center', padding: '100px 0' }}>
                        <Loader2 className="spinner" size={48} />
                        <p className="text-muted mt-3">Cargando catálogo real...</p>
                    </div>
                ) : error ? (
                    <div className="error-state" style={{ textAlign: 'center', padding: '100px 0' }}>
                        <X size={48} color="var(--danger)" />
                        <h3>{error}</h3>
                        <button className="btn btn-secondary mt-3" onClick={() => window.location.reload()}>Reintentar</button>
                    </div>
                ) : products.length === 0 ? (
                    <div className="no-results">
                        <span style={{ fontSize: '3rem' }}>🔍</span>
                        <h3>Sin resultados</h3>
                        <p className="text-muted">Probá con otros filtros o consultanos directamente.</p>
                        <button className="btn btn-secondary" onClick={clearFilters}>Limpiar filtros</button>
                    </div>
                ) : (
                    <div className="grid-products">
                        {products.map(rep => (
                            <ProductCard key={rep.id} rep={rep} addItem={addItem} inCart={isInCart(rep.id)} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function ProductCard({ rep, addItem, inCart }: { rep: Repuesto; addItem: (r: Repuesto) => void; inCart: boolean }) {
    const [added, setAdded] = useState(false);

    const handleAdd = (e: React.MouseEvent) => {
        e.preventDefault();
        addItem(rep);
        setAdded(true);
        setTimeout(() => setAdded(false), 1500);
    };

    return (
        <Link to={`/catalogo/${rep.id}`} className="product-card-catalog card card-hover">
            <div className="pcat-img-wrap">
                <img
                    src={rep.imagen_url || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'}
                    alt={rep.nombre}
                    className="pcat-img"
                    loading="lazy"
                />
                {rep.es_original && <span className="badge badge-original pcat-badge">Original</span>}
                {rep.stock_actual === 0 && <div className="pcat-out-overlay">Agotado</div>}
            </div>
            <div className="pcat-info">
                <span className="pcat-cat">{rep.categoria || 'Repuesto'}</span>
                <p className="pcat-sku">SKU: {rep.sku}</p>
                <h4 className="pcat-name">{rep.nombre}</h4>
                <div className="pcat-footer">
                    <span className="pcat-price">{`$${rep.precio_venta.toLocaleString('es-CO')}`}</span>
                    <button
                        className={`btn btn-sm ${inCart || added ? 'btn-success' : 'btn-primary'}`}
                        onClick={handleAdd}
                        disabled={rep.stock_actual === 0}
                    >
                        {inCart || added ? <Check size={14} /> : <ShoppingCart size={14} />}
                        {inCart || added ? 'Agregado' : 'Agregar'}
                    </button>
                </div>
            </div>
        </Link>
    );
}
