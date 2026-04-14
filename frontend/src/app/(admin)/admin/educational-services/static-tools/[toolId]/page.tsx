'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { ta } from '@/i18n/auto-translations';
import { useTranslation } from '@/i18n/useTranslation';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import {
    ArrowRight, Plus, Trash2, Edit, Eye, EyeOff, GripVertical,
    Save, Loader2, ChevronDown, ChevronRight, Settings,
    FileText, Image as ImageIcon, Link as LinkIcon, Calendar,
    Hash, CheckSquare, AlignLeft, Type, List, ExternalLink,
    Sparkles, RefreshCw, X, Check, LayoutTemplate, Monitor,
    PanelLeftClose, PanelLeft, MousePointer, Columns,
    Smartphone, Pencil, Copy, ToggleLeft,
} from 'lucide-react';
import type { StaticTool, StaticForm, StaticFormField } from '@/types';
import {
    getStaticTool, saveStaticTool, saveToolForms,
} from '@/lib/firestore-static-tools';
import { DEFAULT_SERVICES } from '@/lib/default-services';
import { cn } from '@/lib/utils';

// ── Field type options ────────────────────────────────────────────────────────
const FIELD_TYPES: { value: StaticFormField['type']; label: string; labelEn: string; icon: any }[] = [
    { value: 'text',     label: 'نص قصير',    labelEn: 'Short Text',  icon: Type },
    { value: 'textarea', label: 'نص طويل',    labelEn: 'Long Text',   icon: AlignLeft },
    { value: 'number',   label: 'رقم',        labelEn: 'Number',      icon: Hash },
    { value: 'date',     label: 'تاريخ',      labelEn: 'Date',        icon: Calendar },
    { value: 'select',   label: 'قائمة',      labelEn: 'Dropdown',    icon: List },
    { value: 'checkbox', label: 'صح/خطأ',     labelEn: 'Checkbox',    icon: CheckSquare },
    { value: 'image',    label: 'صورة',       labelEn: 'Image',       icon: ImageIcon },
    { value: 'url',      label: 'رابط',       labelEn: 'URL/Link',    icon: LinkIcon },
];

const FIELD_TYPE_ICON: Record<string, any> = {
    text: Type, textarea: AlignLeft, number: Hash, date: Calendar,
    select: List, checkbox: CheckSquare, image: ImageIcon, url: LinkIcon,
};

// ── Empty defaults ────────────────────────────────────────────────────────────
const emptyField = (sortOrder: number): StaticFormField => ({
    id: crypto.randomUUID(),
    key: '',
    label_ar: '',
    type: 'text',
    placeholder_ar: '',
    required: false,
    rows: 3,
    sort_order: sortOrder,
    is_visible: true,
});

const emptyForm = (sortOrder: number): StaticForm => ({
    id: crypto.randomUUID(),
    title_ar: '',
    description_ar: '',
    fields: [],
    sort_order: sortOrder,
    is_active: true,
});

