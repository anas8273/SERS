/**
 * TemplateRenderer - محرك عرض القوالب الديناميكية
 * يقرأ بنية JSON (TemplateLayout) ويولد الحقول والأقسام تلقائياً
 */
import React from 'react';
import { generateQRDataURL } from '@/lib/qr-utils';

// ─── Types ───────────────────────────────────────────────
interface TemplateField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'select' | 'number' | 'image' | 'list' | 'signatures';
  placeholder?: string;
  required?: boolean;
  options?: string[];
  defaultValue?: string;
  gridColumn?: string;
}

interface TemplateSection {
  id: string;
  title: string;
  titleBg?: string;
  columns?: number;
  fields: TemplateField[];
}

interface TemplateLayout {
  version: number;
  pageSize?: 'A4' | 'letter';
  direction?: 'rtl' | 'ltr';
  headerStyle?: 'full-width' | 'centered' | 'minimal';
  showMoeLogo?: boolean;
  showSchoolLogo?: boolean;
  showEvidenceSection?: boolean;
  evidenceDisplay?: 'images' | 'qr' | 'mixed';
  sections: TemplateSection[];
  footerText?: string;
  signatureLabels?: { right: string; left: string };
}

interface ThemeColors {
  headerBg: string;
  headerText: string;
  accent: string;
  borderColor: string;
  bodyBg: string;
  fontFamily?: string;
}

interface EvidenceItem {
  id: string;
  type: 'image' | 'link' | 'file' | 'video';
  fileName: string;
  fileData?: string;
  link?: string;
  displayAs?: 'image' | 'qr';
}

interface PersonalInfo {
  name?: string;
  school?: string;
  department?: string;
  educationOffice?: string;
  region?: string;
  evaluator?: string;
  customLogo?: string;
  [key: string]: string | undefined;
}

interface TemplateRendererProps {
  layout: TemplateLayout;
  theme: ThemeColors;
  personalInfo: PersonalInfo;
  fieldValues: Record<string, string | string[]>;
  evidences?: EvidenceItem[];
  moeLogo?: string;
  jobTitle?: string;
}

// ─── MOE Logo Default ────────────────────────────────────
const DEFAULT_MOE_LOGO = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663047121386/h34s4aPNVyHXdtjgZ7eNNf/moe-logo-full-5dJWYAGdHPGBpxKkQZFPkP.png';

