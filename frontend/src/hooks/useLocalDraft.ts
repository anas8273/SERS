/**
 * useLocalDraft — auto-saves form data to localStorage.
 *
 * C-01 Fix: school-initiatives, performance-evidence-forms, professional-community
 * were losing all user input on page refresh. This hook provides transparent
 * auto-save with debounce + toast notification.
 *
 * Usage:
 *   const [values, setValues] = useLocalDraft('initiative-ramadan', defaultValues);
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';

const DEBOUNCE_MS = 1500; // save 1.5s after last keystroke

export function useLocalDraft<T extends Record<string, unknown>>(
    key: string,
    defaultValues: T
): [T, (updater: T | ((prev: T) => T)) => void, () => void] {
    const storageKey = `sers_draft_${key}`;

    // Load saved draft on first render
    const [values, setValuesState] = useState<T>(() => {
        if (typeof window === 'undefined') return defaultValues;
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                const parsed = JSON.parse(saved) as T;
                return { ...defaultValues, ...parsed };
            }
        } catch {
            // Corrupted data — ignore
        }
        return defaultValues;
    });

    // Debounce timer ref
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isFirstRender = useRef(true);

    // Auto-save on every value change (debounced)
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            try {
                localStorage.setItem(storageKey, JSON.stringify(values));
            } catch {
                // Storage full or disabled
            }
        }, DEBOUNCE_MS);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [values, storageKey]);

    // Show "draft loaded" toast once on mount if there was saved data
    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                const parsed = JSON.parse(saved) as Partial<T>;
                const hasData = Object.values(parsed).some(v => v && String(v).trim() !== '');
                if (hasData) {
                    toast('📋 تم استعادة المسودة المحفوظة', {
                        id: `draft-${key}`,
                        duration: 3000,
                        icon: '💾',
                    });
                }
            }
        } catch {
            // Ignore
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const setValues = useCallback((updater: T | ((prev: T) => T)) => {
        setValuesState(prev => {
            const next = typeof updater === 'function' ? (updater as (p: T) => T)(prev) : updater;
            return next;
        });
    }, []);

    const clearDraft = useCallback(() => {
        try {
            localStorage.removeItem(storageKey);
        } catch {
            // Ignore
        }
        setValuesState(defaultValues);
        toast.success('تم مسح المسودة');
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [storageKey]);

    return [values, setValues, clearDraft];
}
