import { useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, ShoppingCart, Check } from 'lucide-react';
import { getRepuestos, getCategorias, getMarcas } from '../../services/api';
import { useAsync } from '../../hooks/useAsync';
import { useDebounce } from '../../hooks/useDebounce';
import { useCart } from '../../context/CartContext';
import { SkeletonCard, EmptyState } from '../../components/UI';
import { formatCOP } from '../../utils/helpers';
import { Repuesto } from '../../types/types';
import './Catalogo.css';

export default function Catalogo() {
    const [params, setParams] = useSearchParams();
    const [filtersOpen, setFiltersOpen] = useState(false);
    const { addItem, isInCart } = useCart();

    const rawQ = params.get('q') ?? '';
    const catSlug = params.get('categoria') ?? '';
    const marcaId = params.get('marca') ? Number(params.get('marca')) : 0;
    const soloOriginales = params.get('original') === '1';

    // Debounce only the search query — filters apply instantly
    const debouncedQ = useDebounce(rawQ, 350);

    const { data: repuestos, isLoading } = useAsync(
        () => getRepuestos({ q: debouncedQ, categoriaSlug: catSlug, marcaId, soloOriginales }),
        [debouncedQ, catSlug, marcaId, soloOriginales]
    );

    const { data: categoriasRaiz } = useAsync(getCategorias);
    const { data: marcas } = useAsync(getMarcas);

    const rootCats = categoriasRaiz?.filter(c => !c.padre_id) ?? [];

    const setParam = useCallback((key: string, val: string) => {
        const next = new URLSearchParams(params);
        if (val) next.set(key, val); else next.delete(key);
        setParams(next);
    }, [params, setParams]);

    const clearFilters = useCallback(() => setParams({}), [setParams]);

    const hasFilters = !!(rawQ || catSlug || marcaId || soloOriginales);

    return (
        <div className="catalogo-page">
            {/* Header */}
            <div className="catalogo-header-bar">
                <div className="container">
                    <div className="catalogo-top">
                        <div>
                            <h1 className="catalogo-title">Catálogo de repuestos</h1>
                            <p className="text-muted" style={{ fontSize: '0.88rem' }}>
                                {isLoading
                                    ? 'Buscando...'
                                    : `${repuestos?.length ?? 0} producto${(repuestos?.length ?? 0) !== 1 ? 's' : ''} encontrado${(repuestos?.length ?? 0) !== 1 ? 's' : ''}`
                                }
                            </p>
                        </div>
                        <div className="catalogo-controls">
                            <div className="search-bar catalogo-search">
                                <Search size={16} className="text-muted" aria-hidden="true" />
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre o SKU..."
                                    value={rawQ}
                                    onChange={e => setParam('q', e.target.value)}
                                    aria-label="Buscar en el catálogo"
                                />
                                {rawQ && (
                                    <button onClick={() => setParam('q', '')} aria-label="Limpiar búsqueda">
                                        <X size={14} style={{ color: 'var(--muted)' }} />
                                    </button>
                                )}
                            </div>
                            <button
                                className={`btn btn-secondary btn-sm ${filtersOpen ? 'btn-accent-border' : ''}`}
                                onClick={() => setFiltersOpen(!filtersOpen)}
                                aria-expanded={filtersOpen}
                                aria-label="Mostrar filtros"
                            >
                                <SlidersHorizontal size={14} />
                                Filtros
                                {hasFilters && <span className="filter-dot" aria-label="Filtros activos" />}
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
                        <div className="filter-panel" role="region" aria-label="Filtros">
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
                            <div className="filter-group">
                                <span className="filter-label">Marca de moto</span>
                                <div className="filter-chips">
                                    <button
                                        className={`filter-chip ${!marcaId ? 'active' : ''}`}
                                        onClick={() => setParam('marca', '')}
                                    >Todas</button>
                                    {marcas?.map(m => (
                                        <button
                                            key={m.id}
                                            className={`filter-chip ${marcaId === m.id ? 'active' : ''}`}
                                            onClick={() => setParam('marca', String(m.id))}
                                        >{m.nombre}</button>
                                    ))}
                                </div>
                            </div>
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
                {isLoading ? (
                    <div className="grid-products">
                        {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                ) : !repuestos || repuestos.length === 0 ? (
                    <EmptyState
                        icon="🔍"
                        title="Sin resultados"
                        description="Probá con otros filtros o consultanos directamente."
                        action={<button className="btn btn-secondary" onClick={clearFilters}>Limpiar filtros</button>}
                    />
                ) : (
                    <div className="grid-products">
                        {repuestos.map(rep => (
                            <ProductCard
                                key={rep.id}
                                rep={rep}
                                addItem={addItem}
                                inCart={isInCart(rep.id)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function ProductCard({ rep, addItem, inCart }: {
    rep: Repuesto;
    addItem: (r: Repuesto) => void;
    inCart: boolean;
}) {
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
                    src={rep.imagenes?.[0]?.url ?? 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'}
                    alt={rep.nombre}
                    className="pcat-img"
                    loading="lazy"
                />
                {rep.es_original && <span className="badge badge-original pcat-badge">Original</span>}
                {rep.stock_actual === 0 && <div className="pcat-out-overlay" aria-label="Agotado">Agotado</div>}
            </div>
            <div className="pcat-info">
                <span className="pcat-cat">{rep.categoria?.nombre}</span>
                <p className="pcat-sku">SKU: {rep.sku}</p>
                <h4 className="pcat-name">{rep.nombre}</h4>
                <div className="pcat-footer">
                    <span className="pcat-price">{formatCOP(rep.precio_venta)}</span>
                    <button
                        className={`btn btn-sm ${inCart || added ? 'btn-success' : 'btn-primary'}`}
                        onClick={handleAdd}
                        disabled={rep.stock_actual === 0}
                        aria-label={inCart ? 'Ya en el carrito' : `Agregar ${rep.nombre} al carrito`}
                    >
                        {inCart || added ? <Check size={14} aria-hidden="true" /> : <ShoppingCart size={14} aria-hidden="true" />}
                        {inCart || added ? 'Agregado' : 'Agregar'}
                    </button>
                </div>
            </div>
        </Link>
    );
}
