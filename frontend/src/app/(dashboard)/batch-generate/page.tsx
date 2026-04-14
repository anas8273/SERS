'use client';
import { ta } from '@/i18n/auto-translations';

import { logger } from '@/lib/logger';
import { TopNavBar } from '@/components/layout/TopNavBar';

import { useTranslation } from '@/i18n/useTranslation';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import toast from 'react-hot-toast';
import {
  FileSpreadsheet,
  Upload,
  Download,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  FileText,
  Image as ImageIcon,
  Layers,
  ArrowRight,
  ArrowLeft,
  Eye,
  Trash2,
  Play,
  RotateCcw,
  Settings,
  Users,
  FileDown,
  Zap,
  Clock,
  Table as TableIcon,
  ChevronDown,
  ChevronUp,
  MapPin,
  Link2,
  FileImage,
  Archive,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getTemplateCanvas, getDynamicForm, getServices } from '@/lib/firestore-service';
import { parseFile, analyzeColumns, generateSampleExcel, generateSampleCSV, type ParsedData, type ColumnInfo } from '@/lib/excel-parser';
import type { TemplateCanvas, DynamicFormConfig, DynamicFormField } from '@/types';

// ===== Types =====
interface TemplateOption {
  id: string;
  name_ar: string;
  slug: string;
  category?: string;
  canvas?: TemplateCanvas;
  form?: DynamicFormConfig;
}

interface ColumnMapping {
  excelColumn: string;
  templateField: string;
}

type ExportFormat = 'pdf' | 'zip_png' | 'zip_jpeg';

// ===== Steps =====
const STEPS = [
  { id: 1, title: ta('اختيار القالب', 'Select Template'), icon: Layers, description: ta('اختر القالب التفاعلي', 'Select Interactive Template') },
  { id: 2, title: ta('رفع البيانات', 'Upload Data'), icon: FileSpreadsheet, description: ta('رفع ملف Excel أو CSV', 'Upload Excel or CSV File') },
  { id: 3, title: ta('ربط الأعمدة', 'Map Columns'), icon: Link2, description: ta('ربط أعمدة الملف بحقول القالب', 'Map file columns to template fields') },
  { id: 4, title: ta('معاينة وتوليد', 'Preview & Generate'), icon: Zap, description: ta('معاينة النتائج وبدء التوليد', 'Preview Results and Start Generation') },
];

