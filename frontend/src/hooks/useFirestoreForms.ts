'use client';

/**
 * useFirestoreForms — Smart hook that connects user pages to Firestore.
 * 
 * Flow:
 * 1. User opens page → shows hardcoded forms immediately (no loading)
 * 2. In background → checks Firestore for admin overrides
 * 3. If admin has edited forms → uses Firestore version
 * 4. If Firestore is empty → seeds it with hardcoded forms (so admin can edit later)
 * 5. Result: Admin edits in editor → saved to Firestore → user sees changes
 */

import { useState, useEffect, useCallback } from 'react';
import { getStaticTool, saveStaticTool } from '@/lib/firestore-static-tools';
import type { StaticTool } from '@/types';

interface FormField {
    key: string;
    label: string;
    type: 'text' | 'textarea' | 'image' | 'url' | 'date' | 'number' | 'select' | 'checkbox';
    placeholder?: string;
    required?: boolean;
    rows?: number;
    group?: string;
    groupLabel?: string;
    options?: string[];
}

interface FormTemplate {
    id: string;
    title: string;
    description: string;
    icon: any;
    color: string;
    gradient: string;
    fields: FormField[];
    badge?: string;
}

interface UseFirestoreFormsResult {
    forms: FormTemplate[];
    isFromFirestore: boolean;
    loading: boolean;
}

/**
 * Hook to load forms from Firestore with local fallback.
 * 
 * @param toolSlug - The service slug (used as Firestore doc ID)
 * @param localForms - The hardcoded forms to use as fallback + initial seed
 * @returns forms array (from Firestore if available, otherwise local)
 */
export function useFirestoreForms(
    toolSlug: string,
    localForms: FormTemplate[]
): UseFirestoreFormsResult {
    const [forms, setForms] = useState<FormTemplate[]>(localForms);
    const [isFromFirestore, setIsFromFirestore] = useState(false);
    const [loading, setLoading] = useState(false);

    const syncWithFirestore = useCallback(async () => {
        if (!toolSlug) return;
        setLoading(true);

        try {
            const tool = await getStaticTool(toolSlug);

            if (tool?.forms?.length) {
                // Firestore has forms → admin has edited them → use Firestore version
                // Convert Firestore format to local format
                const firestoreForms: FormTemplate[] = tool.forms
                    .filter(f => f.is_active !== false)
                    .map(f => ({
                        id: f.id,
                        title: f.title_ar || f.title_en || '',
                        description: f.description_ar || f.description_en || '',
                        icon: null,
                        color: '',
                        gradient: '',
                        badge: f.badge || '',
                        fields: (f.fields || [])
                            .filter(field => field.is_visible !== false)
                            .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                            .map(field => ({
                                key: field.key,
                                label: field.label_ar || field.label_en || '',
                                type: field.type as FormField['type'],
                                placeholder: field.placeholder_ar || field.placeholder_en || '',
                                required: field.required || false,
                                rows: field.rows || undefined,
                                group: field.group || undefined,
                                groupLabel: field.groupLabel || undefined,
                                options: field.options || undefined,
                            })),
                    }));

                if (firestoreForms.length > 0) {
                    setForms(firestoreForms);
                    setIsFromFirestore(true);
                }
            } else {
                // Firestore is empty → seed it with local forms so admin can edit
                try {
                    const seedData = {
                        title_ar: toolSlug,
                        title_en: toolSlug,
                        description_ar: '',
                        description_en: '',
                        icon: 'FileText',
                        color: '#3b82f6',
                        gradient: 'from-blue-500 to-blue-600',
                        href: `/${toolSlug}`,
                        is_active: true,
                        sort_order: 1,
                        forms: localForms.map((f, fi) => ({
                            id: f.id || `form-${fi}`,
                            title_ar: f.title,
                            title_en: f.title,
                            description_ar: f.description,
                            description_en: f.description,
                            badge: f.badge || '',
                            is_active: true,
                            sort_order: fi + 1,
                            fields: f.fields.map((field, ffi) => ({
                                id: `field-${fi}-${ffi}`,
                                key: field.key,
                                label_ar: field.label,
                                label_en: field.label,
                                type: field.type,
                                placeholder_ar: field.placeholder || '',
                                placeholder_en: field.placeholder || '',
                                required: field.required || false,
                                rows: field.rows || undefined,
                                group: field.group || undefined,
                                groupLabel: field.groupLabel || undefined,
                                options: field.options || undefined,
                                is_visible: true,
                                sort_order: ffi + 1,
                            })),
                        })),
                    };
                    await saveStaticTool(toolSlug, seedData as any);
                } catch {
                    // Silently fail - seeding is best-effort
                }
            }
        } catch (err) {
            // On error, keep using local forms (graceful degradation)
            console.warn(`[useFirestoreForms] Failed to sync ${toolSlug}:`, err);
        } finally {
            setLoading(false);
        }
    }, [toolSlug, localForms]);

    useEffect(() => {
        // Don't block render - sync in background after a delay
        const timer = setTimeout(syncWithFirestore, 500);
        return () => clearTimeout(timer);
    }, [syncWithFirestore]);

    return { forms, isFromFirestore, loading };
}
