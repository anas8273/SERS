'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  QrCode,
  Link as LinkIcon,
  FileText,
  Upload,
  Download,
  Copy,
  Share2,
  Sparkles,
  Loader2,
  CheckCircle2,
  X,
  Eye,
  Settings,
  Palette,
  Maximize2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface QRCodeGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  templateId?: string;
  templateTitle?: string;
}

export function QRCodeGenerator({ isOpen, onClose, templateId, templateTitle }: QRCodeGeneratorProps) {
  const [activeTab, setActiveTab] = useState('url');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQR, setGeneratedQR] = useState<string | null>(null);
  
  // Form states
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  
  // QR Code customization
  const [qrSize, setQrSize] = useState('256');
  const [qrColor, setQrColor] = useState('#000000');
  const [qrBgColor, setQrBgColor] = useState('#ffffff');
  const [qrFormat, setQrFormat] = useState('png');

  const handleGenerateQR = async () => {
    setIsGenerating(true);
    try {
      let payload: any = {
        size: parseInt(qrSize),
        color: qrColor,
        bg_color: qrBgColor,
        format: qrFormat,
        template_id: templateId,
      };

      if (activeTab === 'url') {
        if (!url.trim()) {
          toast.error('يرجى إدخال رابط صحيح');
          return;
        }
        payload.type = 'url';
        payload.content = url;
      } else if (activeTab === 'text') {
        if (!text.trim()) {
          toast.error('يرجى إدخال النص المطلوب');
          return;
        }
        payload.type = 'text';
        payload.content = text;
      } else if (activeTab === 'file') {
        if (!file) {
          toast.error('يرجى اختيار ملف');
          return;
        }
        
        // Upload file first
        const formData = new FormData();
        formData.append('file', file);
        formData.append('template_id', templateId || '');
        
        const uploadResponse = await api.uploadFileForQR(formData);
        if (!uploadResponse.success) {
          throw new Error('فشل في رفع الملف');
        }
        
        payload.type = 'file';
        payload.file_url = uploadResponse.data.url;
      }

      const response = await api.generateQRCode(payload);
      
      if (response.success && response.data?.qr_code) {
        setGeneratedQR(response.data.qr_code);
        toast.success('تم إنشاء رمز QR بنجاح ✨');
      } else {
        throw new Error('فشل في إنشاء رمز QR');
      }
    } catch (error: any) {
      console.error('QR Generation Error:', error);
      toast.error(error.message || 'حدث خطأ أثناء إنشاء رمز QR');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadQR = () => {
    if (!generatedQR) return;
    
    const link = document.createElement('a');
    link.href = generatedQR;
    link.download = `qr-code-${templateTitle || 'template'}.${qrFormat}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    toast.success('تم تحميل رمز QR');
  };

  const handleCopyQR = async () => {
    if (!generatedQR) return;
    
    try {
      await navigator.clipboard.writeText(generatedQR);
      toast.success('تم نسخ رابط رمز QR');
    } catch (error) {
      toast.error('فشل في نسخ الرابط');
    }
  };

  const handleShareQR = async () => {
    if (!generatedQR) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `رمز QR - ${templateTitle || 'قالب'}`,
          url: generatedQR,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      handleCopyQR();
    }
  };

  const resetForm = () => {
    setUrl('');
    setText('');
    setFile(null);
    setGeneratedQR(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center">
              <QrCode className="w-6 h-6 text-primary" />
            </div>
            مولد رموز QR الذكي
          </DialogTitle>
          <DialogDescription>
            أنشئ رموز QR مخصصة للروابط والنصوص والملفات مع إمكانيات تخصيص متقدمة
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* QR Type Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
              <TabsTrigger value="url" className="flex items-center gap-2 rounded-lg">
                <LinkIcon className="w-4 h-4" />
                رابط
              </TabsTrigger>
              <TabsTrigger value="text" className="flex items-center gap-2 rounded-lg">
                <FileText className="w-4 h-4" />
                نص
              </TabsTrigger>
              <TabsTrigger value="file" className="flex items-center gap-2 rounded-lg">
                <Upload className="w-4 h-4" />
                ملف
              </TabsTrigger>
            </TabsList>

            {/* URL Tab */}
            <TabsContent value="url" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url" className="text-sm font-bold">الرابط</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="h-12 rounded-xl"
                />
                <p className="text-xs text-gray-500">
                  أدخل الرابط الذي تريد تحويله إلى رمز QR
                </p>
              </div>
            </TabsContent>

            {/* Text Tab */}
            <TabsContent value="text" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="text" className="text-sm font-bold">النص</Label>
                <Textarea
                  id="text"
                  placeholder="أدخل النص المطلوب..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="min-h-24 rounded-xl resize-none"
                  maxLength={500}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>سيظهر هذا النص عند مسح رمز QR</span>
                  <span>{text.length}/500</span>
                </div>
              </div>
            </TabsContent>

            {/* File Tab */}
            <TabsContent value="file" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file" className="text-sm font-bold">الملف</Label>
                <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center hover:border-primary/50 transition-colors">
                  <input
                    id="file"
                    type="file"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                  />
                  <label htmlFor="file" className="cursor-pointer">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {file ? file.name : 'اضغط لاختيار ملف'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF, DOC, DOCX, JPG, PNG, GIF (حد أقصى 10MB)
                    </p>
                  </label>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* QR Customization */}
          <Card className="border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Settings className="w-4 h-4" />
                إعدادات التخصيص
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold">الحجم</Label>
                  <Select value={qrSize} onValueChange={setQrSize}>
                    <SelectTrigger className="h-10 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="128">صغير (128px)</SelectItem>
                      <SelectItem value="256">متوسط (256px)</SelectItem>
                      <SelectItem value="512">كبير (512px)</SelectItem>
                      <SelectItem value="1024">كبير جداً (1024px)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs font-bold">التنسيق</Label>
                  <Select value={qrFormat} onValueChange={setQrFormat}>
                    <SelectTrigger className="h-10 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="png">PNG</SelectItem>
                      <SelectItem value="jpg">JPG</SelectItem>
                      <SelectItem value="svg">SVG</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold">لون الرمز</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={qrColor}
                      onChange={(e) => setQrColor(e.target.value)}
                      className="w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer"
                    />
                    <Input
                      value={qrColor}
                      onChange={(e) => setQrColor(e.target.value)}
                      className="h-10 rounded-lg font-mono text-xs"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs font-bold">لون الخلفية</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={qrBgColor}
                      onChange={(e) => setQrBgColor(e.target.value)}
                      className="w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer"
                    />
                    <Input
                      value={qrBgColor}
                      onChange={(e) => setQrBgColor(e.target.value)}
                      className="h-10 rounded-lg font-mono text-xs"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Generated QR Code */}
          {generatedQR && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-primary">
                  <CheckCircle2 className="w-4 h-4" />
                  رمز QR جاهز
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center">
                  <div className="p-4 bg-white rounded-2xl shadow-lg">
                    <img
                      src={generatedQR}
                      alt="Generated QR Code"
                      className="w-48 h-48 object-contain"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={handleDownloadQR}
                    className="flex-1 gap-2 rounded-xl"
                  >
                    <Download className="w-4 h-4" />
                    تحميل
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCopyQR}
                    className="flex-1 gap-2 rounded-xl"
                  >
                    <Copy className="w-4 h-4" />
                    نسخ
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleShareQR}
                    className="flex-1 gap-2 rounded-xl"
                  >
                    <Share2 className="w-4 h-4" />
                    مشاركة
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <Button
              onClick={handleGenerateQR}
              disabled={isGenerating}
              className="flex-1 h-12 rounded-xl font-bold gap-2 shadow-lg"
            >
              {isGenerating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Sparkles className="w-5 h-5" />
              )}
              {isGenerating ? 'جاري الإنشاء...' : 'إنشاء رمز QR'}
            </Button>
            
            <Button
              variant="outline"
              onClick={resetForm}
              className="px-6 h-12 rounded-xl font-bold"
            >
              إعادة تعيين
            </Button>
            
            <Button
              variant="ghost"
              onClick={onClose}
              className="px-6 h-12 rounded-xl font-bold"
            >
              إغلاق
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default QRCodeGenerator;