export default function BulkGeneratePage() {
    const { dir } = useTranslation();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Step state
    const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Template selection
    const [templates, setTemplates] = useState<TemplateOption[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<TemplateOption | null>(null);
    const [loadingTemplates, setLoadingTemplates] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

  // Step 2: File upload
    const [parsedData, setParsedData] = useState<ParsedData | null>(null);
    const [columnInfos, setColumnInfos] = useState<ColumnInfo[]>([]);
    const [uploadedFileName, setUploadedFileName] = useState('');
    const [parsing, setParsing] = useState(false);

  // Step 3: Column mapping
    const [mappings, setMappings] = useState<ColumnMapping[]>([]);
    const [autoMapped, setAutoMapped] = useState(false);

  // Step 4: Generate
    const [exportFormat, setExportFormat] = useState<ExportFormat>('pdf');
    const [generating, setGenerating] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [previewIndex, setPreviewIndex] = useState(0);
    const [previewData, setPreviewData] = useState<Record<string, string>>({});
    const [showSettings, setShowSettings] = useState(false);

  // ===== Load templates from Firestore =====
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoadingTemplates(true);
      // Get services that have templates
      const services = await getServices();
      const templateOptions: TemplateOption[] = [];

      for (const service of services) {
        if (!service.is_active) continue;
        // Each service can have a template canvas + form in Firestore
        // The templateId is the service.id or service.slug
        const possibleIds = [service.id, service.slug].filter(Boolean);
        for (const tplId of possibleIds) {
          try {
            const [canvas, form] = await Promise.all([
              getTemplateCanvas(String(tplId)),
              getDynamicForm(String(tplId)),
            ]);
            if (canvas && form && form.fields.length > 0) {
              templateOptions.push({
                id: String(tplId),
                name_ar: service.name_ar || (service as any).title || tplId,
                slug: service.slug,
                category: service.category,
                canvas,
                form,
              });
              break; // Found template for this service, no need to try other IDs
            }
          } catch {
            // Skip - no canvas/form for this ID
          }
        }
      }

      // If no templates from services, try loading directly from common IDs
      if (templateOptions.length === 0) {
        // Fallback: show a message
      }

      setTemplates(templateOptions);
    } catch (error) {
      logger.error('Error loading templates:', error);
      toast.error(ta('خطأ في تحميل القوالب', 'Error loading templates'));
    } finally {
      setLoadingTemplates(false);
    }
  };

  // ===== Handle template selection =====
  const handleTemplateSelect = (template: TemplateOption) => {
    setSelectedTemplate(template);
    setCurrentStep(2);
    // Reset subsequent steps
    setParsedData(null);
    setMappings([]);
    setPreviewIndex(0);
  };

  // ===== Handle file upload =====
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setParsing(true);
      setUploadedFileName(file.name);

      const data = await parseFile(file);
      const infos = analyzeColumns(data);

      setParsedData(data);
      setColumnInfos(infos);

      toast.success(`تم استيراد ${data.totalRows} سجل من "${file.name}"`);

      // Auto-map columns
      autoMapColumns(data.headers, selectedTemplate?.form?.fields || []);

      setCurrentStep(3);
    } catch (error: any) {
      toast.error(error.message || 'خطأ في قراءة الملف');
    } finally {
      setParsing(false);
    }
  };

  // ===== Handle drag & drop =====
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext || '')) {
      toast.error(ta('يرجى رفع ملف Excel (.xlsx) أو CSV فقط', 'Please upload Excel (.xlsx) or CSV files only'));
      return;
    }

    try {
      setParsing(true);
      setUploadedFileName(file.name);

      const data = await parseFile(file);
      const infos = analyzeColumns(data);

      setParsedData(data);
      setColumnInfos(infos);

      toast.success(`تم استيراد ${data.totalRows} سجل`);
      autoMapColumns(data.headers, selectedTemplate?.form?.fields || []);
      setCurrentStep(3);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setParsing(false);
    }
  }, [selectedTemplate]);

  // ===== Auto-map columns to template fields =====
  const autoMapColumns = (headers: string[], fields: DynamicFormField[]) => {
    const newMappings: ColumnMapping[] = [];

    fields.forEach(field => {
      // Try exact match first
      let matchedHeader = headers.find(h =>
        h === field.label_ar ||
        h === field.label_en ||
        h === field.name ||
        h.toLowerCase() === field.name.toLowerCase()
      );

      // Try fuzzy match
      if (!matchedHeader) {
        matchedHeader = headers.find(h => {
          const hLower = h.toLowerCase().trim();
          const nameLower = field.name.toLowerCase();
          const labelAr = field.label_ar.toLowerCase();
          return hLower.includes(nameLower) || nameLower.includes(hLower) ||
                 hLower.includes(labelAr) || labelAr.includes(hLower);
        });
      }

      // Try common Arabic mappings
      if (!matchedHeader) {
        const commonMappings: Record<string, string[]> = {
          'student_name': ['الاسم', 'اسم الطالب', 'اسم الطالبة', 'الطالب', 'الاسم الكامل', 'name'],
          'course_name': ['المادة', 'اسم المادة', 'الدورة', 'المقرر', 'course'],
          'grade': ['الدرجة', 'النتيجة', 'العلامة', 'التقدير', 'grade', 'score'],
          'date': ['التاريخ', 'تاريخ', 'date'],
          'school_name': ['المدرسة', 'اسم المدرسة', 'school'],
          'teacher_name': ['المعلم', 'اسم المعلم', 'المعلمة', 'teacher'],
          'class': ['الصف', 'الفصل', 'class'],
          'section': ['الشعبة', 'القسم', 'section'],
        };

        const fieldAliases = commonMappings[field.name] || [];
        matchedHeader = headers.find(h =>
          fieldAliases.some(alias => h.includes(alias) || alias.includes(h))
        );
      }

      newMappings.push({
        templateField: field.id,
        excelColumn: matchedHeader || '',
      });
    });

    setMappings(newMappings);
    setAutoMapped(true);
  };

  // ===== Update mapping =====
  const updateMapping = (fieldId: string, excelColumn: string) => {
    setMappings(prev => prev.map(m =>
      m.templateField === fieldId ? { ...m, excelColumn } : m
    ));
  };

  // ===== Get mapped data for a row =====
  const getMappedRowData = (rowIndex: number): Record<string, string> => {
    if (!parsedData || !selectedTemplate?.form) return {};

    const row = parsedData.rows[rowIndex];
    if (!row) return {};

    const data: Record<string, string> = {};
    selectedTemplate.form.fields.forEach(field => {
      const mapping = mappings.find(m => m.templateField === field.id);
      if (mapping && mapping.excelColumn && row[mapping.excelColumn] !== undefined) {
        data[field.id] = String(row[mapping.excelColumn]);
      } else {
        data[field.id] = '';
      }
    });

    return data;
  };

  // ===== Update preview when index changes =====
  useEffect(() => {
    if (parsedData && selectedTemplate) {
      setPreviewData(getMappedRowData(previewIndex));
    }
  }, [previewIndex, mappings, parsedData, selectedTemplate]);

  // ===== Download sample file =====
  const handleDownloadSample = async (format: 'csv' | 'xlsx') => {
    if (!selectedTemplate?.form) return;

    const fields = selectedTemplate.form.fields.map(f => ({
      id: f.id,
      label_ar: f.label_ar,
    }));

    if (format === 'csv') {
      const csv = generateSampleCSV(fields);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedTemplate.name_ar}_template.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } else {
      const blob = generateSampleExcel(fields);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedTemplate.name_ar}_template.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
    }

    toast.success(ta('تم تحميل ملف القالب', 'Template file loaded'));
  };

  // ===== Bulk Generate =====
  const handleBulkGenerate = async () => {
    if (!selectedTemplate?.canvas || !selectedTemplate?.form || !parsedData) return;

    const mappedCount = mappings.filter(m => m.excelColumn).length;
    if (mappedCount === 0) {
      toast.error(ta('يرجى ربط عمود واحد على الأقل بحقول القالب', 'Please link at least one column to template fields'));
      return;
    }

    try {
      setGenerating(true);
      setProgress({ current: 0, total: parsedData.totalRows });

      const canvas = selectedTemplate.canvas;
      const form = selectedTemplate.form;

      // Dynamic import for export utilities
      if (exportFormat === 'pdf') {
        const { bulkExportPDF } = await import('@/lib/pdf-export');

        const renderFn = (rowData: Record<string, any>, index: number): HTMLElement => {
          return createPreviewElement(canvas, form.fields, rowData);
        };

        // Prepare all row data
        const allRows = parsedData.rows.map((_, i) => getMappedRowData(i));

        const result = await bulkExportPDF(renderFn, allRows, {
          fileName: `${selectedTemplate.name_ar}_bulk_${parsedData.totalRows}`,
          canvasWidth: canvas.canvas_width,
          canvasHeight: canvas.canvas_height,
          scale: 2,
          onProgress: (current, total) => {
            setProgress({ current, total });
          },
        });

        if (result.success) {
          toast.success(ta(`تم توليد ${parsedData.totalRows} مستند بنجاح!`, `Successfully generated ${parsedData.totalRows} documents!`));
        } else {
          toast.error(result.error || ta('خطأ في التوليد', 'Generation error'));
        }
      } else {
        // ZIP export
        const { bulkExportZIP } = await import('@/lib/pdf-export');
        const imgFormat = exportFormat === 'zip_png' ? 'png' : 'jpeg';

        const renderFn = (rowData: Record<string, any>, index: number): HTMLElement => {
          return createPreviewElement(canvas, form.fields, rowData);
        };

        const allRows = parsedData.rows.map((_, i) => getMappedRowData(i));

        const result = await bulkExportZIP(renderFn, allRows, {
          fileName: `${selectedTemplate.name_ar}_bulk_${parsedData.totalRows}`,
          canvasWidth: canvas.canvas_width,
          canvasHeight: canvas.canvas_height,
          scale: 2,
          format: imgFormat,
          onProgress: (current, total) => {
            setProgress({ current, total });
          },
        });

        if (result.success) {
          toast.success(ta(`تم توليد ${parsedData.totalRows} صورة في ملف ZIP!`, `Successfully generated ${parsedData.totalRows} images in ZIP!`));
        } else {
          toast.error(result.error || ta('خطأ في التوليد', 'Generation error'));
        }
      }
    } catch (error: any) {
      logger.error('Bulk generation error:', error);
      toast.error(ta('خطأ في التوليد الجماعي', 'Error in batch generation'));
    } finally {
      setGenerating(false);
    }
  };

  // ===== Create preview DOM element for a single record =====
  const createPreviewElement = (
    canvas: TemplateCanvas,
    fields: DynamicFormField[],
    rowData: Record<string, string>
  ): HTMLElement => {
    const container = document.createElement('div');
    container.style.position = 'relative';
    container.style.width = `${canvas.canvas_width}px`;
    container.style.height = `${canvas.canvas_height}px`;
    container.style.overflow = 'hidden';
    container.style.direction = 'rtl';
    container.style.fontFamily = '"Cairo", "Tajawal", sans-serif';

    // Background image
    const bg = document.createElement('img');
    bg.src = canvas.background_url;
    bg.style.width = '100%';
    bg.style.height = '100%';
    bg.style.objectFit = 'cover';
    bg.style.position = 'absolute';
    bg.style.top = '0';
    bg.style.left = '0';
    bg.crossOrigin = 'anonymous';
    container.appendChild(bg);

    // Overlay text elements at X/Y coordinates
    canvas.elements.forEach(element => {
      const value = rowData[element.field_id] || '';
      if (!value || !element.is_visible) return;

      const textEl = document.createElement('div');
      textEl.style.position = 'absolute';
      textEl.style.left = `${element.x}%`;
      textEl.style.top = `${element.y}%`;
      textEl.style.width = `${element.width}%`;
      textEl.style.fontSize = `${element.font_size}px`;
      textEl.style.fontFamily = element.font_family || '"Cairo", sans-serif';
      textEl.style.fontWeight = element.font_weight || 'normal';
      textEl.style.color = element.color || '#000000';
      textEl.style.textAlign = element.text_align || 'center';
      textEl.style.direction = 'rtl';
      textEl.style.whiteSpace = 'pre-wrap';
      textEl.style.lineHeight = '1.4';
      textEl.style.transform = element.rotation ? `rotate(${element.rotation}deg)` : 'none';
      textEl.textContent = value;

      container.appendChild(textEl);
    });

    return container;
  };

  // ===== Filtered templates =====
  const filteredTemplates = templates.filter(t =>
    t.name_ar.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.category || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const mappedFieldsCount = mappings.filter(m => m.excelColumn).length;
  const totalFields = selectedTemplate?.form?.fields.length || 0;

  // ===== RENDER =====
  return (
    <>
    <TopNavBar title={ta('التوليد الجماعي', 'Batch Generation' )} />
    <div className="container mx-auto py-6 px-4" dir={dir}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Layers className="h-6 w-6 text-primary" />
            {ta('التوليد الجماعي', 'Batch Generation')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {ta('رفع ملف Excel لتوليد عشرات أو مئات المستندات دفعة واحدة باستخدام محرك القوالب', 'Upload an Excel file to generate dozens or hundreds of documents at once using the template engine')}
          </p>
        </div>
      </div>

      {/* Steps Indicator */}
      <div className="flex items-center justify-center mb-8 overflow-x-auto">
        {STEPS.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <button
              onClick={() => {
                if (step.id < currentStep) setCurrentStep(step.id);
              }}
              disabled={step.id > currentStep}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all text-sm ${
                currentStep === step.id
                  ? 'bg-primary text-white shadow-lg'
                  : currentStep > step.id
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 cursor-pointer hover:bg-green-200'
                  : 'bg-gray-100 text-gray-400 dark:bg-gray-800 cursor-not-allowed'
              }`}
            >
              {currentStep > step.id ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <step.icon className="h-4 w-4" />
              )}
              <span className="font-medium hidden sm:inline">{step.title}</span>
            </button>
            {index < STEPS.length - 1 && (
              <div className={`w-6 md:w-12 h-0.5 mx-1 ${
                currentStep > step.id ? 'bg-green-400' : 'bg-gray-200 dark:bg-gray-700'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* ===== STEP 1: Template Selection ===== */}
      {currentStep === 1 && (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Input
              placeholder={ta('بحث في القوالب...', 'Search templates...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>

          {loadingTemplates ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">{ta('جاري تحميل القوالب من Firestore...', 'Loading templates from Firestore...')}</p>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <Card className="p-12 text-center">
              <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{ta('لا توجد قوالب تفاعلية', 'No interactive templates')}</h3>
              <p className="text-muted-foreground mb-4">
                {ta('يجب أن يقوم المسؤول بإنشاء قوالب تفاعلية مع Canvas و Form أولاً من لوحة الإدارة', 'Admin must create interactive templates with Canvas and Form first from the admin panel')}
              </p>
              <Button variant="outline" onClick={() => router.push('/admin/templates')}>
                {ta('الذهاب لإدارة القوالب', 'Go to Template Management')}
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => (
                <Card
                  key={template.id}
                  className="cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all group"
                  onClick={() => handleTemplateSelect(template)}
                >
                  {/* Template preview thumbnail */}
                  {template.canvas?.background_url && (
                    <div className="h-40 overflow-hidden rounded-t-lg bg-gray-50">
                      <img
                        src={template.canvas.background_url}
                        alt={template.name_ar}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                      />
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{template.name_ar}</CardTitle>
                        {template.category && (
                          <CardDescription>{template.category}</CardDescription>
                        )}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {template.form?.fields.length || 0} {ta('حقل', 'fields')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-1">
                      {template.form?.fields.slice(0, 4).map((field) => (
                        <Badge key={field.id} variant="outline" className="text-xs">
                          {field.label_ar}
                        </Badge>
                      ))}
                      {(template.form?.fields.length || 0) > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{(template.form?.fields.length || 0) - 4}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {template.canvas?.elements.length || 0} {ta('عنصر على الكانفاس', 'canvas elements')}
                      <span className="mx-1">|</span>
                      {template.canvas?.canvas_width}x{template.canvas?.canvas_height}px
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== STEP 2: File Upload ===== */}
      {currentStep === 2 && selectedTemplate && (
        <div className="space-y-4 max-w-3xl mx-auto">
          {/* Template info bar */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold text-sm">{selectedTemplate.name_ar}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedTemplate.form?.fields.length} {ta('حقل مطلوب', 'required fields')}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setCurrentStep(1)}>
                <ArrowRight className="h-4 w-4 ms-1" />
                {ta('تغيير القالب', 'Change Template')}
              </Button>
            </CardContent>
          </Card>

          {/* Download sample */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Download className="h-4 w-4" />
                {ta('تحميل ملف نموذجي', 'Download Sample File')}
              </CardTitle>
              <CardDescription>
                {ta('حمّل ملف نموذجي يحتوي على أسماء الأعمدة المطلوبة، ثم املأه ببياناتك', 'Download a sample file with required column names, then fill it with your data')}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-3">
              <Button variant="outline" size="sm" onClick={() => handleDownloadSample('xlsx')}>
                <FileSpreadsheet className="h-4 w-4 ms-2" />
                {ta('تحميل Excel', 'Download Excel')}
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleDownloadSample('csv')}>
                <FileText className="h-4 w-4 ms-2" />
                {ta('تحميل CSV', 'Download CSV')}
              </Button>
            </CardContent>
          </Card>

          {/* Upload zone */}
          <Card
            className="border-2 border-dashed hover:border-primary/50 transition-colors"
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDrop={handleDrop}
          >
            <CardContent className="py-12 text-center">
              {parsing ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="text-muted-foreground">{ta('جاري تحليل الملف...', 'Analyzing file...')}</p>
                </div>
              ) : (
                <>
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{ta('اسحب الملف هنا أو اضغط للرفع', 'Drag file here or click to upload')}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {ta('يدعم ملفات Excel (.xlsx) و CSV', 'Supports Excel (.xlsx) and CSV files')}
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-4 w-4 ms-2" />
                    {ta('اختيار ملف', 'Choose File')}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Required fields info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{ta('الحقول المطلوبة في القالب', 'Required Fields in Template')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {selectedTemplate.form?.fields.map(field => (
                  <Badge
                    key={field.id}
                    variant={field.validation.required ? 'default' : 'outline'}
                    className="text-xs"
                  >
                    {field.label_ar}
                    {field.validation.required && <span className="text-red-300 me-1">*</span>}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ===== STEP 3: Column Mapping ===== */}
      {currentStep === 3 && selectedTemplate && parsedData && (
        <div className="space-y-4">
          {/* Info bar */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-sm py-1 px-3">
                <FileSpreadsheet className="h-4 w-4 ms-2" />
                {uploadedFileName}
              </Badge>
              <Badge variant="secondary" className="text-sm py-1 px-3">
                <Users className="h-4 w-4 ms-2" />
                {parsedData.totalRows} {ta('سجل', 'records')}
              </Badge>
              <Badge
                variant={mappedFieldsCount === totalFields ? 'default' : 'outline'}
                className="text-sm py-1 px-3"
              >
                <Link2 className="h-4 w-4 ms-2" />
                {mappedFieldsCount}/{totalFields} {ta('حقل مربوط', 'fields mapped')}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentStep(2)}>
                <ArrowRight className="h-4 w-4 ms-1" />
                {ta('تغيير الملف', 'Change File')}
              </Button>
              <Button
                size="sm"
                onClick={() => setCurrentStep(4)}
                disabled={mappedFieldsCount === 0}
              >
                {ta('متابعة للمعاينة', 'Continue to Preview')}
                <ArrowLeft className="h-4 w-4 me-1" />
              </Button>
            </div>
          </div>

          {/* Mapping table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                {ta('ربط الأعمدة بحقول القالب', 'Map Columns to Template Fields')}
              </CardTitle>
              <CardDescription>
                {ta('اربط كل عمود من ملف Excel بالحقل المقابل في القالب. تم الربط التلقائي للأعمدة المتطابقة.', 'Map each Excel column to the corresponding template field. Matching columns were automatically mapped.')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/3">{ta('حقل القالب', 'Template Field')}</TableHead>
                    <TableHead className="w-1/3">{ta('عمود Excel', 'Excel Column')}</TableHead>
                    <TableHead className="w-1/3">{ta('معاينة (أول سجل)', 'Preview (First Record)')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedTemplate.form?.fields.map(field => {
                    const mapping = mappings.find(m => m.templateField === field.id);
                    const excelCol = mapping?.excelColumn || '';
                    const sampleValue = excelCol && parsedData.rows[0]
                      ? parsedData.rows[0][excelCol] || ''
                      : '';

                    return (
                      <TableRow key={field.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{field.label_ar}</span>
                            {field.validation.required && (
                              <span className="text-red-500 text-xs">{ta('مطلوب', 'Required')}</span>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {field.type}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={excelCol}
                            onValueChange={(val) => updateMapping(field.id, val)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder={ta('اختر عمود...', 'Select column...')} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">{ta('-- بدون ربط --', '-- No binding --')}</SelectItem>
                              {parsedData.headers.map(header => (
                                <SelectItem key={header} value={header}>
                                  {header}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground truncate block max-w-[200px]">
                            {sampleValue || '—'}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Data preview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <TableIcon className="h-5 w-5" />
                  {ta('معاينة البيانات (أول 5 سجلات)', 'Data Preview (First 5 Records)')}
                </CardTitle>
                <Badge variant="outline">{parsedData.totalRows} {ta('سجل إجمالي', 'total records')}</Badge>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    {parsedData.headers.slice(0, 8).map(h => (
                      <TableHead key={h} className="text-xs">{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.rows.slice(0, 5).map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                      {parsedData.headers.slice(0, 8).map(h => (
                        <TableCell key={h} className="text-xs truncate max-w-[150px]">
                          {String(row[h] || '')}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ===== STEP 4: Preview & Generate ===== */}
      {currentStep === 4 && selectedTemplate && parsedData && (
        <div className="space-y-4">
          {/* Controls bar */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => setCurrentStep(3)}>
                <ArrowRight className="h-4 w-4 ms-1" />
                {ta('تعديل الربط', 'Edit Mapping')}
              </Button>
              <Badge variant="secondary" className="text-sm py-1 px-3">
                <Users className="h-4 w-4 ms-2" />
                {parsedData.totalRows} {ta('مستند سيتم توليده', 'documents to generate')}
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <Select
                value={exportFormat}
                onValueChange={(val) => setExportFormat(val as ExportFormat)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4" /> {ta('PDF متعدد الصفحات', 'Multi-page PDF')}
                    </span>
                  </SelectItem>
                  <SelectItem value="zip_png">
                    <span className="flex items-center gap-2">
                      <Archive className="h-4 w-4" /> {ta('ZIP (صور PNG)', 'ZIP (PNG Images)')}
                    </span>
                  </SelectItem>
                  <SelectItem value="zip_jpeg">
                    <span className="flex items-center gap-2">
                      <FileImage className="h-4 w-4" /> {ta('ZIP (صور JPEG)', 'ZIP (JPEG Images)')}
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={handleBulkGenerate}
                disabled={generating}
                className="gap-2"
                size="lg"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {ta(`جاري التوليد... (${progress.current}/${progress.total})`, `Generating... (${progress.current}/${progress.total})`)}
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    {ta('بدء التوليد الجماعي', 'Start Batch Generation')}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Progress bar */}
          {generating && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="py-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    {ta(`جاري توليد المستند ${progress.current} من ${progress.total}...`, `Generating document ${progress.current} of ${progress.total}...`)}
                  </span>
                  <span className="text-sm font-bold text-primary">
                    {progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700">
                  <div
                    className="bg-primary h-3 rounded-full transition-all duration-300"
                    style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Live Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Preview canvas */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    {ta('معاينة حية', 'Live Preview')}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewIndex(Math.max(0, previewIndex - 1))}
                      disabled={previewIndex === 0}
                    >
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                    <span className="text-sm font-medium min-w-[60px] text-center">
                      {previewIndex + 1} / {parsedData.totalRows}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewIndex(Math.min(parsedData.totalRows - 1, previewIndex + 1))}
                      disabled={previewIndex >= parsedData.totalRows - 1}
                    >
                      <ArrowLeft className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div
                  ref={previewRef}
                  className="relative bg-gray-50 rounded-lg overflow-hidden border"
                  style={{
                    aspectRatio: selectedTemplate.canvas
                      ? `${selectedTemplate.canvas.canvas_width} / ${selectedTemplate.canvas.canvas_height}`
                      : '1 / 1.414',
                  }}
                >
                  {/* Background */}
                  {selectedTemplate.canvas?.background_url && (
                    <img
                      src={selectedTemplate.canvas.background_url}
                      alt="خلفية القالب"
                      className="w-full h-full object-contain"
                      crossOrigin="anonymous"
                    />
                  )}

                  {/* Overlay text elements */}
                  {selectedTemplate.canvas?.elements.map(element => {
                    const value = previewData[element.field_id] || '';
                    if (!value || !element.is_visible) return null;

                    return (
                      <div
                        key={element.id}
                        className="absolute"
                        style={{
                          left: `${element.x}%`,
                          top: `${element.y}%`,
                          width: `${element.width}%`,
                          fontSize: `${element.font_size * 0.5}px`, // Scale down for preview
                          fontFamily: element.font_family || '"Cairo", sans-serif',
                          fontWeight: element.font_weight || 'normal',
                          color: element.color || '#000000',
                          textAlign: element.text_align || 'center',
                          direction: 'rtl',
                          whiteSpace: 'pre-wrap',
                          lineHeight: '1.4',
                          transform: element.rotation ? `rotate(${element.rotation}deg)` : 'none',
                        }}
                      >
                        {value}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Record data */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <TableIcon className="h-4 w-4" />
                  {ta(`بيانات السجل #${previewIndex + 1}`, `Record #${previewIndex + 1} Data`)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedTemplate.form?.fields.map(field => {
                    const value = previewData[field.id] || '';
                    const mapping = mappings.find(m => m.templateField === field.id);
                    const isMapped = !!mapping?.excelColumn;

                    return (
                      <div key={field.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                        <div className="flex-1">
                          <Label className="text-xs text-muted-foreground">{field.label_ar}</Label>
                          <p className={`text-sm font-medium ${value ? '' : 'text-muted-foreground italic'}`}>
                            {value || (isMapped ? ta('فارغ', 'Empty') : ta('غير مربوط', 'Not mapped'))}
                          </p>
                        </div>
                        {isMapped ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-300 flex-shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
