'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { getDynamicForm, saveDynamicForm } from '@/lib/firestore-service';
import type { DynamicFormConfig, DynamicFormField, FieldGroup, FormSettings } from '@/types';

// ============================================================
// SCHEMA BUILDER (Form Builder)
// Saves to BOTH MySQL (basic metadata) and Firestore (dynamic form config)
// ============================================================

interface SchemaBuilderProps {
  templateId: string;
  onSchemaUpdate?: (fields: any[]) => void;
}

const FIELD_TYPES = [
  { value: 'text', label: 'نص', icon: '📝' },
  { value: 'textarea', label: 'نص طويل', icon: '📄' },
  { value: 'number', label: 'رقم', icon: '#️⃣' },
  { value: 'date', label: 'تاريخ', icon: '📅' },
  { value: 'time', label: 'وقت', icon: '🕐' },
  { value: 'select', label: 'قائمة منسدلة', icon: '📋' },
  { value: 'multi_select', label: 'اختيار متعدد', icon: '☑️' },
  { value: 'checkbox', label: 'مربع اختيار', icon: '✅' },
  { value: 'radio', label: 'اختيار واحد', icon: '🔘' },
  { value: 'file', label: 'ملف', icon: '📎' },
  { value: 'image', label: 'صورة', icon: '🖼️' },
  { value: 'signature', label: 'توقيع', icon: '✍️' },
  { value: 'color', label: 'لون', icon: '🎨' },
];

function generateFieldId(): string {
  return 'field_' + Math.random().toString(36).substring(2, 9);
}

