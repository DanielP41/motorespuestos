/**
 * Shared utility functions
 */

export function formatCOP(amount: number | null | undefined): string {
    if (amount === null || amount === undefined) return '$0';
    return `$${amount.toLocaleString('es-CO')}`;
}

export function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('es-CO', {
        year: 'numeric', month: 'short', day: 'numeric'
    });
}

export function formatDateTime(iso: string): string {
    return new Date(iso).toLocaleString('es-CO', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

export function getDaysUntil(dateStr: string): number {
    const diff = new Date(dateStr).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function clsx(...classes: (string | false | null | undefined)[]): string {
    return classes.filter(Boolean).join(' ');
}

export function padId(id: number, length = 4): string {
    return String(id).padStart(length, '0');
}

/** Validates Colombian email format */
export function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Validates Colombian phone (10 digits, starts with 3 for mobile or 6 for landline) */
export function isValidPhone(phone: string): boolean {
    return /^[36]\d{9}$/.test(phone.replace(/\s/g, ''));
}
