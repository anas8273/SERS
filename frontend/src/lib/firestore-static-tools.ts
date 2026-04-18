// src/lib/firestore-static-tools.ts
/**
 * Firestore CRUD for `static_tools` collection.
 * Each document = one educational tool (e.g. documentation-forms, weekly-plan, etc.)
 * Each tool contains an array of `forms` — each form has its own `fields` array.
 */
import { db } from './firebase';
import { cache, CACHE_TTL } from './cache';
import { logger } from './logger';
import {
    doc, getDoc, setDoc, updateDoc, deleteDoc,
    collection, query, orderBy, getDocs, addDoc,
} from 'firebase/firestore';
import type { StaticTool, StaticForm, StaticFormField } from '@/types';

const COLLECTION = 'static_tools';
const CACHE_KEY  = 'firestore_static_tools';

/** Deep-strip all `undefined` values from an object/array (Firestore rejects them) */
function stripUndefined<T>(obj: T): T {
    if (obj === null || obj === undefined) return obj;
    if (Array.isArray(obj)) return obj.map(stripUndefined) as unknown as T;
    if (typeof obj === 'object' && obj !== null) {
        const cleaned: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(obj)) {
            if (value !== undefined) {
                cleaned[key] = stripUndefined(value);
            }
        }
        return cleaned as T;
    }
    return obj;
}

// ─────────────────────────────────────────────────────────────────────────────
//  READ
// ─────────────────────────────────────────────────────────────────────────────

/** Fetch all tools from Firestore, sorted by sort_order */
export async function getAllStaticTools(): Promise<StaticTool[]> {
    return cache.getOrSet(CACHE_KEY, async () => {
        try {
            const colRef = collection(db, COLLECTION);
            const q = query(colRef, orderBy('sort_order', 'asc'));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as StaticTool));
        } catch (error: any) {
            // Index missing fallback: client-side sort
            if (error?.message?.includes('index')) {
                logger.warn('⚠️ Firestore index missing for static_tools — using client sort.');
                const colRef = collection(db, COLLECTION);
                const snapshot = await getDocs(colRef);
                const tools = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as StaticTool));
                return tools.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
            }
            logger.error('Error fetching static tools:', error);
            return [];
        }
    }, CACHE_TTL.MEDIUM);
}

/** Fetch a single tool by Firestore document ID */
export async function getStaticTool(toolId: string): Promise<StaticTool | null> {
    try {
        const docRef = doc(db, COLLECTION, toolId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as StaticTool;
        }
        return null;
    } catch (error) {
        logger.error('Error fetching static tool:', error);
        return null;
    }
}

