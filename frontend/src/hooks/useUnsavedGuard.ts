'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { ta } from '@/i18n/auto-translations';

interface UseUnsavedGuardOptions {
    /** Key for localStorage draft (must be unique per form) */
    draftKey?: string;
    /** Auto-save interval in ms (default: 30000 = 30s) */
    autoSaveInterval?: number;
    /** Enable draft restore on mount (default: true) */
    enableDraftRestore?: boolean;
}

/**
 * 🛡️ useUnsavedGuard — Reusable hook for unsaved changes protection
 * 
 * Features:
 * - beforeunload browser warning when dirty
 * - Auto-save to localStorage at intervals
 * - Draft restore on mount
 * - isDirty tracking
 * - savedDraft indicator for UI
 * - confirmLeave() for navigation guards
 * - clearDraft() for post-save cleanup
 *
 * Usage:
 *   const { isDirty, markDirty, savedDraft, confirmLeave, clearDraft } = useUnsavedGuard({ draftKey: 'my_form' });
 */
export function useUnsavedGuard<T extends Record<string, any>>(
    formData: T,
    setFormData: React.Dispatch<React.SetStateAction<T>>,
    options: UseUnsavedGuardOptions = {}
) {
    const {
        draftKey,
        autoSaveInterval = 30000,
        enableDraftRestore = true,
    } = options;

    const [isDirty, setIsDirty] = useState(false);
    const [savedDraft, setSavedDraft] = useState(false);
    const initialLoadDone = useRef(false);

    // ── beforeunload guard ──
    useEffect(() => {
        if (!isDirty) return;
        const handler = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [isDirty]);

    // ── Auto-save draft to localStorage ──
    useEffect(() => {
        if (!isDirty || !draftKey) return;
        const timer = setInterval(() => {
            localStorage.setItem(draftKey, JSON.stringify(formData));
            setSavedDraft(true);
            setTimeout(() => setSavedDraft(false), 2000);
        }, autoSaveInterval);
        return () => clearInterval(timer);
    }, [isDirty, formData, draftKey, autoSaveInterval]);

    // ── Restore draft on mount ──
    useEffect(() => {
        if (initialLoadDone.current || !enableDraftRestore || !draftKey) return;
        initialLoadDone.current = true;

        const draft = localStorage.getItem(draftKey);
        if (draft) {
            try {
                const parsed = JSON.parse(draft);
                if (Object.keys(parsed).length > 0) {
                    setFormData(prev => ({ ...prev, ...parsed }));
                    toast.success(ta('💾 تم استعادة المسودة المحفوظة', '💾 Saved draft restored'), { duration: 3000 });
                }
            } catch { /* ignore parse errors */ }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Mark form as dirty ──
    const markDirty = useCallback(() => {
        setIsDirty(true);
    }, []);

    // ── Clear draft (call after successful save) ──
    const clearDraft = useCallback(() => {
        setIsDirty(false);
        if (draftKey) {
            localStorage.removeItem(draftKey);
        }
    }, [draftKey]);

    // ── Confirm navigation away ──
    const confirmLeave = useCallback((): boolean => {
        if (!isDirty) return true;
        const confirmed = window.confirm(
            ta('⚠️ لديك تغييرات غير محفوظة. هل تريد المغادرة بدون حفظ؟', '⚠️ You have unsaved changes. Leave without saving?')
        );
        if (confirmed) {
            clearDraft();
        }
        return confirmed;
    }, [isDirty, clearDraft]);

    return {
        isDirty,
        savedDraft,
        markDirty,
        clearDraft,
        confirmLeave,
        setIsDirty,
    };
}
