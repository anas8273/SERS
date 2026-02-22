'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { getAIPromptConfig, saveAIPromptConfig } from '@/lib/firestore-service';
import type { AIPromptConfig } from '@/types';

// ============================================================
// AI PROMPT MANAGER
// Saves to BOTH MySQL (basic) and Firestore (prompt configs)
// Admin sets hidden prompts per field for AI assistant
// ============================================================

interface AIPrompt {
  id: string;
  field_name: string;
  field_label: string;
  prompt_type: 'fill' | 'suggest' | 'validate' | 'transform';
  system_prompt: string;
  user_prompt_template: string;
  temperature: number;
  max_tokens: number;
  is_active: boolean;
  model: string;
}

interface AIPromptManagerProps {
  templateId: string;
  fields?: Array<{ id: string; name?: string; label_ar: string; ai_enabled?: boolean }>;
}

const PROMPT_TYPES = [
  { value: 'fill', label: 'ملء تلقائي', icon: '🪄', description: 'يملأ الحقل تلقائياً بناءً على السياق' },
  { value: 'suggest', label: 'اقتراحات', icon: '✨', description: 'يقدم اقتراحات متعددة للمستخدم' },
  { value: 'validate', label: 'تحقق', icon: '✅', description: 'يتحقق من صحة المدخلات' },
  { value: 'transform', label: 'تحويل', icon: '🔄', description: 'يحول النص لصيغة أخرى' },
];

const AI_MODELS = [
  { value: 'gpt-4.1-mini', label: 'GPT-4.1 Mini (سريع)' },
  { value: 'gpt-4.1-nano', label: 'GPT-4.1 Nano (أسرع)' },
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
];

const PROMPT_TEMPLATES: Record<string, { system: string; user: string }> = {
  fill: {
    system: 'أنت مساعد تعليمي متخصص في إنشاء المحتوى التعليمي السعودي. أجب بالعربية فقط وبشكل مختصر ومفيد.',
    user: 'قم بملء حقل "{{field_label}}" بناءً على المعلومات التالية:\n{{context}}\n\nأعط إجابة مباشرة بدون شرح إضافي.',
  },
  suggest: {
    system: 'أنت مساعد تعليمي. قدم 3 اقتراحات مناسبة بالعربية، كل اقتراح في سطر منفصل.',
    user: 'اقترح 3 خيارات لحقل "{{field_label}}":\nالسياق: {{context}}\n\nقدم الاقتراحات مرقمة.',
  },
  validate: {
    system: 'أنت مدقق محتوى تعليمي. تحقق من صحة المدخلات وأعط ملاحظات بالعربية.',
    user: 'تحقق من صحة القيمة التالية لحقل "{{field_label}}":\nالقيمة: {{value}}\n\nأجب بـ "صحيح" أو اذكر المشكلة.',
  },
  transform: {
    system: 'أنت محرر نصوص تعليمية. حول النص للصيغة المطلوبة بالعربية.',
    user: 'حول النص التالي لحقل "{{field_label}}":\nالنص الأصلي: {{value}}\n\nحوله لصيغة رسمية مناسبة.',
  },
};

