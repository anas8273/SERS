'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { LoadingSpinner } from '@/components/ui/loading';
import { cn } from '@/lib/utils';
import {
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  Download,
  Settings,
  Check,
} from 'lucide-react';

export type ExportFormat = 'pdf' | 'png' | 'jpg' | 'excel' | 'word';

interface ExportOptions {
  format: ExportFormat;
  quality?: 'low' | 'medium' | 'high';
  paperSize?: 'a4' | 'a3' | 'letter' | 'legal';
  orientation?: 'portrait' | 'landscape';
  includeHeader?: boolean;
  includeFooter?: boolean;
  includeWatermark?: boolean;
  watermarkText?: string;
  margin?: number;
}

interface AdvancedExportProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => Promise<void>;
  title?: string;
  availableFormats?: ExportFormat[];
}

const formatInfo: Record<
  ExportFormat,
  { label: string; icon: React.ReactNode; description: string }
> = {
  pdf: {
    label: 'PDF',
    icon: <FileText className="w-5 h-5" />,
    description: 'مستند PDF قابل للطباعة',
  },
  png: {
    label: 'PNG',
    icon: <ImageIcon className="w-5 h-5" />,
    description: 'صورة عالية الجودة مع خلفية شفافة',
  },
  jpg: {
    label: 'JPG',
    icon: <ImageIcon className="w-5 h-5" />,
    description: 'صورة مضغوطة للمشاركة',
  },
  excel: {
    label: 'Excel',
    icon: <FileSpreadsheet className="w-5 h-5" />,
    description: 'جدول بيانات قابل للتعديل',
  },
  word: {
    label: 'Word',
    icon: <FileText className="w-5 h-5" />,
    description: 'مستند Word قابل للتعديل',
  },
};

export function AdvancedExport({
  isOpen,
  onClose,
  onExport,
  title = 'تصدير القالب',
  availableFormats = ['pdf', 'png', 'jpg'],
}: AdvancedExportProps) {
  const [options, setOptions] = useState<ExportOptions>({
    format: 'pdf',
    quality: 'high',
    paperSize: 'a4',
    orientation: 'portrait',
    includeHeader: true,
    includeFooter: true,
    includeWatermark: false,
    margin: 20,
  });
  const [isExporting, setIsExporting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExport(options);
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <div className="space-y-6">
        {/* Format Selection */}
        <div>
          <label className="block text-sm font-medium mb-3">صيغة التصدير</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {availableFormats.map((format) => (
              <button
                key={format}
                onClick={() => setOptions({ ...options, format })}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
                  options.format === format
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                )}
              >
                <div
                  className={cn(
                    'p-2 rounded-full',
                    options.format === format
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-gray-800'
                  )}
                >
                  {formatInfo[format].icon}
                </div>
                <span className="font-medium">{formatInfo[format].label}</span>
                <span className="text-xs text-muted-foreground text-center">
                  {formatInfo[format].description}
                </span>
                {options.format === format && (
                  <Check className="w-4 h-4 text-primary absolute top-2 left-2" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Quality Selection (for images) */}
        {(options.format === 'png' || options.format === 'jpg') && (
          <div>
            <label className="block text-sm font-medium mb-3">جودة الصورة</label>
            <div className="flex gap-3">
              {(['low', 'medium', 'high'] as const).map((quality) => (
                <button
                  key={quality}
                  onClick={() => setOptions({ ...options, quality })}
                  className={cn(
                    'flex-1 py-2 px-4 rounded-lg border transition-all',
                    options.quality === quality
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-gray-200 dark:border-gray-700'
                  )}
                >
                  {quality === 'low' && 'منخفضة'}
                  {quality === 'medium' && 'متوسطة'}
                  {quality === 'high' && 'عالية'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Paper Size (for PDF) */}
        {options.format === 'pdf' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-3">حجم الورق</label>
              <select
                value={options.paperSize}
                onChange={(e) =>
                  setOptions({
                    ...options,
                    paperSize: e.target.value as ExportOptions['paperSize'],
                  })
                }
                className="w-full p-2 rounded-lg border bg-background"
              >
                <option value="a4">A4</option>
                <option value="a3">A3</option>
                <option value="letter">Letter</option>
                <option value="legal">Legal</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-3">الاتجاه</label>
              <select
                value={options.orientation}
                onChange={(e) =>
                  setOptions({
                    ...options,
                    orientation: e.target.value as ExportOptions['orientation'],
                  })
                }
                className="w-full p-2 rounded-lg border bg-background"
              >
                <option value="portrait">عمودي</option>
                <option value="landscape">أفقي</option>
              </select>
            </div>
          </div>
        )}

        {/* Advanced Options Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Settings className="w-4 h-4" />
          خيارات متقدمة
        </button>

        {/* Advanced Options */}
        {showAdvanced && (
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <label className="text-sm">تضمين الترويسة</label>
              <input
                type="checkbox"
                checked={options.includeHeader}
                onChange={(e) =>
                  setOptions({ ...options, includeHeader: e.target.checked })
                }
                className="w-4 h-4"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm">تضمين التذييل</label>
              <input
                type="checkbox"
                checked={options.includeFooter}
                onChange={(e) =>
                  setOptions({ ...options, includeFooter: e.target.checked })
                }
                className="w-4 h-4"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm">إضافة علامة مائية</label>
              <input
                type="checkbox"
                checked={options.includeWatermark}
                onChange={(e) =>
                  setOptions({ ...options, includeWatermark: e.target.checked })
                }
                className="w-4 h-4"
              />
            </div>
            {options.includeWatermark && (
              <div>
                <label className="block text-sm mb-2">نص العلامة المائية</label>
                <input
                  type="text"
                  value={options.watermarkText || ''}
                  onChange={(e) =>
                    setOptions({ ...options, watermarkText: e.target.value })
                  }
                  placeholder="SERS"
                  className="w-full p-2 rounded-lg border bg-background"
                />
              </div>
            )}
          </div>
        )}

        {/* Export Button */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            إلغاء
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <LoadingSpinner size="sm" color="white" className="ml-2" />
                جاري التصدير...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 ml-2" />
                تصدير
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
