'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  QrCode,
  Link as LinkIcon,
  Upload,
  Download,
  Loader2,
  Copy,
  Check,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface QRCodeGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onQRGenerated: (qrImageUrl: string) => void;
  userTemplateDataId?: number;
}

export default function QRCodeGenerator({
  open,
  onOpenChange,
  onQRGenerated,
  userTemplateDataId,
}: QRCodeGeneratorProps) {
  const [activeTab, setActiveTab] = useState<'url' | 'file'>('url');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generatedQR, setGeneratedQR] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerateFromUrl = async () => {
    if (!url.trim()) {
      toast.error('يرجى إدخال الرابط');
      return;
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      toast.error('الرابط غير صالح');
      return;
    }

    setGenerating(true);
    try {
      const response = await api.post('/qrcode/url', {
        url,
        user_template_data_id: userTemplateDataId,
      });

      const qrUrl = response.data.data.qr_code_url;
      setGeneratedQR(qrUrl);
      toast.success('تم توليد الباركود بنجاح');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'حدث خطأ في توليد الباركود');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateFromFile = async () => {
    if (!file) {
      toast.error('يرجى اختيار ملف');
      return;
    }

    setGenerating(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (userTemplateDataId) {
        formData.append('user_template_data_id', userTemplateDataId.toString());
      }

      const response = await api.post('/qrcode/file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const qrUrl = response.data.data.qr_code_url;
      setGeneratedQR(qrUrl);
      toast.success('تم توليد الباركود بنجاح');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'حدث خطأ في توليد الباركود');
    } finally {
      setGenerating(false);
    }
  };

  const handleInsertQR = () => {
    if (generatedQR) {
      onQRGenerated(generatedQR);
      handleClose();
    }
  };

  const handleDownloadQR = () => {
    if (generatedQR) {
      const link = document.createElement('a');
      link.href = generatedQR;
      link.download = 'qrcode.png';
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  };

  const handleCopyUrl = async () => {
    if (generatedQR) {
      await navigator.clipboard.writeText(generatedQR);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('تم نسخ الرابط');
    }
  };

  const handleClose = () => {
    setUrl('');
    setFile(null);
    setGeneratedQR(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            توليد باركود QR
          </DialogTitle>
          <DialogDescription>
            قم بتوليد باركود QR من رابط أو ملف لإضافته للقالب
          </DialogDescription>
        </DialogHeader>

        {!generatedQR ? (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'url' | 'file')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="url" className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4" />
                من رابط
              </TabsTrigger>
              <TabsTrigger value="file" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                من ملف
              </TabsTrigger>
            </TabsList>

            <TabsContent value="url" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="url">الرابط</Label>
                <Input
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  dir="ltr"
                  type="url"
                />
                <p className="text-xs text-gray-500">
                  أدخل الرابط الذي تريد تحويله إلى باركود
                </p>
              </div>

              <Button
                onClick={handleGenerateFromUrl}
                disabled={generating || !url.trim()}
                className="w-full"
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                ) : (
                  <QrCode className="w-4 h-4 ml-2" />
                )}
                توليد الباركود
              </Button>
            </TabsContent>

            <TabsContent value="file" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="file">الملف</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  {file ? (
                    <div className="space-y-2">
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFile(null)}
                      >
                        إزالة
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500 mb-2">
                        اسحب الملف هنا أو
                      </p>
                      <Input
                        id="file"
                        type="file"
                        className="hidden"
                        accept="image/*,.pdf,.doc,.docx"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                      />
                      <Label
                        htmlFor="file"
                        className="text-primary cursor-pointer hover:underline"
                      >
                        اختر ملف
                      </Label>
                    </>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  سيتم رفع الملف وتوليد باركود يشير إليه
                </p>
              </div>

              <Button
                onClick={handleGenerateFromFile}
                disabled={generating || !file}
                className="w-full"
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                ) : (
                  <QrCode className="w-4 h-4 ml-2" />
                )}
                توليد الباركود
              </Button>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-4">
            {/* QR Code Preview */}
            <div className="flex justify-center p-4 bg-white rounded-lg">
              <img
                src={generatedQR}
                alt="QR Code"
                className="w-48 h-48 object-contain"
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Button onClick={handleInsertQR} className="w-full">
                <QrCode className="w-4 h-4 ml-2" />
                إدراج في القالب
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={handleDownloadQR}>
                  <Download className="w-4 h-4 ml-2" />
                  تحميل
                </Button>
                <Button variant="outline" onClick={handleCopyUrl}>
                  {copied ? (
                    <Check className="w-4 h-4 ml-2" />
                  ) : (
                    <Copy className="w-4 h-4 ml-2" />
                  )}
                  {copied ? 'تم النسخ' : 'نسخ الرابط'}
                </Button>
              </div>

              <Button
                variant="ghost"
                onClick={() => setGeneratedQR(null)}
                className="w-full"
              >
                توليد باركود آخر
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