export function AIPromptManager({ templateId, fields = [] }: AIPromptManagerProps) {
  const [prompts, setPrompts] = useState<AIPrompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddPrompt, setShowAddPrompt] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<AIPrompt | null>(null);
  const [showPreview, setShowPreview] = useState<string | null>(null);
  const [previewResult, setPreviewResult] = useState<string>('');
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [globalPrompt, setGlobalPrompt] = useState('');

  const [newPrompt, setNewPrompt] = useState<Partial<AIPrompt>>({
    field_name: '',
    prompt_type: 'fill',
    system_prompt: PROMPT_TEMPLATES.fill.system,
    user_prompt_template: PROMPT_TEMPLATES.fill.user,
    temperature: 0.7,
    max_tokens: 500,
    is_active: true,
    model: 'gpt-4.1-mini',
  });

  // ============================================================
  // LOAD (Firestore first, fallback MySQL)
  // ============================================================
  useEffect(() => {
    loadPrompts();
  }, [templateId]);

  const loadPrompts = async () => {
    setIsLoading(true);
    try {
      // Try Firestore first
      const firestorePrompts = await getAIPromptConfig(templateId);
      if (firestorePrompts) {
        setGlobalPrompt(firestorePrompts.system_prompt || '');
        if (firestorePrompts.field_prompts) {
          setPrompts(firestorePrompts.field_prompts.map((fp: any) => ({
            id: fp.field_id || `prompt_${Date.now()}_${Math.random()}`,
            field_name: fp.field_id,
            field_label: fp.field_id,
            prompt_type: fp.prompt_type || 'fill',
            system_prompt: fp.system_prompt || '',
            user_prompt_template: fp.user_prompt_template || '',
            temperature: fp.temperature || 0.7,
            max_tokens: fp.max_tokens || 500,
            is_active: fp.is_active ?? true,
            model: fp.model || 'gpt-4.1-mini',
          })));
        }
      } else {
        // Fallback to MySQL
        try {
          const response = await api.get(`/admin/templates/${templateId}/ai-prompts`);
          if (response.success) {
            setPrompts(response.data || []);
          }
        } catch (e) {
          console.log('No MySQL prompts found');
        }
      }
    } catch (error) {
      console.error('AI Prompts load error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================
  // SAVE (Firestore + MySQL)
  // ============================================================
  const savePrompts = async () => {
    setIsSaving(true);
    try {
      const promptConfig: AIPromptConfig = {
        template_id: templateId,
        system_prompt: globalPrompt,
        field_prompts: prompts.map(p => ({
          field_id: p.field_name,
          prompt_type: p.prompt_type as any,
          prompt_template: p.user_prompt_template || p.system_prompt || '',
          context_fields: [] as string[],
          output_format: '',
        })),
        model: 'gpt-4.1-mini' as const,
        temperature: 0.7,
        max_tokens: 1000,
        updated_at: new Date().toISOString(),
      };

      // Save to Firestore (primary)
      await saveAIPromptConfig(templateId, promptConfig);

      // Sync to MySQL
      try {
        await api.put(`/admin/templates/${templateId}/ai-prompts`, { prompts });
      } catch (e) {
        console.log('MySQL prompts sync skipped');
      }

      setHasChanges(false);
    } catch (error) {
      console.error('AI Prompts save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================================
  // CRUD
  // ============================================================
  const addPrompt = () => {
    if (!newPrompt.field_name) return;
    const field = fields.find(f => (f.name || f.id) === newPrompt.field_name);
    const prompt: AIPrompt = {
      id: `prompt_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      field_name: newPrompt.field_name!,
      field_label: field?.label_ar || newPrompt.field_name!,
      prompt_type: (newPrompt.prompt_type as any) || 'fill',
      system_prompt: newPrompt.system_prompt || '',
      user_prompt_template: newPrompt.user_prompt_template || '',
      temperature: newPrompt.temperature || 0.7,
      max_tokens: newPrompt.max_tokens || 500,
      is_active: newPrompt.is_active ?? true,
      model: newPrompt.model || 'gpt-4.1-mini',
    };
    setPrompts([...prompts, prompt]);
    setHasChanges(true);
    setShowAddPrompt(false);
    resetNewPrompt();
  };

  const removePrompt = (promptId: string) => {
    setPrompts(prompts.filter(p => p.id !== promptId));
    setHasChanges(true);
  };

  const updatePrompt = (promptId: string, updates: Partial<AIPrompt>) => {
    setPrompts(prompts.map(p => p.id === promptId ? { ...p, ...updates } : p));
    setHasChanges(true);
  };

  const resetNewPrompt = () => {
    setNewPrompt({
      field_name: '',
      prompt_type: 'fill',
      system_prompt: PROMPT_TEMPLATES.fill.system,
      user_prompt_template: PROMPT_TEMPLATES.fill.user,
      temperature: 0.7,
      max_tokens: 500,
      is_active: true,
      model: 'gpt-4.1-mini',
    });
  };

  const handlePromptTypeChange = (type: string) => {
    const template = PROMPT_TEMPLATES[type];
    setNewPrompt({
      ...newPrompt,
      prompt_type: type as any,
      system_prompt: template?.system || '',
      user_prompt_template: template?.user || '',
    });
  };

  // Preview AI response
  const previewPrompt = async (prompt: AIPrompt) => {
    setShowPreview(prompt.id);
    setIsPreviewLoading(true);
    setPreviewResult('');
    try {
      const response = await api.post(`/admin/templates/${templateId}/ai-prompts/preview`, {
        system_prompt: prompt.system_prompt,
        user_prompt: prompt.user_prompt_template
          .replace('{{field_label}}', prompt.field_label)
          .replace('{{context}}', 'بيانات تجريبية للمعاينة')
          .replace('{{value}}', 'قيمة تجريبية'),
        model: prompt.model,
        temperature: prompt.temperature,
        max_tokens: prompt.max_tokens,
      });
      if (response.success) {
        setPreviewResult(response.data.result || 'لا توجد نتيجة');
      }
    } catch (error) {
      setPreviewResult('فشل في المعاينة - تأكد من إعدادات API');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  // Auto-generate prompts for all fields
  const autoGeneratePrompts = () => {
    const existingFieldNames = prompts.map(p => p.field_name);
    const newPrompts: AIPrompt[] = [];
    fields.forEach(field => {
      const fieldName = field.name || field.id;
      if (!existingFieldNames.includes(fieldName)) {
        newPrompts.push({
          id: `prompt_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          field_name: fieldName,
          field_label: field.label_ar,
          prompt_type: 'fill',
          system_prompt: PROMPT_TEMPLATES.fill.system,
          user_prompt_template: PROMPT_TEMPLATES.fill.user.replace('{{field_label}}', field.label_ar),
          temperature: 0.7,
          max_tokens: 500,
          is_active: true,
          model: 'gpt-4.1-mini',
        });
      }
    });
    if (newPrompts.length > 0) {
      setPrompts([...prompts, ...newPrompts]);
      setHasChanges(true);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500">جاري تحميل إعدادات الذكاء الاصطناعي...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            🤖 إدارة الذكاء الاصطناعي
          </h2>
          <p className="text-sm text-gray-500 mt-1">إعداد Hidden Prompts لكل حقل في القالب</p>
        </div>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <span className="px-3 py-1 bg-amber-50 text-amber-600 text-xs rounded-full border border-amber-200">
              ⚠️ تغييرات غير محفوظة
            </span>
          )}
          {fields.length > 0 && (
            <button onClick={autoGeneratePrompts} className="px-4 py-2 bg-purple-100 text-purple-700 rounded-xl text-sm hover:bg-purple-200 transition-all">
              ✨ توليد تلقائي
            </button>
          )}
          <button onClick={() => setShowAddPrompt(true)} className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm hover:bg-purple-700 transition-all">
            ➕ إضافة برومبت
          </button>
          <button onClick={savePrompts} disabled={isSaving || !hasChanges} className="px-4 py-2 bg-green-500 text-white rounded-xl text-sm hover:bg-green-600 transition-all disabled:opacity-50">
            {isSaving ? '⏳ جاري الحفظ...' : '💾 حفظ الإعدادات'}
          </button>
        </div>
      </div>

      {/* Global System Prompt */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
        <h3 className="text-sm font-bold text-purple-800 dark:text-purple-300 mb-2">🌐 البرومبت العام (يُطبق على جميع الحقول)</h3>
        <textarea
          rows={3}
          className="w-full px-3 py-2 border border-purple-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white dark:bg-gray-800 dark:border-gray-600"
          value={globalPrompt}
          onChange={(e) => { setGlobalPrompt(e.target.value); setHasChanges(true); }}
          placeholder="تعليمات عامة للذكاء الاصطناعي تُطبق على جميع حقول هذا القالب..."
        />
      </div>

      {/* Prompts List */}
      {prompts.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <span className="text-5xl block mb-4">🤖</span>
          <h3 className="font-bold text-gray-900 dark:text-white mb-2">لا توجد برومبتات</h3>
          <p className="text-sm text-gray-500 mb-4">أضف Hidden Prompts لتفعيل الذكاء الاصطناعي في القالب</p>
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => setShowAddPrompt(true)} className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm hover:bg-purple-700">
              ➕ إضافة أول برومبت
            </button>
            {fields.length > 0 && (
              <button onClick={autoGeneratePrompts} className="px-4 py-2 bg-purple-100 text-purple-700 rounded-xl text-sm hover:bg-purple-200">
                ✨ توليد تلقائي لجميع الحقول
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {prompts.map((prompt) => {
            const typeInfo = PROMPT_TYPES.find(t => t.value === prompt.prompt_type);
            return (
              <div key={prompt.id} className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 transition-all ${!prompt.is_active ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                      prompt.prompt_type === 'fill' ? 'bg-blue-100' :
                      prompt.prompt_type === 'suggest' ? 'bg-purple-100' :
                      prompt.prompt_type === 'validate' ? 'bg-green-100' : 'bg-orange-100'
                    }`}>
                      {typeInfo?.icon || '🤖'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-gray-900 dark:text-white">{prompt.field_label}</h4>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">{typeInfo?.label}</span>
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full">{prompt.model}</span>
                        {!prompt.is_active && <span className="px-2 py-0.5 bg-red-50 text-red-500 text-xs rounded-full">معطّل</span>}
                      </div>
                      <div className="mt-2 space-y-2">
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                          <p className="text-xs text-gray-500 mb-1 font-medium">System Prompt:</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{prompt.system_prompt}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                          <p className="text-xs text-gray-500 mb-1 font-medium">User Prompt Template:</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{prompt.user_prompt_template}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>🌡️ Temperature: {prompt.temperature}</span>
                        <span>📊 Max Tokens: {prompt.max_tokens}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mr-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={prompt.is_active} onChange={(e) => updatePrompt(prompt.id, { is_active: e.target.checked })} className="sr-only peer" />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                    <button onClick={() => previewPrompt(prompt)} className="p-1.5 text-purple-500 hover:bg-purple-50 rounded-lg" title="معاينة">👁️</button>
                    <button onClick={() => setEditingPrompt(prompt)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg" title="تعديل">⚙️</button>
                    <button onClick={() => removePrompt(prompt.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="حذف">🗑️</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Prompt Modal */}
      {showAddPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAddPrompt(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl p-6 m-4 max-h-[85vh] overflow-y-auto" dir="rtl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">🤖 إضافة Hidden Prompt جديد</h3>

            <div className="space-y-4">
              {/* Field & Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 block mb-1">الحقل المستهدف</label>
                  <select value={newPrompt.field_name} onChange={e => setNewPrompt({ ...newPrompt, field_name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                    <option value="">اختر حقل...</option>
                    {fields.map(f => <option key={f.id} value={f.name || f.id}>{f.label_ar}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">نوع البرومبت</label>
                  <select value={newPrompt.prompt_type} onChange={e => handlePromptTypeChange(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                    {PROMPT_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Model & Parameters */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-gray-600 block mb-1">النموذج</label>
                  <select value={newPrompt.model} onChange={e => setNewPrompt({ ...newPrompt, model: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                    {AI_MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Temperature ({newPrompt.temperature})</label>
                  <input type="range" min="0" max="1" step="0.1" value={newPrompt.temperature} onChange={e => setNewPrompt({ ...newPrompt, temperature: parseFloat(e.target.value) })} className="w-full mt-2" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Max Tokens</label>
                  <input type="number" value={newPrompt.max_tokens} onChange={e => setNewPrompt({ ...newPrompt, max_tokens: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
              </div>

              {/* System Prompt */}
              <div>
                <label className="text-sm text-gray-600 block mb-1">System Prompt <span className="text-xs text-purple-500">(مخفي عن المستخدم)</span></label>
                <textarea rows={4} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" value={newPrompt.system_prompt} onChange={e => setNewPrompt({ ...newPrompt, system_prompt: e.target.value })} />
              </div>

              {/* User Prompt Template */}
              <div>
                <label className="text-sm text-gray-600 block mb-1">User Prompt Template <span className="text-xs text-blue-500">(يدعم المتغيرات)</span></label>
                <textarea rows={4} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" value={newPrompt.user_prompt_template} onChange={e => setNewPrompt({ ...newPrompt, user_prompt_template: e.target.value })} />
                <div className="flex flex-wrap gap-2 mt-2">
                  {['{{field_label}}', '{{context}}', '{{value}}', '{{all_fields}}'].map(v => (
                    <button key={v} onClick={() => setNewPrompt({ ...newPrompt, user_prompt_template: (newPrompt.user_prompt_template || '') + v })} className="px-2 py-1 bg-purple-50 text-purple-600 text-xs rounded-lg hover:bg-purple-100">
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={addPrompt} className="flex-1 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all">إضافة البرومبت</button>
                <button onClick={() => setShowAddPrompt(false)} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all">إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowPreview(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg p-6 m-4" dir="rtl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">👁️ معاينة نتيجة الذكاء الاصطناعي</h3>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 min-h-[100px]">
              {isPreviewLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  <span className="mr-2 text-sm text-gray-500">جاري التوليد...</span>
                </div>
              ) : (
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{previewResult || 'لا توجد نتيجة'}</p>
              )}
            </div>
            <button onClick={() => setShowPreview(null)} className="w-full mt-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200">إغلاق</button>
          </div>
        </div>
      )}

      {/* Edit Prompt Modal */}
      {editingPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setEditingPrompt(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl p-6 m-4 max-h-[85vh] overflow-y-auto" dir="rtl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">⚙️ تعديل البرومبت - {editingPrompt.field_label}</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-gray-600 block mb-1">النموذج</label>
                  <select value={editingPrompt.model} onChange={e => { setEditingPrompt({ ...editingPrompt, model: e.target.value }); updatePrompt(editingPrompt.id, { model: e.target.value }); }} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                    {AI_MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Temperature ({editingPrompt.temperature})</label>
                  <input type="range" min="0" max="1" step="0.1" value={editingPrompt.temperature} onChange={e => { const v = parseFloat(e.target.value); setEditingPrompt({ ...editingPrompt, temperature: v }); updatePrompt(editingPrompt.id, { temperature: v }); }} className="w-full mt-2" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Max Tokens</label>
                  <input type="number" value={editingPrompt.max_tokens} onChange={e => { const v = parseInt(e.target.value); setEditingPrompt({ ...editingPrompt, max_tokens: v }); updatePrompt(editingPrompt.id, { max_tokens: v }); }} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">System Prompt</label>
                <textarea rows={4} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" value={editingPrompt.system_prompt} onChange={e => { setEditingPrompt({ ...editingPrompt, system_prompt: e.target.value }); updatePrompt(editingPrompt.id, { system_prompt: e.target.value }); }} />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">User Prompt Template</label>
                <textarea rows={4} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" value={editingPrompt.user_prompt_template} onChange={e => { setEditingPrompt({ ...editingPrompt, user_prompt_template: e.target.value }); updatePrompt(editingPrompt.id, { user_prompt_template: e.target.value }); }} />
              </div>
              <button onClick={() => setEditingPrompt(null)} className="w-full py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all">تم التعديل</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AIPromptManager;
