'use client';
import { ta } from '@/i18n/auto-translations';

import { logger } from '@/lib/logger';

import { useTranslation } from '@/i18n/useTranslation';
import { useState, useCallback, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
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
import toast from 'react-hot-toast';
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
  excellent: ta('متفوق (90-100)', 'Excellent (90-100)'),
  very_good: ta('جيد جداً (80-89)', 'Very Good (80-89)'),
  good: ta('جيد (70-79)', 'Good (70-79)'),
  pass: ta('مقبول (60-69)', 'Acceptable (60-69)'),
  fail: ta('متعثر (أقل من 60)', 'Failing (below 60)'),
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
    const { dir } = useTranslation();
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

      toast.success(ta(`تم تحميل ${data.totalRows} سجل من "${file.name}"`, `Loaded ${data.totalRows} records from "${file.name}"`));

      if (nameCol && numericCols.length > 0) {
        setDataReady(true);
        setShowUpload(false);
      }
    } catch (error: any) {
      toast.error(error.message || ta('خطأ في قراءة الملف', 'Error reading file'));
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
        name: String(row[nameColumn] || ta('بدون اسم', 'No Name')),
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
      [ta('المتوسط', 'Average')]: s.average,
      [ta('أعلى درجة', 'Highest')]: s.highest,
      [ta('أقل درجة', 'Lowest')]: s.lowest,
    }));
  }, [subjectStats]);

  const passFailData = useMemo(() => {
    return subjectStats.map(s => ({
      name: s.name,
      [ta('ناجح', 'Passed')]: s.passCount,
      [ta('راسب', 'Failed')]: s.failCount,
    }));
  }, [subjectStats]);

  const classificationBySubject = useMemo(() => {
    return subjectStats.map(s => ({
      name: s.name,
      [ta('متفوق', 'Excellent')]: s.excellentCount,
      [ta('جيد جداً', 'Very Good')]: s.veryGoodCount,
      [ta('جيد', 'Good')]: s.goodCount,
      [ta('مقبول', 'Acceptable')]: s.passOnlyCount,
      [ta('متعثر', 'Failing')]: s.failCount,
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

      toast.success(ta('تم إنشاء التحليل بنجاح', 'Analysis created successfully'));
    } catch (error) {
      logger.error('AI analysis error:', error);
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
      toast.success(ta('تم إنشاء التحليل المحلي', 'Local analysis created'));
    } finally {
      setAiLoading(false);
    }
  };

  // ===== Local Analysis Fallback =====
  const generateLocalAnalysis = (data: any): string => {
    const { totalStudents, subjects, overallAverage, overallPassRate, classifications } = data;

    let analysis = `## ${ta('تقرير تحليل الأداء الأكاديمي', 'Academic Performance Analysis Report')}\n\n`;
    analysis += `### ${ta('ملخص عام', 'General Summary')}\n`;
    analysis += `- **${ta('إجمالي الطلاب', 'Total Students')}:** ${totalStudents} ${ta('طالب/طالبة', 'student(s)')}\n`;
    analysis += `- **${ta('المتوسط العام', 'Overall Average')}:** ${overallAverage} ${ta('من 100', 'out of 100')}\n`;
    analysis += `- **${ta('نسبة النجاح', 'Pass Rate')}:** ${overallPassRate}%\n\n`;

    analysis += `### ${ta('توزيع المستويات', 'Level Distribution')}\n`;
    if (classifications) {
      Object.entries(classifications).forEach(([key, value]) => {
        analysis += `- ${CLASSIFICATION_LABELS[key] || key}: ${value} ${ta('طالب', 'student(s)')} (${Math.round(((value as number) / totalStudents) * 100)}%)\n`;
      });
    }

    analysis += `\n### ${ta('تحليل المواد', 'Subject Analysis')}\n`;
    const bestSubject = subjects.reduce((a: any, b: any) => a.average > b.average ? a : b);
    const worstSubject = subjects.reduce((a: any, b: any) => a.average < b.average ? a : b);

    analysis += `- **${ta('أفضل مادة', 'Best Subject')}:** ${bestSubject.name} (${ta('متوسط', 'avg')} ${bestSubject.average})\n`;
    analysis += `- **${ta('أضعف مادة', 'Weakest Subject')}:** ${worstSubject.name} (${ta('متوسط', 'avg')} ${worstSubject.average})\n\n`;

    subjects.forEach((s: any) => {
      analysis += `#### ${s.name}\n`;
      analysis += `${ta('المتوسط', 'Average')}: ${s.average} | ${ta('نسبة النجاح', 'Pass Rate')}: ${s.passRate}% | ${ta('أعلى', 'Highest')}: ${s.highest} | ${ta('أقل', 'Lowest')}: ${s.lowest}\n\n`;
    });

    analysis += `### ${ta('التوصيات', 'Recommendations')}\n`;
    if (overallPassRate < 70) {
      analysis += `- **${ta('تحذير', 'Warning')}:** ${ta('نسبة النجاح العامة منخفضة', 'Overall pass rate is low')} (${overallPassRate}%). ${ta('يُنصح بمراجعة أساليب التدريس', 'Consider reviewing teaching methods')}.\n`;
    }
    subjects.forEach((s: any) => {
      if (s.passRate < 60) {
        analysis += `- ${ta('مادة', 'Subject')} **${s.name}** ${ta('تحتاج اهتماماً خاصاً', 'needs special attention')} (${ta('نسبة النجاح', 'pass rate')} ${s.passRate}% ${ta('فقط', 'only')}).\n`;
      }
      if (s.stdDev > 20) {
        analysis += `- ${ta('مادة', 'Subject')} **${s.name}** ${ta('تظهر تباين كبير بين الطلاب', 'shows high variance among students')} (${ta('الانحراف المعياري', 'std dev')} ${s.stdDev}). ${ta('يُنصح بتقديم دعم إضافي للطلاب المتعثرين', 'Consider additional support for struggling students')}.\n`;
      }
    });

    if (classifications?.fail > totalStudents * 0.2) {
      analysis += `- ${ta('نسبة الطلاب المتعثرين مرتفعة. يُنصح بإعداد خطط علاجية فورية', 'High failing rate. Immediate remedial plans recommended')}.\n`;
    }

    return analysis;
  };

  // ===== Export =====
  const handleExportReport = async () => {
    if (students.length === 0) return;

    const exportData = students.map(s => ({
      [ta('الاسم', 'Name')]: s.name,
      ...s.grades,
      [ta('المتوسط', 'Average')]: s.average,
      [ta('التصنيف', 'Classification')]: CLASSIFICATION_LABELS[s.classification] || s.classification,
    }));

    exportToExcel(exportData, ta('تقرير_تحليل_الدرجات', 'grade_analysis_report'));
    toast.success(ta('تم تصدير التقرير', 'Report exported'));
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
      <TopNavBar title={ta('تحليل البيانات والدرجات', 'Data & Grade Analysis')} />
      <div className="container mx-auto py-6 px-4" dir={dir}>
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              {ta('تحليل البيانات والدرجات', 'Data & Grade Analysis')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {ta('رفع ملف Excel يحتوي على درجات الطلاب للحصول على تحليل شامل ورسوم بيانية تفاعلية', 'Upload an Excel file with student grades for comprehensive analysis and interactive charts')}
            </p>
          </div>
          {dataReady && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExportReport}>
                <FileDown className="h-4 w-4 ms-2" />
                {ta('تصدير Excel', 'Export Excel')}
              </Button>
              <Button variant="outline" size="sm" onClick={handleAIAnalysis} disabled={aiLoading}>
                {aiLoading ? <Loader2 className="h-4 w-4 ms-2 animate-spin" /> : <Brain className="h-4 w-4 ms-2" />}
                {ta('تحليل AI', 'AI Analysis')}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <RefreshCw className="h-4 w-4 ms-2" />
                {ta('إعادة', 'Reset')}
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
                    <p className="text-muted-foreground">{ta('جاري تحليل الملف...', 'Analyzing file...')}</p>
                  </div>
                ) : (
                  <>
                    <Upload className="h-14 w-14 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">{ta('رفع ملف الدرجات', 'Upload Grades File')}</h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                      {ta('اسحب ملف Excel أو CSV هنا، أو اضغط لاختيار الملف. يجب أن يحتوي على عمود للأسماء وأعمدة رقمية للدرجات.', 'Drag an Excel or CSV file here, or click to choose. Must contain a name column and numeric grade columns.')}
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button size="lg" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="h-4 w-4 ms-2" />
                      {ta('اختيار ملف', 'Choose File')}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Column configuration (shown after upload) */}
            {parsedData && !dataReady && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{ta('تهيئة الأعمدة', 'Configure Columns')}</CardTitle>
                  <CardDescription>{ta('حدد عمود الأسماء وأعمدة الدرجات', 'Select the name column and grade columns')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>{ta('عمود الأسماء', 'Name Column')}</Label>
                    <Select value={nameColumn} onValueChange={setNameColumn}>
                      <SelectTrigger>
                        <SelectValue placeholder={ta('اختر عمود الأسماء...', 'Select name column...')} />
                      </SelectTrigger>
                      <SelectContent>
                        {parsedData.headers.map(h => (
                          <SelectItem key={h} value={h}>{h}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>{ta('أعمدة الدرجات (اضغط لتحديد/إلغاء)', 'Grade Columns (click to select/deselect)')}</Label>
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
                          {col.isNumeric && <Calculator className="h-3 w-3 me-1" />}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={() => { setDataReady(true); setShowUpload(false); }}
                    disabled={!nameColumn || gradeColumns.length === 0}
                    className="w-full"
                  >
                    <CheckCircle2 className="h-4 w-4 ms-2" />
                    {ta(`بدء التحليل (${gradeColumns.length} مادة، ${parsedData.totalRows} طالب)`, `Start Analysis (${gradeColumns.length} subjects, ${parsedData.totalRows} students)`)}
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
                { id: 'overview' as const, label: ta('نظرة عامة', 'Overview'), icon: PieChartIcon },
                { id: 'subjects' as const, label: ta('تحليل المواد', 'Subject Analysis'), icon: BarChart3 },
                { id: 'students' as const, label: ta('قائمة الطلاب', 'Student List'), icon: Users },
                { id: 'ai' as const, label: ta('تحليل AI', 'AI Analysis'), icon: Brain },
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
                          <p className="text-xs text-blue-600">{ta('إجمالي الطلاب', 'Total Students')}</p>
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
                          <p className="text-xs text-emerald-600">{ta('المتوسط العام', 'Overall Average')}</p>
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
                          <p className="text-xs text-green-600">{ta('نسبة النجاح', 'Pass Rate')}</p>
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
                          <p className="text-xs text-red-600">{ta('طلاب متعثرون', 'Struggling Students')}</p>
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
                        {ta('توزيع المستويات', 'Level Distribution')}
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
                        {ta('متوسط الدرجات لكل مادة', 'Average Grades per Subject')}
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
                          <Bar dataKey={ta('المتوسط', 'Average')} fill="#3b82f6" radius={[0, 4, 4, 0]} />
                          <Bar dataKey={ta('أعلى درجة', 'Highest')} fill="#10b981" radius={[0, 4, 4, 0]} />
                          <Bar dataKey={ta('أقل درجة', 'Lowest')} fill="#ef4444" radius={[0, 4, 4, 0]} />
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
                      {ta('نسبة النجاح والرسوب لكل مادة', 'Pass/Fail Rate per Subject')}
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
                        <Bar dataKey={ta('ناجح', 'Passed')} stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey={ta('راسب', 'Failed')} stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
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
                    <CardTitle className="text-base">{ta('توزيع المستويات حسب المادة', 'Level Distribution per Subject')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={classificationBySubject}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontFamily: 'Cairo', fontSize: 12 }} />
                        <YAxis />
                        <Tooltip contentStyle={{ direction: 'rtl', fontFamily: 'Cairo' }} />
                        <Legend formatter={(value) => <span style={{ fontFamily: 'Cairo' }}>{value}</span>} />
                        <Bar dataKey={ta('متفوق', 'Excellent')} stackId="a" fill={CLASSIFICATION_COLORS.excellent} />
                        <Bar dataKey={ta('جيد جداً', 'Very Good')} stackId="a" fill={CLASSIFICATION_COLORS.very_good} />
                        <Bar dataKey={ta('جيد', 'Good')} stackId="a" fill={CLASSIFICATION_COLORS.good} />
                        <Bar dataKey={ta('مقبول', 'Acceptable')} stackId="a" fill={CLASSIFICATION_COLORS.pass} />
                        <Bar dataKey={ta('متعثر', 'Failing')} stackId="a" fill={CLASSIFICATION_COLORS.fail} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Subject Details Table */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <TableIcon className="h-5 w-5" />
                      {ta('تفاصيل المواد', 'Subject Details')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{ta('المادة', 'Subject')}</TableHead>
                          <TableHead>{ta('المتوسط', 'Average')}</TableHead>
                          <TableHead>{ta('أعلى', 'Highest')}</TableHead>
                          <TableHead>{ta('أقل', 'Lowest')}</TableHead>
                          <TableHead>{ta('نسبة النجاح', 'Pass Rate')}</TableHead>
                          <TableHead>{ta('ناجح', 'Passed')}</TableHead>
                          <TableHead>{ta('راسب', 'Failed')}</TableHead>
                          <TableHead>{ta('الانحراف المعياري', 'Std Deviation')}</TableHead>
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
                        <ArrowUpDown className="h-4 w-4 ms-1" />
                        {ta('ترتيب بالمتوسط', 'ترتيب بالمتوسط')}
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
                        <ArrowUpDown className="h-4 w-4 ms-1" />
                        {ta('ترتيب بالاسم', 'ترتيب بالاسم')}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>{ta('الاسم', 'Name')}</TableHead>
                        {gradeColumns.map(col => (
                          <TableHead key={col} className="text-center">{col}</TableHead>
                        ))}
                        <TableHead className="text-center">{ta('المتوسط', 'Average')}</TableHead>
                        <TableHead className="text-center">{ta('التصنيف', 'Classification')}</TableHead>
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
                    <h3 className="text-lg font-semibold mb-2">{ta('تحليل ذكي بالذكاء الاصطناعي', 'تحليل ذكي بالذكاء الاصطناعي')}</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      {ta('اضغط الزر أدناه لإنشاء تقرير تحليلي شامل يتضمن توصيات لتحسين الأداء الأكاديمي', 'اضغط الزر أدناه لإنشاء تقرير تحليلي شامل يتضمن توصيات لتحسين الأداء الأكاديمي')}
                    </p>
                    <Button size="lg" onClick={handleAIAnalysis} disabled={aiLoading}>
                      <Sparkles className="h-4 w-4 ms-2" />
                      {ta('إنشاء تحليل AI', 'إنشاء تحليل AI')}
                    </Button>
                  </Card>
                )}

                {aiLoading && (
                  <Card className="p-12 text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">{ta('جاري تحليل البيانات بالذكاء الاصطناعي...', 'جاري تحليل البيانات بالذكاء الاصطناعي...')}</p>
                  </Card>
                )}

                {aiAnalysis && !aiLoading && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Brain className="h-5 w-5" />
                          {ta('تقرير التحليل الذكي', 'تقرير التحليل الذكي')}
                        </CardTitle>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={handleAIAnalysis}>
                            <RefreshCw className="h-4 w-4 ms-2" />
                            {ta('إعادة التحليل', 'Re-analyze')}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm max-w-none dark:prose-invert" dir={dir}>
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
                            
                            // [CRITICAL FIX] Escape HTML tags to prevent XSS from malicious Excel files 
                            const escapedContent = content
                              .replace(/&/g, '&amp;')
                              .replace(/</g, '&lt;')
                              .replace(/>/g, '&gt;')
                              .replace(/"/g, '&quot;');

                            return (
                              <div key={i} className="flex items-start gap-2 my-1 text-sm">
                                <span className="text-primary mt-1">•</span>
                                <span dangerouslySetInnerHTML={{
                                  __html: escapedContent
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
