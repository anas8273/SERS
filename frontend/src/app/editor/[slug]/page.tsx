'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { 
  ArrowRight, 
  Save,
  Download,
  Image as ImageIcon,
  QrCode,
  History,
  Sparkles,
  Loader2,
  ChevronLeft,
  ChevronDown,
  Check,
  Upload,
  Link as LinkIcon,
  X
} from 'lucide-react';

interface TemplateField {
  id: number;
  name: string;
  label_ar: string;
  label_en: string;
  type: 'text' | 'textarea' | 'date' | 'image' | 'signature' | 'qrcode';
  placeholder_ar: string | null;
  placeholder_en: string | null;
  default_value: string | null;
  is_required: boolean;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  font_size: number;
  font_color: string;
  font_family: string;
  text_align: string;
  order: number;
}

interface TemplateVariant {
  id: number;
  name_ar: string;
  name_en: string;
  background_image: string;
  thumbnail: string | null;
  is_default: boolean;
}

interface Template {
  id: number;
  name_ar: string;
  name_en: string;
  slug: string;
  description_ar: string | null;
  type: 'interactive';
  category: {
    id: number;
    name_ar: string;
    slug: string;
    section: {
      id: number;
      name_ar: string;
      slug: string;
    };
  };
  fields: TemplateField[];
  variants: TemplateVariant[];
}

interface UserData {
  id?: number;
  title: string;
  field_values: Record<string, string>;
  selected_variant_id: number;
}

