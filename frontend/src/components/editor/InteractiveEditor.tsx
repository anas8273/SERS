'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
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
  Upload,
  Link as LinkIcon,
  Palette,
  Eye,
  Undo,
  Redo,
  ChevronRight,
  ChevronLeft,
  Type,
  Image as ImageIcon,
  Calendar as CalendarIcon,
  PenTool,
  CheckCircle2,
  Maximize2,
  Minimize2,
  Layout
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import AIAssistant from './AIAssistant';
import { cn } from '@/lib/utils';

interface TemplateField {
  id: number;
  name: string;
  label_ar: string;
  label_en: string;
  type: 'text' | 'textarea' | 'image' | 'date' | 'select' | 'signature';
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
  font_color: string;
  text_align: string;
}

interface TemplateVariant {
  id: number;
  name_ar: string;
  name_en: string;
  background_image: string;
  thumbnail: string;
  is_default: boolean;
}

interface Template {
  id: number;
  name_ar: string;
  name_en: string;
  description_ar: string;
  fields: TemplateField[];
  variants: TemplateVariant[];
  category: any;
}

interface InteractiveEditorProps {
  template: Template;
  variant: TemplateVariant;
  onClose: () => void;
  existingData?: any;
}

export default function InteractiveEditor({
  template,
  variant,
  onClose,
  existingData,
}: InteractiveEditorProps) {
  const router = useRouter();
  const previewRef = useRef<HTMLDivElement>(null);
  const [selectedVariant, setSelectedVariant] = useState<TemplateVariant>(variant);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [activeAIField, setActiveAIField] = useState<string | null>(null);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [qrUrl, setQrUrl] = useState('');
  const [generatingQR, setGeneratingQR] = useState(false);
  const [userTemplateDataId, setUserTemplateDataId] = useState<number | null>(
    existingData?.id || null
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState('content');

  // Initialize form data
  useEffect(() => {
    const initialData: Record<string, any> = {};
    template.fields.forEach((field) => {
      initialData[field.name] = existingData?.data?.[field.name] || field.default_value || '';
    });
    setFormData(initialData);
    setTitle(existingData?.title || '');
  }, [template, existingData]);

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('يرجى إدخال عنوان للقالب');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        interactive_template_id: template.id,
        template_variant_id: selectedVariant.id,
        title,
        data: formData,
      };

      let response;
      if (userTemplateDataId) {
        response = await api.put(`/user-templates/${userTemplateDataId}`, payload);
      } else {
        response = await api.post('/user-templates', payload);
        setUserTemplateDataId(response.data.data.id);
      }

      toast.success('تم حفظ التغييرات بنجاح');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async (format: 'image' | 'pdf') => {
    if (!userTemplateDataId) {
      toast.error('يرجى حفظ القالب أولاً قبل التصدير');
      return;
    }

    setExporting(true);
    try {
      const response = await api.exportTemplate(userTemplateDataId, format);
      
      // If the API returns a URL
      if (response.url) {
        const link = document.createElement('a');
        link.href = response.url;
        link.setAttribute('download', `${title}.${format === 'image' ? 'png' : 'pdf'}`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        // If the API returns a blob (handled by downloadFile)
        await api.downloadFile(`/export/${userTemplateDataId}/${format}`, `${title}.${format === 'image' ? 'png' : 'pdf'}`);
      }

      toast.success(`تم تصدير الملف بصيغة ${format === 'image' ? 'صورة' : 'PDF'} بنجاح`);
    } catch (error) {
      toast.error('حدث خطأ أثناء التصدير، يرجى المحاولة مرة أخرى');
    } finally {
      setExporting(false);
    }
  };

  const handleOpenAI = (fieldName: string) => {
    setActiveAIField(fieldName);
    setShowAI(true);
  };

  const handleAISuggestion = (suggestion: string) => {
    if (activeAIField) {
      handleFieldChange(activeAIField, suggestion);
      toast.success('تم تطبيق اقتراح الذكاء الاصطناعي');
    }
    setShowAI(false);
  };

  const renderField = (field: TemplateField) => {
    const value = formData[field.name] || '';

    const fieldIcons = {
      text: <Type className="w-4 h-4" />,
      textarea: <FileText className="w-4 h-4" />,
      image: <ImageIcon className="w-4 h-4" />,
      date: <CalendarIcon className="w-4 h-4" />,
      select: <Layout className="w-4 h-4" />,
      signature: <PenTool className="w-4 h-4" />,
    };

    return (
      <div key={field.id} className="space-y-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800 transition-all hover:border-primary/30">
        <div className="flex items-center justify-between">
          <Label htmlFor={field.name} className="flex items-center gap-2 font-bold text-gray-700 dark:text-gray-300">
            <span className="p-1.5 bg-white dark:bg-gray-800 rounded-lg shadow-sm text-primary">
              {fieldIcons[field.type] || <Type className="w-4 h-4" />}
            </span>
            {field.label_ar}
            {field.is_required && <span className="text-red-500 mr-1">*</span>}
          </Label>
          {(field.type === 'text' || field.type === 'textarea') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenAI(field.name)}
              className="h-8 text-xs font-bold text-primary hover:bg-primary/10 gap-1.5 rounded-full"
            >
              <Sparkles className="w-3 h-3" />
              ذكاء اصطناعي
            </Button>
          )}
        </div>

        {field.type === 'text' && (
          <Input
            id={field.name}
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder_ar}
            className="rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
          />
        )}

        {field.type === 'textarea' && (
          <Textarea
            id={field.name}
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder_ar}
            rows={4}
            className="rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 resize-none"
          />
        )}

        {field.type === 'image' && (
          <div className="relative group">
            <div className={cn(
              "border-2 border-dashed rounded-2xl p-6 text-center transition-all",
              value ? "border-primary/50 bg-primary/5" : "border-gray-200 dark:border-gray-700 hover:border-primary/30"
            )}>
              {value ? (
                <div className="relative inline-block">
                  <img src={value} alt="" className="max-h-40 rounded-xl shadow-lg mx-auto" />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 w-8 h-8 rounded-full shadow-xl"
                    onClick={() => handleFieldChange(field.name, '')}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto text-gray-400">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300">اسحب الصورة هنا</p>
                    <p className="text-xs text-gray-500">أو انقر لاختيار ملف من جهازك</p>
                  </div>
                  <Input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id={`file-${field.name}`}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          handleFieldChange(field.name, e.target?.result);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <Label
                    htmlFor={`file-${field.name}`}
                    className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-4 text-xs font-bold text-white cursor-pointer hover:bg-primary/90 transition-colors"
                  >
                    اختر صورة
                  </Label>
                </div>
              )}
            </div>
          </div>
        )}

        {field.type === 'date' && (
          <Input
            id={field.name}
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
          />
        )}

        {field.type === 'signature' && (
          <div className="border-2 border-gray-100 dark:border-gray-800 rounded-2xl p-4 bg-white dark:bg-gray-800 text-center italic text-gray-400">
            <PenTool className="w-8 h-8 mx-auto mb-2 opacity-20" />
            <p className="text-xs">سيتم إضافة التوقيع الرقمي هنا عند التصدير</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn(
      "fixed inset-0 z-[100] bg-white dark:bg-gray-950 flex flex-col transition-all duration-500",
      isFullscreen ? "p-0" : "p-0"
    )} dir="rtl">
      {/* Top Header */}
      <header className="h-16 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-6 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
            <ChevronRight className="w-6 h-6" />
          </Button>
          <div className="h-8 w-[1px] bg-gray-100 dark:bg-gray-800" />
          <div className="flex flex-col">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="عنوان السجل التعليمي..."
              className="h-8 border-none bg-transparent font-black text-lg p-0 focus-visible:ring-0 w-64 placeholder:text-gray-300"
            />
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">تحرير: {template.name_ar}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-1 bg-gray-50 dark:bg-gray-900 p-1 rounded-full border border-gray-100 dark:border-gray-800">
            <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full text-gray-400 hover:text-primary">
              <Undo className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full text-gray-400 hover:text-primary">
              <Redo className="w-4 h-4" />
            </Button>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="rounded-full hidden sm:flex gap-2 font-bold border-2"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            {isFullscreen ? 'تصغير' : 'ملء الشاشة'}
          </Button>

          <Button 
            onClick={handleSave} 
            disabled={saving} 
            className="rounded-full px-6 font-black gap-2 shadow-lg shadow-primary/20"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            حفظ
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary" className="rounded-full px-6 font-black gap-2 bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100">
                <Download className="w-4 h-4" />
                تصدير
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-[2rem]" dir="rtl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black text-right">تصدير السجل</DialogTitle>
                <DialogDescription className="text-right">اختر الصيغة المناسبة لتحميل سجلك التعليمي</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-6">
                <Button
                  variant="outline"
                  className="h-32 flex flex-col gap-3 rounded-3xl border-2 hover:border-primary hover:bg-primary/5 transition-all group"
                  onClick={() => handleExport('image')}
                  disabled={exporting}
                >
                  <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileImage className="w-6 h-6" />
                  </div>
                  <span className="font-black">صورة PNG</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-32 flex flex-col gap-3 rounded-3xl border-2 hover:border-primary hover:bg-primary/5 transition-all group"
                  onClick={() => handleExport('pdf')}
                  disabled={exporting}
                >
                  <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileText className="w-6 h-6" />
                  </div>
                  <span className="font-black">ملف PDF</span>
                </Button>
              </div>
              {exporting && (
                <div className="flex items-center justify-center gap-3 text-primary font-bold animate-pulse">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  جاري معالجة الملف...
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Main Editor Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Controls */}
        <aside className="w-full md:w-[400px] border-l border-gray-100 dark:border-gray-800 flex flex-col bg-white dark:bg-gray-950 z-10">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="w-full h-14 bg-gray-50/50 dark:bg-gray-900/50 rounded-none border-b border-gray-100 dark:border-gray-800 px-4 gap-2">
              <TabsTrigger value="content" className="flex-1 rounded-xl font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm">
                المحتوى
              </TabsTrigger>
              <TabsTrigger value="design" className="flex-1 rounded-xl font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm">
                التصميم
              </TabsTrigger>
              <TabsTrigger value="tools" className="flex-1 rounded-xl font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm">
                أدوات
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1">
              <div className="p-6">
                <TabsContent value="content" className="mt-0 space-y-6">
                  <div className="space-y-1 mb-6">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white">بيانات السجل</h3>
                    <p className="text-xs text-gray-500">قم بتعبئة الحقول التالية لتخصيص قالبك</p>
                  </div>
                  <div className="space-y-4">
                    {template.fields.map((field) => renderField(field))}
                  </div>
                </TabsContent>

                <TabsContent value="design" className="mt-0 space-y-8">
                  <div className="space-y-1 mb-6">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white">تنسيق القالب</h3>
                    <p className="text-xs text-gray-500">اختر المظهر والألوان المناسبة</p>
                  </div>
                  
                  <div className="space-y-4">
                    <Label className="font-black text-gray-700 dark:text-gray-300">النماذج المتاحة</Label>
                    <div className="grid grid-cols-2 gap-4">
                      {template.variants.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => setSelectedVariant(v)}
                          className={cn(
                            "relative aspect-[3/4] rounded-2xl overflow-hidden border-4 transition-all group",
                            selectedVariant.id === v.id ? "border-primary shadow-xl scale-[1.02]" : "border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                          )}
                        >
                          <img src={v.thumbnail} alt={v.name_ar} className="w-full h-full object-cover" />
                          <div className={cn(
                            "absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity",
                            selectedVariant.id === v.id && "opacity-100"
                          )}>
                            {selectedVariant.id === v.id && <CheckCircle2 className="w-8 h-8 text-white" />}
                          </div>
                          <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                            <p className="text-[10px] font-bold text-white text-center">{v.name_ar}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <Separator className="bg-gray-100 dark:bg-gray-800" />

                  <div className="space-y-4">
                    <Label className="font-black text-gray-700 dark:text-gray-300">الخطوط والألوان</Label>
                    <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 text-center">
                      <Palette className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-xs text-gray-500">ميزات التنسيق المتقدمة قادمة قريباً</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="tools" className="mt-0 space-y-6">
                  <div className="space-y-1 mb-6">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white">أدوات إضافية</h3>
                    <p className="text-xs text-gray-500">عزز قالبك بميزات ذكية</p>
                  </div>

                  <Card className="rounded-3xl border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-lg transition-shadow">
                    <CardHeader className="bg-gray-50/50 dark:bg-gray-900/50 pb-4">
                      <CardTitle className="text-sm font-black flex items-center gap-2">
                        <QrCode className="w-4 h-4 text-primary" />
                        توليد باركود (QR Code)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                      <p className="text-xs text-gray-500 leading-relaxed">أضف رابطاً تفاعلياً (مثل فيديو شرح أو ملف إضافي) ليتم تحويله لباركود يظهر في القالب.</p>
                      <div className="flex gap-2">
                        <Input
                          placeholder="أدخل الرابط هنا..."
                          value={qrUrl}
                          onChange={(e) => setQrUrl(e.target.value)}
                          className="rounded-xl text-xs"
                        />
                        <Button 
                          size="sm" 
                          onClick={() => setShowQRDialog(true)}
                          className="rounded-xl font-bold"
                        >
                          توليد
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-3xl border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-lg transition-shadow">
                    <CardHeader className="bg-gray-50/50 dark:bg-gray-900/50 pb-4">
                      <CardTitle className="text-sm font-black flex items-center gap-2">
                        <History className="w-4 h-4 text-primary" />
                        سجل النسخ
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <Button variant="outline" className="w-full rounded-xl font-bold gap-2 border-2">
                        <Eye className="w-4 h-4" />
                        عرض النسخ السابقة
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </ScrollArea>
          </Tabs>
        </aside>

        {/* Right Area - Preview */}
        <main className="flex-1 bg-gray-100 dark:bg-gray-900 relative overflow-hidden flex items-center justify-center p-8">
          <div className="absolute inset-0 opacity-30 dark:opacity-10 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:20px_20px] dark:bg-[radial-gradient(#fff_1px,transparent_1px)]" />
          </div>

          <ScrollArea className="w-full h-full">
            <div className="flex items-center justify-center min-h-full p-4">
              <div
                ref={previewRef}
                className="relative bg-white shadow-2xl transition-all duration-500 origin-center"
                style={{
                  width: '210mm',
                  height: '297mm',
                  backgroundImage: `url(${selectedVariant.background_image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                {template.fields.map((field) => {
                  const value = formData[field.name] || '';
                  return (
                    <div
                      key={field.id}
                      className="absolute overflow-hidden flex items-center"
                      style={{
                        left: `${field.position_x}%`,
                        top: `${field.position_y}%`,
                        width: `${field.width}%`,
                        height: `${field.height}%`,
                        fontSize: `${field.font_size}px`,
                        fontFamily: field.font_family,
                        color: field.font_color,
                        textAlign: field.text_align as any,
                        justifyContent: field.text_align === 'center' ? 'center' : field.text_align === 'right' ? 'flex-end' : 'flex-start',
                      }}
                    >
                      {field.type === 'image' && value ? (
                        <img src={value} alt="" className="max-w-full max-h-full object-contain" />
                      ) : (
                        <span className="whitespace-pre-wrap break-words w-full">
                          {value || (
                            <span className="opacity-20 italic text-[0.8em]">
                              [{field.label_ar}]
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </ScrollArea>

          {/* Floating Preview Controls */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-2 rounded-full shadow-2xl border border-white/20">
            <Button variant="ghost" size="icon" className="rounded-full w-10 h-10 hover:bg-primary/10 hover:text-primary">
              <ChevronRight className="w-5 h-5" />
            </Button>
            <div className="px-4 text-xs font-black text-gray-500">صفحة 1 من 1</div>
            <Button variant="ghost" size="icon" className="rounded-full w-10 h-10 hover:bg-primary/10 hover:text-primary">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </div>
        </main>
      </div>

      {/* AI Assistant Modal */}
      {showAI && (
        <AIAssistant
          onClose={() => setShowAI(false)}
          onApply={handleAISuggestion}
          initialPrompt={activeAIField ? `ساعدني في كتابة محتوى لحقل "${template.fields.find(f => f.name === activeAIField)?.label_ar}" في سجل تعليمي بعنوان "${title || template.name_ar}"` : ''}
        />
      )}
    </div>
  );
}