// ─── Helper: Render field value ──────────────────────────
function renderFieldValue(field: TemplateField, value: string | string[] | undefined, theme: ThemeColors) {
  if (field.type === 'list') {
    const items = Array.isArray(value) ? value : (typeof value === 'string' ? value.split('\n').filter(Boolean) : []);
    if (items.length === 0) return <div style={{ fontSize: '11px', color: '#999', fontStyle: 'italic' }}>لا توجد بيانات</div>;
    return (
      <div style={{ fontSize: '11px', color: '#333', lineHeight: '1.8' }}>
        {items.map((item, i) => (
          <div key={i} style={{ paddingRight: '4px' }}>
            {i + 1}. {item}
          </div>
        ))}
      </div>
    );
  }

  const displayValue = typeof value === 'string' ? value : (Array.isArray(value) ? value.join(', ') : '');
  if (!displayValue) return <div style={{ fontSize: '11px', color: '#999', fontStyle: 'italic' }}>—</div>;
  
  if (field.type === 'textarea') {
    return <div style={{ fontSize: '11px', color: '#333', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>{displayValue}</div>;
  }

  return <div style={{ fontSize: '12px', color: '#1a1a1a', fontWeight: '500' }}>{displayValue}</div>;
}

// ─── Main Component ──────────────────────────────────────
export default function TemplateRenderer({
  layout,
  theme,
  personalInfo,
  fieldValues,
  evidences = [],
  moeLogo = DEFAULT_MOE_LOGO,
  jobTitle,
}: TemplateRendererProps) {
  const dir = layout.direction || 'rtl';

  return (
    <div
      dir={dir}
      style={{
        fontFamily: theme.fontFamily || "'Cairo', 'Tajawal', sans-serif",
        background: theme.bodyBg || '#ffffff',
        maxWidth: layout.pageSize === 'letter' ? '816px' : '794px',
        margin: '0 auto',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    >
      {/* ═══ Header ═══ */}
      <div
        style={{
          background: theme.headerBg,
          padding: layout.headerStyle === 'minimal' ? '16px 24px' : '20px 30px',
          color: theme.headerText,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        {/* Right side: MOE logo + text */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {layout.showMoeLogo !== false && (
            <img src={moeLogo} alt="وزارة التعليم" style={{ height: '55px', objectFit: 'contain' }} />
          )}
          <div style={{ fontSize: '11px', lineHeight: '1.6' }}>
            <div>الإدارة العامة للتعليم</div>
            <div>بالمنطقة {personalInfo.region || ''}</div>
            <div>{personalInfo.school || 'مدرسة'}</div>
          </div>
        </div>

        {/* Left side: School logo */}
        {layout.showSchoolLogo !== false && personalInfo.customLogo && (
          <img src={personalInfo.customLogo} alt="شعار المدرسة" style={{ height: '50px', objectFit: 'contain', borderRadius: '6px' }} />
        )}
      </div>

      {/* ═══ Accent line ═══ */}
      <div style={{ height: '4px', background: `linear-gradient(to left, ${theme.accent}, ${theme.borderColor}, ${theme.accent})` }} />

      {/* ═══ Body ═══ */}
      <div style={{ padding: '24px 28px' }}>
        {layout.sections.map((section) => (
          <div key={section.id} style={{ marginBottom: '20px' }}>
            {/* Section title */}
            <div
              style={{
                background: section.titleBg || `linear-gradient(135deg, ${theme.accent}, ${theme.accent}dd)`,
                color: 'white',
                padding: '8px 20px',
                borderRadius: '8px',
                fontWeight: 'bold',
                fontSize: '13px',
                textAlign: 'center',
                marginBottom: '12px',
              }}
            >
              {section.title}
            </div>

            {/* Section fields */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: (section.columns || 1) === 2 ? '1fr 1fr' : '1fr',
                gap: '10px',
              }}
            >
              {section.fields.map((field) => {
                const value = fieldValues[field.id];
                const isFullWidth = field.type === 'textarea' || field.type === 'list' || field.gridColumn;

                return (
                  <div
                    key={field.id}
                    style={{
                      border: `1.5px solid ${theme.accent}30`,
                      borderRadius: '8px',
                      padding: '10px 14px',
                      background: `${theme.accent}04`,
                      gridColumn: isFullWidth && (section.columns || 1) === 2 ? '1 / -1' : undefined,
                    }}
                  >
                    {/* Field label */}
                    <div
                      style={{
                        fontSize: '10px',
                        fontWeight: 'bold',
                        color: theme.accent,
                        marginBottom: '6px',
                        position: 'relative',
                      }}
                    >
                      <span
                        style={{
                          background: theme.accent,
                          color: 'white',
                          padding: '2px 10px',
                          borderRadius: '4px',
                          fontSize: '10px',
                        }}
                      >
                        {field.label}:
                      </span>
                    </div>

                    {/* Field value */}
                    {renderFieldValue(field, value, theme)}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* ═══ Evidence Section ═══ */}
        {layout.showEvidenceSection !== false && evidences.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <div
              style={{
                background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent}dd)`,
                color: 'white',
                padding: '8px 20px',
                borderRadius: '8px',
                fontWeight: 'bold',
                fontSize: '13px',
                textAlign: 'center',
                marginBottom: '12px',
              }}
            >
              الشواهد
            </div>
            <div
              style={{
                border: `1.5px solid ${theme.accent}30`,
                borderRadius: '10px',
                padding: '14px',
                display: 'grid',
                gridTemplateColumns: evidences.length === 1 ? '1fr' : 'repeat(2, 1fr)',
                gap: '12px',
                background: `${theme.accent}04`,
              }}
            >
              {evidences.map((ev) => {
                // Links → always QR
                if (ev.type === 'link') {
                  return (
                    <div key={ev.id} style={{ border: '1px solid #E8E8E8', borderRadius: '8px', padding: '12px', textAlign: 'center', background: '#FAFAFA' }}>
                      <img src={generateQRDataURL(ev.link || '', 5)} alt="QR" style={{ width: '100px', height: '100px', margin: '0 auto 8px' }} />
                      <div style={{ fontSize: '9px', color: '#666', wordBreak: 'break-all', maxHeight: '30px', overflow: 'hidden' }}>{ev.link}</div>
                    </div>
                  );
                }
                // Files/Videos → always QR
                if (ev.type === 'file' || ev.type === 'video') {
                  const qrData = ev.fileData?.startsWith('idb://') ? ev.fileName : (ev.fileData || ev.fileName);
                  return (
                    <div key={ev.id} style={{ border: '1px solid #E8E8E8', borderRadius: '8px', padding: '12px', textAlign: 'center', background: '#FAFAFA' }}>
                      <img src={generateQRDataURL(qrData.substring(0, 200), 5)} alt="QR" style={{ width: '100px', height: '100px', margin: '0 auto 8px' }} />
                      <div style={{ fontSize: '9px', color: '#666', fontWeight: 'bold' }}>{ev.fileName}</div>
                    </div>
                  );
                }
                // Images → based on displayAs
                if (ev.displayAs === 'qr') {
                  const qrData = ev.fileData?.startsWith('idb://') ? ev.fileName : (ev.fileData || ev.fileName);
                  return (
                    <div key={ev.id} style={{ border: '1px solid #E8E8E8', borderRadius: '8px', padding: '12px', textAlign: 'center', background: '#FAFAFA' }}>
                      <img src={generateQRDataURL(qrData.substring(0, 200), 5)} alt="QR" style={{ width: '100px', height: '100px', margin: '0 auto 8px' }} />
                      <div style={{ fontSize: '9px', color: '#666' }}>{ev.fileName}</div>
                    </div>
                  );
                }
                // Regular image
                return (
                  <div key={ev.id} style={{ border: '1px solid #E8E8E8', borderRadius: '8px', overflow: 'hidden' }}>
                    <img src={ev.fileData?.startsWith('idb://') ? '' : (ev.fileData || '')} alt={ev.fileName} style={{ width: '100%', height: 'auto', maxHeight: '220px', objectFit: 'contain' }} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ Signatures ═══ */}
        {layout.signatureLabels && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '20px' }}>
            <div>
              <div style={{ background: theme.accent, color: 'white', padding: '8px 16px', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold', fontSize: '12px', marginBottom: '8px' }}>
                {layout.signatureLabels.right.split('/')[0]}
              </div>
              <div style={{ border: `1.5px solid ${theme.accent}35`, borderRadius: '10px', padding: '14px', textAlign: 'center', background: `${theme.accent}04` }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1a1a1a' }}>{personalInfo.name || layout.signatureLabels.right.split('/')[1]?.trim() || ''}</div>
                <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>{jobTitle || ''}</div>
                <div style={{ width: '80px', borderBottom: '1.5px dotted #999', margin: '8px auto 0' }} />
              </div>
            </div>
            <div>
              <div style={{ background: theme.accent, color: 'white', padding: '8px 16px', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold', fontSize: '12px', marginBottom: '8px' }}>
                {layout.signatureLabels.left.split('/')[0]}
              </div>
              <div style={{ border: `1.5px solid ${theme.accent}35`, borderRadius: '10px', padding: '14px', textAlign: 'center', background: `${theme.accent}04` }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1a1a1a' }}>{personalInfo.evaluator || layout.signatureLabels.left.split('/')[1]?.trim() || ''}</div>
                <div style={{ width: '80px', borderBottom: '1.5px dotted #999', margin: '8px auto 0' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══ Footer ═══ */}
      <div style={{ height: '4px', background: `linear-gradient(to left, ${theme.accent}, ${theme.borderColor}, ${theme.accent})` }} />
      <div
        style={{
          background: theme.headerBg.includes('gradient') ? theme.headerBg : theme.accent,
          padding: '10px 20px',
          textAlign: 'center',
          color: theme.headerText,
          fontSize: '10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>{layout.footerText || 'SERS - نظام السجلات التعليمية الذكي'}</span>
        <span style={{ opacity: 0.7 }}>صفحة 1</span>
      </div>
    </div>
  );
}

// ─── Template Form Generator ─────────────────────────────
// Generates input form from TemplateLayout for data entry
interface TemplateFormProps {
  layout: TemplateLayout;
  theme: ThemeColors;
  values: Record<string, string | string[]>;
  onChange: (fieldId: string, value: string | string[]) => void;
}

export function TemplateForm({ layout, theme, values, onChange }: TemplateFormProps) {
  return (
    <div dir={layout.direction || 'rtl'} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {layout.sections.map((section) => (
        <div key={section.id} style={{ border: `1px solid ${theme.accent}20`, borderRadius: '12px', overflow: 'hidden' }}>
          <div
            style={{
              background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent}cc)`,
              color: 'white',
              padding: '10px 16px',
              fontWeight: 'bold',
              fontSize: '14px',
            }}
          >
            {section.title}
          </div>
          <div
            style={{
              padding: '16px',
              display: 'grid',
              gridTemplateColumns: (section.columns || 1) === 2 ? '1fr 1fr' : '1fr',
              gap: '12px',
            }}
          >
            {section.fields.map((field) => {
              const value = values[field.id] || (field.type === 'list' ? [] : '');
              const isFullWidth = field.type === 'textarea' || field.type === 'list';

              return (
                <div
                  key={field.id}
                  style={{
                    gridColumn: isFullWidth && (section.columns || 1) === 2 ? '1 / -1' : undefined,
                  }}
                >
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '4px', display: 'block' }}>
                    {field.label}
                    {field.required && <span style={{ color: '#ef4444', marginRight: '4px' }}>*</span>}
                  </label>

                  {field.type === 'textarea' ? (
                    <textarea
                      value={typeof value === 'string' ? value : ''}
                      onChange={(e) => onChange(field.id, e.target.value)}
                      placeholder={field.placeholder || field.label}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: `1px solid ${theme.accent}30`,
                        borderRadius: '8px',
                        fontSize: '13px',
                        resize: 'vertical',
                        fontFamily: 'inherit',
                      }}
                    />
                  ) : field.type === 'list' ? (
                    <textarea
                      value={Array.isArray(value) ? value.join('\n') : (typeof value === 'string' ? value : '')}
                      onChange={(e) => onChange(field.id, e.target.value.split('\n'))}
                      placeholder="أدخل كل عنصر في سطر جديد"
                      rows={4}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: `1px solid ${theme.accent}30`,
                        borderRadius: '8px',
                        fontSize: '13px',
                        resize: 'vertical',
                        fontFamily: 'inherit',
                      }}
                    />
                  ) : field.type === 'select' ? (
                    <select
                      value={typeof value === 'string' ? value : ''}
                      onChange={(e) => onChange(field.id, e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: `1px solid ${theme.accent}30`,
                        borderRadius: '8px',
                        fontSize: '13px',
                      }}
                    >
                      <option value="">اختر...</option>
                      {field.options?.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type === 'date' ? 'text' : field.type === 'number' ? 'number' : 'text'}
                      value={typeof value === 'string' ? value : ''}
                      onChange={(e) => onChange(field.id, e.target.value)}
                      placeholder={field.placeholder || field.label}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: `1px solid ${theme.accent}30`,
                        borderRadius: '8px',
                        fontSize: '13px',
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
