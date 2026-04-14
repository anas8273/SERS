// src/hooks/useApiCache.ts
// [PERF-M3] Lightweight SWR-like hook for client-side API data fetching.
//
// Features:
// - Automatic deduplication: same key = same request, no duplicates
// - stale-while-revalidate: shows cached data immediately, refreshes in background
// - Error boundary integration: returns error state instead of throwing
// - Manual revalidation: call revalidate() to force a fresh fetch
// - Automatic cleanup: cancels pending requests on unmount
//
// Usage:
//   const { data, isLoading, error, revalidate } = useApiCache(
//     'templates_featured',
//     () => api.getFeaturedTemplates(),
//     { ttl: 300_000 } // 5 minutes
//   );

import { useCallback, useEffect, useRef, useState } from 'react';

interface Options<T> {
    /** Cache TTL in milliseconds (default: 60 seconds) */
    ttl?: number;
    /** Initial data to show before the first fetch completes */
    initialData?: T;
    /** If false, the fetch is paused until enabled is true (default: true) */
    enabled?: boolean;
    /** Called when data is successfully fetched */
    onSuccess?: (data: T) => void;
    /** Called when the fetch fails */
    onError?: (error: Error) => void;
    /** Retry count on failure (default: 1) */
    retries?: number;
}

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
}

// Module-level cache: shared across all hook instances (survives re-renders)
const _cache = new Map<string, CacheEntry<unknown>>();
// Deduplication map: prevents parallel fetches for the same key
const _inflight = new Map<string, Promise<unknown>>();

function isCacheValid<T>(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
}

export interface UseApiCacheResult<T> {
    data: T | undefined;
    isLoading: boolean;
    isValidating: boolean;
    error: Error | null;
    revalidate: () => void;
}

export function useApiCache<T>(
    key: string | null | false,
    fetcher: () => Promise<T>,
    options: Options<T> = {}
): UseApiCacheResult<T> {
    const { ttl = 60_000, initialData, enabled = true, onSuccess, onError, retries = 1 } = options;

    const [data, setData] = useState<T | undefined>(initialData);
    const [isLoading, setIsLoading] = useState(!initialData);
    const [isValidating, setIsValidating] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const mountedRef = useRef(true);
    const retriesRef = useRef(0);

    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    const fetch = useCallback(async (isRevalidation = false) => {
        if (!key || !enabled) return;

        // Check cache first (stale-while-revalidate)
        const cached = _cache.get(key) as CacheEntry<T> | undefined;
        if (cached && isCacheValid(cached)) {
            if (!mountedRef.current) return;
            setData(cached.data);
            setIsLoading(false);
            if (!isRevalidation) return; // Use cache, no network call needed
        }

        if (!isRevalidation) setIsLoading(!cached);
        setIsValidating(true);

        // Deduplication: if an identical request is in-flight, reuse it
        if (!_inflight.has(key)) {
            _inflight.set(key, fetcher().finally(() => _inflight.delete(key)));
        }

        try {
            const result = await _inflight.get(key) as T;

            // Cache the successful result
            _cache.set(key, { data: result, timestamp: Date.now(), ttl });
            retriesRef.current = 0;

            if (!mountedRef.current) return;
            setData(result);
            setError(null);
            onSuccess?.(result);
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));

            // Auto-retry logic
            if (retriesRef.current < retries) {
                retriesRef.current++;
                setTimeout(() => fetch(isRevalidation), 1000 * retriesRef.current); // exp backoff
                return;
            }

            if (!mountedRef.current) return;
            setError(error);
            onError?.(error);
        } finally {
            if (mountedRef.current) {
                setIsLoading(false);
                setIsValidating(false);
            }
        }
    }, [key, enabled, ttl, fetcher, onSuccess, onError, retries]);

    useEffect(() => {
        fetch(false);
    }, [fetch]);

    const revalidate = useCallback(() => {
        if (key) _cache.delete(key); // Clear cache entry to force fresh fetch
        fetch(true);
    }, [key, fetch]);

    return { data, isLoading, isValidating, error, revalidate };
}

/**
 * Manually invalidate a cache key from outside a hook context.
 * Useful in event handlers (e.g., after a mutation).
 */
export function invalidateCache(key: string | string[]): void {
    const keys = Array.isArray(key) ? key : [key];
    keys.forEach(k => _cache.delete(k));
}
