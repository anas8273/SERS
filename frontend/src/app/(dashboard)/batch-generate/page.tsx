'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
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
  Pause,
  RotateCcw,
  Settings,
  ChevronDown,
  ChevronUp,
  Users,
  FileDown,
  Zap,
  Clock,
  BarChart3,
  Table as TableIcon,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface TemplateOption {
  id: number;
  name_ar: string;
  slug: string;
  type: string;
  category: {
    name_ar: string;
  };
  fields: {
    name: string;
    label_ar: string;
    type: string;
    is_required: boolean;
  }[];
}

interface BatchRecord {
  id: number;
  data: Record<string, string>;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error_message?: string;
  output_url?: string;
}

interface BatchJob {
  id: string;
  template_id: number;
  template_name: string;
  total_records: number;
  completed_records: number;
  failed_records: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  download_url?: string;
}

export default function BatchGeneratePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step state
  const [currentStep, setCurrentStep] = useState(1);
  
  // Step 1: Template selection
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateOption | null>(null);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Step 2: Data input
  const [inputMethod, setInputMethod] = useState<'manual' | 'csv' | 'excel'>('manual');
  const [records, setRecords] = useState<BatchRecord[]>([]);
  const [csvContent, setCsvContent] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Step 3: Preview & Generate
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [batchJobId, setBatchJobId] = useState<string | null>(null);

  // History
  const [batchJobs, setBatchJobs] = useState<BatchJob[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Settings
  const [outputFormat, setOutputFormat] = useState<'pdf' | 'image'>('pdf');
  const [showSettings, setShowSettings] = useState(false);
  const [useAI, setUseAI] = useState(false);
  const [variantId, setVariantId] = useState<number | null>(null);

  useEffect(() => {
    fetchTemplates();
    fetchBatchHistory();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const response = await api.getTemplates({ type: 'interactive' });
      setTemplates(response.data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const fetchBatchHistory = async () => {
    try {
      setLoadingHistory(true);
      const response = await api.getBatchJobs();
      setBatchJobs(response.data || []);
    } catch (error) {
      console.error('Error fetching batch history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleTemplateSelect = (template: TemplateOption) => {
    setSelectedTemplate(template);
    // Initialize empty records with template fields
    const emptyRecord: Record<string, string> = {};
    template.fields.forEach(f => {
      emptyRecord[f.name] = '';
    });
    setRecords([{ id: 1, data: emptyRecord, status: 'pending' }]);
    setCurrentStep(2);
  };

  const handleAddRecord = () => {
    if (!selectedTemplate) return;
    const emptyRecord: Record<string, string> = {};
    selectedTemplate.fields.forEach(f => {
      emptyRecord[f.name] = '';
    });
    setRecords(prev => [...prev, {
      id: (prev[prev.length - 1]?.id || 0) + 1,
      data: emptyRecord,
      status: 'pending'
    }]);
  };

  const handleRemoveRecord = (id: number) => {
    setRecords(prev => prev.filter(r => r.id !== id));
  };

  const handleRecordChange = (id: number, fieldName: string, value: string) => {
    setRecords(prev => prev.map(r => 
      r.id === id ? { ...r, data: { ...r.data, [fieldName]: value } } : r
    ));
  };

  const handleCSVParse = () => {
    if (!selectedTemplate || !csvContent.trim()) return;

    try {
      const lines = csvContent.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      const newRecords: BatchRecord[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const data: Record<string, string> = {};
        
        selectedTemplate.fields.forEach((field, index) => {
          const headerIndex = headers.findIndex(h => 
            h === field.name || h === field.label_ar
          );
          data[field.name] = headerIndex >= 0 ? values[headerIndex] || '' : values[index] || '';
        });

        newRecords.push({
          id: i,
          data,
          status: 'pending'
        });
      }

      setRecords(newRecords);
      toast.success(`تم استيراد ${newRecords.length} سجل بنجاح`);
    } catch (error) {
      toast.error('خطأ في تحليل البيانات. تأكد من صحة التنسيق');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);

    if (file.name.endsWith('.csv')) {
      const text = await file.text();
      setCsvContent(text);
      setInputMethod('csv');
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('template_id', selectedTemplate?.id?.toString() || '');
        
        const response = await api.parseExcelForBatch(formData);
        if (response.success && response.data.records) {
          setRecords(response.data.records.map((data: Record<string, string>, i: number) => ({
            id: i + 1,
            data,
            status: 'pending' as const
          })));
          toast.success(`تم استيراد ${response.data.records.length} سجل من ملف Excel`);
        }
      } catch (error) {
        toast.error('خطأ في قراءة ملف Excel');
      }
    }
  };

  const handleAIFillRecords = async () => {
    if (!selectedTemplate) return;
    
    try {
      setGenerating(true);
      const response = await api.aiFillBatchRecords({
        template_id: selectedTemplate.id,
        records: records.map(r => r.data),
      });
      
      if (response.success && response.data.records) {
        setRecords(prev => prev.map((r, i) => ({
          ...r,
          data: response.data.records[i] || r.data
        })));
        toast.success('تم تعبئة البيانات بالذكاء الاصطناعي');
      }
    } catch (error) {
      toast.error('خطأ في التعبئة التلقائية');
    } finally {
      setGenerating(false);
    }
  };

  const handleStartBatch = async () => {
    if (!selectedTemplate || records.length === 0) return;

    try {
      setGenerating(true);
      setProgress(0);
      setCurrentStep(3);

      const response = await api.startBatchGeneration({
        template_id: selectedTemplate.id,
        variant_id: variantId,
        output_format: outputFormat,
        records: records.map(r => r.data),
        use_ai: useAI,
      });

      if (response.success) {
        setBatchJobId(response.data.job_id);
        
        // Poll for progress
        const pollInterval = setInterval(async () => {
          try {
            const statusResponse = await api.getBatchJobStatus(response.data.job_id);
            if (statusResponse.success) {
              const job = statusResponse.data;
              const newProgress = Math.round((job.completed_records / job.total_records) * 100);
              setProgress(newProgress);

              // Update individual record statuses
              if (job.record_statuses) {
                setRecords(prev => prev.map((r, i) => ({
                  ...r,
                  status: job.record_statuses[i]?.status || r.status,
                  error_message: job.record_statuses[i]?.error_message,
                  output_url: job.record_statuses[i]?.output_url,
                })));
              }

              if (job.status === 'completed' || job.status === 'failed') {
                clearInterval(pollInterval);
                setGenerating(false);
                if (job.status === 'completed') {
                  toast.success('تم التوليد الجماعي بنجاح!');
                } else {
                  toast.error('حدث خطأ في بعض السجلات');
                }
                fetchBatchHistory();
              }
            }
          } catch (err) {
            console.error('Poll error:', err);
          }
        }, 2000);
      }
    } catch (error) {
      console.error('Batch generation error:', error);
      toast.error('خطأ في بدء التوليد الجماعي');
      setGenerating(false);
    }
  };

  const handleDownloadAll = async () => {
    if (!batchJobId) return;
    try {
      const response = await api.downloadBatchResults(batchJobId);
      if (response.data?.download_url) {
        window.open(response.data.download_url, '_blank');
      }
    } catch (error) {
      toast.error('خطأ في تحميل النتائج');
    }
  };

  const handleDownloadSampleCSV = () => {
    if (!selectedTemplate) return;
    const headers = selectedTemplate.fields.map(f => f.label_ar).join(',');
    const sampleRow = selectedTemplate.fields.map(f => `مثال_${f.label_ar}`).join(',');
    const csv = `${headers}\n${sampleRow}`;
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedTemplate.name_ar}_template.csv`;
    link.click();
  };

  const filteredTemplates = templates.filter(t =>
    t.name_ar.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.category?.name_ar?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const completedRecords = records.filter(r => r.status === 'completed').length;
  const failedRecords = records.filter(r => r.status === 'error').length;

  const steps = [
    { id: 1, title: 'اختيار القالب', icon: Layers },
    { id: 2, title: 'إدخال البيانات', icon: TableIcon },
    { id: 3, title: 'التوليد والتحميل', icon: Zap },
  ];

  return (
    <div className="container mx-auto py-6 px-4" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Layers className="h-6 w-6 text-primary" />
            التوليد الجماعي
          </h1>
          <p className="text-muted-foreground mt-1">
            توليد عدة مستندات دفعة واحدة من قالب واحد
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowHistory(!showHistory)}
            className="gap-2"
          >
            <Clock className="h-4 w-4" />
            السجل ({batchJobs.length})
          </Button>
        </div>
      </div>

      {/* Steps Indicator */}
      <div className="flex items-center justify-center mb-8">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                currentStep === step.id
                  ? 'bg-primary text-white shadow-lg'
                  : currentStep > step.id
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-gray-100 text-gray-500 dark:bg-gray-800'
              }`}
            >
              {currentStep > step.id ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <step.icon className="h-5 w-5" />
              )}
              <span className="font-medium text-sm hidden sm:inline">{step.title}</span>
              <span className="font-medium text-sm sm:hidden">{step.id}</span>
            </div>
            {index < steps.length - 1 && (
              <div className={`w-8 md:w-16 h-0.5 mx-1 ${
                currentStep > step.id ? 'bg-green-400' : 'bg-gray-200 dark:bg-gray-700'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Template Selection */}
      {currentStep === 1 && (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Input
              placeholder="بحث في القوالب..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>

          {loadingTemplates ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => (
                <Card
                  key={template.id}
                  className="cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all"
                  onClick={() => handleTemplateSelect(template)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{template.name_ar}</CardTitle>
                        <CardDescription>{template.category?.name_ar}</CardDescription>
                      </div>
                      <Badge variant="secondary">{template.fields?.length || 0} حقل</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {template.fields?.slice(0, 4).map((field) => (
                        <Badge key={field.name} variant="outline" className="text-xs">
                          {field.label_ar}
                        </Badge>
                      ))}
                      {(template.fields?.length || 0) > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{(template.fields?.length || 0) - 4}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Data Input */}
      {currentStep === 2 && selectedTemplate && (
        <div className="space-y-4">
          {/* Template Info */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{selectedTemplate.name_ar}</CardTitle>
                  <CardDescription>
                    {selectedTemplate.fields.length} حقل | {records.length} سجل
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => setCurrentStep(1)}>
                  <ArrowRight className="h-4 w-4 ml-1" />
                  تغيير القالب
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Input Method */}
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { id: 'manual' as const, label: 'إدخال يدوي', icon: TableIcon },
              { id: 'csv' as const, label: 'CSV', icon: FileText },
              { id: 'excel' as const, label: 'Excel', icon: FileSpreadsheet },
            ].map(method => (
              <Button
                key={method.id}
                variant={inputMethod === method.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setInputMethod(method.id)}
                className="gap-2"
              >
                <method.icon className="h-4 w-4" />
                {method.label}
              </Button>
            ))}

            <div className="flex-1" />

            <Button variant="outline" size="sm" onClick={handleDownloadSampleCSV} className="gap-2">
              <Download className="h-4 w-4" />
              تحميل نموذج CSV
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleAIFillRecords}
              disabled={generating}
              className="gap-2 text-purple-600 border-purple-200 hover:bg-purple-50"
            >
              <Sparkles className="h-4 w-4" />
              تعبئة ذكية
            </Button>
          </div>

          {/* CSV/Excel Input */}
          {inputMethod === 'csv' && (
            <Card>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <Textarea
                    placeholder={`الصق بيانات CSV هنا...\n${selectedTemplate.fields.map(f => f.label_ar).join(',')}\nقيمة1,قيمة2,...`}
                    value={csvContent}
                    onChange={(e) => setCsvContent(e.target.value)}
                    className="min-h-[200px] font-mono text-sm"
                  />
                  <div className="flex items-center gap-2">
                    <Button onClick={handleCSVParse} className="gap-2">
                      <Play className="h-4 w-4" />
                      تحليل البيانات
                    </Button>
                    <span className="text-sm text-muted-foreground">أو</span>
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2">
                      <Upload className="h-4 w-4" />
                      رفع ملف
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {inputMethod === 'excel' && (
            <Card>
              <CardContent className="pt-4">
                <div
                  className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileSpreadsheet className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {uploadedFile ? uploadedFile.name : 'اسحب ملف Excel أو انقر للرفع'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    يدعم ملفات .xlsx و .xls
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Manual Data Table */}
          {(inputMethod === 'manual' || records.length > 0) && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    البيانات ({records.length} سجل)
                  </CardTitle>
                  <Button size="sm" onClick={handleAddRecord} className="gap-1">
                    + إضافة سجل
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        {selectedTemplate.fields.map(field => (
                          <TableHead key={field.name} className="min-w-[150px]">
                            {field.label_ar}
                            {field.is_required && <span className="text-red-500 mr-1">*</span>}
                          </TableHead>
                        ))}
                        <TableHead className="w-16">إجراء</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {records.map((record, index) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-mono text-sm">{index + 1}</TableCell>
                          {selectedTemplate.fields.map(field => (
                            <TableCell key={field.name}>
                              <Input
                                value={record.data[field.name] || ''}
                                onChange={(e) => handleRecordChange(record.id, field.name, e.target.value)}
                                placeholder={field.label_ar}
                                className="min-w-[130px]"
                              />
                            </TableCell>
                          ))}
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => handleRemoveRecord(record.id)}
                              disabled={records.length <= 1}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Settings */}
          <Card>
            <CardHeader className="pb-3 cursor-pointer" onClick={() => setShowSettings(!showSettings)}>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  إعدادات التوليد
                </CardTitle>
                {showSettings ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </CardHeader>
            {showSettings && (
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>صيغة الإخراج</Label>
                    <Select value={outputFormat} onValueChange={(v: 'pdf' | 'image') => setOutputFormat(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="image">صورة PNG</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>استخدام الذكاء الاصطناعي</Label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setUseAI(!useAI)}
                        className={`relative w-11 h-6 rounded-full transition-colors ${
                          useAI ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                      >
                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                          useAI ? 'right-0.5' : 'right-[22px]'
                        }`} />
                      </button>
                      <span className="text-sm text-muted-foreground">
                        {useAI ? 'مفعل' : 'معطل'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setCurrentStep(1)} className="gap-2">
              <ArrowRight className="h-4 w-4" />
              السابق
            </Button>
            <Button
              onClick={handleStartBatch}
              disabled={records.length === 0 || generating}
              className="gap-2"
              size="lg"
            >
              {generating ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Zap className="h-5 w-5" />
              )}
              بدء التوليد ({records.length} مستند)
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Progress & Results */}
      {currentStep === 3 && (
        <div className="space-y-6">
          {/* Progress Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {generating ? (
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                ) : progress === 100 ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                )}
                {generating ? 'جاري التوليد...' : progress === 100 ? 'اكتمل التوليد' : 'نتائج التوليد'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{progress}%</span>
                  <span className="text-sm text-muted-foreground">
                    {completedRecords}/{records.length} مستند
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                  <CheckCircle2 className="h-6 w-6 text-green-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-green-600">{completedRecords}</p>
                  <p className="text-xs text-muted-foreground">مكتمل</p>
                </div>
                <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                  <XCircle className="h-6 w-6 text-red-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-red-600">{failedRecords}</p>
                  <p className="text-xs text-muted-foreground">فشل</p>
                </div>
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <Clock className="h-6 w-6 text-blue-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-blue-600">
                    {records.length - completedRecords - failedRecords}
                  </p>
                  <p className="text-xs text-muted-foreground">قيد الانتظار</p>
                </div>
              </div>

              {/* Records Status */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>البيانات</TableHead>
                    <TableHead className="w-24">الحالة</TableHead>
                    <TableHead className="w-24">إجراء</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record, index) => (
                    <TableRow key={record.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(record.data).slice(0, 3).map(([key, value]) => (
                            <Badge key={key} variant="outline" className="text-xs">
                              {value || '-'}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {record.status === 'completed' && (
                          <Badge className="bg-green-500">مكتمل</Badge>
                        )}
                        {record.status === 'processing' && (
                          <Badge className="bg-blue-500">
                            <Loader2 className="h-3 w-3 animate-spin ml-1" />
                            جاري
                          </Badge>
                        )}
                        {record.status === 'error' && (
                          <Badge variant="destructive">فشل</Badge>
                        )}
                        {record.status === 'pending' && (
                          <Badge variant="secondary">انتظار</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {record.output_url && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => window.open(record.output_url, '_blank')}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setCurrentStep(2);
                setRecords(prev => prev.map(r => ({ ...r, status: 'pending' as const })));
                setProgress(0);
              }}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              إعادة التوليد
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentStep(1);
                  setSelectedTemplate(null);
                  setRecords([]);
                  setProgress(0);
                }}
                className="gap-2"
              >
                توليد جديد
              </Button>
              {!generating && completedRecords > 0 && (
                <Button onClick={handleDownloadAll} className="gap-2" size="lg">
                  <FileDown className="h-5 w-5" />
                  تحميل الكل ({completedRecords} ملف)
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Batch History Sidebar */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowHistory(false)} />
          <div className="relative mr-auto w-96 bg-white dark:bg-gray-900 h-full shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b p-4 flex items-center justify-between">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                سجل التوليد الجماعي
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setShowHistory(false)}>
                <XCircle className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-4 space-y-3">
              {batchJobs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Layers className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>لا توجد عمليات سابقة</p>
                </div>
              ) : (
                batchJobs.map((job) => (
                  <Card key={job.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{job.template_name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {new Date(job.created_at).toLocaleDateString('ar-SA')}
                          </p>
                        </div>
                        <Badge className={
                          job.status === 'completed' ? 'bg-green-500' :
                          job.status === 'failed' ? 'bg-red-500' :
                          job.status === 'processing' ? 'bg-blue-500' : ''
                        }>
                          {job.status === 'completed' ? 'مكتمل' :
                           job.status === 'failed' ? 'فشل' :
                           job.status === 'processing' ? 'جاري' : 'انتظار'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {job.completed_records}/{job.total_records} مستند
                        </span>
                        {job.download_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(job.download_url, '_blank')}
                            className="gap-1"
                          >
                            <Download className="h-3 w-3" />
                            تحميل
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
