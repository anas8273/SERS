'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { ta } from '@/i18n/auto-translations';

/**
 * Hook for AI-powered field auto-filling in educational forms.
 * Uses the `/ai/suggest` endpoint which accepts field_name + title + current_values.
 */
export function useAIFieldFill() {
  const [loadingField, setLoadingField] = useState<string | null>(null);

  /**
   * Generate AI content for a specific field.
   */
  const fillField = async (
    fieldKey: string,
    fieldLabel: string,
    formTitle: string,
    existingValues: Record<string, string>,
    setter: (key: string, value: string) => void
  ) => {
    if (loadingField) return;
    setLoadingField(fieldKey);
    try {
      const res = await api.post('/ai/suggest', {
        field_name: fieldKey,
        field_label: fieldLabel,
        title: formTitle || 'نموذج تعليمي',
        current_values: existingValues,
        locale: 'ar',
      });
      const content = (res as any)?.data?.suggestion || (res as any)?.suggestion || '';
      if (content) {
        setter(fieldKey, content);
        toast.success(ta('تم التعبئة بنجاح ✨', 'Field filled successfully ✨'));
      } else {
        toast.error(ta('لم يتم إنشاء محتوى', 'No content generated'));
      }
    } catch (err: any) {
      console.error('AI fill error:', err);
      toast.error(ta('فشل الاتصال بالذكاء الاصطناعي', 'AI connection failed'));
    } finally {
      setLoadingField(null);
    }
  };

  /**
   * Fill ALL empty textarea/text fields at once.
   */
  const fillAllFields = async (
    fields: { key: string; label: string; type: string }[],
    formTitle: string,
    currentValues: Record<string, string>,
    setter: (key: string, value: string) => void
  ) => {
    const textFields = fields.filter(f =>
      (f.type === 'textarea' || f.type === 'text') &&
      !currentValues[f.key]?.trim()
    );

    if (textFields.length === 0) {
      toast.error(ta('جميع الحقول ممتلئة بالفعل', 'All fields are already filled'));
      return;
    }

    setLoadingField('__all__');
    toast.success(ta(`جاري تعبئة ${textFields.length} حقول...`, `Filling ${textFields.length} fields...`));

    const updatedValues = { ...currentValues };

    for (const field of textFields) {
      try {
        const res = await api.post('/ai/suggest', {
          field_name: field.key,
          field_label: field.label,
          title: formTitle || 'نموذج تعليمي',
          current_values: updatedValues,
          locale: 'ar',
        });
        const content = (res as any)?.data?.suggestion || (res as any)?.suggestion || '';
        if (content) {
          setter(field.key, content);
          updatedValues[field.key] = content;
        }
      } catch {
        // Skip failed fields silently
      }
    }

    setLoadingField(null);
    toast.success(ta('تم تعبئة الحقول بنجاح! ✨', 'Fields filled successfully! ✨'));
  };

  return { fillField, fillAllFields, loadingField };
}
