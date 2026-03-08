import { useState, useEffect } from 'react';

/**
 * Like useState but synced to localStorage.
 * Falls back gracefully if storage is unavailable.
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = localStorage.getItem(key);
            return item ? (JSON.parse(item) as T) : initialValue;
        } catch {
            return initialValue;
        }
    });

    const setValue = (value: T | ((prev: T) => T)) => {
        try {
            const next = value instanceof Function ? value(storedValue) : value;
            setStoredValue(next);
            localStorage.setItem(key, JSON.stringify(next));
        } catch (e) {
            console.warn(`[useLocalStorage] Could not persist key "${key}"`, e);
        }
    };

    // Sync across tabs
    useEffect(() => {
        const handler = (e: StorageEvent) => {
            if (e.key === key && e.newValue !== null) {
                try {
                    setStoredValue(JSON.parse(e.newValue) as T);
                } catch { /* ignore */ }
            }
        };
        window.addEventListener('storage', handler);
        return () => window.removeEventListener('storage', handler);
    }, [key]);

    return [storedValue, setValue];
}
