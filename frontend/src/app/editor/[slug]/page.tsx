'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  X,
  Undo2,
  Redo2,
  MessageSquare,
  Send,
  Printer,
  FileText,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Bot,
  Palette,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Copy,
  Trash2,
  Settings,
  HelpCircle,
  ChevronRight
} from 'lucide-react';

interface TemplateField {
  id: number;
  name: string;
  label_ar: string;
  label_en: string;
  type: 'text' | 'textarea' | 'date' | 'image' | 'signature' | 'qrcode' | 'select' | 'number';
  placeholder_ar: string | null;
  placeholder_en: string | null;
  default_value: string | null;
  is_required: boolean;
  options?: string[];
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

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface HistoryEntry {
  field_values: Record<string, string>;
  timestamp: Date;
  description: string;
}

export default function InteractiveEditorPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const canvasRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
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
  const [showChat, setShowChat] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showFieldGuide, setShowFieldGuide] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPreviewOverlay, setShowPreviewOverlay] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [activeTab, setActiveTab] = useState<'fields' | 'design' | 'settings'>('fields');

  // QR Code state
  const [qrType, setQrType] = useState<'link' | 'file'>('link');
  const [qrLink, setQrLink] = useState('');
  const [qrFieldName, setQrFieldName] = useState('');

  // Undo/Redo state
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'مرحباً! أنا المساعد الذكي. كيف يمكنني مساعدتك في تعبئة هذا القالب؟ يمكنني:\n\n• اقتراح محتوى لأي حقل\n• تعبئة جميع الحقول تلقائياً\n• الإجابة على أسئلتك حول القالب\n• تقديم نصائح لتحسين المحتوى',
      timestamp: new Date()
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Auto-save timer
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchTemplate();
    }
  }, [slug]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Auto-save every 2 minutes
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const timer = setTimeout(() => {
      handleAutoSave();
    }, 120000);
    return () => clearTimeout(timer);
  }, [userData, hasUnsavedChanges]);

  // Push to history on field change
  const pushHistory = useCallback((description: string) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push({
        field_values: { ...userData.field_values },
        timestamp: new Date(),
        description
      });
      return newHistory.slice(-50); // Keep last 50 entries
    });
    setHistoryIndex(prev => prev + 1);
  }, [userData.field_values, historyIndex]);

  const handleUndo = () => {
    if (historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    setUserData(prev => ({
      ...prev,
      field_values: { ...history[newIndex].field_values }
    }));
  };

  const handleRedo = () => {
    if (historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    setUserData(prev => ({
      ...prev,
      field_values: { ...history[newIndex].field_values }
    }));
  };

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      const response = await api.getTemplateForEditor(slug);
      if (response.success) {
        setTemplate(response.data);
        
        const initialValues: Record<string, string> = {};
        response.data.fields.forEach((field: TemplateField) => {
          initialValues[field.name] = field.default_value || '';
        });
        
        const defaultVariant = response.data.variants.find((v: TemplateVariant) => v.is_default) 
          || response.data.variants[0];
        
        setUserData({
          title: '',
          field_values: initialValues,
          selected_variant_id: defaultVariant?.id || 0
        });

        // Initialize history
        setHistory([{
          field_values: initialValues,
          timestamp: new Date(),
          description: 'تحميل القالب'
        }]);
        setHistoryIndex(0);
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
    setHasUnsavedChanges(true);
  };

  const handleFieldBlur = (fieldName: string) => {
    pushHistory(`تعديل حقل: ${fieldName}`);
  };

  const handleVariantChange = (variantId: number) => {
    setUserData(prev => ({
      ...prev,
      selected_variant_id: variantId
    }));
    setShowVariants(false);
    setHasUnsavedChanges(true);
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
        pushHistory(`اقتراح AI لحقل: ${fieldName}`);
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
        pushHistory('تعبئة تلقائية بالذكاء الاصطناعي');
        setHasUnsavedChanges(true);
      }
    } catch (err) {
      console.error('AI fill all error:', err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleChatSend = async () => {
    if (!chatInput.trim() || chatLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput.trim(),
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setChatLoading(true);

    try {
      const response = await api.chatWithAI(
        `[قالب: ${template?.name_ar}] [عنوان: ${userData.title}] ${userMessage.content}`
      );

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.success ? response.data.reply : 'عذراً، حدث خطأ. حاول مرة أخرى.',
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, assistantMessage]);

      // If AI suggests field values, apply them
      if (response.success && response.data.field_updates) {
        setUserData(prev => ({
          ...prev,
          field_values: {
            ...prev.field_values,
            ...response.data.field_updates
          }
        }));
        pushHistory('تحديث من المحادثة الذكية');
      }
    } catch (err) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'عذراً، حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setChatLoading(false);
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
        pushHistory('توليد QR Code');
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
      
      const response = await api.saveUserTemplateData(slug, {
        template_id: template?.id,
        variant_id: userData.selected_variant_id,
        title: userData.title,
        field_values: userData.field_values
      });
      
      if (response.success) {
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
        setSuccessMessage('تم الحفظ بنجاح');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAutoSave = async () => {
    try {
      await api.saveUserTemplateData(slug, {
        template_id: template?.id,
        variant_id: userData.selected_variant_id,
        title: userData.title,
        field_values: userData.field_values
      });
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error('Auto-save error:', err);
    }
  };

  const handleExport = async (format: 'image' | 'pdf') => {
    try {
      setExporting(true);
      setShowExportMenu(false);
      
      const response = await api.exportTemplate(slug, format);
      
      if (response.success && response.data?.download_url) {
        window.open(response.data.download_url, '_blank');
      } else if (response instanceof Blob) {
        const url = window.URL.createObjectURL(response);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${userData.title || template?.name_ar || 'template'}.${format === 'pdf' ? 'pdf' : 'png'}`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleResetFields = () => {
    if (!template) return;
    const initialValues: Record<string, string> = {};
    template.fields.forEach((field) => {
      initialValues[field.name] = field.default_value || '';
    });
    setUserData(prev => ({ ...prev, field_values: initialValues }));
    pushHistory('إعادة تعيين الحقول');
    setHasUnsavedChanges(true);
  };

  const selectedVariant = template?.variants.find(v => v.id === userData.selected_variant_id);
  const completedFields = template?.fields.filter(f => userData.field_values[f.name]?.trim()).length || 0;
  const totalFields = template?.fields.length || 0;
  const completionPercent = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">جاري تحميل المحرر...</p>
        </div>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg max-w-md">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">القالب غير موجود</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{error || 'لم يتم العثور على القالب المطلوب'}</p>
          <Link 
            href="/marketplace"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            العودة للمتجر
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900" dir="rtl">
      {/* Success Toast */}
      {successMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top">
          <Check className="w-5 h-5" />
          {successMessage}
        </div>
      )}

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Breadcrumb & Title */}
            <div className="flex items-center gap-3">
              <Link 
                href="/marketplace"
                className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="العودة"
              >
                <ArrowRight className="w-5 h-5" />
              </Link>
              <div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{template.category.section?.name_ar}</span>
                  <ChevronLeft className="w-3 h-3" />
                  <span>{template.category.name_ar}</span>
                </div>
                <h1 className="font-bold text-gray-900 dark:text-white text-sm">{template.name_ar}</h1>
              </div>
            </div>

            {/* Center: Progress */}
            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {completedFields}/{totalFields} حقل ({completionPercent}%)
                </span>
              </div>
              {lastSaved && (
                <span className="text-xs text-gray-400">
                  آخر حفظ: {lastSaved.toLocaleTimeString('ar-SA')}
                </span>
              )}
              {hasUnsavedChanges && (
                <span className="w-2 h-2 bg-orange-400 rounded-full" title="تغييرات غير محفوظة" />
              )}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1">
              {/* Undo/Redo */}
              <button
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="تراجع"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="إعادة"
              >
                <Redo2 className="w-4 h-4" />
              </button>

              <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

              {/* History */}
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="سجل التغييرات"
              >
                <History className="w-4 h-4" />
              </button>

              {/* Chat Toggle */}
              <button
                onClick={() => setShowChat(!showChat)}
                className={`p-2 rounded-lg transition-colors ${
                  showChat 
                    ? 'bg-primary text-white' 
                    : 'text-gray-600 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title="المساعد الذكي"
              >
                <Bot className="w-4 h-4" />
              </button>

              <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />
              
              {/* Save */}
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span className="hidden sm:inline">حفظ</span>
              </button>
              
              {/* Export */}
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  disabled={exporting}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  <span className="hidden sm:inline">تصدير</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
                
                {showExportMenu && (
                  <div className="absolute left-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-10 min-w-[200px] overflow-hidden">
                    <button
                      onClick={() => handleExport('pdf')}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <FileText className="w-5 h-5 text-red-500" />
                      <div className="text-right">
                        <p className="font-medium text-gray-900 dark:text-white text-sm">تصدير PDF</p>
                        <p className="text-xs text-gray-500">ملف جاهز للطباعة</p>
                      </div>
                    </button>
                    <button
                      onClick={() => handleExport('image')}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <ImageIcon className="w-5 h-5 text-blue-500" />
                      <div className="text-right">
                        <p className="font-medium text-gray-900 dark:text-white text-sm">تصدير صورة</p>
                        <p className="text-xs text-gray-500">صورة PNG عالية الجودة</p>
                      </div>
                    </button>
                    <div className="border-t border-gray-100 dark:border-gray-700" />
                    <button
                      onClick={handlePrint}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Printer className="w-5 h-5 text-gray-500" />
                      <div className="text-right">
                        <p className="font-medium text-gray-900 dark:text-white text-sm">طباعة</p>
                        <p className="text-xs text-gray-500">طباعة مباشرة</p>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar - Form */}
          <div className={`${showChat ? 'lg:col-span-3' : 'lg:col-span-4'} space-y-4`}>
            {/* Title Input */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                عنوان المستند
              </label>
              <input
                type="text"
                value={userData.title}
                onChange={(e) => {
                  setUserData(prev => ({ ...prev, title: e.target.value }));
                  setHasUnsavedChanges(true);
                }}
                placeholder="أدخل عنوان المستند..."
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary dark:bg-gray-700 dark:text-white transition-all"
              />
            </div>

            {/* Tabs */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="flex border-b border-gray-100 dark:border-gray-700">
                {[
                  { id: 'fields' as const, label: 'الحقول', icon: FileText },
                  { id: 'design' as const, label: 'التصميم', icon: Palette },
                  { id: 'settings' as const, label: 'إعدادات', icon: Settings },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-3 text-xs font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'text-primary border-b-2 border-primary bg-primary/5'
                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-4">
                {/* Fields Tab */}
                {activeTab === 'fields' && (
                  <div className="space-y-4">
                    {/* AI Fill All Button */}
                    <button
                      onClick={handleAIFillAll}
                      disabled={aiLoading || !userData.title}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                      {aiLoading && !activeField ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Sparkles className="w-5 h-5" />
                      )}
                      تعبئة تلقائية بالذكاء الاصطناعي
                    </button>

                    {/* Fields */}
                    {template.fields.sort((a, b) => a.order - b.order).map((field) => (
                      <div key={field.id} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                            {field.label_ar}
                            {field.is_required && <span className="text-red-500">*</span>}
                            {userData.field_values[field.name]?.trim() && (
                              <Check className="w-3 h-3 text-green-500" />
                            )}
                          </label>
                          
                          <div className="flex items-center gap-1">
                            {(field.type === 'text' || field.type === 'textarea') && (
                              <button
                                onClick={() => handleAISuggest(field.name)}
                                disabled={aiLoading && activeField === field.name}
                                className="text-xs text-purple-500 hover:text-purple-600 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                              >
                                {aiLoading && activeField === field.name ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Sparkles className="w-3 h-3" />
                                )}
                                اقتراح
                              </button>
                            )}
                            {field.type === 'qrcode' && (
                              <button
                                onClick={() => {
                                  setQrFieldName(field.name);
                                  setShowQRModal(true);
                                }}
                                className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                              >
                                <QrCode className="w-3 h-3" />
                                توليد
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {field.type === 'text' && (
                          <input
                            type="text"
                            value={userData.field_values[field.name] || ''}
                            onChange={(e) => handleFieldChange(field.name, e.target.value)}
                            onBlur={() => handleFieldBlur(field.name)}
                            placeholder={field.placeholder_ar || ''}
                            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary dark:bg-gray-700 dark:text-white text-sm transition-all"
                          />
                        )}
                        
                        {field.type === 'textarea' && (
                          <textarea
                            value={userData.field_values[field.name] || ''}
                            onChange={(e) => handleFieldChange(field.name, e.target.value)}
                            onBlur={() => handleFieldBlur(field.name)}
                            placeholder={field.placeholder_ar || ''}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary dark:bg-gray-700 dark:text-white text-sm resize-none transition-all"
                          />
                        )}
                        
                        {field.type === 'date' && (
                          <input
                            type="date"
                            value={userData.field_values[field.name] || ''}
                            onChange={(e) => handleFieldChange(field.name, e.target.value)}
                            onBlur={() => handleFieldBlur(field.name)}
                            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary dark:bg-gray-700 dark:text-white text-sm transition-all"
                          />
                        )}

                        {field.type === 'number' && (
                          <input
                            type="number"
                            value={userData.field_values[field.name] || ''}
                            onChange={(e) => handleFieldChange(field.name, e.target.value)}
                            onBlur={() => handleFieldBlur(field.name)}
                            placeholder={field.placeholder_ar || ''}
                            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary dark:bg-gray-700 dark:text-white text-sm transition-all"
                          />
                        )}

                        {field.type === 'select' && (
                          <select
                            value={userData.field_values[field.name] || ''}
                            onChange={(e) => handleFieldChange(field.name, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary dark:bg-gray-700 dark:text-white text-sm transition-all"
                          >
                            <option value="">اختر...</option>
                            {field.options?.map((opt, i) => (
                              <option key={i} value={opt}>{opt}</option>
                            ))}
                          </select>
                        )}
                        
                        {field.type === 'image' && (
                          <div className="border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl p-4 text-center hover:border-primary/50 transition-colors cursor-pointer">
                            <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                            <p className="text-xs text-gray-500">اسحب صورة أو انقر للرفع</p>
                          </div>
                        )}
                        
                        {field.type === 'qrcode' && userData.field_values[field.name] && (
                          <div className="flex justify-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <img 
                              src={userData.field_values[field.name]} 
                              alt="QR Code"
                              className="w-20 h-20"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Design Tab */}
                {activeTab === 'design' && (
                  <div className="space-y-4">
                    {/* Variant Selector */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        اختر التصميم
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {template.variants.map((variant) => (
                          <button
                            key={variant.id}
                            onClick={() => handleVariantChange(variant.id)}
                            className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                              variant.id === userData.selected_variant_id
                                ? 'border-primary shadow-lg ring-2 ring-primary/20'
                                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                            }`}
                          >
                            {variant.thumbnail ? (
                              <img 
                                src={variant.thumbnail} 
                                alt={variant.name_ar}
                                className="w-full aspect-[3/4] object-cover"
                              />
                            ) : (
                              <div className="w-full aspect-[3/4] bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                <Palette className="w-8 h-8 text-gray-400" />
                              </div>
                            )}
                            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                              <p className="text-white text-xs font-medium">{variant.name_ar}</p>
                            </div>
                            {variant.id === userData.selected_variant_id && (
                              <div className="absolute top-2 left-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Zoom */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        التكبير/التصغير
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setZoom(Math.max(50, zoom - 10))}
                          className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                          <ZoomOut className="w-4 h-4" />
                        </button>
                        <div className="flex-1 text-center text-sm font-medium">{zoom}%</div>
                        <button
                          onClick={() => setZoom(Math.min(200, zoom + 10))}
                          className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                          <ZoomIn className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setZoom(100)}
                          className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                          title="إعادة تعيين"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                  <div className="space-y-4">
                    <button
                      onClick={handleResetFields}
                      className="w-full flex items-center gap-2 px-4 py-3 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      إعادة تعيين جميع الحقول
                    </button>
                    
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">معلومات القالب</h4>
                      <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
                        <p>الاسم: {template.name_ar}</p>
                        <p>التصنيف: {template.category.name_ar}</p>
                        <p>عدد الحقول: {totalFields}</p>
                        <p>عدد التصاميم: {template.variants.length}</p>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                      <div className="flex items-start gap-2">
                        <HelpCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-blue-700 dark:text-blue-300">
                          <p className="font-medium mb-1">نصائح:</p>
                          <ul className="space-y-1 list-disc list-inside">
                            <li>أدخل العنوان أولاً لتفعيل التعبئة الذكية</li>
                            <li>استخدم زر الاقتراح لكل حقل</li>
                            <li>يتم الحفظ التلقائي كل دقيقتين</li>
                            <li>يمكنك التراجع عن أي تغيير</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className={`${showChat ? 'lg:col-span-5' : 'lg:col-span-8'}`}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 sticky top-20">
              {/* Preview Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  المعاينة المباشرة
                </h3>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowPreviewOverlay(!showPreviewOverlay)}
                    className="p-1.5 text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title={showPreviewOverlay ? 'إخفاء الحقول' : 'إظهار الحقول'}
                  >
                    {showPreviewOverlay ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="p-1.5 text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="شاشة كاملة"
                  >
                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Canvas */}
              <div className="p-4 overflow-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                <div 
                  ref={canvasRef}
                  className="relative bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden mx-auto shadow-inner"
                  style={{ 
                    aspectRatio: '1/1.414',
                    transform: `scale(${zoom / 100})`,
                    transformOrigin: 'top center',
                    maxWidth: '100%'
                  }}
                >
                  {selectedVariant?.background_image && (
                    <img 
                      src={selectedVariant.background_image}
                      alt="Template Background"
                      className="absolute inset-0 w-full h-full object-contain"
                    />
                  )}
                  
                  {/* Render Fields on Canvas */}
                  {showPreviewOverlay && template.fields.map((field) => (
                    <div
                      key={field.id}
                      className="absolute transition-all duration-200"
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
                          <div className="w-full h-full border border-dashed border-gray-400/50 flex items-center justify-center text-gray-400 text-xs rounded">
                            {field.label_ar}
                          </div>
                        )
                      ) : (
                        <span className="leading-tight">
                          {userData.field_values[field.name] || (
                            <span className="opacity-40">{field.placeholder_ar || field.label_ar}</span>
                          )}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* AI Chat Panel */}
          {showChat && (
            <div className="lg:col-span-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 sticky top-20 flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
                {/* Chat Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-sm">المساعد الذكي</h3>
                      <p className="text-xs text-green-500">متصل</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowChat(false)}
                    className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                          msg.role === 'user'
                            ? 'bg-primary text-white rounded-tr-sm'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-tl-sm'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${
                          msg.role === 'user' ? 'text-white/60' : 'text-gray-400'
                        }`}>
                          {msg.timestamp.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex justify-end">
                      <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-tl-sm px-4 py-3">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Quick Actions */}
                <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex gap-1 overflow-x-auto pb-1">
                    {[
                      'عبئ جميع الحقول',
                      'اقترح عنوان',
                      'حسّن المحتوى',
                      'ترجم للإنجليزية'
                    ].map((action, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setChatInput(action);
                          handleChatSend();
                        }}
                        className="whitespace-nowrap px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-xs hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chat Input */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
                      placeholder="اكتب رسالتك..."
                      className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary dark:bg-gray-700 dark:text-white text-sm transition-all"
                    />
                    <button
                      onClick={handleChatSend}
                      disabled={!chatInput.trim() || chatLoading}
                      className="p-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* History Sidebar */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowHistory(false)} />
          <div className="relative mr-auto w-80 bg-white dark:bg-gray-800 h-full shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 p-4 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <History className="w-5 h-5" />
                سجل التغييرات
              </h3>
              <button
                onClick={() => setShowHistory(false)}
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-2">
              {history.map((entry, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setHistoryIndex(index);
                    setUserData(prev => ({
                      ...prev,
                      field_values: { ...entry.field_values }
                    }));
                  }}
                  className={`w-full text-right p-3 rounded-xl transition-colors ${
                    index === historyIndex
                      ? 'bg-primary/10 border border-primary/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{entry.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {entry.timestamp.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <QrCode className="w-5 h-5 text-primary" />
                توليد باركود
              </h3>
              <button onClick={() => setShowQRModal(false)} className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setQrType('link')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-colors ${
                    qrType === 'link' 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                  }`}
                >
                  <LinkIcon className="w-4 h-4" />
                  رابط
                </button>
                <button
                  onClick={() => setQrType('file')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-colors ${
                    qrType === 'file' 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
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
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary dark:bg-gray-700 dark:text-white"
                />
              ) : (
                <div className="border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">اسحب ملف أو انقر للرفع</p>
                </div>
              )}
              
              <button
                onClick={handleGenerateQR}
                disabled={qrType === 'link' && !qrLink}
                className="w-full px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors font-medium"
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
