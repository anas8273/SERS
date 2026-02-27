// src/lib/firestore-service.ts
import { cache, CACHE_TTL } from './cache';
/**
 * Firestore Service - Dynamic Template Engine
 * 
 * This service handles all Firestore operations for the dynamic template engine.
 * Collections:
 *   - template_canvas/{templateId}  → Canvas data (background + X/Y coordinates)
 *   - dynamic_forms/{templateId}    → Form fields configuration
 *   - ai_prompts/{templateId}       → AI prompt configuration
 *   - user_records/{recordId}       → User-filled records
 *   - services/{serviceId}          → Dynamic service definitions
 */

import { db } from './firebase';
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, query, where, getDocs, orderBy, limit,
  addDoc, serverTimestamp, Timestamp,
  onSnapshot,
} from 'firebase/firestore';
import type {
  TemplateCanvas, CanvasElement, CanvasVariant,
  DynamicFormConfig, DynamicFormField, FieldGroup, FormSettings,
  AIPromptConfig, AIFieldPrompt,
  UserRecord,
  ServiceDefinition,
  ServiceCategory,
} from '@/types';

// ============================================================
// TEMPLATE CANVAS
// ============================================================

export async function getTemplateCanvas(templateId: string): Promise<TemplateCanvas | null> {
  try {
    const docRef = doc(db, 'template_canvas', templateId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as TemplateCanvas;
    }
    return null;
  } catch (error) {
    console.error('Error fetching template canvas:', error);
    return null;
  }
}

