'use client';
import { ta } from '@/i18n/auto-translations';

import { logger } from '@/lib/logger';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  getTemplateCanvas, getDynamicForm, getAIPromptConfig,
  createUserRecord, updateUserRecord, getUserRecord,
} from '@/lib/firestore-service';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';
import { useTranslation } from '@/i18n/useTranslation';
import type {
  TemplateCanvas, DynamicFormConfig, DynamicFormField, AIPromptConfig,
  CanvasElement, UserRecord, Template,
} from '@/types';


// ============================================================
// DYNAMIC EDITOR - Single route for ALL templates
// Fetches form structure + canvas data from Firestore
// DOM-based live preview for pixel-perfect PDF export
// ============================================================

function DynamicEditorPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const { dir } = useTranslation();
  const templateId = params.templateId as string;
  const recordId = searchParams.get('record');

  // State: Loading & Error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State: Template data from MySQL (via API)
  const [templateMeta, setTemplateMeta] = useState<Template | null>(null);

  // State: Dynamic data from Firestore
  const [canvas, setCanvas] = useState<TemplateCanvas | null>(null);
  const [formConfig, setFormConfig] = useState<DynamicFormConfig | null>(null);
  const [aiConfig, setAIConfig] = useState<AIPromptConfig | null>(null);

  // State: User input
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});
  const [currentRecordId, setCurrentRecordId] = useState<string | null>(recordId);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);

  // State: UI
  const [activeTab, setActiveTab] = useState<'fields' | 'design' | 'ai'>('fields');
  const [zoom, setZoom] = useState(100);
  const [showAIChat, setShowAIChat] = useState(false);
  const [aiMessages, setAIMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [aiInput, setAIInput] = useState('');
  const [aiLoading, setAILoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [undoStack, setUndoStack] = useState<Record<string, any>[]>([]);
  const [redoStack, setRedoStack] = useState<Record<string, any>[]>([]);
  const [exportSuccess, setExportSuccess] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

  // ============================================================
  // LOAD ALL DATA
  // ============================================================
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        // 1. Fetch template metadata from MySQL (via Laravel API)
        try {
          const metaResponse = await api.getTemplate(templateId);
          if (metaResponse?.data) {
            setTemplateMeta(metaResponse.data);
          }
        } catch (e) {
        }

        // 2. Fetch dynamic data from Firestore (parallel)
        const [canvasData, formData, aiData] = await Promise.all([
          getTemplateCanvas(templateId),
          getDynamicForm(templateId),
          getAIPromptConfig(templateId),
        ]);

        if (!canvasData || !formData) {
          setError('لم يتم العثور على بيانات القالب. تأكد من إعداد القالب في لوحة الإدارة.');
          return;
        }

        setCanvas(canvasData);
        setFormConfig(formData);
        setAIConfig(aiData);

        // Set default variant
        const defaultVariant = canvasData.variants?.find(v => v.is_default);
        if (defaultVariant) {
          setSelectedVariant(defaultVariant.id);
        }

        // 3. Load existing record if editing
        if (recordId) {
          const record = await getUserRecord(recordId);
          if (record) {
            setFieldValues(record.field_values || {});
            if (record.variant_id) setSelectedVariant(record.variant_id);
          }
        } else {
          // Initialize with default values
          const defaults: Record<string, any> = {};
          formData.fields.forEach(field => {
            if (field.default_value) {
              defaults[field.id] = field.default_value;
            }
          });
          setFieldValues(defaults);
        }
      } catch (err: any) {
        logger.error('Error loading editor data:', err);
        setError('حدث خطأ أثناء تحميل بيانات القالب');
      } finally {
        setLoading(false);
      }
    }

    if (templateId) loadData();
  }, [templateId, recordId]);

  // ============================================================
  // CALCULATE PROGRESS
  // ============================================================
  useEffect(() => {
    if (!formConfig) return;
    const requiredFields = formConfig.fields.filter(f => f.validation.required && f.is_visible);
    const filledRequired = requiredFields.filter(f => {
      const val = fieldValues[f.id];
      return val !== undefined && val !== null && val !== '';
    });
    setProgress(requiredFields.length > 0 ? Math.round((filledRequired.length / requiredFields.length) * 100) : 0);
  }, [fieldValues, formConfig]);

  // ============================================================
  // AUTO-SAVE
  // ============================================================
  useEffect(() => {
    if (!formConfig?.settings.auto_save || !currentRecordId) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      try {
        await updateUserRecord(currentRecordId, {
          field_values: fieldValues,
          variant_id: selectedVariant || undefined,
        });
      } catch (err) {
        logger.error('Auto-save failed:', err);
        toast.error(ta('فشل الحفظ التلقائي', 'Auto-save failed'));
      }
    }, (formConfig.settings.auto_save_interval || 120) * 1000);

    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [fieldValues, selectedVariant, currentRecordId, formConfig]);

  // ============================================================
  // FIELD CHANGE HANDLER
  // ============================================================
  const handleFieldChange = (fieldId: string, value: any) => {
    setUndoStack(prev => [...prev.slice(-20), { ...fieldValues }]);
    setRedoStack([]);
    setFieldValues(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack(r => [...r, { ...fieldValues }]);
    setFieldValues(prev);
    setUndoStack(u => u.slice(0, -1));
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack(u => [...u, { ...fieldValues }]);
    setFieldValues(next);
    setRedoStack(r => r.slice(0, -1));
  };

  // ============================================================
  // AI ASSISTANT
  // ============================================================
  const handleAIFillField = async (field: DynamicFormField) => {
    if (!aiConfig) return;
    try {
      const fieldPrompt = aiConfig.field_prompts.find(p => p.field_id === field.id);
      if (!fieldPrompt) return;

      const context: Record<string, string> = {};
      (fieldPrompt.context_fields || []).forEach(fid => {
        if (fieldValues[fid]) context[fid] = fieldValues[fid];
      });

      const prompt = fieldPrompt.prompt_template
        .replace(/\{\{(\w+)\}\}/g, (_, key) => context[key] || fieldValues[key] || '');

      const response = await api.chatWithAI(
        aiConfig.system_prompt + '\n\n' + prompt
      );

      if (response?.data?.message) {
        handleFieldChange(field.id, response.data.message);
      }
    } catch (err) {
      logger.error('AI fill failed:', err);
    }
  };

  const handleAIFillAll = async () => {
    if (!aiConfig || !formConfig) return;
    setAILoading(true);
    try {
      const fillableFields = formConfig.fields.filter(f => f.ai_fillable && !fieldValues[f.id]);
      for (const field of fillableFields) {
        await handleAIFillField(field);
      }
    } finally {
      setAILoading(false);
    }
  };

  const handleAIChat = async () => {
    if (!aiInput.trim() || !aiConfig) return;
    const userMsg = aiInput.trim();
    setAIInput('');
    setAIMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setAILoading(true);

    try {
      const contextStr = Object.entries(fieldValues)
        .filter(([, v]) => v)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n');

      const fullPrompt = `${aiConfig.system_prompt}\n\nالبيانات الحالية:\n${contextStr}\n\nسؤال المستخدم: ${userMsg}`;

      const response = await api.chatWithAI(fullPrompt);
      const aiReply = response?.data?.message || 'عذراً، لم أتمكن من المساعدة.';
      setAIMessages(prev => [...prev, { role: 'assistant', content: aiReply }]);
    } catch (err) {
      setAIMessages(prev => [...prev, { role: 'assistant', content: ta('حدث خطأ في الاتصال بالذكاء الاصطناعي.', 'Error connecting to AI.') }]);
    } finally {
      setAILoading(false);
    }
  };

  // ============================================================
  // SAVE
  // ============================================================
  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      if (currentRecordId) {
        await updateUserRecord(currentRecordId, {
          field_values: fieldValues,
          variant_id: selectedVariant || undefined,
          status: 'draft',
        });
      } else {
        const newId = await createUserRecord({
          user_id: user.id,
          template_id: templateId,
          variant_id: selectedVariant || undefined,
          field_values: fieldValues,
          status: 'draft',
        });
        setCurrentRecordId(newId);
      }
      toast.success(ta('تم الحفظ بنجاح', 'Saved successfully'));
    } catch (err) {
      logger.error('Save failed:', err);
      toast.error(ta('فشل الحفظ. حاول مرة أخرى.', 'Save failed. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // EXPORT (Client-side with html2canvas + jspdf)
  // ============================================================
  const handleExport = async (format: 'pdf' | 'image') => {
    if (!previewRef.current) return;
    setExporting(true);
    setExportSuccess(false);

    try {
      // Save first
      await handleSave();

      // Dynamic import for client-side only
      const html2canvas = (await import('html2canvas')).default;

      const previewEl = previewRef.current;
      const canvasWidth = canvas?.canvas_width || 794;
      const canvasHeight = canvas?.canvas_height || 1123;

      // Render the preview div to canvas at original resolution
      const renderedCanvas = await html2canvas(previewEl, {
        scale: 2, // 2x for high quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: canvasWidth,
        height: canvasHeight,
        windowWidth: canvasWidth,
        windowHeight: canvasHeight,
      });

      if (format === 'image') {
        // Export as PNG
        const dataUrl = renderedCanvas.toDataURL('image/png', 1.0);
        const link = document.createElement('a');
        link.download = `${templateMeta?.name_ar || 'template'}_${Date.now()}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Export as PDF using jspdf
        const jsPDF = (await import('jspdf')).default;

        const isLandscape = canvasWidth > canvasHeight;
        const pdf = new jsPDF({
          orientation: isLandscape ? 'landscape' : 'portrait',
          unit: 'px',
          format: [canvasWidth, canvasHeight],
        });

        const imgData = renderedCanvas.toDataURL('image/png', 1.0);
        pdf.addImage(imgData, 'PNG', 0, 0, canvasWidth, canvasHeight);
        pdf.save(`${templateMeta?.name_ar || 'template'}_${Date.now()}.pdf`);
      }

      // Update record status
      if (currentRecordId) {
        await updateUserRecord(currentRecordId, { status: 'exported' });
      }

      setExportSuccess(true);
      toast.success(format === 'pdf' ? ta('تم تصدير PDF بنجاح', 'PDF exported successfully') : 'تم تصدير الصورة بنجاح');
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      logger.error('Export failed:', err);
      toast.error(ta('حدث خطأ أثناء التصدير. حاول مرة أخرى.', 'Error during export. Please try again.'));
    } finally {
      setExporting(false);
    }
  };

  // ============================================================
  // CONDITIONAL FIELD VISIBILITY
  // ============================================================
  const isFieldVisible = (field: DynamicFormField): boolean => {
    if (!field.is_visible) return false;
    if (!field.conditional) return true;
    const { field_id, operator, value } = field.conditional;
    const currentVal = String(fieldValues[field_id] || '');
    switch (operator) {
      case 'equals': return currentVal === value;
      case 'not_equals': return currentVal !== value;
      case 'contains': return currentVal.includes(value);
      case 'greater_than': return Number(currentVal) > Number(value);
      case 'less_than': return Number(currentVal) < Number(value);
      default: return true;
    }
  };

  // ============================================================
  // RENDER FIELD (Dynamic based on type)
  // ============================================================
  const renderField = (field: DynamicFormField) => {
    if (!isFieldVisible(field)) return null;
    const value = fieldValues[field.id] || '';
    const commonClasses = 'w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm bg-white dark:bg-gray-700';

    switch (field.type) {
      case 'text':
      case 'number':
      case 'date':
      case 'time':
      case 'color':
        return (
          <input
            type={field.type}
            value={value}
            onChange={e => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder_ar}
            className={commonClasses}
            required={field.validation.required}
            minLength={field.validation.min_length}
            maxLength={field.validation.max_length}
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={e => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder_ar}
            className={`${commonClasses} min-h-[80px] resize-y`}
            required={field.validation.required}
            rows={3}
          />
        );

      case 'select':
        return (
          <select
            value={value}
            onChange={e => handleFieldChange(field.id, e.target.value)}
            className={commonClasses}
            required={field.validation.required}
          >
            <option value="">{ta('اختر...', 'Select...')}</option>
            {(field.options || []).map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label_ar}</option>
            ))}
          </select>
        );

      case 'multi_select':
        return (
          <div className="flex flex-wrap gap-2">
            {(field.options || []).map(opt => {
              const selected = Array.isArray(value) ? value.includes(opt.value) : false;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    const arr = Array.isArray(value) ? [...value] : [];
                    if (selected) {
                      handleFieldChange(field.id, arr.filter(v => v !== opt.value));
                    } else {
                      handleFieldChange(field.id, [...arr, opt.value]);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${selected ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'}`}
                >
                  {opt.label_ar}
                </button>
              );
            })}
          </div>
        );

      case 'checkbox':
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!!value}
              onChange={e => handleFieldChange(field.id, e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm text-gray-700">{field.label_ar}</span>
          </label>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {(field.options || []).map(opt => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={field.id}
                  value={opt.value}
                  checked={value === opt.value}
                  onChange={e => handleFieldChange(field.id, e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-700">{opt.label_ar}</span>
              </label>
            ))}
          </div>
        );

      case 'image':
      case 'file':
        return (
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-blue-300 transition-all cursor-pointer">
            <input
              type="file"
              accept={field.type === 'image' ? 'image/*' : '*'}
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = () => handleFieldChange(field.id, reader.result);
                  reader.readAsDataURL(file);
                }
              }}
              className="hidden"
              id={`file-${field.id}`}
            />
            <label htmlFor={`file-${field.id}`} className="cursor-pointer">
              {value ? (
                field.type === 'image' ? (
                  <img src={value} alt="" className="max-h-32 mx-auto rounded" />
                ) : (
                  <span className="text-green-600 text-sm">{ta('تم رفع الملف ✓', 'File uploaded ✓')}</span>
                )
              ) : (
                <div className="text-gray-400">
                  <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-sm">{field.type === 'image' ? ta('ارفع صورة', 'Upload image') : ta('ارفع ملف', 'Upload File') }</span>
                </div>
              )}
            </label>
          </div>
        );

      case 'signature':
        return (
          <div className="border border-gray-200 rounded-xl p-2 bg-white">
            <canvas
              width={400}
              height={150}
              className="w-full border border-gray-100 rounded cursor-crosshair"
              onMouseDown={(e) => {
                const cvs = e.currentTarget;
                const ctx = cvs.getContext('2d');
                if (!ctx) return;
                ctx.beginPath();
                const rect = cvs.getBoundingClientRect();
                ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
                const onMove = (ev: MouseEvent) => {
                  ctx.lineTo(ev.clientX - rect.left, ev.clientY - rect.top);
                  ctx.stroke();
                };
                const onUp = () => {
                  handleFieldChange(field.id, cvs.toDataURL());
                  window.removeEventListener('mousemove', onMove);
                  window.removeEventListener('mouseup', onUp);
                };
                window.addEventListener('mousemove', onMove);
                window.addEventListener('mouseup', onUp);
              }}
            />
            <button
              type="button"
              onClick={() => handleFieldChange(field.id, '')}
              className="mt-1 text-xs text-red-500 hover:text-red-700"
            >
              {ta('مسح التوقيع', 'Clear Signature')}
            </button>
          </div>
        );

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={e => handleFieldChange(field.id, e.target.value)}
            className={commonClasses}
          />
        );
    }
  };

  // ============================================================
  // GROUP FIELDS
  // ============================================================
  const getGroupedFields = () => {
    if (!formConfig) return {};
    const groups: Record<string, DynamicFormField[]> = {};

    formConfig.fields.forEach(field => {
      const groupId = field.group || 'default';
      if (!groups[groupId]) groups[groupId] = [];
      groups[groupId].push(field);
    });

    Object.values(groups).forEach(fields => {
      fields.sort((a, b) => a.sort_order - b.sort_order);
    });

    return groups;
  };

  const getGroupName = (groupId: string) => {
    if (groupId === 'default') return 'الحقول الأساسية';
    const group = formConfig?.field_groups?.find(g => g.id === groupId);
    return group?.name_ar || groupId;
  };

  // ============================================================
  // GET BACKGROUND URL
  // ============================================================
  const getBackgroundUrl = () => {
    if (!canvas) return '';
    const variant = canvas.variants?.find(v => v.id === selectedVariant);
    return variant?.background_url || canvas.background_url;
  };

  // ============================================================
  // LOADING STATE
  // ============================================================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" dir={dir}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">{ta('جاري تحميل المحرر...', 'Loading editor...')}</p>
          <p className="text-sm text-gray-400 mt-1">{ta('يتم جلب بيانات القالب من Firestore', 'Template data is fetched from Firestore')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" dir={dir}>
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{ta('خطأ', 'Error')}</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <Link href="/marketplace" className="px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all">
              {ta('العودة للمتجر', 'Back to Store')}
            </Link>
            <button onClick={() => window.location.reload()} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all">
              {ta('إعادة المحاولة', 'Try Again')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const groupedFields = getGroupedFields();
  const bgUrl = getBackgroundUrl();

  // ============================================================
  // MAIN RENDER - Split Screen
  // ============================================================
  return (
    <div className="min-h-screen bg-gray-50" dir={dir}>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-[1920px] mx-auto px-2 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Link href="/marketplace" className="text-gray-500 hover:text-gray-700 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              <h1 className="text-sm sm:text-lg font-bold text-gray-900 truncate">{templateMeta?.name_ar || 'محرر القالب'}</h1>
              <p className="text-xs text-gray-500">
                {currentRecordId ? ta('تعديل السجل', 'Edit Record') : ta('سجل جديد', 'New Record') }
                {formConfig?.settings.auto_save && <span className="mr-2 text-green-500">{ta('● حفظ تلقائي', '● Auto Save')}</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Progress */}
            <div className="hidden md:flex items-center gap-2 ms-4">
              <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-l from-blue-500 to-blue-600 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-xs text-gray-500 font-medium">{progress}%</span>
            </div>

            {/* Undo/Redo */}
            <button onClick={handleUndo} disabled={undoStack.length === 0} className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-30 transition-all" title={ta('تراجع (Ctrl+Z)', 'Undo (Ctrl+Z)')}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
            </button>
            <button onClick={handleRedo} disabled={redoStack.length === 0} className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-30 transition-all" title={ta('إعادة (Ctrl+Y)', 'Redo (Ctrl+Y)')}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" /></svg>
            </button>

            <div className="w-px h-6 bg-gray-200 mx-1" />

            {/* Zoom */}
            <div className="hidden md:flex items-center gap-1">
              <button onClick={() => setZoom(Math.max(50, zoom - 10))} className="p-1 text-gray-500 hover:text-gray-700 text-xs">−</button>
              <span className="text-xs text-gray-500 min-w-[35px] text-center">{zoom}%</span>
              <button onClick={() => setZoom(Math.min(200, zoom + 10))} className="p-1 text-gray-500 hover:text-gray-700 text-xs">+</button>
            </div>

            <div className="w-px h-6 bg-gray-200 mx-1" />

            {/* AI */}
            <button onClick={() => { setActiveTab('ai'); setShowAIChat(!showAIChat); }} className={`p-2 rounded-lg transition-all ${showAIChat ? 'bg-purple-100 text-purple-600' : 'text-gray-500 hover:text-gray-700'}`} title={ta('المساعد الذكي', 'AI Assistant' )}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
            </button>

            {/* Save */}
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all text-sm font-medium disabled:opacity-50">
              {saving ? ta('جاري الحفظ...', 'Saving...') : ta('💾 حفظ', '💾 Save') }
            </button>

            {/* Export */}
            <div className="relative group">
              <button
                disabled={exporting}
                className="px-4 py-2 bg-gradient-to-l from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all text-sm font-medium disabled:opacity-50"
              >
                {exporting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {ta('جاري التصدير...', 'Exporting...')}
                  </span>
                ) : exportSuccess ? (
                  '✅ تم التصدير!'
                ) : (
                  'تصدير ▾'
                )}
              </button>
              {!exporting && !exportSuccess && (
                <div className="absolute left-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-gray-100 py-2 w-44 hidden group-hover:block z-50">
                  <button onClick={() => handleExport('pdf')} className="w-full px-4 py-2.5 text-start text-sm hover:bg-gray-50 transition-colors flex items-center gap-2">
                    <span>📄</span> {ta('تصدير PDF', 'Export PDF')}
                  </button>
                  <button onClick={() => handleExport('image')} className="w-full px-4 py-2.5 text-start text-sm hover:bg-gray-50 transition-colors flex items-center gap-2">
                    <span>🖼️</span> {ta('تصدير صورة PNG', 'Export PNG Image')}
                  </button>
                  <hr className="my-1" />
                  <button onClick={() => window.print()} className="w-full px-4 py-2.5 text-start text-sm hover:bg-gray-50 transition-colors flex items-center gap-2">
                    <span>🖨️</span> {ta('طباعة', 'Print')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Split Screen */}
      <div className="flex flex-col-reverse lg:flex-row h-[calc(100vh-64px)]">
        {/* RIGHT SIDE: Dynamic Form */}
        <div className="w-full lg:w-[400px] bg-white border-t lg:border-t-0 lg:border-l border-gray-200 overflow-y-auto flex-shrink-0 max-h-[50vh] lg:max-h-none">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 sticky top-0 bg-white z-10">
            {[
              { id: 'fields' as const, label: ta('الحقول', 'Fields'), icon: '📝' },
              { id: 'design' as const, label: ta('التصميم', 'Design'), icon: '🎨' },
              { id: 'ai' as const, label: 'AI', icon: '🤖' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 text-sm font-medium transition-all border-b-2 ${activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                <span className="ml-1">{tab.icon}</span> {tab.label}
              </button>
            ))}
          </div>

          <div className="p-4">
            {/* Fields Tab */}
            {activeTab === 'fields' && (
              <div className="space-y-6">
                {Object.entries(groupedFields).map(([groupId, fields]) => (
                  <div key={groupId}>
                    <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                      {getGroupName(groupId)}
                    </h3>
                    <div className="space-y-4">
                      {fields.map(field => (
                        <div key={field.id}>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="text-sm font-medium text-gray-700">
                              {field.label_ar}
                              {field.validation.required && <span className="text-red-500 me-1">*</span>}
                            </label>
                            {field.ai_fillable && aiConfig && (
                              <button
                                onClick={() => handleAIFillField(field)}
                                className="text-xs text-purple-500 hover:text-purple-700 flex items-center gap-1"
                                title={ta('تعبئة بالذكاء الاصطناعي', 'AI Auto-Fill')}
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                AI
                              </button>
                            )}
                          </div>
                          {renderField(field)}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* AI Fill All Button */}
                {aiConfig && formConfig?.settings.enable_ai_assist && (
                  <button
                    onClick={handleAIFillAll}
                    disabled={aiLoading}
                    className="w-full py-3 bg-gradient-to-l from-purple-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {aiLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {ta('جاري التعبئة الذكية...', 'AI filling in progress...')}
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        {ta('تعبئة ذكية لجميع الحقول', 'Smart fill for all fields')}
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Design Tab */}
            {activeTab === 'design' && canvas && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-700">{ta('اختر التصميم', 'Choose Design')}</h3>
                {canvas.variants && canvas.variants.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {canvas.variants.map(variant => (
                      <button
                        key={variant.id}
                        onClick={() => setSelectedVariant(variant.id)}
                        className={`rounded-xl overflow-hidden border-2 transition-all ${selectedVariant === variant.id ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-blue-300'}`}
                      >
                        <div className="aspect-[3/4] bg-gray-100 relative">
                          {variant.preview_url && (
                            <img src={variant.preview_url} alt={variant.name_ar} className="w-full h-full object-cover" />
                          )}
                          {selectedVariant === variant.id && (
                            <div className="absolute top-2 left-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-center py-2 font-medium">{variant.name_ar}</p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <p className="text-sm">{ta('لا توجد تصاميم بديلة لهذا القالب', 'No alternative designs for this template')}</p>
                  </div>
                )}

                {/* Zoom Control */}
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-bold text-gray-700 mb-2">{ta('التكبير', 'Zoom In')}</h3>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setZoom(Math.max(50, zoom - 10))} className="p-1.5 rounded bg-gray-100 hover:bg-gray-200 text-sm">−</button>
                    <input
                      type="range"
                      min={50}
                      max={200}
                      value={zoom}
                      onChange={e => setZoom(Number(e.target.value))}
                      className="flex-1"
                    />
                    <button onClick={() => setZoom(Math.min(200, zoom + 10))} className="p-1.5 rounded bg-gray-100 hover:bg-gray-200 text-sm">+</button>
                    <span className="text-xs text-gray-500 w-10">{zoom}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* AI Tab */}
            {activeTab === 'ai' && (
              <div className="space-y-4">
                <div className="bg-purple-50 rounded-xl p-4">
                  <h3 className="text-sm font-bold text-purple-800 mb-1">{ta('المساعد الذكي', 'AI Assistant')}</h3>
                  <p className="text-xs text-purple-600">{ta('اسأل المساعد الذكي عن أي شيء يتعلق بهذا القالب', 'Ask the smart assistant about anything related to this template')}</p>
                </div>

                {/* Chat Messages */}
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {aiMessages.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <p className="text-sm">{ta('ابدأ محادثة مع المساعد الذكي', 'Start a conversation with the smart assistant')}</p>
                    </div>
                  )}
                  {aiMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-blue-500 text-white rounded-tr-none' : 'bg-gray-100 text-gray-800 rounded-tl-none'}`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {aiLoading && (
                    <div className="flex justify-end">
                      <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-tl-none">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <div className="flex gap-2">
                  <input
                    value={aiInput}
                    onChange={e => setAIInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAIChat()}
                    placeholder={ta('اكتب سؤالك...', 'Type your question...')}
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleAIChat}
                    disabled={aiLoading || !aiInput.trim()}
                    className="px-4 py-2.5 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-all disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2">
                  {['ساعدني في ملء البيانات', 'اقترح محتوى مناسب', 'راجع البيانات المدخلة'].map(action => (
                    <button
                      key={action}
                      onClick={() => { setAIInput(action); }}
                      className="px-3 py-1.5 bg-purple-50 text-purple-600 rounded-lg text-xs hover:bg-purple-100 transition-all"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* LEFT SIDE: Live Preview (DOM-based for PDF export) */}
        <div className="flex-1 overflow-auto p-3 sm:p-6 flex items-start justify-center bg-gray-100">
          <div
            className="bg-white rounded-2xl shadow-xl overflow-hidden"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
          >
            {/* This div is the actual preview that gets exported */}
            <div
              ref={previewRef}
              className="relative"
              style={{
                width: canvas?.canvas_width || 794,
                height: canvas?.canvas_height || 1123,
              }}
            >
              {/* Background Image */}
              {bgUrl && (
                <img
                  src={bgUrl}
                  alt="Template Background"
                  className="absolute inset-0 w-full h-full object-cover"
                  crossOrigin="anonymous"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}

              {/* Fallback background */}
              {!bgUrl && (
                <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
                  <p className="text-gray-400 text-lg">{ta('لم يتم تحميل خلفية القالب', 'Template background not loaded')}</p>
                </div>
              )}

              {/* Overlay text elements at X/Y coordinates */}
              {canvas?.elements?.map((element) => {
                if (!element.is_visible) return null;
                const value = fieldValues[element.field_id] || '';
                if (!value && !element.label) return null;

                const displayText = value || '';
                const cw = canvas.canvas_width || 794;
                const ch = canvas.canvas_height || 1123;

                return (
                  <div
                    key={element.id}
                    className="absolute overflow-hidden"
                    style={{
                      left: `${element.x}%`,
                      top: `${element.y}%`,
                      width: `${element.width}%`,
                      height: `${element.height}%`,
                      fontSize: `${element.font_size}px`,
                      fontFamily: element.font_family || 'Cairo',
                      fontWeight: element.font_weight || 'normal',
                      color: element.color || '#000000',
                      textAlign: element.text_align || 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: element.text_align === 'center' ? 'center' : element.text_align === 'right' ? 'flex-end' : 'flex-start',
                      lineHeight: '1.4',
                      transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
                      whiteSpace: (element.max_lines || 1) === 1 ? 'nowrap' : 'pre-wrap',
                      direction: 'rtl',
                    }}
                  >
                    {displayText}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Required wrapper — useSearchParams() needs Suspense in Next.js App Router
export default function EditorPage() {
  const { dir } = useTranslation();
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50" dir={dir}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">{ta('جاري تحميل المحرر...', 'Loading editor...')}</p>
        </div>
      </div>
    }>
      <DynamicEditorPage />
    </Suspense>
  );
}
