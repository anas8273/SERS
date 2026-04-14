'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Settings2, Eye, Layout, ChevronRight, Loader2, RefreshCw } from 'lucide-react';
import { SchemaBuilder } from '@/components/admin/SchemaBuilder';
import { TemplateMapper } from '@/components/admin/TemplateMapper';
import type { DynamicFormField } from '@/types';
import Link from 'next/link';
import { ta } from '@/i18n/auto-translations';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export interface ServiceDesignerConfig {
  /** ID فريد يُستخدم في Firestore و SchemaBuilder — مثل "edu-certificates" */
  serviceId: string;
  /** الاسم العربي للقسم — يظهر في العنوان */
  serviceName: string;
  /** مسار API القسم — مثل "certificates" */
  serviceSlug: string;
  /** Tailwind gradient classes */
  serviceColor: string;
  /** Lucide icon element */
  serviceIcon: React.ReactNode;
  /** مسار الصفحة الرئيسية للخدمات التعليمية */
  backUrl?: string;
  /** هل يدعم محرر القالب البصري (للشهادات وأوراق العمل والخطط) */
  hasVisualDesigner?: boolean;
}

interface ServiceDesignerProps extends ServiceDesignerConfig {
  /** محتوى Tab الأول — جدول البيانات الحالي (CRUD) */
  children: React.ReactNode;
  /** أزرار الإجراءات تظهر بجانب العنوان (إضافة، تصدير، تحديث) */
  headerActions?: React.ReactNode;
}

type TabId = 'data' | 'schema' | 'preview' | 'template';

