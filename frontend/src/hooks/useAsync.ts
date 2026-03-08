import { useState, useEffect, useCallback, useRef } from 'react';

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
    data: T | null;
    status: AsyncStatus;
    error: string | null;
    isLoading: boolean;
    isSuccess: boolean;
    isError: boolean;
    refetch: () => void;
}

/**
 * Generic hook for async data fetching.
 * Re-fetches whenever `deps` change (like useEffect).
 */
export function useAsync<T>(
    fn: () => Promise<T>,
    deps: unknown[] = []
): AsyncState<T> {
    const [data, setData] = useState<T | null>(null);
    const [status, setStatus] = useState<AsyncStatus>('idle');
    const [error, setError] = useState<string | null>(null);
    const mountedRef = useRef(true);
    const fetchRef = useRef(0);

    const execute = useCallback(async () => {
        const id = ++fetchRef.current;
        setStatus('loading');
        setError(null);
        try {
            const result = await fn();
            if (mountedRef.current && id === fetchRef.current) {
                setData(result);
                setStatus('success');
            }
        } catch (e) {
            if (mountedRef.current && id === fetchRef.current) {
                setError(e instanceof Error ? e.message : 'Error desconocido');
                setStatus('error');
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);

    useEffect(() => {
        mountedRef.current = true;
        execute();
        return () => { mountedRef.current = false; };
    }, [execute]);

    return {
        data,
        status,
        error,
        isLoading: status === 'loading' || status === 'idle',
        isSuccess: status === 'success',
        isError: status === 'error',
        refetch: execute,
    };
}
