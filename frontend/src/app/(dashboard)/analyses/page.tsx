'use client';

import { useState, useCallback, useMemo, useRef } from 'react';
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
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import {
  BarChart3, FileDown, Trash2, Sparkles, TrendingUp,
  TrendingDown, Users, Calculator, FileSpreadsheet, Loader2, Upload,
  PieChart as PieChartIcon, Award, AlertTriangle, Download, RefreshCw,
  Brain, Target, CheckCircle2, XCircle, Printer, ArrowUpDown,
  ChevronDown, ChevronUp, Eye, FileText, Table as TableIcon,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, RadialBarChart, RadialBar,
  LineChart, Line,
} from 'recharts';
import { parseFile, analyzeColumns, calculateColumnStats, exportToExcel, type ParsedData, type ColumnInfo } from '@/lib/excel-parser';
import { TopNavBar } from '@/components/layout/TopNavBar';

// ===== Constants =====
const CLASSIFICATION_COLORS = {
  excellent: '#10b981',
  very_good: '#3b82f6',
  good: '#f59e0b',
  pass: '#f97316',
  fail: '#ef4444',
};

const CLASSIFICATION_LABELS: Record<string, string> = {
  excellent: 'متفوق (90-100)',
  very_good: 'جيد جداً (80-89)',
  good: 'جيد (70-79)',
  pass: 'مقبول (60-69)',
  fail: 'متعثر (أقل من 60)',
};

// ===== Types =====
interface StudentRecord {
  name: string;
  grades: Record<string, number>;
  average: number;
  classification: string;
}

interface SubjectStats {
  name: string;
  average: number;
  highest: number;
  lowest: number;
  passRate: number;
  passCount: number;
  failCount: number;
  stdDev: number;
  excellentCount: number;
  veryGoodCount: number;
  goodCount: number;
  passOnlyCount: number;
}

// ===== Helper Functions =====
function classifyGrade(grade: number): string {
  if (grade >= 90) return 'excellent';
  if (grade >= 80) return 'very_good';
  if (grade >= 70) return 'good';
  if (grade >= 60) return 'pass';
  return 'fail';
}

function getClassificationColor(c: string): string {
  return CLASSIFICATION_COLORS[c as keyof typeof CLASSIFICATION_COLORS] || '#6b7280';
}

