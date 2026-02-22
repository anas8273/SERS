'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { doc, onSnapshot, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { api } from '@/lib/api';
import { SmartFieldInput } from './SmartFieldInput';
import { QRCodeGenerator } from './QRCodeGenerator';
import { VersionHistory } from './VersionHistory';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn, debounce } from '@/lib/utils';
import {
  Save,
  Download,
  FileImage,
  FileText,
  Sparkles,
  QrCode,
  History,
  X,
  Loader2,
  Eye,
  Undo,
  Redo,
  ChevronRight,
  ChevronLeft,
  Maximize2,
  Minimize2,
  Layout,
  Palette,
  Settings,
  Share2,
  Printer,
  Clock,
  CheckCircle2,
  AlertCircle,
  BrainCircuit,
  Wand2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TemplateField {
  id: string;
  name: string;
  label_ar: string;
  label_en: string;
  type: 'text' | 'textarea' | 'image' | 'date' | 'select' | 'signature' | 'list';
  placeholder_ar: string;
  placeholder_en: string;
  is_required: boolean;
  default_value: string;
  options: any;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  font_size: number;
  font_family: string;
  color: string;
  text_align: string;
  ai_fillable: boolean;
  ai_prompt_hint: string;
  sort_order: number;
}

interface TemplateVariant {
  id: string;
  name_ar: string;
  name_en: string;
  background_image: string;
  thumbnail: string;
  is_default: boolean;
}

interface Template {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  fields: TemplateField[];
  variants: TemplateVariant[];
  category: any;
}

interface TemplateEditorProps {
  recordId?: string;
  template?: Template;
  variant?: TemplateVariant;
  initialData?: Record<string, any>;
  onSave?: (data: Record<string, any>) => void;
  onClose?: () => void;
}

export function TemplateEditor({
  recordId,
  template,
  variant,
  initialData = {},
  onSave,
  onClose,
}: TemplateEditorProps) {
  const router = useRouter();
  const previewRef = useRef<HTMLDivElement>(null);
  
  // State
  const [selectedVariant, setSelectedVariant] = useState<TemplateVariant | undefined>(variant);
  const [formData, setFormData] = useState<Record<string, any>>(initialData);
  const [title, setTitle] = useState(initialData.title || '');
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState('content');
  const [showAIFillAll, setShowAIFillAll] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showQRGenerator, setShowQRGenerator] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  // Calculate completion percentage
  const requiredFields = template?.fields.filter(f => f.is_required) || [];
  const filledRequiredFields = requiredFields.filter(f => formData[f.name]?.trim());
  const completionPercentage = requiredFields.length > 0
    ? Math.round((filledRequiredFields.length / requiredFields.length) * 100)
    : 100;

  // Initialize form data from template defaults
  useEffect(() => {
    if (template?.fields) {
      const initialFormData: Record<string, any> = { ...initialData };
      template.fields.forEach((field) => {
        if (!initialFormData[field.name]) {
          initialFormData[field.name] = field.default_value || '';
        }
      });
      setFormData(initialFormData);
    }
  }, [template, initialData]);

  // Listen to Firestore changes if recordId is provided
  useEffect(() => {
    if (!recordId) return;

    const unsubscribe = onSnapshot(
      doc(db, 'user_records', recordId),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setFormData(data.user_data || {});
          setTitle(data.title || '');
        }
      },
      (error) => {
        console.error('Error listening to record:', error);
        toast.error('حدث خطأ في تحميل السجل');
      }
    );

    return () => unsubscribe();
  }, [recordId]);

  // Debounced save to Firestore
  const saveToFirestore = useCallback(
    debounce(async (newData: Record<string, any>) => {
      if (!recordId) return;

      try {
        await updateDoc(doc(db, 'user_records', recordId), {
          user_data: newData,
          title,
          updated_at: new Date(),
        });
        setLastSaved(new Date());
        setHasChanges(false);
      } catch (error) {
        console.error('Error saving:', error);
        toast.error('فشل حفظ التغييرات');
      }
    }, 1500),
    [recordId, title]
  );

  // Handle field change
  const handleFieldChange = (fieldName: string, value: any) => {
    const newData = { ...formData, [fieldName]: value };
    setFormData(newData);
    setHasChanges(true);
    
    if (recordId) {
      saveToFirestore(newData);
    }
  };

  // Manual save
  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('يرجى إدخال عنوان للقالب');
      return;
    }

    setSaving(true);
    try {
      if (recordId) {
        await updateDoc(doc(db, 'user_records', recordId), {
          user_data: formData,
          title,
          updated_at: new Date(),
        });
      }
      
      if (onSave) {
        onSave({ ...formData, title });
      }

      setLastSaved(new Date());
      setHasChanges(false);
      toast.success('تم حفظ التغييرات بنجاح');
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  // Export template
  const handleExport = async (format: 'image' | 'pdf') => {
    if (!recordId) {
      toast.error('يرجى حفظ القالب أولاً');
      return;
    }

    setExporting(true);
    try {
      const response = await api.post(`/templates/export/${recordId}`, { format });
      
      if (response.url) {
        const link = document.createElement('a');
        link.href = response.url;
        link.download = `${title || 'template'}.${format === 'image' ? 'png' : 'pdf'}`;
        document.body.appendChild(link);
        link.click();
        link.remove();
      }

      toast.success(`تم تصدير الملف بصيغة ${format === 'image' ? 'صورة' : 'PDF'} بنجاح`);
    } catch (error) {
      toast.error('حدث خطأ أثناء التصدير');
    } finally {
      setExporting(false);
    }
  };

  // AI Fill All
  const handleAIFillAll = async () => {
    if (!template) return;

    setAiLoading(true);
    try {
      const response = await api.getAIFillAll({
        template_id: parseInt(template.id),
        title: title,
        current_values: formData,
      });

      if (response.success && response.data?.suggestions) {
        const newData = { ...formData };
        Object.entries(response.data.suggestions).forEach(([key, value]) => {
          if (value && typeof value === 'string') {
            newData[key] = value;
          }
        });
        setFormData(newData);
        setHasChanges(true);
        
        if (recordId) {
          saveToFirestore(newData);
        }

        toast.success('تم ملء جميع الحقول بنجاح ✨');
      }
    } catch (error) {
      console.error('AI Fill All Error:', error);
      toast.error('حدث خطأ في الذكاء الاصطناعي');
    } finally {
      setAiLoading(false);
      setShowAIFillAll(false);
    }
  };

  if (!template) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className={cn(
      'bg-gray-50 dark:bg-gray-950 min-h-screen',
      isFullscreen && 'fixed inset-0 z-50'
    )}>
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left side */}
            <div className="flex items-center gap-4">
              {onClose && (
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
              )}
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                  {template.name_ar}
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  {hasChanges ? (
                    <Badge variant="outline" className="text-yellow-600 border-yellow-300 bg-yellow-50">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      تغييرات غير محفوظة
                    </Badge>
                  ) : lastSaved ? (
                    <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      محفوظ
                    </Badge>
                  ) : null}
                  <span className="text-xs text-gray-500">
                    اكتمال {completionPercentage}%
                  </span>
                </div>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {/* QR Code Generator Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowQRGenerator(true)}
                className="gap-2 font-bold"
              >
                <QrCode className="w-4 h-4" />
                QR
              </Button>

              {/* Version History Button */}
              {recordId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowVersionHistory(true)}
                  className="gap-2 font-bold"
                >
                  <History className="w-4 h-4" />
                  الإصدارات
                </Button>
              )}

              {/* AI Fill All Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAIFillAll(true)}
                disabled={aiLoading}
                className="gap-2 font-bold"
              >
                {aiLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <BrainCircuit className="w-4 h-4" />
                )}
                ملء ذكي
              </Button>

              {/* Save Button */}
              <Button
                onClick={handleSave}
                disabled={saving}
                className="gap-2 font-bold"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                حفظ
              </Button>

              {/* Export Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={exporting}>
                    {exporting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleExport('image')}>
                    <FileImage className="w-4 h-4 mr-2" />
                    تصدير كصورة PNG
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('pdf')}>
                    <FileText className="w-4 h-4 mr-2" />
                    تصدير كـ PDF
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => window.print()}>
                    <Printer className="w-4 h-4 mr-2" />
                    طباعة
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Fullscreen Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-3">
            <Progress value={completionPercentage} className="h-1.5" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <Card className="shadow-sm">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">بيانات القالب</CardTitle>
                  <Badge variant="secondary">
                    {template.fields.length} حقل
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {/* Title Field */}
                <div className="mb-6">
                  <SmartFieldInput
                    field={{
                      name: 'title',
                      label_ar: 'عنوان القالب',
                      type: 'text',
                      placeholder_ar: 'أدخل عنوان القالب',
                      is_required: true,
                    }}
                    value={title}
                    onChange={setTitle}
                    templateId={template.id}
                    templateTitle={title}
                    context={formData}
                  />
                </div>

                <Separator className="my-6" />

                {/* Template Fields */}
                <div className="space-y-6">
                  {template.fields
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map((field) => (
                      <SmartFieldInput
                        key={field.id || field.name}
                        field={field}
                        value={formData[field.name] || ''}
                        onChange={(value) => handleFieldChange(field.name, value)}
                        templateId={template.id}
                        templateTitle={title}
                        context={formData}
                      />
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview Section */}
          <div className="lg:col-span-1">
            <Card className="shadow-sm sticky top-24">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    معاينة
                  </CardTitle>
                  {template.variants.length > 1 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Palette className="w-4 h-4 mr-2" />
                          تغيير التصميم
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {template.variants.map((v) => (
                          <DropdownMenuItem
                            key={v.id}
                            onClick={() => setSelectedVariant(v)}
                            className={cn(
                              selectedVariant?.id === v.id && 'bg-primary/10'
                            )}
                          >
                            {v.name_ar}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div
                  ref={previewRef}
                  className="relative bg-white rounded-lg overflow-hidden shadow-inner aspect-[3/4]"
                  style={{
                    backgroundImage: selectedVariant?.background_image
                      ? `url(${selectedVariant.background_image})`
                      : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  {/* Preview content would be rendered here */}
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <Eye className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">معاينة القالب</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* AI Fill All Dialog */}
      <Dialog open={showAIFillAll} onOpenChange={setShowAIFillAll}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-primary" />
              ملء ذكي بالذكاء الاصطناعي
            </DialogTitle>
            <DialogDescription>
              سيقوم الذكاء الاصطناعي بملء جميع الحقول تلقائياً بناءً على عنوان القالب والسياق.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
              <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-primary" />
                ما سيتم ملؤه:
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {template.fields.filter(f => f.type === 'text' || f.type === 'textarea').map((f) => (
                  <li key={f.id} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                    {f.label_ar}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleAIFillAll}
                disabled={aiLoading}
                className="flex-1 gap-2"
              >
                {aiLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                ابدأ الملء الذكي
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAIFillAll(false)}
              >
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Code Generator */}
      <QRCodeGenerator
        isOpen={showQRGenerator}
        onClose={() => setShowQRGenerator(false)}
        templateId={template.id}
        templateTitle={title || template.name_ar}
      />

      {/* Version History */}
      {recordId && (
        <VersionHistory
          isOpen={showVersionHistory}
          onClose={() => setShowVersionHistory(false)}
          recordId={recordId}
          templateTitle={title || template.name_ar}
          onRestore={(versionData) => {
            setFormData(versionData);
            setHasChanges(true);
            if (versionData.title) {
              setTitle(versionData.title);
            }
          }}
        />
      )}
    </div>
  );
}

export default TemplateEditor;