// ─────────────────────────────────────────────────────────────────────────────
// ServiceDesigner Component
// ─────────────────────────────────────────────────────────────────────────────
export function ServiceDesigner({
  serviceId,
  serviceName,
  serviceSlug,
  serviceColor,
  serviceIcon,
  backUrl = '/admin/educational-services',
  hasVisualDesigner = false,
  children,
  headerActions,
}: ServiceDesignerProps) {
  const [activeTab, setActiveTab] = useState<TabId>('data');
  const [schemaFields, setSchemaFields] = useState<DynamicFormField[]>([]);

  const handleSchemaUpdate = useCallback((fields: DynamicFormField[]) => {
    setSchemaFields(fields);
  }, []);

  const tabs: { id: TabId; label: string; icon: React.ReactNode; color: string }[] = [
    {
      id: 'data',
      label: ta('البيانات', 'Data'),
      icon: <Database className="w-4 h-4" />,
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      id: 'schema',
      label: ta('مصمم النموذج', 'Form Designer'),
      icon: <Settings2 className="w-4 h-4" />,
      color: 'text-violet-600 dark:text-violet-400',
    },
    {
      id: 'preview',
      label: ta('معاينة النموذج', 'Form Preview'),
      icon: <Eye className="w-4 h-4" />,
      color: 'text-emerald-600 dark:text-emerald-400',
    },
    ...(hasVisualDesigner
      ? [
          {
            id: 'template' as TabId,
            label: ta('تصميم القالب', 'Template Design'),
            icon: <Layout className="w-4 h-4" />,
            color: 'text-orange-600 dark:text-orange-400',
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-4" dir="rtl">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={backUrl}
            className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center
              justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors shrink-0"
          >
            <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-300 rotate-180 rtl:rotate-0" />
          </Link>
          <div
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br ${serviceColor}
              flex items-center justify-center shadow-lg shrink-0`}
          >
            {serviceIcon}
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white leading-tight truncate">
              {serviceName}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
              <span
                className={`w-1.5 h-1.5 rounded-full bg-gradient-to-br ${serviceColor} inline-block shrink-0`}
              />
              <span className="truncate">{ta('إدارة الخدمة التعليمية', 'Educational Service Management')}</span>
            </p>
          </div>
        </div>
        {/* Action buttons slot */}
        {headerActions && (
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {headerActions}
          </div>
        )}
      </motion.div>

      {/* ── Tab Navigation ──────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-1.5">
        <div className="overflow-x-auto scrollbar-none -mx-0.5">
          <div className="flex items-center gap-1 min-w-max px-0.5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all
                  whitespace-nowrap shrink-0
                  ${
                    activeTab === tab.id
                      ? `bg-gradient-to-br ${serviceColor} text-white shadow-md`
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }
                `}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab Content ─────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          {activeTab === 'data' && <div className="space-y-4">{children}</div>}

          {activeTab === 'schema' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 sm:p-6">
              <div className="mb-5 pb-4 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-violet-500" />
                  {ta('مصمم نموذج', 'Form Designer')} {serviceName}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {ta('أضف الحقول وعدّلها — المستخدم يرى النموذج النهائي فقط ولا يقدر يعدّل هيكله', 'Add and edit fields — Users see only the final form and cannot edit its structure')}
                </p>
              </div>
              <SchemaBuilder
                templateId={serviceId}
                onSchemaUpdate={handleSchemaUpdate as any}
              />
            </div>
          )}

          {activeTab === 'preview' && (
            <FormPreview
              serviceId={serviceId}
              serviceName={serviceName}
              serviceColor={serviceColor}
              fields={schemaFields}
            />
          )}

          {activeTab === 'template' && hasVisualDesigner && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 sm:p-6">
              <div className="mb-5 pb-4 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <Layout className="w-5 h-5 text-orange-500" />
                  {ta('تصميم قالب', 'Template Design')} {serviceName}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {ta('ارفع صورة التصميم الأساسية ثم ضع الحقول على مواضعها بالضبط', 'Upload the base design image then position the fields exactly')}
                </p>
              </div>
              <TemplateMapper
                templateId={serviceId}
                fields={schemaFields.map((f) => ({
                  id: f.id,
                  label_ar: f.label_ar,
                }))}
              />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FormPreview — معاينة النموذج كما يراه المستخدم
// ─────────────────────────────────────────────────────────────────────────────
interface FormPreviewProps {
  serviceId: string;
  serviceName: string;
  serviceColor: string;
  fields?: DynamicFormField[];
}

const FIELD_ICONS: Record<string, string> = {
  text: '📝', textarea: '📄', number: '#️⃣', date: '📅',
  time: '🕐', select: '📋', multi_select: '☑️', checkbox: '✅',
  radio: '🔘', file: '📎', image: '🖼️', signature: '✍️', color: '🎨',
};

function FormPreview({ serviceId, serviceName, serviceColor, fields = [] }: FormPreviewProps) {
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const visibleFields = fields.filter((f) => f.is_visible !== false);
  const hasFields = visibleFields.length > 0;

  const handleChange = (id: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [id]: value }));
  };

  const handleReset = () => {
    setFormValues({});
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      {/* ── Form Column ─────────────────────────────────── */}
      <div className="lg:col-span-3">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          {/* Header */}
          <div className={`h-2 bg-gradient-to-r ${serviceColor}`} />
          <div className="p-5 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-base font-black text-gray-900 dark:text-white">
                  {ta('معاينة نموذج', 'Form Preview')} {serviceName}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">{ta('هكذا يرى المستخدم النموذج', 'This is how the user sees the form')}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleReset}
                  className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600
                    dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {ta('إعادة تعيين', 'Reset')}
                </button>
                <span className="px-3 py-1.5 text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-600
                   dark:text-amber-400 rounded-xl border border-amber-200 dark:border-amber-800">
                  {ta('وضع المعاينة فقط', 'Preview Mode Only')}
                </span>
              </div>
            </div>
          </div>

          {/* Fields */}
          <div className="p-5">
            {!hasFields ? (
              <EmptyPreview serviceColor={serviceColor} />
            ) : (
              <div className="space-y-5">
                {visibleFields.map((field) => (
                  <FieldPreviewItem
                    key={field.id}
                    field={field}
                    value={formValues[field.id] || ''}
                    onChange={(v) => handleChange(field.id, v)}
                  />
                ))}

                {/* Submit Button (preview only) */}
                <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                  <button
                    disabled
                    className={`w-full py-3 px-6 rounded-xl text-sm font-bold text-white
                      bg-gradient-to-r ${serviceColor} opacity-70 cursor-not-allowed`}
                  >
                    {ta('حفظ البيانات (معاينة فقط)', 'Save Data (Preview Only)')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Summary Column ──────────────────────────────── */}
      <div className="lg:col-span-2 space-y-4">
        {/* Field Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
          <h4 className="text-sm font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-violet-500 inline-block" />
            {ta('إحصائيات النموذج', 'Form Statistics')}
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: ta('إجمالي الحقول', 'Total Fields'), value: fields.length, color: 'text-violet-600 dark:text-violet-400' },
              { label: ta('حقول مرئية', 'Visible Fields'), value: visibleFields.length, color: 'text-blue-600 dark:text-blue-400' },
              {
                label: ta('حقول مطلوبة', 'Required Fields'),
                value: fields.filter((f) => f.validation?.required).length,
                color: 'text-red-600 dark:text-red-400',
              },
              {
                label: ta('حقول AI', 'AI Fields'),
                value: fields.filter((f) => f.ai_fillable).length,
                color: 'text-purple-600 dark:text-purple-400',
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 text-center"
              >
                <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Field List */}
        {hasFields && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
            <h4 className="text-sm font-black text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              {ta('قائمة الحقول', 'Field List')}
            </h4>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {visibleFields.map((field) => (
                <div
                  key={field.id}
                  className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-sm"
                >
                  <span className="text-base flex-shrink-0">{FIELD_ICONS[field.type] || '📝'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 dark:text-gray-200 truncate">
                      {field.label_ar}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {field.type} {field.validation?.required && ta('• مطلوب', '• Required')}
                    </p>
                  </div>
                  {formValues[field.id] && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800 p-4">
          <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
            💡 {ta('هذه معاينة للنموذج كما يراه المستخدم. لإضافة حقول أو تعديلها انتقل إلى تبويب', 'This is a preview of the form as the user sees it. To add or edit fields, go to the')}{' '}
            <strong>{ta('مصمم النموذج', 'Form Designer')}</strong>. {ta('التغييرات تُحفظ تلقائياً في Firestore وتظهر فوراً للمستخدمين.', 'Changes are saved automatically in Firestore and appear immediately to users.')}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FieldPreviewItem
// ─────────────────────────────────────────────────────────────────────────────
function FieldPreviewItem({
  field,
  value,
  onChange,
}: {
  field: DynamicFormField;
  value: string;
  onChange: (v: string) => void;
}) {
  const baseInput =
    'w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 dark:focus:border-blue-500 transition-all';

  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-200">
        {FIELD_ICONS[field.type] || '📝'}
        {field.label_ar}
        {field.validation?.required && (
          <span className="text-red-500 text-xs font-bold">*</span>
        )}
        {field.ai_fillable && (
          <span className="px-1.5 py-0.5 text-[10px] bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full font-bold">
            AI
          </span>
        )}
      </label>

      {field.type === 'textarea' ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder_ar || `أدخل ${field.label_ar}...`}
          className={`${baseInput} min-h-[90px] resize-y`}
          rows={3}
        />
      ) : field.type === 'select' ? (
        <select value={value} onChange={(e) => onChange(e.target.value)} className={baseInput}>
           <option value="">{field.placeholder_ar || `${ta('اختر', 'Choose')} ${field.label_ar}`}</option>
          {(field.options || []).map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label_ar}
            </option>
          ))}
        </select>
      ) : field.type === 'checkbox' ? (
        <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
          <input
            type="checkbox"
            checked={value === 'true'}
            onChange={(e) => onChange(e.target.checked ? 'true' : 'false')}
            className="w-4 h-4 text-blue-600 rounded border-gray-300"
          />
          <span className="text-sm text-gray-700 dark:text-gray-200">{field.label_ar}</span>
        </label>
      ) : field.type === 'radio' && (field.options || []).length > 0 ? (
        <div className="space-y-2">
          {(field.options || []).map((opt) => (
            <label key={opt.value} className="flex items-center gap-3 cursor-pointer p-2.5 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <input
                type="radio"
                name={field.id}
                value={opt.value}
                checked={value === opt.value}
                onChange={() => onChange(opt.value)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-200">{opt.label_ar}</span>
            </label>
          ))}
        </div>
      ) : field.type === 'file' || field.type === 'image' ? (
        <label className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/30 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
          <span className="text-3xl">{field.type === 'image' ? '🖼️' : '📎'}</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {field.placeholder_ar || ta('انقر لاختيار ملف', 'Click to select a file')}
          </span>
          <input type="file" accept={field.type === 'image' ? 'image/*' : '*'} className="hidden" />
        </label>
      ) : field.type === 'color' ? (
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={value || '#3B82F6'}
            onChange={(e) => onChange(e.target.value)}
            className="w-12 h-10 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer"
          />
          <input
            type="text"
            value={value || '#3B82F6'}
            onChange={(e) => onChange(e.target.value)}
            className={`${baseInput} flex-1`}
            placeholder="#000000"
          />
        </div>
      ) : (
        <input
          type={
            field.type === 'date'
              ? 'date'
              : field.type === 'time'
              ? 'time'
              : field.type === 'number'
              ? 'number'
              : 'text'
          }
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder_ar || `${ta('أدخل', 'Enter')} ${field.label_ar}...`}
          className={baseInput}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EmptyPreview — when no fields defined yet
// ─────────────────────────────────────────────────────────────────────────────
function EmptyPreview({ serviceColor }: { serviceColor: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
      <div
        className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${serviceColor} opacity-20
          flex items-center justify-center`}
      >
        <Settings2 className="w-10 h-10 text-white opacity-60" />
      </div>
      <div>
         <p className="font-black text-gray-700 dark:text-gray-200 text-base">
          {ta('لم يتم تصميم النموذج بعد', 'Form not designed yet')}
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          {ta('انتقل إلى تبويب', 'Go to tab')} <strong className="text-violet-500">{ta('مصمم النموذج', 'Form Designer')}</strong> {ta('لإضافة الحقول', 'to add fields')}
        </p>
      </div>
    </div>
  );
}

export default ServiceDesigner;
