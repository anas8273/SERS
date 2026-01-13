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
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [qrUrl, setQrUrl] = useState('');
  const [generatingQR, setGeneratingQR] = useState(false);
  const [userTemplateDataId, setUserTemplateDataId] = useState<number | null>(
    existingData?.id || null
  );

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

      toast.success('تم الحفظ بنجاح');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'حدث خطأ في الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async (format: 'image' | 'pdf') => {
    if (!userTemplateDataId) {
      toast.error('يرجى حفظ القالب أولاً');
      return;
    }

    setExporting(true);
    try {
      const response = await api.post(
        `/export/${userTemplateDataId}/${format}`,
        {},
        { responseType: 'blob' }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${title}.${format === 'image' ? 'png' : 'pdf'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success(`تم تصدير الملف بصيغة ${format === 'image' ? 'صورة' : 'PDF'}`);
    } catch (error) {
      toast.error('حدث خطأ في التصدير');
    } finally {
      setExporting(false);
    }
  };

  const handleGenerateQR = async () => {
    if (!qrUrl.trim()) {
      toast.error('يرجى إدخال الرابط');
      return;
    }

    setGeneratingQR(true);
    try {
      const response = await api.post('/qrcode/url', {
        url: qrUrl,
        user_template_data_id: userTemplateDataId,
      });

      // Add QR code to a field or show it
      toast.success('تم توليد الباركود بنجاح');
      setShowQRDialog(false);
      setQrUrl('');
    } catch (error) {
      toast.error('حدث خطأ في توليد الباركود');
    } finally {
      setGeneratingQR(false);
    }
  };

  const handleAISuggestion = (fieldName: string, suggestion: string) => {
    handleFieldChange(fieldName, suggestion);
    toast.success('تم تطبيق الاقتراح');
  };

  const renderField = (field: TemplateField) => {
    const value = formData[field.name] || '';

    switch (field.type) {
      case 'text':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label_ar}
              {field.is_required && <span className="text-red-500 mr-1">*</span>}
            </Label>
            <div className="flex gap-2">
              <Input
                id={field.name}
                value={value}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                placeholder={field.placeholder_ar}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAI(true)}
                title="اقتراح بالذكاء الاصطناعي"
              >
                <Sparkles className="w-4 h-4" />
              </Button>
            </div>
          </div>
        );

      case 'textarea':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label_ar}
              {field.is_required && <span className="text-red-500 mr-1">*</span>}
            </Label>
            <div className="space-y-2">
              <Textarea
                id={field.name}
                value={value}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                placeholder={field.placeholder_ar}
                rows={4}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAI(true)}
                className="w-full"
              >
                <Sparkles className="w-4 h-4 ml-2" />
                اقتراح نص بالذكاء الاصطناعي
              </Button>
            </div>
          </div>
        );

      case 'image':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label_ar}
              {field.is_required && <span className="text-red-500 mr-1">*</span>}
            </Label>
            <div className="border-2 border-dashed rounded-lg p-4 text-center">
              {value ? (
                <div className="relative">
                  <img src={value} alt="" className="max-h-32 mx-auto" />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-0 right-0"
                    onClick={() => handleFieldChange(field.name, '')}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div>
                  <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">اسحب الصورة هنا أو</p>
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
                    className="text-primary cursor-pointer hover:underline"
                  >
                    اختر ملف
                  </Label>
                </div>
              )}
            </div>
          </div>
        );

      case 'date':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label_ar}
              {field.is_required && <span className="text-red-500 mr-1">*</span>}
            </Label>
            <Input
              id={field.name}
              type="date"
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-100 dark:bg-gray-900 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-semibold">{template.name_ar}</h1>
            <p className="text-sm text-gray-500">{template.category?.name_ar}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowAI(true)}>
            <Sparkles className="w-4 h-4 ml-2" />
            مساعد AI
          </Button>
          
          <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <QrCode className="w-4 h-4 ml-2" />
                باركود
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>توليد باركود QR</DialogTitle>
                <DialogDescription>
                  أدخل الرابط لتوليد باركود QR وإضافته للقالب
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>الرابط</Label>
                  <Input
                    value={qrUrl}
                    onChange={(e) => setQrUrl(e.target.value)}
                    placeholder="https://example.com"
                    dir="ltr"
                  />
                </div>
                <Button
                  onClick={handleGenerateQR}
                  disabled={generatingQR}
                  className="w-full"
                >
                  {generatingQR ? (
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  ) : (
                    <QrCode className="w-4 h-4 ml-2" />
                  )}
                  توليد الباركود
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Separator orientation="vertical" className="h-6" />

          <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 ml-2" />
            )}
            حفظ
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('image')}
            disabled={exporting || !userTemplateDataId}
          >
            <FileImage className="w-4 h-4 ml-2" />
            صورة
          </Button>

          <Button
            size="sm"
            onClick={() => handleExport('pdf')}
            disabled={exporting || !userTemplateDataId}
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 ml-2" />
            )}
            تحميل PDF
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Form Fields */}
        <div className="w-96 bg-white dark:bg-gray-800 border-l overflow-hidden flex flex-col">
          <div className="p-4 border-b">
            <Label htmlFor="title">عنوان القالب *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: تقرير نشاط التسامح"
              className="mt-2"
            />
          </div>

          <Tabs defaultValue="fields" className="flex-1 flex flex-col">
            <TabsList className="mx-4 mt-2">
              <TabsTrigger value="fields" className="flex-1">الحقول</TabsTrigger>
              <TabsTrigger value="variants" className="flex-1">الأشكال</TabsTrigger>
            </TabsList>

            <TabsContent value="fields" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full p-4">
                <div className="space-y-6">
                  {template.fields.map(renderField)}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="variants" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full p-4">
                <div className="grid grid-cols-2 gap-3">
                  {template.variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      className={`relative aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all ${
                        selectedVariant.id === v.id
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {v.thumbnail ? (
                        <Image
                          src={v.thumbnail}
                          alt={v.name_ar}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <FileText className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-xs p-1 text-center">
                        {v.name_ar}
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview Area */}
        <div className="flex-1 p-8 overflow-auto bg-gray-200 dark:bg-gray-950">
          <div
            ref={previewRef}
            className="max-w-3xl mx-auto bg-white shadow-2xl rounded-lg overflow-hidden"
            style={{ aspectRatio: '3/4' }}
          >
            <div className="relative w-full h-full">
              {/* Background Image */}
              {selectedVariant.background_image && (
                <Image
                  src={selectedVariant.background_image}
                  alt=""
                  fill
                  className="object-contain"
                />
              )}

              {/* Render Fields on Preview */}
              {template.fields.map((field) => {
                const value = formData[field.name];
                if (!value) return null;

                return (
                  <div
                    key={field.id}
                    className="absolute"
                    style={{
                      left: `${field.position_x}%`,
                      top: `${field.position_y}%`,
                      width: `${field.width}%`,
                      height: `${field.height}%`,
                      fontSize: `${field.font_size}px`,
                      fontFamily: field.font_family,
                      color: field.font_color,
                      textAlign: field.text_align as any,
                    }}
                  >
                    {field.type === 'image' ? (
                      <img src={value} alt="" className="w-full h-full object-contain" />
                    ) : (
                      <span>{value}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* AI Assistant Dialog */}
      {showAI && (
        <AIAssistant
          template={template}
          formData={formData}
          onSuggestion={handleAISuggestion}
          onClose={() => setShowAI(false)}
        />
      )}
    </div>
  );
}