export default function InteractiveEditorPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const canvasRef = useRef<HTMLDivElement>(null);
  
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // User data state
  const [userData, setUserData] = useState<UserData>({
    title: '',
    field_values: {},
    selected_variant_id: 0
  });
  
  // UI state
  const [showVariants, setShowVariants] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [activeField, setActiveField] = useState<string | null>(null);

  // QR Code state
  const [qrType, setQrType] = useState<'link' | 'file'>('link');
  const [qrLink, setQrLink] = useState('');
  const [qrFieldName, setQrFieldName] = useState('');

  useEffect(() => {
    if (slug) {
      fetchTemplate();
    }
  }, [slug]);

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      const response = await api.getTemplateForEditor(slug);
      if (response.success) {
        setTemplate(response.data);
        
        // Initialize field values
        const initialValues: Record<string, string> = {};
        response.data.fields.forEach((field: TemplateField) => {
          initialValues[field.name] = field.default_value || '';
        });
        
        // Set default variant
        const defaultVariant = response.data.variants.find((v: TemplateVariant) => v.is_default) 
          || response.data.variants[0];
        
        setUserData({
          title: '',
          field_values: initialValues,
          selected_variant_id: defaultVariant?.id || 0
        });
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في تحميل القالب');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (fieldName: string, value: string) => {
    setUserData(prev => ({
      ...prev,
      field_values: {
        ...prev.field_values,
        [fieldName]: value
      }
    }));
  };

  const handleVariantChange = (variantId: number) => {
    setUserData(prev => ({
      ...prev,
      selected_variant_id: variantId
    }));
    setShowVariants(false);
  };

  const handleAISuggest = async (fieldName: string) => {
    try {
      setAiLoading(true);
      setActiveField(fieldName);
      
      const response = await api.getAISuggestion({
        template_id: template?.id,
        field_name: fieldName,
        title: userData.title,
        current_values: userData.field_values
      });
      
      if (response.success && response.data.suggestion) {
        handleFieldChange(fieldName, response.data.suggestion);
      }
    } catch (err) {
      console.error('AI suggestion error:', err);
    } finally {
      setAiLoading(false);
      setActiveField(null);
    }
  };

  const handleAIFillAll = async () => {
    try {
      setAiLoading(true);
      
      const response = await api.getAIFillAll({
        template_id: template?.id,
        title: userData.title,
        current_values: userData.field_values
      });
      
      if (response.success && response.data.values) {
        setUserData(prev => ({
          ...prev,
          field_values: {
            ...prev.field_values,
            ...response.data.values
          }
        }));
      }
    } catch (err) {
      console.error('AI fill all error:', err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleGenerateQR = async () => {
    if (!qrFieldName) return;
    
    try {
      const response = await api.generateQRCode({
        type: qrType,
        content: qrLink
      });
      
      if (response.success && response.data.qr_image) {
        handleFieldChange(qrFieldName, response.data.qr_image);
        setShowQRModal(false);
        setQrLink('');
      }
    } catch (err) {
      console.error('QR generation error:', err);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const response = await api.saveUserTemplateData({
        template_id: template?.id,
        variant_id: userData.selected_variant_id,
        title: userData.title,
        field_values: userData.field_values
      });
      
      if (response.success) {
        // Show success message
        alert('تم الحفظ بنجاح');
      }
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async (format: 'image' | 'pdf') => {
    try {
      setExporting(true);
      
      const response = await api.exportTemplate({
        template_id: template?.id,
        variant_id: userData.selected_variant_id,
        field_values: userData.field_values,
        format
      });
      
      if (response.success && response.data.download_url) {
        // Download the file
        window.open(response.data.download_url, '_blank');
      }
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setExporting(false);
    }
  };

  const selectedVariant = template?.variants.find(v => v.id === userData.selected_variant_id);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'القالب غير موجود'}</p>
          <Link 
            href="/sections"
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            العودة للأقسام
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm">
              <Link 
                href={`/categories/${template.category.slug}`}
                className="text-gray-500 hover:text-primary flex items-center gap-1"
              >
                <ArrowRight className="w-4 h-4" />
                {template.category.name_ar}
              </Link>
              <ChevronLeft className="w-4 h-4 text-gray-400" />
              <span className="text-primary font-medium">{template.name_ar}</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowHistory(true)}
                className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
                title="سجل التغييرات"
              >
                <History className="w-5 h-5" />
              </button>
              
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                حفظ
              </button>
              
              <div className="relative">
                <button
                  onClick={() => handleExport('image')}
                  disabled={exporting}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  تصدير
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar - Form */}
          <div className="lg:col-span-1 space-y-4">
            {/* Title Input */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                عنوان المستند
              </label>
              <input
                type="text"
                value={userData.title}
                onChange={(e) => setUserData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="أدخل عنوان المستند..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Variant Selector */}
            {template.variants.length > 1 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  اختر التصميم
                </label>
                <div className="relative">
                  <button
                    onClick={() => setShowVariants(!showVariants)}
                    className="w-full flex items-center justify-between px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  >
                    <span>{selectedVariant?.name_ar || 'اختر تصميم'}</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  
                  {showVariants && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                      {template.variants.map((variant) => (
                        <button
                          key={variant.id}
                          onClick={() => handleVariantChange(variant.id)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        >
                          {variant.thumbnail && (
                            <img 
                              src={variant.thumbnail} 
                              alt={variant.name_ar}
                              className="w-12 h-12 object-cover rounded"
                            />
                          )}
                          <span className="flex-1 text-right">{variant.name_ar}</span>
                          {variant.id === userData.selected_variant_id && (
                            <Check className="w-4 h-4 text-primary" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* AI Fill All Button */}
            <button
              onClick={handleAIFillAll}
              disabled={aiLoading || !userData.title}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {aiLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Sparkles className="w-5 h-5" />
              )}
              تعبئة تلقائية بالذكاء الاصطناعي
            </button>

            {/* Fields Form */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-900 dark:text-white">حقول القالب</h3>
              
              {template.fields.map((field) => (
                <div key={field.id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {field.label_ar}
                      {field.is_required && <span className="text-red-500 mr-1">*</span>}
                    </label>
                    
                    {field.type === 'text' || field.type === 'textarea' ? (
                      <button
                        onClick={() => handleAISuggest(field.name)}
                        disabled={aiLoading && activeField === field.name}
                        className="text-xs text-purple-500 hover:text-purple-600 flex items-center gap-1"
                      >
                        {aiLoading && activeField === field.name ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                        اقتراح
                      </button>
                    ) : field.type === 'qrcode' ? (
                      <button
                        onClick={() => {
                          setQrFieldName(field.name);
                          setShowQRModal(true);
                        }}
                        className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1"
                      >
                        <QrCode className="w-3 h-3" />
                        توليد
                      </button>
                    ) : null}
                  </div>
                  
                  {field.type === 'text' && (
                    <input
                      type="text"
                      value={userData.field_values[field.name] || ''}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      placeholder={field.placeholder_ar || ''}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                    />
                  )}
                  
                  {field.type === 'textarea' && (
                    <textarea
                      value={userData.field_values[field.name] || ''}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      placeholder={field.placeholder_ar || ''}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white text-sm resize-none"
                    />
                  )}
                  
                  {field.type === 'date' && (
                    <input
                      type="date"
                      value={userData.field_values[field.name] || ''}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                    />
                  )}
                  
                  {field.type === 'image' && (
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">اسحب صورة أو انقر للرفع</p>
                    </div>
                  )}
                  
                  {field.type === 'qrcode' && userData.field_values[field.name] && (
                    <div className="flex justify-center">
                      <img 
                        src={userData.field_values[field.name]} 
                        alt="QR Code"
                        className="w-24 h-24"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm sticky top-20">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">معاينة</h3>
              
              <div 
                ref={canvasRef}
                className="relative bg-gray-200 rounded-lg overflow-hidden"
                style={{ aspectRatio: '1/1.414' }} // A4 ratio
              >
                {selectedVariant?.background_image && (
                  <img 
                    src={selectedVariant.background_image}
                    alt="Template Background"
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                )}
                
                {/* Render Fields on Canvas */}
                {template.fields.map((field) => (
                  <div
                    key={field.id}
                    className="absolute"
                    style={{
                      left: `${field.position_x}%`,
                      top: `${field.position_y}%`,
                      width: `${field.width}%`,
                      height: `${field.height}%`,
                      fontSize: `${field.font_size}px`,
                      color: field.font_color,
                      fontFamily: field.font_family,
                      textAlign: field.text_align as any,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: field.text_align === 'center' ? 'center' : 
                                     field.text_align === 'right' ? 'flex-end' : 'flex-start'
                    }}
                  >
                    {field.type === 'image' || field.type === 'qrcode' ? (
                      userData.field_values[field.name] ? (
                        <img 
                          src={userData.field_values[field.name]}
                          alt={field.label_ar}
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full border-2 border-dashed border-gray-400 flex items-center justify-center text-gray-400 text-xs">
                          {field.label_ar}
                        </div>
                      )
                    ) : (
                      <span>{userData.field_values[field.name] || field.placeholder_ar || field.label_ar}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">توليد باركود</h3>
              <button onClick={() => setShowQRModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setQrType('link')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    qrType === 'link' 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <LinkIcon className="w-4 h-4" />
                  رابط
                </button>
                <button
                  onClick={() => setQrType('file')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    qrType === 'file' 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  ملف
                </button>
              </div>
              
              {qrType === 'link' ? (
                <input
                  type="url"
                  value={qrLink}
                  onChange={(e) => setQrLink(e.target.value)}
                  placeholder="أدخل الرابط..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary"
                />
              ) : (
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">اسحب ملف أو انقر للرفع</p>
                </div>
              )}
              
              <button
                onClick={handleGenerateQR}
                disabled={qrType === 'link' && !qrLink}
                className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
              >
                توليد الباركود
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