// ===== Main Component =====
export default function AnalysesPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Data state
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [columnInfos, setColumnInfos] = useState<ColumnInfo[]>([]);
  const [nameColumn, setNameColumn] = useState('');
  const [gradeColumns, setGradeColumns] = useState<string[]>([]);
  const [parsing, setParsing] = useState(false);
  const [dataReady, setDataReady] = useState(false);

  // AI Analysis
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // View
  const [activeTab, setActiveTab] = useState<'overview' | 'subjects' | 'students' | 'ai'>('overview');
  const [sortBy, setSortBy] = useState<'name' | 'average'>('average');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [showUpload, setShowUpload] = useState(true);

  // ===== File Upload =====
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await processFile(file);
  }, []);

  const processFile = async (file: File) => {
    try {
      setParsing(true);
      const data = await parseFile(file);
      const infos = analyzeColumns(data);

      setParsedData(data);
      setColumnInfos(infos);

      // Auto-detect name column
      const nameCol = infos.find(c =>
        c.name.includes('اسم') || c.name.includes('الاسم') || c.name.includes('الطالب') ||
        c.name.toLowerCase().includes('name') || c.name.toLowerCase().includes('student')
      );
      if (nameCol) setNameColumn(nameCol.name);

      // Auto-detect grade columns (numeric columns)
      const numericCols = infos.filter(c => c.isNumeric && c.name !== nameCol?.name);
      setGradeColumns(numericCols.map(c => c.name));

      toast.success(`تم تحميل ${data.totalRows} سجل من "${file.name}"`);

      if (nameCol && numericCols.length > 0) {
        setDataReady(true);
        setShowUpload(false);
      }
    } catch (error: any) {
      toast.error(error.message || 'خطأ في قراءة الملف');
    } finally {
      setParsing(false);
    }
  };

  // ===== Process students data =====
  const students: StudentRecord[] = useMemo(() => {
    if (!parsedData || !nameColumn || gradeColumns.length === 0) return [];

    return parsedData.rows.map(row => {
      const grades: Record<string, number> = {};
      let total = 0;
      let count = 0;

      gradeColumns.forEach(col => {
        const val = parseFloat(String(row[col]));
        if (!isNaN(val)) {
          grades[col] = Math.min(100, Math.max(0, val));
          total += grades[col];
          count++;
        }
      });

      const average = count > 0 ? Math.round((total / count) * 100) / 100 : 0;

      return {
        name: String(row[nameColumn] || 'بدون اسم'),
        grades,
        average,
        classification: classifyGrade(average),
      };
    });
  }, [parsedData, nameColumn, gradeColumns]);

  // ===== Subject statistics =====
  const subjectStats: SubjectStats[] = useMemo(() => {
    if (students.length === 0) return [];

    return gradeColumns.map(col => {
      const grades = students
        .map(s => s.grades[col])
        .filter(g => g !== undefined && !isNaN(g));

      if (grades.length === 0) {
        return {
          name: col, average: 0, highest: 0, lowest: 0,
          passRate: 0, passCount: 0, failCount: 0, stdDev: 0,
          excellentCount: 0, veryGoodCount: 0, goodCount: 0, passOnlyCount: 0,
        };
      }

      const stats = calculateColumnStats(grades);
      return {
        name: col,
        average: stats.average,
        highest: stats.max,
        lowest: stats.min,
        passRate: stats.passRate,
        passCount: stats.passCount,
        failCount: stats.failCount,
        stdDev: stats.stdDev,
        excellentCount: grades.filter(g => g >= 90).length,
        veryGoodCount: grades.filter(g => g >= 80 && g < 90).length,
        goodCount: grades.filter(g => g >= 70 && g < 80).length,
        passOnlyCount: grades.filter(g => g >= 60 && g < 70).length,
      };
    });
  }, [students, gradeColumns]);

  // ===== Overall statistics =====
  const overallStats = useMemo(() => {
    if (students.length === 0) return null;

    const averages = students.map(s => s.average);
    const stats = calculateColumnStats(averages);
    const classifications = students.reduce((acc, s) => {
      acc[s.classification] = (acc[s.classification] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { ...stats, classifications };
  }, [students]);

  // ===== Chart data =====
  const pieChartData = useMemo(() => {
    if (!overallStats) return [];
    return Object.entries(overallStats.classifications).map(([key, value]) => ({
      name: CLASSIFICATION_LABELS[key] || key,
      value: value as number,
      color: getClassificationColor(key),
    }));
  }, [overallStats]);

  const barChartData = useMemo(() => {
    return subjectStats.map(s => ({
      name: s.name,
      المتوسط: s.average,
      'أعلى درجة': s.highest,
      'أقل درجة': s.lowest,
    }));
  }, [subjectStats]);

  const passFailData = useMemo(() => {
    return subjectStats.map(s => ({
      name: s.name,
      ناجح: s.passCount,
      راسب: s.failCount,
    }));
  }, [subjectStats]);

  const classificationBySubject = useMemo(() => {
    return subjectStats.map(s => ({
      name: s.name,
      متفوق: s.excellentCount,
      'جيد جداً': s.veryGoodCount,
      جيد: s.goodCount,
      مقبول: s.passOnlyCount,
      متعثر: s.failCount,
    }));
  }, [subjectStats]);

  // ===== Sorted students =====
  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => {
      const aVal = sortBy === 'name' ? a.name : a.average;
      const bVal = sortBy === 'name' ? b.name : b.average;
      if (typeof aVal === 'string') {
        return sortDir === 'asc'
          ? aVal.localeCompare(bVal as string, 'ar')
          : (bVal as string).localeCompare(aVal, 'ar');
      }
      return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
  }, [students, sortBy, sortDir]);

  // ===== AI Analysis =====
  const handleAIAnalysis = async () => {
    if (students.length === 0) return;

    try {
      setAiLoading(true);
      setActiveTab('ai');

      // Prepare anonymized summary data for AI
      const summaryData = {
        totalStudents: students.length,
        subjects: subjectStats.map(s => ({
          name: s.name,
          average: s.average,
          passRate: s.passRate,
          highest: s.highest,
          lowest: s.lowest,
          stdDev: s.stdDev,
        })),
        overallAverage: overallStats?.average,
        overallPassRate: overallStats?.passRate,
        classifications: overallStats?.classifications,
      };

      // Call AI API
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'grade_analysis',
          data: summaryData,
          language: 'ar',
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setAiAnalysis(result.analysis || result.data?.analysis || '');
      } else {
        // Fallback: Generate local analysis
        setAiAnalysis(generateLocalAnalysis(summaryData));
      }

      toast.success('تم إنشاء التحليل بنجاح');
    } catch (error) {
      console.error('AI analysis error:', error);
      // Fallback to local analysis
      const summaryData = {
        totalStudents: students.length,
        subjects: subjectStats.map(s => ({
          name: s.name,
          average: s.average,
          passRate: s.passRate,
          highest: s.highest,
          lowest: s.lowest,
          stdDev: s.stdDev,
        })),
        overallAverage: overallStats?.average,
        overallPassRate: overallStats?.passRate,
        classifications: overallStats?.classifications,
      };
      setAiAnalysis(generateLocalAnalysis(summaryData));
      toast.success('تم إنشاء التحليل المحلي');
    } finally {
      setAiLoading(false);
    }
  };

  // ===== Local Analysis Fallback =====
  const generateLocalAnalysis = (data: any): string => {
    const { totalStudents, subjects, overallAverage, overallPassRate, classifications } = data;

    let analysis = `## تقرير تحليل الأداء الأكاديمي\n\n`;
    analysis += `### ملخص عام\n`;
    analysis += `- **إجمالي الطلاب:** ${totalStudents} طالب/طالبة\n`;
    analysis += `- **المتوسط العام:** ${overallAverage} من 100\n`;
    analysis += `- **نسبة النجاح:** ${overallPassRate}%\n\n`;

    analysis += `### توزيع المستويات\n`;
    if (classifications) {
      Object.entries(classifications).forEach(([key, value]) => {
        analysis += `- ${CLASSIFICATION_LABELS[key] || key}: ${value} طالب (${Math.round(((value as number) / totalStudents) * 100)}%)\n`;
      });
    }

    analysis += `\n### تحليل المواد\n`;
    const bestSubject = subjects.reduce((a: any, b: any) => a.average > b.average ? a : b);
    const worstSubject = subjects.reduce((a: any, b: any) => a.average < b.average ? a : b);

    analysis += `- **أفضل مادة:** ${bestSubject.name} (متوسط ${bestSubject.average})\n`;
    analysis += `- **أضعف مادة:** ${worstSubject.name} (متوسط ${worstSubject.average})\n\n`;

    subjects.forEach((s: any) => {
      analysis += `#### ${s.name}\n`;
      analysis += `المتوسط: ${s.average} | نسبة النجاح: ${s.passRate}% | أعلى: ${s.highest} | أقل: ${s.lowest}\n\n`;
    });

    analysis += `### التوصيات\n`;
    if (overallPassRate < 70) {
      analysis += `- **تحذير:** نسبة النجاح العامة منخفضة (${overallPassRate}%). يُنصح بمراجعة أساليب التدريس.\n`;
    }
    subjects.forEach((s: any) => {
      if (s.passRate < 60) {
        analysis += `- مادة **${s.name}** تحتاج اهتماماً خاصاً (نسبة النجاح ${s.passRate}% فقط).\n`;
      }
      if (s.stdDev > 20) {
        analysis += `- مادة **${s.name}** تظهر تباين كبير بين الطلاب (الانحراف المعياري ${s.stdDev}). يُنصح بتقديم دعم إضافي للطلاب المتعثرين.\n`;
      }
    });

    if (classifications?.fail > totalStudents * 0.2) {
      analysis += `- نسبة الطلاب المتعثرين مرتفعة. يُنصح بإعداد خطط علاجية فورية.\n`;
    }

    return analysis;
  };

  // ===== Export =====
  const handleExportReport = () => {
    if (students.length === 0) return;

    const exportData = students.map(s => ({
      'الاسم': s.name,
      ...s.grades,
      'المتوسط': s.average,
      'التصنيف': CLASSIFICATION_LABELS[s.classification] || s.classification,
    }));

    exportToExcel(exportData, 'تقرير_تحليل_الدرجات');
    toast.success('تم تصدير التقرير');
  };

  // ===== Reset =====
  const handleReset = () => {
    setParsedData(null);
    setColumnInfos([]);
    setNameColumn('');
    setGradeColumns([]);
    setDataReady(false);
    setShowUpload(true);
    setAiAnalysis('');
    setActiveTab('overview');
  };

  // ===== Toggle grade column =====
  const toggleGradeColumn = (col: string) => {
    setGradeColumns(prev =>
      prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
    );
  };

  // ===== RENDER =====
  return (
    <>
      <TopNavBar title="تحليل البيانات والدرجات" />
      <div className="container mx-auto py-6 px-4" dir="rtl">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              تحليل البيانات والدرجات
            </h1>
            <p className="text-muted-foreground mt-1">
              رفع ملف Excel يحتوي على درجات الطلاب للحصول على تحليل شامل ورسوم بيانية تفاعلية
            </p>
          </div>
          {dataReady && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExportReport}>
                <FileDown className="h-4 w-4 ml-2" />
                تصدير Excel
              </Button>
              <Button variant="outline" size="sm" onClick={handleAIAnalysis} disabled={aiLoading}>
                {aiLoading ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <Brain className="h-4 w-4 ml-2" />}
                تحليل AI
              </Button>
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <RefreshCw className="h-4 w-4 ml-2" />
                إعادة
              </Button>
            </div>
          )}
        </div>

        {/* ===== Upload Section ===== */}
        {showUpload && (
          <div className="max-w-3xl mx-auto space-y-4">
            <Card
              className="border-2 border-dashed hover:border-primary/50 transition-colors"
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={handleDrop}
            >
              <CardContent className="py-16 text-center">
                {parsing ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-muted-foreground">جاري تحليل الملف...</p>
                  </div>
                ) : (
                  <>
                    <Upload className="h-14 w-14 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">رفع ملف الدرجات</h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                      اسحب ملف Excel (.xlsx) أو CSV هنا، أو اضغط لاختيار الملف.
                      يجب أن يحتوي الملف على عمود للأسماء وأعمدة رقمية للدرجات.
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button size="lg" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="h-4 w-4 ml-2" />
                      اختيار ملف
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Column configuration (shown after upload) */}
            {parsedData && !dataReady && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">تهيئة الأعمدة</CardTitle>
                  <CardDescription>حدد عمود الأسماء وأعمدة الدرجات</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>عمود الأسماء</Label>
                    <Select value={nameColumn} onValueChange={setNameColumn}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر عمود الأسماء..." />
                      </SelectTrigger>
                      <SelectContent>
                        {parsedData.headers.map(h => (
                          <SelectItem key={h} value={h}>{h}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>أعمدة الدرجات (اضغط لتحديد/إلغاء)</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {columnInfos.map(col => (
                        <Badge
                          key={col.name}
                          variant={gradeColumns.includes(col.name) ? 'default' : 'outline'}
                          className={`cursor-pointer transition-all ${gradeColumns.includes(col.name) ? '' : 'opacity-60'
                            } ${col.isNumeric ? '' : 'border-dashed'}`}
                          onClick={() => toggleGradeColumn(col.name)}
                        >
                          {col.name}
                          {col.isNumeric && <Calculator className="h-3 w-3 mr-1" />}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={() => { setDataReady(true); setShowUpload(false); }}
                    disabled={!nameColumn || gradeColumns.length === 0}
                    className="w-full"
                  >
                    <CheckCircle2 className="h-4 w-4 ml-2" />
                    بدء التحليل ({gradeColumns.length} مادة، {parsedData.totalRows} طالب)
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ===== Dashboard ===== */}
        {dataReady && overallStats && (
          <>
            {/* Tabs */}
            <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
              {[
                { id: 'overview' as const, label: 'نظرة عامة', icon: PieChartIcon },
                { id: 'subjects' as const, label: 'تحليل المواد', icon: BarChart3 },
                { id: 'students' as const, label: 'قائمة الطلاب', icon: Users },
                { id: 'ai' as const, label: 'تحليل AI', icon: Brain },
              ].map(tab => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTab(tab.id)}
                  className="gap-2"
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </Button>
              ))}
            </div>

            {/* ===== Overview Tab ===== */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200">
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-center justify-between">
                        <Users className="h-8 w-8 text-blue-600" />
                        <div className="text-left">
                          <p className="text-2xl font-bold text-blue-700">{overallStats.count}</p>
                          <p className="text-xs text-blue-600">إجمالي الطلاب</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 border-emerald-200">
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-center justify-between">
                        <Target className="h-8 w-8 text-emerald-600" />
                        <div className="text-left">
                          <p className="text-2xl font-bold text-emerald-700">{overallStats.average}</p>
                          <p className="text-xs text-emerald-600">المتوسط العام</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200">
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-center justify-between">
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                        <div className="text-left">
                          <p className="text-2xl font-bold text-green-700">{overallStats.passRate}%</p>
                          <p className="text-xs text-green-600">نسبة النجاح</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200">
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-center justify-between">
                        <AlertTriangle className="h-8 w-8 text-red-600" />
                        <div className="text-left">
                          <p className="text-2xl font-bold text-red-700">{overallStats.failCount}</p>
                          <p className="text-xs text-red-600">طلاب متعثرون</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Pie Chart - Pass/Fail Distribution */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <PieChartIcon className="h-5 w-5" />
                        توزيع المستويات
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={pieChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={3}
                            dataKey="value"
                            label={((props: any) => `${props.name || ''} (${((props.percent || 0) * 100).toFixed(0)}%)`) as any}
                            labelLine={false}
                          >
                            {pieChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={((value: any) => [`${value} طالب`, 'العدد']) as any}
                            contentStyle={{ direction: 'rtl', fontFamily: 'Cairo' }}
                          />
                          <Legend
                            formatter={(value) => <span style={{ fontFamily: 'Cairo', fontSize: '12px' }}>{value}</span>}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Bar Chart - Average per Subject */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        متوسط الدرجات لكل مادة
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={barChartData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" domain={[0, 100]} />
                          <YAxis
                            dataKey="name"
                            type="category"
                            width={100}
                            tick={{ fontFamily: 'Cairo', fontSize: 12 }}
                          />
                          <Tooltip contentStyle={{ direction: 'rtl', fontFamily: 'Cairo' }} />
                          <Legend formatter={(value) => <span style={{ fontFamily: 'Cairo' }}>{value}</span>} />
                          <Bar dataKey="المتوسط" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                          <Bar dataKey="أعلى درجة" fill="#10b981" radius={[0, 4, 4, 0]} />
                          <Bar dataKey="أقل درجة" fill="#ef4444" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Pass/Fail per Subject */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5" />
                      نسبة النجاح والرسوب لكل مادة
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={passFailData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontFamily: 'Cairo', fontSize: 12 }} />
                        <YAxis />
                        <Tooltip contentStyle={{ direction: 'rtl', fontFamily: 'Cairo' }} />
                        <Legend formatter={(value) => <span style={{ fontFamily: 'Cairo' }}>{value}</span>} />
                        <Bar dataKey="ناجح" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="راسب" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ===== Subjects Tab ===== */}
            {activeTab === 'subjects' && (
              <div className="space-y-6">
                {/* Classification by Subject */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">توزيع المستويات حسب المادة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={classificationBySubject}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontFamily: 'Cairo', fontSize: 12 }} />
                        <YAxis />
                        <Tooltip contentStyle={{ direction: 'rtl', fontFamily: 'Cairo' }} />
                        <Legend formatter={(value) => <span style={{ fontFamily: 'Cairo' }}>{value}</span>} />
                        <Bar dataKey="متفوق" stackId="a" fill={CLASSIFICATION_COLORS.excellent} />
                        <Bar dataKey="جيد جداً" stackId="a" fill={CLASSIFICATION_COLORS.very_good} />
                        <Bar dataKey="جيد" stackId="a" fill={CLASSIFICATION_COLORS.good} />
                        <Bar dataKey="مقبول" stackId="a" fill={CLASSIFICATION_COLORS.pass} />
                        <Bar dataKey="متعثر" stackId="a" fill={CLASSIFICATION_COLORS.fail} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Subject Details Table */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <TableIcon className="h-5 w-5" />
                      تفاصيل المواد
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>المادة</TableHead>
                          <TableHead>المتوسط</TableHead>
                          <TableHead>أعلى</TableHead>
                          <TableHead>أقل</TableHead>
                          <TableHead>نسبة النجاح</TableHead>
                          <TableHead>ناجح</TableHead>
                          <TableHead>راسب</TableHead>
                          <TableHead>الانحراف المعياري</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {subjectStats.map(s => (
                          <TableRow key={s.name}>
                            <TableCell className="font-medium">{s.name}</TableCell>
                            <TableCell>
                              <Badge variant={s.average >= 60 ? 'default' : 'destructive'}>
                                {s.average}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-green-600 font-medium">{s.highest}</TableCell>
                            <TableCell className="text-red-600 font-medium">{s.lowest}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full ${s.passRate >= 70 ? 'bg-green-500' : s.passRate >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                    style={{ width: `${s.passRate}%` }}
                                  />
                                </div>
                                <span className="text-sm">{s.passRate}%</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-green-600">{s.passCount}</TableCell>
                            <TableCell className="text-red-600">{s.failCount}</TableCell>
                            <TableCell>{s.stdDev}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ===== Students Tab ===== */}
            {activeTab === 'students' && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      قائمة الطلاب ({students.length})
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (sortBy === 'average') {
                            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
                          } else {
                            setSortBy('average');
                            setSortDir('desc');
                          }
                        }}
                      >
                        <ArrowUpDown className="h-4 w-4 ml-1" />
                        ترتيب بالمتوسط
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (sortBy === 'name') {
                            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
                          } else {
                            setSortBy('name');
                            setSortDir('asc');
                          }
                        }}
                      >
                        <ArrowUpDown className="h-4 w-4 ml-1" />
                        ترتيب بالاسم
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>الاسم</TableHead>
                        {gradeColumns.map(col => (
                          <TableHead key={col} className="text-center">{col}</TableHead>
                        ))}
                        <TableHead className="text-center">المتوسط</TableHead>
                        <TableHead className="text-center">التصنيف</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedStudents.map((student, i) => (
                        <TableRow key={i} className={student.classification === 'fail' ? 'bg-red-50 dark:bg-red-950/20' : ''}>
                          <TableCell className="text-muted-foreground text-xs">{i + 1}</TableCell>
                          <TableCell className="font-medium">{student.name}</TableCell>
                          {gradeColumns.map(col => {
                            const grade = student.grades[col];
                            return (
                              <TableCell key={col} className="text-center">
                                {grade !== undefined ? (
                                  <span className={`font-medium ${grade >= 90 ? 'text-emerald-600' :
                                    grade >= 80 ? 'text-blue-600' :
                                      grade >= 70 ? 'text-amber-600' :
                                        grade >= 60 ? 'text-orange-600' :
                                          'text-red-600 font-bold'
                                    }`}>
                                    {grade}
                                  </span>
                                ) : '—'}
                              </TableCell>
                            );
                          })}
                          <TableCell className="text-center">
                            <Badge variant={student.average >= 60 ? 'default' : 'destructive'}>
                              {student.average}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              className="text-xs"
                              style={{
                                backgroundColor: getClassificationColor(student.classification) + '20',
                                color: getClassificationColor(student.classification),
                                borderColor: getClassificationColor(student.classification),
                              }}
                              variant="outline"
                            >
                              {CLASSIFICATION_LABELS[student.classification]}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* ===== AI Analysis Tab ===== */}
            {activeTab === 'ai' && (
              <div className="space-y-4">
                {!aiAnalysis && !aiLoading && (
                  <Card className="p-12 text-center">
                    <Brain className="h-16 w-16 text-primary/30 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">تحليل ذكي بالذكاء الاصطناعي</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      اضغط الزر أدناه لإنشاء تقرير تحليلي شامل يتضمن توصيات لتحسين الأداء الأكاديمي
                    </p>
                    <Button size="lg" onClick={handleAIAnalysis} disabled={aiLoading}>
                      <Sparkles className="h-4 w-4 ml-2" />
                      إنشاء تحليل AI
                    </Button>
                  </Card>
                )}

                {aiLoading && (
                  <Card className="p-12 text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">جاري تحليل البيانات بالذكاء الاصطناعي...</p>
                  </Card>
                )}

                {aiAnalysis && !aiLoading && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Brain className="h-5 w-5" />
                          تقرير التحليل الذكي
                        </CardTitle>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={handleAIAnalysis}>
                            <RefreshCw className="h-4 w-4 ml-2" />
                            إعادة التحليل
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm max-w-none dark:prose-invert" dir="rtl">
                        {aiAnalysis.split('\n').map((line, i) => {
                          if (line.startsWith('## ')) {
                            return <h2 key={i} className="text-lg font-bold mt-4 mb-2">{line.replace('## ', '')}</h2>;
                          }
                          if (line.startsWith('### ')) {
                            return <h3 key={i} className="text-base font-semibold mt-3 mb-1">{line.replace('### ', '')}</h3>;
                          }
                          if (line.startsWith('#### ')) {
                            return <h4 key={i} className="text-sm font-semibold mt-2 mb-1">{line.replace('#### ', '')}</h4>;
                          }
                          if (line.startsWith('- ')) {
                            const content = line.replace('- ', '');
                            return (
                              <div key={i} className="flex items-start gap-2 my-1 text-sm">
                                <span className="text-primary mt-1">•</span>
                                <span dangerouslySetInnerHTML={{
                                  __html: content
                                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                }} />
                              </div>
                            );
                          }
                          if (line.trim()) {
                            return <p key={i} className="text-sm my-1">{line}</p>;
                          }
                          return <br key={i} />;
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
