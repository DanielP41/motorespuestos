import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, X, CheckCircle } from 'lucide-react';

// ── Loading Spinner ───────────────────────────────────────────────────────────
interface SpinnerProps { size?: number; className?: string; }

export function Spinner({ size = 24, className = '' }: SpinnerProps) {
    return (
        <div
            className={`spinner ${className}`}
            style={{ width: size, height: size }}
            role="status"
            aria-label="Cargando"
        />
    );
}

// ── Page Loading ──────────────────────────────────────────────────────────────
export function PageLoading({ message = 'Cargando...' }: { message?: string }) {
    return (
        <div className="page-loading">
            <Spinner size={32} />
            <p className="text-muted">{message}</p>
        </div>
    );
}

// ── Error Message ─────────────────────────────────────────────────────────────
interface ErrorMessageProps {
    message?: string;
    onRetry?: () => void;
}

export function ErrorMessage({ message = 'Ocurrió un error al cargar los datos.', onRetry }: ErrorMessageProps) {
    return (
        <div className="error-message">
            <AlertTriangle size={28} color="#e74c3c" />
            <p>{message}</p>
            {onRetry && (
                <button className="btn btn-secondary btn-sm" onClick={onRetry}>
                    <RefreshCw size={14} /> Reintentar
                </button>
            )}
        </div>
    );
}

// ── Skeleton rows for tables ──────────────────────────────────────────────────
export function SkeletonRows({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, r) => (
                <tr key={r}>
                    {Array.from({ length: cols }).map((_, c) => (
                        <td key={c}>
                            <div className="skeleton" style={{ height: 16, width: c === 0 ? '60%' : '80%', borderRadius: 4 }} />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}

// ── Skeleton cards ────────────────────────────────────────────────────────────
export function SkeletonCard() {
    return (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="skeleton" style={{ height: 180, borderRadius: 8 }} />
            <div className="skeleton" style={{ height: 12, width: '60%', borderRadius: 4 }} />
            <div className="skeleton" style={{ height: 16, width: '90%', borderRadius: 4 }} />
            <div className="skeleton" style={{ height: 16, width: '40%', borderRadius: 4 }} />
        </div>
    );
}

// ── Empty state ───────────────────────────────────────────────────────────────
interface EmptyStateProps {
    icon?: string;
    title: string;
    description?: string;
    action?: React.ReactNode;
}

export function EmptyState({ icon = '📭', title, description, action }: EmptyStateProps) {
    return (
        <div className="empty-state">
            <span className="empty-state-icon">{icon}</span>
            <h3>{title}</h3>
            {description && <p className="text-muted">{description}</p>}
            {action}
        </div>
    );
}

// ── Toast notification ────────────────────────────────────────────────────────
interface ToastProps {
    message: string;
    type?: 'success' | 'error';
    onClose: () => void;
}

export function Toast({ message, type = 'success', onClose }: ToastProps) {
    useEffect(() => {
        const t = setTimeout(onClose, 3000);
        return () => clearTimeout(t);
    }, [onClose]);

    const color = type === 'success' ? '#22c55e' : '#ef4444';
    const bg = type === 'success' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)';
    const border = type === 'success' ? 'rgba(34,197,94,0.35)' : 'rgba(239,68,68,0.35)';

    return (
        <div style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
            background: bg, border: `1px solid ${border}`,
            borderRadius: 'var(--radius)', padding: '12px 18px',
            display: 'flex', alignItems: 'center', gap: 10,
            backdropFilter: 'blur(8px)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}>
            <CheckCircle size={16} color={color} />
            <span style={{ color: 'var(--text)', fontWeight: 500, fontSize: '0.9rem' }}>{message}</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 0, marginLeft: 4 }}>
                <X size={14} />
            </button>
        </div>
    );
}

// ── Form field with validation ────────────────────────────────────────────────
interface FormFieldProps {
    label: string;
    error?: string;
    required?: boolean;
    children: React.ReactNode;
}

export function FormField({ label, error, required, children }: FormFieldProps) {
    return (
        <div className={`form-group ${error ? 'form-group--error' : ''}`}>
            <label className="form-label">
                {label} {required && <span style={{ color: 'var(--accent)' }}>*</span>}
            </label>
            {children}
            {error && <span className="form-error">{error}</span>}
        </div>
    );
}