// ═══════════════════════════════════════════════════════════════════════════════
// INTERACTIVE LIVE PREVIEW COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
function InteractiveLivePreview({
    form,
    selectedFieldId,
    onSelectField,
    previewMode,
}: {
    form: StaticForm;
    selectedFieldId: string | null;
    onSelectField: (fieldId: string) => void;
    previewMode: 'desktop' | 'mobile';
}) {
    const { dir } = useTranslation();
    const [formValues, setFormValues] = useState<Record<string, any>>({});
    const activeFields = (form.fields || []).filter(f => f.is_visible);

    const updateValue = (key: string, value: any) => {
        setFormValues(prev => ({ ...prev, [key]: value }));
    };

    if (activeFields.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <LayoutTemplate className="w-14 h-14 mb-4 opacity-20" />
                <p className="text-base font-bold mb-1">{ta('لا توجد حقول بعد', 'No fields yet')}</p>
                <p className="text-xs">{ta('أضف حقولاً من اللوحة اليمنى لترى المعاينة', 'Add fields from the left panel to see preview')}</p>
            </div>
        );
    }

    return (
        <div className={cn("space-y-5 text-start", previewMode === 'mobile' ? 'max-w-sm mx-auto' : '')} dir={dir}>
            {/* Form title */}
            <div className="mb-6">
                <h3 className="text-lg font-black text-gray-900 dark:text-white">{form.title_ar || ta('(بدون عنوان)', '(Untitled)')}</h3>
                {form.description_ar && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{form.description_ar}</p>}
            </div>

            {activeFields.map(f => {
                const FieldIcon = FIELD_TYPE_ICON[f.type] || Type;
                const isSelected = selectedFieldId === f.id;

                return (
                    <motion.div
                        key={f.id}
                        layout
                        onClick={() => onSelectField(f.id)}
                        className={cn(
                            'relative rounded-xl p-4 cursor-pointer transition-all',
                            isSelected
                                ? 'ring-2 ring-primary bg-primary/5 dark:bg-primary/10 shadow-lg shadow-primary/10'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-700/30 border border-transparent hover:border-gray-200 dark:hover:border-gray-600'
                        )}
                    >
                        {/* Selection indicator */}
                        {isSelected && (
                            <div className="absolute -top-2 -end-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg">
                                <Pencil className="w-3 h-3 text-white" />
                            </div>
                        )}

                        {/* Label */}
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-2">
                            <FieldIcon className="w-3.5 h-3.5 text-gray-400" />
                            {f.label_ar || ta('(بدون عنوان)', '(No label)')}
                            {f.required && <span className="text-red-500 text-xs">*</span>}
                        </label>

                        {/* Interactive field rendering */}
                        {f.type === 'textarea' ? (
                            <textarea
                                rows={f.rows || 3}
                                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none resize-none transition-all"
                                placeholder={f.placeholder_ar || ta('اكتب هنا...', 'Type here...')}
                                value={formValues[f.key] || ''}
                                onChange={e => updateValue(f.key, e.target.value)}
                            />
                        ) : f.type === 'image' ? (
                            <div className="border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800/50 p-6 flex flex-col items-center justify-center text-gray-400 hover:border-primary/50 hover:text-primary/60 transition-colors cursor-pointer">
                                <ImageIcon className="w-8 h-8 mb-2" />
                                <p className="text-xs font-bold">{ta('اضغط لرفع صورة', 'Click to upload image')}</p>
                                <p className="text-[10px] mt-1">{ta('PNG, JPG, WEBP — بحد أقصى 5MB', 'PNG, JPG, WEBP — max 5MB')}</p>
                            </div>
                        ) : f.type === 'select' ? (
                            <select
                                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none appearance-none transition-all"
                                value={formValues[f.key] || ''}
                                onChange={e => updateValue(f.key, e.target.value)}
                            >
                                <option value="">{f.placeholder_ar || ta('اختر...', 'Select...')}</option>
                                {(f.options || []).map((opt, i) => (
                                    <option key={i} value={opt}>{opt}</option>
                                ))}
                            </select>
                        ) : f.type === 'checkbox' ? (
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className={cn(
                                    'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all',
                                    formValues[f.key]
                                        ? 'border-primary bg-primary text-white'
                                        : 'border-gray-300 dark:border-gray-600 group-hover:border-primary/50'
                                )} onClick={() => updateValue(f.key, !formValues[f.key])}>
                                    {formValues[f.key] && <Check className="w-3 h-3" />}
                                </div>
                                <span className="text-sm text-gray-600 dark:text-gray-400">{f.placeholder_ar || f.label_ar}</span>
                            </label>
                        ) : f.type === 'date' ? (
                            <input
                                type="date"
                                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                                value={formValues[f.key] || ''}
                                onChange={e => updateValue(f.key, e.target.value)}
                            />
                        ) : f.type === 'number' ? (
                            <input
                                type="number"
                                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                                placeholder={f.placeholder_ar || '0'}
                                value={formValues[f.key] || ''}
                                onChange={e => updateValue(f.key, e.target.value)}
                            />
                        ) : f.type === 'url' ? (
                            <input
                                type="url"
                                dir="ltr"
                                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                                placeholder={f.placeholder_ar || 'https://...'}
                                value={formValues[f.key] || ''}
                                onChange={e => updateValue(f.key, e.target.value)}
                            />
                        ) : (
                            <input
                                type="text"
                                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                                placeholder={f.placeholder_ar || ta('اكتب هنا...', 'Type here...')}
                                value={formValues[f.key] || ''}
                                onChange={e => updateValue(f.key, e.target.value)}
                            />
                        )}
                    </motion.div>
                );
            })}

            {/* Submit button preview */}
            <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                <button className="w-full bg-gradient-to-l from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 rounded-xl py-3 text-white font-bold text-sm shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]">
                    ⬇ {ta('تحميل PDF', 'Download PDF')}
                </button>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE — SPLIT-SCREEN FORM BUILDER
// ═══════════════════════════════════════════════════════════════════════════════
export default function StaticToolDetailPage() {
    const params    = useParams();
    const router    = useRouter();
    const { dir }   = useTranslation();
    const toolId    = params?.toolId as string;

    const [tool, setTool]             = useState<StaticTool | null>(null);
    const [forms, setForms]           = useState<StaticForm[]>([]);
    const [loading, setLoading]       = useState(true);
    const [saving, setSaving]         = useState(false);

    // Active form being edited
    const [activeFormId, setActiveFormId] = useState<string | null>(null);

    // Field editor
    const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
    const [editingFieldData, setEditingFieldData] = useState<StaticFormField | null>(null);

    // Form editor modal
    const [showFormEditor, setShowFormEditor] = useState(false);
    const [editingForm, setEditingForm] = useState<StaticForm | null>(null);
    const [editingFormData, setEditingFormData] = useState<Partial<StaticForm>>({});

    // Confirm delete
    const [deleteFormId, setDeleteFormId]     = useState<string | null>(null);
    const [deleteFieldId, setDeleteFieldId]   = useState<string | null>(null);

    // UI State
    const [showPanel, setShowPanel] = useState(true);
    const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
    const [newOption, setNewOption] = useState('');

    // Active form
    const activeForm = forms.find(f => f.id === activeFormId) || forms[0] || null;
    const selectedField = activeForm?.fields?.find(f => f.id === selectedFieldId) || null;

    // ── Load tool ──────────────────────────────────────────────────────────────
    const loadTool = useCallback(async () => {
        if (!toolId) return;
        setLoading(true);
        try {
            let data = await getStaticTool(toolId);
            
            // Auto-create from DEFAULT_SERVICES if not found in Firestore
            if (!data) {
                const defaultSvc = DEFAULT_SERVICES.find(s => s.slug === toolId);
                if (defaultSvc) {
                    const newTool: Omit<StaticTool, 'id'> = {
                        title_ar: defaultSvc.name_ar,
                        title_en: defaultSvc.name_en || defaultSvc.name_ar,
                        description_ar: defaultSvc.description_ar,
                        description_en: defaultSvc.description_en || defaultSvc.description_ar,
                        icon: defaultSvc.icon,
                        color: defaultSvc.color,
                        gradient: defaultSvc.gradient || 'from-blue-500 to-blue-600',
                        href: `/${defaultSvc.slug}`,
                        is_active: true,
                        sort_order: defaultSvc.sort_order,
                        forms: [],
                    };
                    await saveStaticTool(toolId, newTool as any);
                    data = { id: toolId, ...newTool } as StaticTool;
                } else {
                    router.push('/admin/educational-services');
                    return;
                }
            }
            
            setTool(data);
            setForms(data.forms || []);
            if (data.forms?.length) setActiveFormId(data.forms[0].id);
        } catch {
            toast.error(ta('خطأ في تحميل الأداة', 'Error loading tool'));
        } finally {
            setLoading(false);
        }
    }, [toolId, router]);

    useEffect(() => { loadTool(); }, [loadTool]);

    // ── Save all forms ──────────────────────────────────────────────────────────
    const handleSaveForms = async (newForms: StaticForm[]) => {
        setSaving(true);
        try {
            await saveToolForms(toolId, newForms);
            setForms(newForms);
            toast.success(ta('تم الحفظ ✅', 'Saved ✅'));
        } catch {
            toast.error(ta('خطأ في الحفظ', 'Save error'));
        } finally {
            setSaving(false);
        }
    };

    // ── Form CRUD ──────────────────────────────────────────────────────────────
    const openAddForm = () => {
        setEditingForm(null);
        setEditingFormData({ title_ar: '', description_ar: '', badge: '', sort_order: forms.length + 1, is_active: true });
        setShowFormEditor(true);
    };

    const openEditForm = (f: StaticForm) => {
        setEditingForm(f);
        setEditingFormData({ ...f });
        setShowFormEditor(true);
    };

    const handleSaveForm = async () => {
        if (!editingFormData.title_ar?.trim()) {
            toast.error(ta('عنوان النموذج مطلوب', 'Form title required'));
            return;
        }
        let newForms: StaticForm[];
        if (editingForm) {
            newForms = forms.map(f => f.id === editingForm.id ? { ...f, ...editingFormData } as StaticForm : f);
        } else {
            const freshForm: StaticForm = {
                id: crypto.randomUUID(),
                title_ar: editingFormData.title_ar || '',
                description_ar: editingFormData.description_ar || '',
                badge: editingFormData.badge,
                fields: [],
                sort_order: forms.length + 1,
                is_active: editingFormData.is_active ?? true,
            };
            newForms = [...forms, freshForm];
            setActiveFormId(freshForm.id);
        }
        await handleSaveForms(newForms);
        setShowFormEditor(false);
        setEditingForm(null);
    };

    const handleDeleteForm = async () => {
        if (!deleteFormId) return;
        const newForms = forms.filter(f => f.id !== deleteFormId);
        await handleSaveForms(newForms);
        setDeleteFormId(null);
        if (activeFormId === deleteFormId) setActiveFormId(newForms[0]?.id || null);
    };

    const toggleFormActive = async (formId: string) => {
        const newForms = forms.map(f => f.id === formId ? { ...f, is_active: !f.is_active } : f);
        await handleSaveForms(newForms);
    };

    // ── Field CRUD ──────────────────────────────────────────────────────────────
    const addField = async (type: StaticFormField['type'] = 'text') => {
        if (!activeForm) return;
        const newField = emptyField((activeForm.fields || []).length + 1);
        newField.type = type;
        newField.label_ar = FIELD_TYPES.find(ft => ft.value === type)?.label || '';
        newField.key = `field_${Date.now()}`;
        const newForms = forms.map(f => {
            if (f.id !== activeForm.id) return f;
            return { ...f, fields: [...(f.fields || []), newField] };
        });
        await handleSaveForms(newForms);
        setSelectedFieldId(newField.id);
        setEditingFieldData(newField);
    };

    const selectField = (fieldId: string) => {
        setSelectedFieldId(fieldId);
        const field = activeForm?.fields?.find(f => f.id === fieldId);
        if (field) setEditingFieldData({ ...field });
    };

    const handleSaveField = async () => {
        if (!editingFieldData || !activeForm) return;
        if (!editingFieldData.label_ar?.trim()) {
            toast.error(ta('عنوان الحقل مطلوب', 'Field label required'));
            return;
        }
        if (!editingFieldData.key?.trim()) {
            editingFieldData.key = editingFieldData.label_ar
                .toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_\u0600-\u06FF]/g, '');
        }
        const newForms = forms.map(f => {
            if (f.id !== activeForm.id) return f;
            const existingIdx = f.fields.findIndex(fld => fld.id === editingFieldData!.id);
            let newFields: StaticFormField[];
            if (existingIdx >= 0) {
                newFields = f.fields.map(fld => fld.id === editingFieldData!.id ? { ...fld, ...editingFieldData } as StaticFormField : fld);
            } else {
                newFields = [...f.fields, editingFieldData as StaticFormField];
            }
            return { ...f, fields: newFields };
        });
        await handleSaveForms(newForms);
    };

    const handleDeleteField = async () => {
        if (!deleteFieldId || !activeForm) return;
        const newForms = forms.map(f => {
            if (f.id !== activeForm.id) return f;
            return { ...f, fields: f.fields.filter(fld => fld.id !== deleteFieldId) };
        });
        await handleSaveForms(newForms);
        setDeleteFieldId(null);
        if (selectedFieldId === deleteFieldId) {
            setSelectedFieldId(null);
            setEditingFieldData(null);
        }
    };

    const toggleFieldVisible = async (fieldId: string) => {
        if (!activeForm) return;
        const newForms = forms.map(f => {
            if (f.id !== activeForm.id) return f;
            return { ...f, fields: f.fields.map(fld => fld.id === fieldId ? { ...fld, is_visible: !fld.is_visible } : fld) };
        });
        await handleSaveForms(newForms);
    };

    const duplicateField = async (fieldId: string) => {
        if (!activeForm) return;
        const field = activeForm.fields.find(f => f.id === fieldId);
        if (!field) return;
        const newField = { ...field, id: crypto.randomUUID(), key: field.key + '_copy', label_ar: field.label_ar + ' (نسخة)', sort_order: activeForm.fields.length + 1 };
        const newForms = forms.map(f => {
            if (f.id !== activeForm.id) return f;
            return { ...f, fields: [...f.fields, newField] };
        });
        await handleSaveForms(newForms);
        toast.success(ta('تم نسخ الحقل', 'Field duplicated'));
    };

    const handleReorderFields = async (newFields: StaticFormField[]) => {
        const reindexed = newFields.map((f, i) => ({ ...f, sort_order: i + 1 }));
        const newForms = forms.map(f => f.id === activeForm?.id ? { ...f, fields: reindexed } : f);
        setForms(newForms);
        await saveToolForms(toolId, newForms);
    };

    // ── Select options ──────────────────────────────────────────────────────────
    const addOption = () => {
        if (!newOption.trim() || !editingFieldData) return;
        setEditingFieldData({ ...editingFieldData, options: [...(editingFieldData.options || []), newOption.trim()] });
        setNewOption('');
    };
    const removeOption = (idx: number) => {
        if (!editingFieldData) return;
        const opts = [...(editingFieldData.options || [])];
        opts.splice(idx, 1);
        setEditingFieldData({ ...editingFieldData, options: opts });
    };

    // ── Loading ───────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-3" />
                    <p className="text-sm text-gray-500">{ta('جاري تحميل المحرر...', 'Loading editor...')}</p>
                </div>
            </div>
        );
    }

    if (!tool) return null;

    // ═══════════════════════════════════════════════════════════════════════════
    return (
        <div className="flex flex-col h-[calc(100vh-80px)] min-h-0" dir={dir}>

            {/* ═══ Top Bar ═══ */}
            <div className="flex flex-wrap items-center justify-between px-3 md:px-4 py-2 md:py-3 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 flex-shrink-0 gap-2">
                <div className="flex items-center gap-3">
                    <Link href="/admin/educational-services/static-tools"
                        className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                    </Link>
                    <div>
                        <h1 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                            <Settings className="w-4 h-4 text-primary" />
                            {tool.title_ar}
                        </h1>
                        <p className="text-[10px] text-gray-400 font-mono" dir="ltr">{tool.href}</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
                    {/* Preview mode toggle */}
                    <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
                        <button onClick={() => setPreviewMode('desktop')}
                            className={cn('p-1.5 rounded-md transition-all', previewMode === 'desktop' ? 'bg-white dark:bg-gray-600 shadow-sm text-primary' : 'text-gray-400')}>
                            <Monitor className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setPreviewMode('mobile')}
                            className={cn('p-1.5 rounded-md transition-all', previewMode === 'mobile' ? 'bg-white dark:bg-gray-600 shadow-sm text-primary' : 'text-gray-400')}>
                            <Smartphone className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    {/* Panel toggle */}
                    <button onClick={() => setShowPanel(!showPanel)}
                        className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors"
                        title={showPanel ? ta('إخفاء اللوحة', 'Hide Panel') : ta('إظهار اللوحة', 'Show Panel')}>
                        {showPanel ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
                    </button>
                    {/* Preview link */}
                    <a href={tool.href} target="_blank" rel="noopener noreferrer" className="hidden sm:inline-flex">
                        <Button variant="outline" size="sm" className="gap-1.5 rounded-xl text-xs">
                            <ExternalLink className="w-3.5 h-3.5" />
                            {ta('عرض الصفحة', 'View Page')}
                        </Button>
                    </a>
                    {/* Save indicator */}
                    {saving && (
                        <Badge className="bg-amber-100 text-amber-700 gap-1 animate-pulse">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            {ta('جاري الحفظ', 'Saving')}
                        </Badge>
                    )}
                </div>
            </div>

            {/* ═══ Form Tabs ═══ */}
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700 flex-shrink-0 overflow-x-auto">
                {forms.map(f => (
                    <button key={f.id}
                        onClick={() => { setActiveFormId(f.id); setSelectedFieldId(null); setEditingFieldData(null); }}
                        className={cn(
                            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all',
                            activeFormId === f.id
                                ? 'bg-white dark:bg-gray-700 text-primary shadow-sm border border-primary/20'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white/50'
                        )}>
                        {!f.is_active && <EyeOff className="w-3 h-3 text-red-400" />}
                        {f.title_ar || ta('بدون عنوان', 'Untitled')}
                        <Badge variant="outline" className="text-[8px] px-1 h-3.5">{f.fields?.length || 0}</Badge>
                    </button>
                ))}
                <button onClick={openAddForm}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-primary hover:bg-primary/10 transition-colors whitespace-nowrap">
                    <Plus className="w-3 h-3" />
                    {ta('نموذج جديد', 'New Form')}
                </button>
            </div>

            {/* ═══ Main Content — Split Screen ═══ */}
            <div className="flex-1 flex overflow-hidden relative">

                {/* ═══ LEFT PANEL: Field List + Editor ═══ */}
                <AnimatePresence>
                {showPanel && (
                    <>
                    {/* Mobile overlay backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowPanel(false)}
                        className="md:hidden fixed inset-0 z-30 bg-black/40 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: '100%', opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        className="fixed md:relative inset-y-0 start-0 z-40 md:z-auto w-full md:!w-[340px] lg:!w-[380px] flex-shrink-0 border-e border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden flex flex-col max-w-[380px]"
                    >
                        {/* Panel Header */}
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
                            <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
                                <Columns className="w-4 h-4 text-primary" />
                                {ta('الحقول', 'Fields')}
                                <Badge className="bg-primary/10 text-primary text-[10px]">{activeForm?.fields?.length || 0}</Badge>
                            </h3>
                            {activeForm && (
                                <div className="flex items-center gap-1">
                                    <button onClick={() => openEditForm(activeForm)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title={ta('تعديل النموذج', 'Edit Form')}>
                                        <Edit className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => toggleFormActive(activeForm.id)} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                                        {activeForm.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                    </button>
                                    <button onClick={() => setDeleteFormId(activeForm.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Field Type Palette — Quick Add */}
                        <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">{ta('إضافة حقل سريع', 'Quick Add Field')}</p>
                            <div className="grid grid-cols-4 gap-1.5">
                                {FIELD_TYPES.map(ft => {
                                    const FIcon = ft.icon;
                                    return (
                                        <button key={ft.value}
                                            onClick={() => addField(ft.value)}
                                            className="flex flex-col items-center justify-center p-2 rounded-lg border border-gray-100 dark:border-gray-700 text-[9px] font-bold text-gray-500 hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all gap-1">
                                            <FIcon className="w-3.5 h-3.5" />
                                            {ft.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Field List — Scrollable */}
                        <div className="flex-1 overflow-y-auto">
                            {!activeForm || !activeForm.fields?.length ? (
                                <div className="flex flex-col items-center justify-center py-12 text-gray-400 px-4">
                                    <Type className="w-10 h-10 mb-3 opacity-20" />
                                    <p className="text-sm font-bold">{ta('لا توجد حقول', 'No fields')}</p>
                                    <p className="text-xs mt-1 text-center">{ta('اضغط على أحد الأنواع أعلاه لإضافة حقل', 'Click a type above to add a field')}</p>
                                </div>
                            ) : (
                                <Reorder.Group axis="y" values={activeForm.fields} onReorder={handleReorderFields} className="divide-y dark:divide-gray-700">
                                    {activeForm.fields.map(field => {
                                        const FIcon = FIELD_TYPE_ICON[field.type] || Type;
                                        const isSelected = selectedFieldId === field.id;
                                        return (
                                            <Reorder.Item key={field.id} value={field}>
                                                <div
                                                    onClick={() => selectField(field.id)}
                                                    className={cn(
                                                        'flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-all',
                                                        isSelected ? 'bg-primary/5 border-s-2 border-primary' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border-s-2 border-transparent',
                                                        !field.is_visible && 'opacity-40'
                                                    )}>
                                                    <div className="cursor-grab text-gray-300 flex-shrink-0">
                                                        <GripVertical className="w-3.5 h-3.5" />
                                                    </div>
                                                    <div className="w-6 h-6 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                                                        <FIcon className="w-3 h-3 text-gray-500" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">{field.label_ar || ta('(بدون عنوان)', '(No label)')}</p>
                                                        <p className="text-[9px] text-gray-400 font-mono truncate">{field.key} · {field.type}</p>
                                                    </div>
                                                    {field.required && <span className="text-red-500 text-[9px] font-bold">*</span>}
                                                    <div className="flex items-center gap-0.5 flex-shrink-0">
                                                        <button onClick={(e) => { e.stopPropagation(); duplicateField(field.id); }}
                                                            className="p-1 text-gray-400 hover:text-blue-500 rounded" title={ta('نسخ', 'Duplicate')}>
                                                            <Copy className="w-3 h-3" />
                                                        </button>
                                                        <button onClick={(e) => { e.stopPropagation(); toggleFieldVisible(field.id); }}
                                                            className="p-1 text-gray-400 hover:text-amber-500 rounded">
                                                            {field.is_visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                                        </button>
                                                        <button onClick={(e) => { e.stopPropagation(); setDeleteFieldId(field.id); }}
                                                            className="p-1 text-gray-400 hover:text-red-500 rounded">
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </Reorder.Item>
                                        );
                                    })}
                                </Reorder.Group>
                            )}
                        </div>

                        {/* ═══ Field Properties Editor (bottom) ═══ */}
                        <AnimatePresence>
                        {editingFieldData && selectedFieldId && (
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: 'auto' }}
                                exit={{ height: 0 }}
                                className="border-t-2 border-primary/20 bg-gray-50 dark:bg-gray-900/50 overflow-hidden flex-shrink-0"
                            >
                                <div className="p-3 space-y-3 max-h-[40vh] overflow-y-auto">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-black text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                            <Pencil className="w-3 h-3 text-primary" />
                                            {ta('خصائص الحقل', 'Field Properties')}
                                        </h4>
                                        <button onClick={() => { setSelectedFieldId(null); setEditingFieldData(null); }}
                                            className="p-1 text-gray-400 hover:text-gray-600 rounded">
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>

                                    {/* Label */}
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 mb-0.5 block">{ta('عنوان الحقل', 'Label')}</label>
                                        <Input value={editingFieldData.label_ar} onChange={e => setEditingFieldData({ ...editingFieldData, label_ar: e.target.value })}
                                            className="h-8 text-xs dark:bg-gray-800 dark:border-gray-700 rounded-lg" />
                                    </div>

                                    {/* Key */}
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 mb-0.5 block">{ta('المفتاح', 'Key')}</label>
                                        <Input value={editingFieldData.key || ''} onChange={e => setEditingFieldData({ ...editingFieldData, key: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                                            dir="ltr" className="h-8 text-xs font-mono dark:bg-gray-800 dark:border-gray-700 rounded-lg" />
                                    </div>

                                    {/* Type */}
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 mb-1 block">{ta('النوع', 'Type')}</label>
                                        <div className="grid grid-cols-4 gap-1">
                                            {FIELD_TYPES.map(ft => {
                                                const FIC = ft.icon;
                                                return (
                                                    <button key={ft.value}
                                                        onClick={() => setEditingFieldData({ ...editingFieldData, type: ft.value })}
                                                        className={cn(
                                                            'flex flex-col items-center p-1.5 rounded-lg border text-[8px] font-bold gap-0.5 transition-all',
                                                            editingFieldData.type === ft.value
                                                                ? 'border-primary bg-primary/10 text-primary'
                                                                : 'border-gray-200 dark:border-gray-700 text-gray-400 hover:border-primary/30'
                                                        )}>
                                                        <FIC className="w-3 h-3" />
                                                        {ft.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Placeholder */}
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 mb-0.5 block">{ta('نص التلميح', 'Placeholder')}</label>
                                        <Input value={editingFieldData.placeholder_ar || ''} onChange={e => setEditingFieldData({ ...editingFieldData, placeholder_ar: e.target.value })}
                                            className="h-8 text-xs dark:bg-gray-800 dark:border-gray-700 rounded-lg" />
                                    </div>

                                    {/* Rows (textarea) */}
                                    {editingFieldData.type === 'textarea' && (
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-500 mb-0.5 block">{ta('عدد الأسطر', 'Rows')}</label>
                                            <Input type="number" min={1} max={20} value={editingFieldData.rows || 3}
                                                onChange={e => setEditingFieldData({ ...editingFieldData, rows: parseInt(e.target.value) || 3 })}
                                                className="h-8 text-xs w-20 dark:bg-gray-800 dark:border-gray-700 rounded-lg" />
                                        </div>
                                    )}

                                    {/* Select options */}
                                    {editingFieldData.type === 'select' && (
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-500 mb-1 block">{ta('الخيارات', 'Options')}</label>
                                            <div className="space-y-1 mb-2">
                                                {(editingFieldData.options || []).map((opt, idx) => (
                                                    <div key={idx} className="flex items-center gap-1">
                                                        <span className="flex-1 text-xs px-2 py-1 bg-white dark:bg-gray-800 rounded border dark:border-gray-700">{opt}</span>
                                                        <button onClick={() => removeOption(idx)} className="p-0.5 text-red-400 hover:text-red-600">
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex gap-1">
                                                <Input value={newOption} onChange={e => setNewOption(e.target.value)}
                                                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addOption(); } }}
                                                    placeholder={ta('أضف خياراً...', 'Add option...')}
                                                    className="flex-1 h-7 text-xs dark:bg-gray-800 dark:border-gray-700 rounded-lg" />
                                                <Button onClick={addOption} size="sm" variant="outline" className="h-7 px-2 text-xs">
                                                    <Plus className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Toggles */}
                                    <div className="flex items-center gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <div onClick={() => setEditingFieldData({ ...editingFieldData, required: !editingFieldData.required })}
                                                className={cn('relative w-8 h-4 rounded-full transition-colors', editingFieldData.required ? 'bg-red-500' : 'bg-gray-300 dark:bg-gray-600')}>
                                                <div className={cn('absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform', editingFieldData.required ? 'translate-x-4' : 'translate-x-0.5')} />
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-600">{ta('إلزامي', 'Required')}</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <div onClick={() => setEditingFieldData({ ...editingFieldData, is_visible: !editingFieldData.is_visible })}
                                                className={cn('relative w-8 h-4 rounded-full transition-colors', editingFieldData.is_visible ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600')}>
                                                <div className={cn('absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform', editingFieldData.is_visible ? 'translate-x-4' : 'translate-x-0.5')} />
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-600">{ta('مرئي', 'Visible')}</span>
                                        </label>
                                    </div>

                                    {/* Save button */}
                                    <Button onClick={handleSaveField} disabled={saving} size="sm" className="w-full gap-1.5 bg-primary text-white rounded-lg h-8 text-xs">
                                        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                        {ta('حفظ التعديلات', 'Save Changes')}
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                        </AnimatePresence>
                    </motion.div>
                    </>
                )}
                </AnimatePresence>

                {/* ═══ RIGHT PANEL: Live Interactive Preview ═══ */}
                <div className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                    <div className="p-4 md:p-6 lg:p-10">
                        {/* Preview Header */}
                        <div className="flex items-center justify-between mb-4 md:mb-6">
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                <Eye className="w-3.5 h-3.5" />
                                <span className="font-bold">{ta('معاينة حية تفاعلية', 'Interactive Live Preview')}</span>
                                <span className="hidden sm:inline">•</span>
                                <span className="hidden sm:inline">{ta('اضغط على أي حقل لتعديله', 'Click any field to edit it')}</span>
                            </div>
                            {/* Mobile panel toggle */}
                            <button onClick={() => setShowPanel(true)} className="md:hidden p-2 rounded-xl bg-primary/10 text-primary">
                                <PanelLeft className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Preview Container */}
                        <div className={cn(
                            'bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 md:p-8 transition-all',
                            previewMode === 'mobile' ? 'max-w-sm mx-auto' : 'max-w-2xl mx-auto'
                        )}>
                            {activeForm ? (
                                <InteractiveLivePreview
                                    form={activeForm}
                                    selectedFieldId={selectedFieldId}
                                    onSelectField={selectField}
                                    previewMode={previewMode}
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                    <LayoutTemplate className="w-16 h-16 mb-4 opacity-20" />
                                    <p className="text-lg font-bold mb-2">{ta('لا توجد نماذج', 'No Forms')}</p>
                                    <p className="text-sm mb-4">{ta('أضف نموذجاً جديداً للبدء', 'Add a new form to get started')}</p>
                                    <Button onClick={openAddForm} className="gap-2 bg-primary text-white">
                                        <Plus className="w-4 h-4" />
                                        {ta('إضافة نموذج', 'Add Form')}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══ Form Editor Modal ═══ */}
            <AnimatePresence>
                {showFormEditor && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl border dark:border-gray-700">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5">
                                {editingForm ? ta('✏️ تعديل النموذج', '✏️ Edit Form') : ta('➕ نموذج جديد', '➕ New Form')}
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                                        {ta('عنوان النموذج *', 'Form Title *')}
                                    </label>
                                    <Input value={editingFormData.title_ar || ''} onChange={e => setEditingFormData({ ...editingFormData, title_ar: e.target.value })}
                                        placeholder={ta('مثال: نموذج توثيق', 'e.g. Documentation Form')}
                                        className="dark:bg-gray-700 dark:border-gray-600" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                                        {ta('الوصف', 'Description')}
                                    </label>
                                    <textarea rows={2} value={editingFormData.description_ar || ''}
                                        onChange={e => setEditingFormData({ ...editingFormData, description_ar: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-xl text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none resize-none focus:ring-2 focus:ring-primary/20" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                                        {ta('شارة (اختياري)', 'Badge')}
                                    </label>
                                    <Input value={editingFormData.badge || ''} onChange={e => setEditingFormData({ ...editingFormData, badge: e.target.value })}
                                        className="dark:bg-gray-700 dark:border-gray-600" />
                                </div>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <div onClick={() => setEditingFormData({ ...editingFormData, is_active: !editingFormData.is_active })}
                                        className={cn('relative w-10 h-5 rounded-full transition-colors', editingFormData.is_active ? 'bg-primary' : 'bg-gray-300')}>
                                        <div className={cn('absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform', editingFormData.is_active ? 'translate-x-5' : 'translate-x-0.5')} />
                                    </div>
                                    <span className="text-sm font-medium">{editingFormData.is_active ? ta('نشط', 'Active') : ta('مخفي', 'Hidden')}</span>
                                </label>
                                <div className="flex gap-3 pt-2">
                                    <Button onClick={handleSaveForm} disabled={saving} className="flex-1 bg-primary text-white gap-2">
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        {ta('حفظ', 'Save')}
                                    </Button>
                                    <Button onClick={() => { setShowFormEditor(false); setEditingForm(null); }} variant="outline" className="flex-1">
                                        {ta('إلغاء', 'Cancel')}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══ Confirm Dialogs ═══ */}
            <ConfirmDialog
                open={!!deleteFormId}
                title={ta('حذف النموذج', 'Delete Form')}
                message={ta('سيتم حذف النموذج وجميع حقوله نهائياً.', 'The form and all its fields will be permanently deleted.')}
                confirmLabel={ta('نعم، احذف', 'Yes, Delete')}
                onConfirm={handleDeleteForm}
                onCancel={() => setDeleteFormId(null)}
            />
            <ConfirmDialog
                open={!!deleteFieldId}
                title={ta('حذف الحقل', 'Delete Field')}
                message={ta('سيتم حذف هذا الحقل نهائياً.', 'This field will be permanently deleted.')}
                confirmLabel={ta('نعم، احذف', 'Yes, Delete')}
                onConfirm={handleDeleteField}
                onCancel={() => setDeleteFieldId(null)}
            />
        </div>
    );
}
