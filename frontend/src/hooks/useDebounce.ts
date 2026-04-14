// src/hooks/useDebounce.ts

import { useEffect, useRef, useState } from 'react';

/**
 * useDebounce [PERF-M3]
 *
 * Delays updating the debounced value until the user stops typing.
 * Used for search inputs to avoid firing an API request on every keystroke.
 *
 * @param value   The live value (e.g., search input state)
 * @param delay   Delay in ms (default 300ms — good UX balance)
 * @returns       The debounced value that only updates after the delay
 *
 * @example
 * const debouncedSearch = useDebounce(searchInput, 300);
 * useEffect(() => { api.getTemplates({ search: debouncedSearch }); }, [debouncedSearch]);
 */
export function useDebounce<T>(value: T, delay = 300): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
}

/**
 * useDebouncedCallback [PERF-M3]
 *
 * Returns a debounced version of a callback.
 * Useful when you need to debounce a function rather than a value.
 * Automatically cancels the previous call on each new invocation.
 *
 * @param callback  The function to debounce
 * @param delay     Delay in ms (default 300ms)
 *
 * @example
 * const debouncedSearch = useDebouncedCallback((term: string) => {
 *   fetchResults(term);
 * }, 300);
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
    callback: T,
    delay = 300
): (...args: Parameters<T>) => void {
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const callbackRef = useRef<T>(callback);

    // Always use the latest callback without resetting the timer
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    return (...args: Parameters<T>) => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        timerRef.current = setTimeout(() => {
            callbackRef.current(...args);
        }, delay);
    };
}