/** Fetch a single tool by its `href` slug (e.g. "/documentation-forms") */
export async function getStaticToolByHref(href: string): Promise<StaticTool | null> {
    try {
        const all = await getAllStaticTools();
        return all.find(t => t.href === href) ?? null;
    } catch (error) {
        logger.error('Error fetching static tool by href:', error);
        return null;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  CREATE / UPDATE
// ─────────────────────────────────────────────────────────────────────────────

/** Create a new static tool document */
export async function createStaticTool(data: Omit<StaticTool, 'id'>): Promise<string> {
    try {
        const colRef = collection(db, COLLECTION);
        const cleanData = stripUndefined({
            ...data,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        });
        const docRef = await addDoc(colRef, cleanData);
        cache.delete(CACHE_KEY);
        return docRef.id;
    } catch (error) {
        logger.error('Error creating static tool:', error);
        throw error;
    }
}

/** Merge-update an existing static tool */
export async function saveStaticTool(toolId: string, data: Partial<StaticTool>): Promise<void> {
    try {
        const docRef = doc(db, COLLECTION, toolId);
        const cleanData = stripUndefined({
            ...data,
            updated_at: new Date().toISOString(),
        });
        await setDoc(docRef, cleanData, { merge: true });
        cache.delete(CACHE_KEY);
    } catch (error) {
        logger.error('Error saving static tool:', error);
        throw error;
    }
}

/** Bulk-save the ordered IDs (for drag-and-drop reorder) */
export async function reorderStaticTools(orderedIds: string[]): Promise<void> {
    try {
        await Promise.all(
            orderedIds.map((id, index) => {
                const docRef = doc(db, COLLECTION, id);
                return updateDoc(docRef, {
                    sort_order: index + 1,
                    updated_at: new Date().toISOString(),
                });
            })
        );
        cache.delete(CACHE_KEY);
    } catch (error) {
        logger.error('Error reordering static tools:', error);
        throw error;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  DELETE
// ─────────────────────────────────────────────────────────────────────────────

/** Delete a static tool document entirely */
export async function deleteStaticTool(toolId: string): Promise<void> {
    try {
        const docRef = doc(db, COLLECTION, toolId);
        await deleteDoc(docRef);
        cache.delete(CACHE_KEY);
    } catch (error) {
        logger.error('Error deleting static tool:', error);
        throw error;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  FORMS WITHIN A TOOL
// ─────────────────────────────────────────────────────────────────────────────

/** Save ALL forms for a tool (replaces existing forms array) */
export async function saveToolForms(toolId: string, forms: StaticForm[]): Promise<void> {
    try {
        const docRef = doc(db, COLLECTION, toolId);
        await updateDoc(docRef, {
            forms,
            updated_at: new Date().toISOString(),
        });
        cache.delete(CACHE_KEY);
    } catch (error) {
        logger.error('Error saving tool forms:', error);
        throw error;
    }
}

/** Add a single form to a tool */
export async function addFormToTool(toolId: string, newForm: StaticForm): Promise<void> {
    const tool = await getStaticTool(toolId);
    if (!tool) throw new Error('Tool not found');
    const forms = [...(tool.forms || []), newForm];
    await saveToolForms(toolId, forms);
}

/** Remove a form from a tool by form ID */
export async function removeFormFromTool(toolId: string, formId: string): Promise<void> {
    const tool = await getStaticTool(toolId);
    if (!tool) throw new Error('Tool not found');
    const forms = (tool.forms || []).filter(f => f.id !== formId);
    await saveToolForms(toolId, forms);
}

/** Update a single form inside a tool */
export async function updateFormInTool(toolId: string, updatedForm: StaticForm): Promise<void> {
    const tool = await getStaticTool(toolId);
    if (!tool) throw new Error('Tool not found');
    const forms = (tool.forms || []).map(f => f.id === updatedForm.id ? updatedForm : f);
    await saveToolForms(toolId, forms);
}

// ─────────────────────────────────────────────────────────────────────────────
//  FIELDS WITHIN A FORM
// ─────────────────────────────────────────────────────────────────────────────

/** Save ALL fields for a specific form inside a tool */
export async function saveFormFields(
    toolId: string,
    formId: string,
    fields: StaticFormField[]
): Promise<void> {
    const tool = await getStaticTool(toolId);
    if (!tool) throw new Error('Tool not found');
    const forms = (tool.forms || []).map(f =>
        f.id === formId ? { ...f, fields } : f
    );
    await saveToolForms(toolId, forms);
}

// ─────────────────────────────────────────────────────────────────────────────
//  SEEDING (one-time initialization)
// ─────────────────────────────────────────────────────────────────────────────

/** Seed default tools if collection is empty. Returns { seeded, count }. */
export async function seedStaticToolsIfEmpty(
    defaultTools: Omit<StaticTool, 'id'>[]
): Promise<{ seeded: boolean; count: number }> {
    try {
        const existing = await getAllStaticTools();
        if (existing.length > 0) {
            return { seeded: false, count: existing.length };
        }
        let count = 0;
        for (const tool of defaultTools) {
            await createStaticTool(tool);
            count++;
        }
        cache.delete(CACHE_KEY);
        return { seeded: true, count };
    } catch (error) {
        logger.error('Error seeding static tools:', error);
        throw error;
    }
}
