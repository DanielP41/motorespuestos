import { useState, useEffect } from 'react';

/**
 * Debounces a value — use for search inputs before calling the API.
 */
export function useDebounce<T>(value: T, delayMs = 300): T {
    const [debounced, setDebounced] = useState<T>(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delayMs);
        return () => clearTimeout(timer);
    }, [value, delayMs]);

    return debounced;
}
