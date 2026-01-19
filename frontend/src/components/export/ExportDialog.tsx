'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import {
  Download,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  Settings2,
} from 'lucide-react';
import { toast } from 'sonner';

interface ExportDialogProps {
  title?: string;
  description?: string;
  onExport: (options: ExportOptions) => Promise<void>;
  supportedFormats?: ('pdf' | 'png' | 'jpg' | 'excel' | 'word')[];
  children?: React.ReactNode;
}

export interface ExportOptions {
  format: 'pdf' | 'png' | 'jpg' | 'excel' | 'word';
  quality: number;
  includeHeader: boolean;
  includeFooter: boolean;
  includeWatermark: boolean;
  paperSize: 'a4' | 'a3' | 'letter';
  orientation: 'portrait' | 'landscape';
}

const formatIcons = {
  pdf: FileText,
  png: ImageIcon,
  jpg: ImageIcon,
  excel: FileSpreadsheet,
  word: FileText,
};

const formatLabels = {
  pdf: 'PDF',
  png: 'PNG',
  jpg: 'JPG',
  excel: 'Excel',
  word: 'Word',
};

const formatDescriptions = {
  pdf: 'مستند PDF جاهز للطباعة',
  png: 'صورة عالية الجودة',
  jpg: 'صورة مضغوطة',
  excel: 'جدول بيانات Excel',
  word: 'مستند Word قابل للتعديل',
};

export function ExportDialog({
  title = 'تصدير',
  description = 'اختر صيغة التصدير والإعدادات المناسبة',
  onExport,
  supportedFormats = ['pdf', 'png', 'jpg'],
  children,
}: ExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [options, setOptions] = useState<ExportOptions>({
    format: supportedFormats[0],
    quality: 100,
    includeHeader: true,
    includeFooter: true,
    includeWatermark: false,
    paperSize: 'a4',
    orientation: 'portrait',
  });

  const handleExport = async () => {
    setIsExporting(true);
    setExportSuccess(false);
    
    try {
      await onExport(options);
      setExportSuccess(true);
      toast.success('تم التصدير بنجاح!');
      setTimeout(() => {
        setOpen(false);
        setExportSuccess(false);
      }, 1500);
    } catch (error) {
      toast.error('حدث خطأ أثناء التصدير');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            تصدير
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">صيغة التصدير</Label>
            <RadioGroup
              value={options.format}
              onValueChange={(value) => setOptions({ ...options, format: value as any })}
              className="grid grid-cols-2 gap-3"
            >
              {supportedFormats.map((format) => {
                const Icon = formatIcons[format];
                return (
                  <div key={format}>
                    <RadioGroupItem
                      value={format}
                      id={format}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={format}
                      className="flex flex-col items-center justify-center rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                    >
                      <Icon className="w-8 h-8 mb-2 text-muted-foreground" />
                      <span className="font-semibold">{formatLabels[format]}</span>
                      <span className="text-xs text-muted-foreground text-center mt-1">
                        {formatDescriptions[format]}
                      </span>
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          {/* Quality Slider (for images) */}
          {(options.format === 'png' || options.format === 'jpg') && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label>جودة الصورة</Label>
                <span className="text-sm font-semibold text-primary">{options.quality}%</span>
              </div>
              <Slider
                value={[options.quality]}
                onValueChange={([value]) => setOptions({ ...options, quality: value })}
                min={50}
                max={100}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>أصغر حجم</span>
                <span>أعلى جودة</span>
              </div>
            </div>
          )}

          {/* Advanced Options Toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <Settings2 className="w-4 h-4" />
            خيارات متقدمة
          </Button>

          {/* Advanced Options */}
          {showAdvanced && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-xl">
              {/* Paper Size (for PDF) */}
              {options.format === 'pdf' && (
                <div className="space-y-2">
                  <Label>حجم الورق</Label>
                  <RadioGroup
                    value={options.paperSize}
                    onValueChange={(value) => setOptions({ ...options, paperSize: value as any })}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <RadioGroupItem value="a4" id="a4" />
                      <Label htmlFor="a4">A4</Label>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <RadioGroupItem value="a3" id="a3" />
                      <Label htmlFor="a3">A3</Label>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <RadioGroupItem value="letter" id="letter" />
                      <Label htmlFor="letter">Letter</Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              {/* Orientation (for PDF) */}
              {options.format === 'pdf' && (
                <div className="space-y-2">
                  <Label>الاتجاه</Label>
                  <RadioGroup
                    value={options.orientation}
                    onValueChange={(value) => setOptions({ ...options, orientation: value as any })}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <RadioGroupItem value="portrait" id="portrait" />
                      <Label htmlFor="portrait">عمودي</Label>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <RadioGroupItem value="landscape" id="landscape" />
                      <Label htmlFor="landscape">أفقي</Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              {/* Checkboxes */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id="header"
                    checked={options.includeHeader}
                    onCheckedChange={(checked) => setOptions({ ...options, includeHeader: !!checked })}
                  />
                  <Label htmlFor="header">تضمين الترويسة</Label>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id="footer"
                    checked={options.includeFooter}
                    onCheckedChange={(checked) => setOptions({ ...options, includeFooter: !!checked })}
                  />
                  <Label htmlFor="footer">تضمين التذييل</Label>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id="watermark"
                    checked={options.includeWatermark}
                    onCheckedChange={(checked) => setOptions({ ...options, includeWatermark: !!checked })}
                  />
                  <Label htmlFor="watermark">إضافة علامة مائية</Label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Export Button */}
        <Button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full gap-2"
          size="lg"
        >
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              جاري التصدير...
            </>
          ) : exportSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              تم التصدير بنجاح!
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              تصدير {formatLabels[options.format]}
            </>
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