export function SchemaBuilder({ templateId, onSchemaUpdate }: SchemaBuilderProps) {
  const [formConfig, setFormConfig] = useState<DynamicFormConfig | null>(null);
  const [fields, setFields] = useState<DynamicFormField[]>([]);
  const [fieldGroups, setFieldGroups] = useState<FieldGroup[]>([]);
  const [settings, setSettings] = useState<FormSettings>({
    enable_ai_assist: true,
    auto_save: true,
    auto_save_interval: 120,
    show_progress: true,
    allow_partial_save: true,
    require_all_fields: false,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showAddField, setShowAddField] = useState(false);
  const [editingField, setEditingField] = useState<DynamicFormField | null>(null);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [deleteFieldId, setDeleteFieldId] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // New field form
  const [newField, setNewField] = useState<Partial<DynamicFormField>>({
    id: '',
    label_ar: '',
    label_en: '',
    type: 'text',
    placeholder_ar: '',
    placeholder_en: '',
    default_value: '',
    group: 'default',
    sort_order: 0,
    is_visible: true,
    ai_fillable: false,
    options: [],
    validation: { required: false },
  });

  // New group form
  const [newGroup, setNewGroup] = useState({ id: '', name_ar: '', name_en: '', icon: '', sort_order: 0 });

  // ============================================================
  // LOAD DATA (from Firestore first, fallback to MySQL)
  // ============================================================
  useEffect(() => {
    loadSchema();
  }, [templateId]);

  const loadSchema = async () => {
    setIsLoading(true);
    try {
      // Try Firestore first
      const firestoreForm = await getDynamicForm(templateId);
      if (firestoreForm) {
        setFormConfig(firestoreForm);
        setFields(firestoreForm.fields || []);
        setFieldGroups(firestoreForm.field_groups || []);
        setSettings(firestoreForm.settings || settings);
      } else {
        // Fallback: load from MySQL API and migrate
        try {
          const response = await api.get(`/admin/templates/${templateId}/schema`);
          if (response.success && response.data?.mysql_fields?.length > 0) {
            const migratedFields: DynamicFormField[] = response.data.mysql_fields.map((f: any, i: number) => ({
              id: f.id || f.name || generateFieldId(),
              label_ar: f.label_ar || f.name,
              label_en: f.label_en || f.name,
              type: f.type || 'text',
              placeholder_ar: f.placeholder_ar || '',
              placeholder_en: f.placeholder_en || '',
              default_value: f.default_value || '',
              group: 'default',
              sort_order: f.sort_order || i,
              is_visible: true,
              ai_fillable: f.ai_enabled || false,
              options: f.options?.map((o: string) => ({ value: o, label_ar: o, label_en: o })) || [],
              validation: { required: f.is_required || false },
            }));
            setFields(migratedFields);
          }
        } catch (e) {
          console.log('No MySQL schema found, starting fresh');
        }
      }
    } catch (error) {
      console.error('Schema load error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================
  // SAVE (to Firestore + MySQL sync)
  // ============================================================
  const saveSchema = async () => {
    setIsSaving(true);
    try {
      const config: DynamicFormConfig = {
        template_id: templateId,
        fields: fields.map((f, i) => ({ ...f, sort_order: i })),
        field_groups: fieldGroups,
        settings,
        updated_at: new Date().toISOString(),
      };

      // Save to Firestore (primary)
      await saveDynamicForm(templateId, config);

      // Sync basic field info to MySQL (for search/filtering)
      try {
        await api.put(`/admin/templates/${templateId}/schema`, {
          fields: fields.map((f, i) => ({
            id: f.id,
            name: f.id,
            label_ar: f.label_ar,
            label_en: f.label_en,
            type: f.type,
            is_required: f.validation.required,
            ai_enabled: f.ai_fillable,
            sort_order: i,
          })),
        });
      } catch (e) {
        console.log('MySQL sync skipped (API may not be available)');
      }

      setFormConfig(config);
      setHasChanges(false);
      onSchemaUpdate?.(fields as any[]);
    } catch (error) {
      console.error('Schema save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================================
  // FIELD OPERATIONS
  // ============================================================
  const addField = () => {
    const fieldId = newField.id || generateFieldId();
    const field: DynamicFormField = {
      id: fieldId,
      name: fieldId,
      label_ar: newField.label_ar || '',
      label_en: newField.label_en || '',
      type: newField.type || 'text',
      placeholder_ar: newField.placeholder_ar || '',
      placeholder_en: newField.placeholder_en || '',
      default_value: newField.default_value || '',
      group: newField.group || 'default',
      sort_order: fields.length,
      is_visible: true,
      ai_fillable: newField.ai_fillable || false,
      options: newField.options || [],
      validation: newField.validation || { required: false },
    };

    setFields([...fields, field]);
    setHasChanges(true);
    setShowAddField(false);
    resetNewField();
  };

  const updateField = (fieldId: string, updates: Partial<DynamicFormField>) => {
    setFields(fields.map(f => f.id === fieldId ? { ...f, ...updates } : f));
    setHasChanges(true);
  };

  const removeField = (fieldId: string) => {
    setFields(fields.filter(f => f.id !== fieldId));
    setHasChanges(true);
    setDeleteFieldId(null);
  };

  const duplicateField = (field: DynamicFormField) => {
    const newId = generateFieldId();
    const duplicate: DynamicFormField = {
      ...field,
      id: newId,
      label_ar: field.label_ar + ' (نسخة)',
      sort_order: fields.length,
    };
    setFields([...fields, duplicate]);
    setHasChanges(true);
  };

  // Drag & Drop
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const newFields = [...fields];
    const [dragged] = newFields.splice(draggedIndex, 1);
    newFields.splice(index, 0, dragged);
    setFields(newFields);
    setDraggedIndex(index);
    setHasChanges(true);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const resetNewField = () => {
    setNewField({
      id: '',
      label_ar: '',
      label_en: '',
      type: 'text',
      placeholder_ar: '',
      placeholder_en: '',
      default_value: '',
      group: 'default',
      sort_order: 0,
      is_visible: true,
      ai_fillable: false,
      options: [],
      validation: { required: false },
    });
  };

  // ============================================================
  // GROUP OPERATIONS
  // ============================================================
  const addGroup = () => {
    if (!newGroup.id || !newGroup.name_ar) return;
    setFieldGroups([...fieldGroups, { ...newGroup, sort_order: fieldGroups.length, collapsible: true, default_collapsed: false }]);
    setNewGroup({ id: '', name_ar: '', name_en: '', icon: '', sort_order: 0 });
    setShowAddGroup(false);
    setHasChanges(true);
  };

  const removeGroup = (groupId: string) => {
    setFieldGroups(fieldGroups.filter(g => g.id !== groupId));
    // Move fields from deleted group to default
    setFields(fields.map(f => f.group === groupId ? { ...f, group: 'default' } : f));
    setHasChanges(true);
  };

  // ============================================================
  // RENDER
  // ============================================================
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500">جاري تحميل مخطط القالب...</p>
        </div>
      </div>
    );
  }

  const groupedFields: Record<string, DynamicFormField[]> = {};
  fields.forEach(f => {
    const g = f.group || 'default';
    if (!groupedFields[g]) groupedFields[g] = [];
    groupedFields[g].push(f);
  });

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="text-2xl">🔧</span> منشئ النماذج (Form Builder)
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            أنشئ حقول القالب بدون كتابة كود - يتم الحفظ في Firestore
          </p>
        </div>

        <div className="flex items-center gap-3">
          {hasChanges && (
            <span className="px-3 py-1 bg-amber-50 text-amber-600 text-xs rounded-full border border-amber-200">
              تغييرات غير محفوظة
            </span>
          )}

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-all"
            title="الإعدادات"
          >
            ⚙️
          </button>

          <button
            onClick={() => setShowAddGroup(true)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all text-sm"
          >
            + مجموعة
          </button>

          <button
            onClick={() => setShowAddField(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all text-sm"
          >
            + إضافة حقل
          </button>

          <button
            onClick={saveSchema}
            disabled={isSaving || !hasChanges}
            className="px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all text-sm disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>💾 حفظ المخطط</>
            )}
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4">⚙️ إعدادات النموذج</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl cursor-pointer">
              <input type="checkbox" checked={settings.enable_ai_assist} onChange={e => { setSettings({ ...settings, enable_ai_assist: e.target.checked }); setHasChanges(true); }} className="w-4 h-4 text-blue-600 rounded" />
              <span className="text-sm">تفعيل مساعد AI</span>
            </label>
            <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl cursor-pointer">
              <input type="checkbox" checked={settings.auto_save} onChange={e => { setSettings({ ...settings, auto_save: e.target.checked }); setHasChanges(true); }} className="w-4 h-4 text-blue-600 rounded" />
              <span className="text-sm">حفظ تلقائي</span>
            </label>
            <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl cursor-pointer">
              <input type="checkbox" checked={settings.show_progress} onChange={e => { setSettings({ ...settings, show_progress: e.target.checked }); setHasChanges(true); }} className="w-4 h-4 text-blue-600 rounded" />
              <span className="text-sm">شريط التقدم</span>
            </label>
            <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl cursor-pointer">
              <input type="checkbox" checked={settings.allow_partial_save} onChange={e => { setSettings({ ...settings, allow_partial_save: e.target.checked }); setHasChanges(true); }} className="w-4 h-4 text-blue-600 rounded" />
              <span className="text-sm">حفظ جزئي</span>
            </label>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <label className="text-xs text-gray-500 block mb-1">فترة الحفظ التلقائي (ثانية)</label>
              <input type="number" value={settings.auto_save_interval || 120} onChange={e => { setSettings({ ...settings, auto_save_interval: Number(e.target.value) }); setHasChanges(true); }} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm" />
            </div>
          </div>
        </div>
      )}

      {/* Field Groups */}
      {fieldGroups.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="font-bold text-gray-900 dark:text-white mb-3 text-sm">📁 مجموعات الحقول</h3>
          <div className="flex flex-wrap gap-2">
            {fieldGroups.map(group => (
              <div key={group.id} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm">
                <span>{(group as any).icon || '📁'}</span>
                <span>{group.name_ar}</span>
                <span className="text-xs text-gray-400">({groupedFields[group.id]?.length || 0})</span>
                <button onClick={() => removeGroup(group.id)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fields List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            📝 حقول القالب ({fields.length})
          </h3>
        </div>

        {fields.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <div className="text-4xl">📝</div>
            <h3 className="font-bold text-gray-900 dark:text-white">لا توجد حقول</h3>
            <p className="text-sm text-gray-500">ابدأ بإضافة حقول لقالبك</p>
            <button onClick={() => setShowAddField(true)} className="px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all text-sm">
              + إضافة أول حقل
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {fields.map((field, index) => {
              const fieldType = FIELD_TYPES.find(ft => ft.value === field.type);
              const isEditing = editingField?.id === field.id;

              return (
                <div
                  key={field.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`p-4 transition-all ${draggedIndex === index ? 'bg-blue-50 dark:bg-blue-900/20 opacity-70' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'}`}
                >
                  <div className="flex items-center gap-4">
                    {/* Drag Handle */}
                    <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" /></svg>
                    </div>

                    {/* Field Icon */}
                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center text-lg">
                      {fieldType?.icon || '📝'}
                    </div>

                    {/* Field Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">{field.label_ar}</h4>
                        {field.validation.required && (
                          <span className="px-2 py-0.5 bg-red-50 text-red-600 text-xs rounded-full border border-red-200">مطلوب</span>
                        )}
                        {field.ai_fillable && (
                          <span className="px-2 py-0.5 bg-purple-50 text-purple-600 text-xs rounded-full border border-purple-200">🤖 AI</span>
                        )}
                        {field.group && field.group !== 'default' && (
                          <span className="px-2 py-0.5 bg-gray-50 text-gray-500 text-xs rounded-full border border-gray-200">{field.group}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>ID: {field.id}</span>
                        <span>النوع: {fieldType?.label}</span>
                        {field.label_en && <span>EN: {field.label_en}</span>}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateField(field.id, { ai_fillable: !field.ai_fillable })} className={`p-2 rounded-lg transition-all ${field.ai_fillable ? 'text-purple-600 bg-purple-50' : 'text-gray-400 hover:text-gray-600'}`} title="تبديل AI">
                        🤖
                      </button>
                      <button onClick={() => updateField(field.id, { is_visible: !field.is_visible })} className={`p-2 rounded-lg transition-all ${field.is_visible ? 'text-blue-600' : 'text-gray-300'}`} title="إظهار/إخفاء">
                        {field.is_visible ? '👁️' : '🙈'}
                      </button>
                      <button onClick={() => duplicateField(field)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-all" title="نسخ">
                        📋
                      </button>
                      <button onClick={() => setEditingField(isEditing ? null : field)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-all" title="تعديل">
                        ⚙️
                      </button>
                      <button onClick={() => setDeleteFieldId(field.id)} className="p-2 text-red-400 hover:text-red-600 rounded-lg transition-all" title="حذف">
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* Edit Panel (inline) */}
                  {isEditing && (
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">التسمية بالعربية</label>
                          <input type="text" value={field.label_ar} onChange={e => updateField(field.id, { label_ar: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">التسمية بالإنجليزية</label>
                          <input type="text" value={field.label_en} onChange={e => updateField(field.id, { label_en: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">نوع الحقل</label>
                          <select value={field.type} onChange={e => updateField(field.id, { type: e.target.value as DynamicFormField['type'] })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                            {FIELD_TYPES.map(ft => <option key={ft.value} value={ft.value}>{ft.icon} {ft.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">المجموعة</label>
                          <select value={field.group || 'default'} onChange={e => updateField(field.id, { group: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                            <option value="default">الأساسية</option>
                            {fieldGroups.map(g => <option key={g.id} value={g.id}>{g.name_ar}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">Placeholder عربي</label>
                          <input type="text" value={field.placeholder_ar || ''} onChange={e => updateField(field.id, { placeholder_ar: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">القيمة الافتراضية</label>
                          <input type="text" value={field.default_value || ''} onChange={e => updateField(field.id, { default_value: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                        </div>
                      </div>

                      {/* Options (for select/radio/multi_select) */}
                      {['select', 'radio', 'multi_select'].includes(field.type) && (
                        <div>
                          <label className="text-xs text-gray-500 block mb-2">الخيارات</label>
                          <div className="space-y-2">
                            {(field.options || []).map((opt, oi) => (
                              <div key={oi} className="flex items-center gap-2">
                                <input type="text" value={opt.value} onChange={e => {
                                  const opts = [...(field.options || [])];
                                  opts[oi] = { ...opts[oi], value: e.target.value };
                                  updateField(field.id, { options: opts });
                                }} placeholder="القيمة" className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm" />
                                <input type="text" value={opt.label_ar} onChange={e => {
                                  const opts = [...(field.options || [])];
                                  opts[oi] = { ...opts[oi], label_ar: e.target.value };
                                  updateField(field.id, { options: opts });
                                }} placeholder="التسمية" className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm" />
                                <button onClick={() => {
                                  const opts = (field.options || []).filter((_, i) => i !== oi);
                                  updateField(field.id, { options: opts });
                                }} className="text-red-400 hover:text-red-600">✕</button>
                              </div>
                            ))}
                            <button onClick={() => {
                              const opts = [...(field.options || []), { value: '', label_ar: '', label_en: '' }];
                              updateField(field.id, { options: opts });
                            }} className="text-blue-500 text-sm hover:text-blue-700">+ إضافة خيار</button>
                          </div>
                        </div>
                      )}

                      {/* Validation */}
                      <div>
                        <label className="text-xs text-gray-500 block mb-2">التحقق</label>
                        <div className="flex flex-wrap gap-3">
                          <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" checked={field.validation.required} onChange={e => updateField(field.id, { validation: { ...field.validation, required: e.target.checked } })} className="w-4 h-4 text-blue-600 rounded" />
                            مطلوب
                          </label>
                          {['text', 'textarea'].includes(field.type) && (
                            <>
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-gray-500">الحد الأدنى:</span>
                                <input type="number" value={field.validation.min_length || ''} onChange={e => updateField(field.id, { validation: { ...field.validation, min_length: Number(e.target.value) || undefined } })} className="w-16 px-2 py-1 border border-gray-200 rounded text-xs" />
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-gray-500">الحد الأقصى:</span>
                                <input type="number" value={field.validation.max_length || ''} onChange={e => updateField(field.id, { validation: { ...field.validation, max_length: Number(e.target.value) || undefined } })} className="w-16 px-2 py-1 border border-gray-200 rounded text-xs" />
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      <button onClick={() => setEditingField(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-all">
                        إغلاق التعديل
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Field Modal */}
      {showAddField && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAddField(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg p-6 m-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">إضافة حقل جديد</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">معرف الحقل (ID)</label>
                  <input type="text" value={newField.id || ''} onChange={e => setNewField({ ...newField, id: e.target.value })} placeholder="field_name" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">نوع الحقل</label>
                  <select value={newField.type} onChange={e => setNewField({ ...newField, type: e.target.value as DynamicFormField['type'] })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                    {FIELD_TYPES.map(ft => <option key={ft.value} value={ft.value}>{ft.icon} {ft.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">التسمية بالعربية *</label>
                <input type="text" value={newField.label_ar || ''} onChange={e => setNewField({ ...newField, label_ar: e.target.value })} placeholder="اسم الحقل بالعربية" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">التسمية بالإنجليزية</label>
                <input type="text" value={newField.label_en || ''} onChange={e => setNewField({ ...newField, label_en: e.target.value })} placeholder="Field Label" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">المجموعة</label>
                <select value={newField.group || 'default'} onChange={e => setNewField({ ...newField, group: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                  <option value="default">الأساسية</option>
                  {fieldGroups.map(g => <option key={g.id} value={g.id}>{g.name_ar}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={newField.validation?.required || false} onChange={e => setNewField({ ...newField, validation: { ...newField.validation, required: e.target.checked } })} className="w-4 h-4 text-blue-600 rounded" />
                  حقل مطلوب
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={newField.ai_fillable || false} onChange={e => setNewField({ ...newField, ai_fillable: e.target.checked })} className="w-4 h-4 text-purple-600 rounded" />
                  تفعيل AI
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={addField} disabled={!newField.label_ar} className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all text-sm disabled:opacity-50">
                  إضافة الحقل
                </button>
                <button onClick={() => setShowAddField(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all text-sm">
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Group Modal */}
      {showAddGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAddGroup(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 m-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">إضافة مجموعة حقول</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1">معرف المجموعة (ID)</label>
                <input type="text" value={newGroup.id} onChange={e => setNewGroup({ ...newGroup, id: e.target.value })} placeholder="group_id" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">الاسم بالعربية *</label>
                <input type="text" value={newGroup.name_ar} onChange={e => setNewGroup({ ...newGroup, name_ar: e.target.value })} placeholder="اسم المجموعة" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">الأيقونة</label>
                <input type="text" value={newGroup.icon} onChange={e => setNewGroup({ ...newGroup, icon: e.target.value })} placeholder="📁" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div className="flex gap-3">
                <button onClick={addGroup} disabled={!newGroup.id || !newGroup.name_ar} className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all text-sm disabled:opacity-50">إضافة</button>
                <button onClick={() => setShowAddGroup(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all text-sm">إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteFieldId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 m-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">تأكيد الحذف</h3>
            <p className="text-sm text-gray-500 mb-4">هل أنت متأكد من حذف هذا الحقل؟</p>
            <div className="flex gap-3">
              <button onClick={() => removeField(deleteFieldId)} className="flex-1 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all text-sm">حذف</button>
              <button onClick={() => setDeleteFieldId(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all text-sm">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SchemaBuilder;
