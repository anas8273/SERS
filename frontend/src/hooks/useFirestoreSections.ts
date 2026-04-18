'use client';

/**
 * useFirestoreSections — Hook for pages that use SECTIONS (array of sections, each with forms).
 * Works exactly like useFirestoreForms but for the sections structure.
 * 
 * Used by: performance-evidence-forms, teacher-evaluation-forms
 */

import { useState, useEffect, useCallback } from 'react';
import { getStaticTool, saveStaticTool } from '@/lib/firestore-static-tools';

interface FieldDef {
    key: string;
    label: string;
    type: 'text' | 'textarea' | 'image';
    placeholder?: string;
    rows?: number;
    required?: boolean;
}

interface FormDef {
    id: string;
    title: string;
    description?: string;
    gradient?: string;
    fields: FieldDef[];
}

interface Section {
    id: string;
    title: string;
    description: string;
    gradient: string;
    badge?: string;
    forms: FormDef[];
}

interface UseFirestoreSectionsResult {
    sections: Section[];
    isFromFirestore: boolean;
    loading: boolean;
}

export function useFirestoreSections(
    toolSlug: string,
    localSections: Section[]
): UseFirestoreSectionsResult {
    const [sections, setSections] = useState<Section[]>(localSections);
    const [isFromFirestore, setIsFromFirestore] = useState(false);
    const [loading, setLoading] = useState(false);

    const syncWithFirestore = useCallback(async () => {
        if (!toolSlug) return;
        setLoading(true);

        try {
            const tool = await getStaticTool(toolSlug);

            if (tool?.sections?.length) {
                // Firestore has sections → admin has edited them
                const firestoreSections: Section[] = tool.sections
                    .filter((s: any) => s.is_active !== false)
                    .map((s: any) => ({
                        id: s.id,
                        title: s.title_ar || s.title_en || '',
                        description: s.description_ar || s.description_en || '',
                        gradient: s.gradient || 'from-blue-600 to-blue-700',
                        badge: s.badge || undefined,
                        forms: (s.forms || [])
                            .filter((f: any) => f.is_active !== false)
                            .map((f: any) => ({
                                id: f.id,
                                title: f.title_ar || f.title_en || '',
                                description: f.description_ar || f.description_en || '',
                                gradient: f.gradient || undefined,
                                fields: (f.fields || [])
                                    .filter((field: any) => field.is_visible !== false)
                                    .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
                                    .map((field: any) => ({
                                        key: field.key,
                                        label: field.label_ar || field.label_en || '',
                                        type: field.type || 'text',
                                        placeholder: field.placeholder_ar || field.placeholder_en || '',
                                        required: field.required || false,
                                        rows: field.rows || undefined,
                                    })),
                            })),
                    }));

                if (firestoreSections.length > 0) {
                    setSections(firestoreSections);
                    setIsFromFirestore(true);
                }
            } else if (tool?.forms?.length) {
                // Fallback: forms-style storage (flat forms list)
                // Don't override sections
            } else {
                // Firestore is empty → seed it with local sections for admin editing
                try {
                    const seedData = {
                        title_ar: toolSlug,
                        title_en: toolSlug,
                        description_ar: '',
                        description_en: '',
                        icon: 'ClipboardCheck',
                        color: '#7c3aed',
                        gradient: 'from-violet-600 to-purple-700',
                        href: `/${toolSlug}`,
                        is_active: true,
                        sort_order: 1,
                        sections: localSections.map((s, si) => ({
                            id: s.id,
                            title_ar: s.title,
                            title_en: s.title,
                            description_ar: s.description,
                            description_en: s.description,
                            gradient: s.gradient,
                            badge: s.badge || '',
                            is_active: true,
                            sort_order: si + 1,
                            forms: s.forms.map((f, fi) => ({
                                id: f.id,
                                title_ar: f.title,
                                title_en: f.title,
                                description_ar: f.description || '',
                                description_en: f.description || '',
                                gradient: f.gradient || '',
                                is_active: true,
                                sort_order: fi + 1,
                                fields: f.fields.map((field, ffi) => ({
                                    id: `field-${si}-${fi}-${ffi}`,
                                    key: field.key,
                                    label_ar: field.label,
                                    label_en: field.label,
                                    type: field.type,
                                    placeholder_ar: field.placeholder || '',
                                    placeholder_en: field.placeholder || '',
                                    required: field.required || false,
                                    rows: field.rows || undefined,
                                    is_visible: true,
                                    sort_order: ffi + 1,
                                })),
                            })),
                        })),
                    };
                    await saveStaticTool(toolSlug, seedData as any);
                } catch {
                    // Silently fail
                }
            }
        } catch (err) {
            console.warn(`[useFirestoreSections] Failed to sync ${toolSlug}:`, err);
        } finally {
            setLoading(false);
        }
    }, [toolSlug, localSections]);

    useEffect(() => {
        const timer = setTimeout(syncWithFirestore, 500);
        return () => clearTimeout(timer);
    }, [syncWithFirestore]);

    return { sections, isFromFirestore, loading };
}