export async function saveTemplateCanvas(templateId: string, canvas: TemplateCanvas): Promise<void> {
  try {
    const docRef = doc(db, 'template_canvas', templateId);
    await setDoc(docRef, {
      ...canvas,
      template_id: templateId,
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error saving template canvas:', error);
    throw error;
  }
}

export async function updateCanvasElements(templateId: string, elements: CanvasElement[]): Promise<void> {
  try {
    const docRef = doc(db, 'template_canvas', templateId);
    await updateDoc(docRef, {
      elements,
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating canvas elements:', error);
    throw error;
  }
}

export async function addCanvasVariant(templateId: string, variant: CanvasVariant): Promise<void> {
  try {
    const canvas = await getTemplateCanvas(templateId);
    if (!canvas) throw new Error('Canvas not found');
    const variants = [...(canvas.variants || []), variant];
    const docRef = doc(db, 'template_canvas', templateId);
    await updateDoc(docRef, { variants, updated_at: new Date().toISOString() });
  } catch (error) {
    console.error('Error adding canvas variant:', error);
    throw error;
  }
}

// ============================================================
// DYNAMIC FORMS
// ============================================================

export async function getDynamicForm(templateId: string): Promise<DynamicFormConfig | null> {
  try {
    const docRef = doc(db, 'dynamic_forms', templateId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as DynamicFormConfig;
    }
    return null;
  } catch (error) {
    console.error('Error fetching dynamic form:', error);
    return null;
  }
}

export async function saveDynamicForm(templateId: string, formConfig: DynamicFormConfig): Promise<void> {
  try {
    const docRef = doc(db, 'dynamic_forms', templateId);
    await setDoc(docRef, {
      ...formConfig,
      template_id: templateId,
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error saving dynamic form:', error);
    throw error;
  }
}

export async function updateFormFields(templateId: string, fields: DynamicFormField[]): Promise<void> {
  try {
    const docRef = doc(db, 'dynamic_forms', templateId);
    await updateDoc(docRef, {
      fields,
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating form fields:', error);
    throw error;
  }
}

// ============================================================
// AI PROMPTS
// ============================================================

export async function getAIPromptConfig(templateId: string): Promise<AIPromptConfig | null> {
  try {
    const docRef = doc(db, 'ai_prompts', templateId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as AIPromptConfig;
    }
    return null;
  } catch (error) {
    console.error('Error fetching AI prompt config:', error);
    return null;
  }
}

export async function saveAIPromptConfig(templateId: string, config: AIPromptConfig): Promise<void> {
  try {
    const docRef = doc(db, 'ai_prompts', templateId);
    await setDoc(docRef, {
      ...config,
      template_id: templateId,
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error saving AI prompt config:', error);
    throw error;
  }
}

// ============================================================
// USER RECORDS
// ============================================================

export async function createUserRecord(record: Omit<UserRecord, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
  try {
    const colRef = collection(db, 'user_records');
    const docRef = await addDoc(colRef, {
      ...record,
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating user record:', error);
    throw error;
  }
}

export async function getUserRecord(recordId: string): Promise<UserRecord | null> {
  try {
    const docRef = doc(db, 'user_records', recordId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as UserRecord;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user record:', error);
    return null;
  }
}

export async function updateUserRecord(recordId: string, data: Partial<UserRecord>): Promise<void> {
  try {
    const docRef = doc(db, 'user_records', recordId);
    await updateDoc(docRef, {
      ...data,
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating user record:', error);
    throw error;
  }
}

export async function getUserRecords(userId: string, templateId?: string): Promise<UserRecord[]> {
  try {
    const colRef = collection(db, 'user_records');
    let q;
    if (templateId) {
      q = query(colRef, where('user_id', '==', userId), where('template_id', '==', templateId), orderBy('updated_at', 'desc'));
    } else {
      q = query(colRef, where('user_id', '==', userId), orderBy('updated_at', 'desc'));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as UserRecord));
  } catch (error) {
    console.error('Error fetching user records:', error);
    return [];
  }
}

export async function deleteUserRecord(recordId: string): Promise<void> {
  try {
    const docRef = doc(db, 'user_records', recordId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting user record:', error);
    throw error;
  }
}

// ============================================================
// SERVICES (Dynamic)
// ============================================================

export async function getServices(): Promise<ServiceDefinition[]> {
  return cache.getOrSet('firestore_services', async () => {
    try {
      const colRef = collection(db, 'services');
      const q = query(colRef, where('is_active', '==', true), orderBy('sort_order', 'asc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ServiceDefinition));
    } catch (error) {
      console.error('Error fetching services:', error);
      return [];
    }
  }, CACHE_TTL.LONG);
}

export async function getService(serviceId: string): Promise<ServiceDefinition | null> {
  try {
    const docRef = doc(db, 'services', serviceId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as ServiceDefinition;
    }
    return null;
  } catch (error) {
    console.error('Error fetching service:', error);
    return null;
  }
}

export async function saveService(serviceId: string, service: Partial<ServiceDefinition>): Promise<void> {
  try {
    const docRef = doc(db, 'services', serviceId);
    await setDoc(docRef, {
      ...service,
      updated_at: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    console.error('Error saving service:', error);
    throw error;
  }
}

export async function createService(service: Omit<ServiceDefinition, 'id'>): Promise<string> {
  try {
    const colRef = collection(db, 'services');
    const docRef = await addDoc(colRef, {
      ...service,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating service:', error);
    throw error;
  }
}

export async function deleteService(serviceId: string): Promise<void> {
  try {
    const docRef = doc(db, 'services', serviceId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting service:', error);
    throw error;
  }
}

export async function getAllServices(): Promise<ServiceDefinition[]> {
  try {
    const colRef = collection(db, 'services');
    const q = query(colRef, orderBy('sort_order', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ServiceDefinition));
  } catch (error) {
    console.error('Error fetching all services:', error);
    return [];
  }
}

export async function getServiceBySlug(slug: string): Promise<ServiceDefinition | null> {
  try {
    const colRef = collection(db, 'services');
    const q = query(colRef, where('slug', '==', slug), limit(1));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const docSnap = snapshot.docs[0];
      return { id: docSnap.id, ...docSnap.data() } as ServiceDefinition;
    }
    return null;
  } catch (error) {
    console.error('Error fetching service by slug:', error);
    return null;
  }
}

// Service Categories
export async function getServiceCategories(): Promise<ServiceCategory[]> {
  return cache.getOrSet('firestore_service_categories', async () => {
    try {
      const colRef = collection(db, 'service_categories');
      const q = query(colRef, orderBy('name_ar', 'asc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ServiceCategory));
    } catch (error) {
      console.error('Error fetching service categories:', error);
      return [];
    }
  }, CACHE_TTL.LONG);
}

export async function saveServiceCategory(categoryId: string, category: Partial<ServiceCategory>): Promise<void> {
  try {
    const docRef = doc(db, 'service_categories', categoryId);
    await setDoc(docRef, { ...category, updated_at: new Date().toISOString() }, { merge: true });
  } catch (error) {
    console.error('Error saving service category:', error);
    throw error;
  }
}

export async function createServiceCategory(category: Omit<ServiceCategory, 'id'>): Promise<string> {
  try {
    const colRef = collection(db, 'service_categories');
    const docRef = await addDoc(colRef, {
      ...category,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating service category:', error);
    throw error;
  }
}

export async function deleteServiceCategory(categoryId: string): Promise<void> {
  try {
    const docRef = doc(db, 'service_categories', categoryId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting service category:', error);
    throw error;
  }
}

// ============================================================
// REAL-TIME LISTENERS
// ============================================================

export function onCanvasChange(templateId: string, callback: (canvas: TemplateCanvas | null) => void) {
  const docRef = doc(db, 'template_canvas', templateId);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as TemplateCanvas);
    } else {
      callback(null);
    }
  });
}

export function onFormChange(templateId: string, callback: (form: DynamicFormConfig | null) => void) {
  const docRef = doc(db, 'dynamic_forms', templateId);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as DynamicFormConfig);
    } else {
      callback(null);
    }
  });
}

/**
 * Real-time listener for user records.
 * Syncs instantly across multiple tabs/users without race conditions.
 * Returns an unsubscribe function to clean up the listener.
 */
export function onUserRecordsChange(
  userId: string,
  callback: (records: UserRecord[]) => void,
  templateId?: string
) {
  const colRef = collection(db, 'user_records');
  let q;
  if (templateId) {
    q = query(colRef, where('user_id', '==', userId), where('template_id', '==', templateId), orderBy('updated_at', 'desc'));
  } else {
    q = query(colRef, where('user_id', '==', userId), orderBy('updated_at', 'desc'));
  }
  return onSnapshot(q, (snapshot) => {
    const records = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as UserRecord));
    callback(records);
  }, (error) => {
    console.error('Error in user records listener:', error);
    callback([]);
  });
}

// ============================================================
// BATCH OPERATIONS (for admin)
// ============================================================

export async function getFullTemplateConfig(templateId: string) {
  const [canvas, form, aiPrompts] = await Promise.all([
    getTemplateCanvas(templateId),
    getDynamicForm(templateId),
    getAIPromptConfig(templateId),
  ]);
  return { canvas, form, aiPrompts };
}

export async function saveFullTemplateConfig(
  templateId: string,
  canvas: TemplateCanvas,
  form: DynamicFormConfig,
  aiPrompts: AIPromptConfig
): Promise<void> {
  await Promise.all([
    saveTemplateCanvas(templateId, canvas),
    saveDynamicForm(templateId, form),
    saveAIPromptConfig(templateId, aiPrompts),
  ]);
}
