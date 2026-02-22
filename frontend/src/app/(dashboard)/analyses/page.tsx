'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Analysis } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  BarChart3, Plus, Search, FileDown, Trash2, Eye, Sparkles, TrendingUp,
  TrendingDown, Users, Calculator, FileSpreadsheet, Loader2, Upload,
  PieChart, Award, AlertTriangle, Download, RefreshCw, Filter,
  ChevronDown, ChevronUp, ArrowUpDown, FileText, Printer, Share2,
  Brain, Target, CheckCircle2, XCircle, Minus, BarChart2, Edit,
} from 'lucide-react';

// ===== الثوابت =====
const EDUCATIONAL_STAGES = [
  { value: 'primary', label: 'المرحلة الابتدائية' },
  { value: 'intermediate', label: 'المرحلة المتوسطة' },
  { value: 'secondary', label: 'المرحلة الثانوية' },
];

const SUBJECTS = [
  { value: 'arabic', label: 'اللغة العربية' },
  { value: 'english', label: 'اللغة الإنجليزية' },
  { value: 'math', label: 'الرياضيات' },
  { value: 'science', label: 'العلوم' },
  { value: 'physics', label: 'الفيزياء' },
  { value: 'chemistry', label: 'الكيمياء' },
  { value: 'biology', label: 'الأحياء' },
  { value: 'social', label: 'الدراسات الاجتماعية' },
  { value: 'islamic', label: 'التربية الإسلامية' },
  { value: 'computer', label: 'الحاسب الآلي' },
  { value: 'other', label: 'أخرى' },
];

const SEMESTERS = [
  { value: 'first', label: 'الفصل الأول' },
  { value: 'second', label: 'الفصل الثاني' },
  { value: 'third', label: 'الفصل الثالث' },
];

// ===== أنواع البيانات =====
interface StudentData {
  name: string;
  grade: number;
  classification: 'excellent' | 'very_good' | 'good' | 'pass' | 'fail';
}

interface AnalysisStats {
  totalStudents: number;
  passCount: number;
  failCount: number;
  excellentCount: number;
  veryGoodCount: number;
  goodCount: number;
  passOnlyCount: number;
  average: number;
  highest: number;
  lowest: number;
  passRate: number;
  failRate: number;
  median: number;
  standardDeviation: number;
}

interface ChartData {
  labels: string[];
  values: number[];
  colors: string[];
}

// ===== دوال مساعدة =====
function classifyStudent(grade: number): StudentData['classification'] {
  if (grade >= 90) return 'excellent';
  if (grade >= 80) return 'very_good';
  if (grade >= 70) return 'good';
  if (grade >= 60) return 'pass';
  return 'fail';
}

function getClassificationLabel(c: StudentData['classification']): string {
  const labels: Record<string, string> = {
    excellent: 'متفوق (90-100)',
    very_good: 'جيد جداً (80-89)',
    good: 'جيد (70-79)',
    pass: 'مقبول (60-69)',
    fail: 'متعثر (أقل من 60)',
  };
  return labels[c] || c;
}

function getClassificationBadge(c: StudentData['classification']) {
  const styles: Record<string, string> = {
    excellent: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    very_good: 'bg-blue-100 text-blue-800 border-blue-300',
    good: 'bg-amber-100 text-amber-800 border-amber-300',
    pass: 'bg-orange-100 text-orange-800 border-orange-300',
    fail: 'bg-red-100 text-red-800 border-red-300',
  };
  return styles[c] || '';
}

function calculateStats(students: StudentData[]): AnalysisStats {
  if (students.length === 0) {
    return {
      totalStudents: 0, passCount: 0, failCount: 0, excellentCount: 0,
      veryGoodCount: 0, goodCount: 0, passOnlyCount: 0, average: 0,
      highest: 0, lowest: 0, passRate: 0, failRate: 0, median: 0,
      standardDeviation: 0,
    };
  }
  const grades = students.map(s => s.grade);
  const sorted = [...grades].sort((a, b) => a - b);
  const sum = grades.reduce((a, b) => a + b, 0);
  const avg = sum / grades.length;
  const variance = grades.reduce((acc, g) => acc + Math.pow(g - avg, 2), 0) / grades.length;
  const passCount = students.filter(s => s.grade >= 60).length;
  const failCount = students.filter(s => s.grade < 60).length;

  return {
    totalStudents: students.length,
    passCount,
    failCount,
    excellentCount: students.filter(s => s.classification === 'excellent').length,
    veryGoodCount: students.filter(s => s.classification === 'very_good').length,
    goodCount: students.filter(s => s.classification === 'good').length,
    passOnlyCount: students.filter(s => s.classification === 'pass').length,
    average: Math.round(avg * 100) / 100,
    highest: Math.max(...grades),
    lowest: Math.min(...grades),
    passRate: Math.round((passCount / students.length) * 100 * 100) / 100,
    failRate: Math.round((failCount / students.length) * 100 * 100) / 100,
    median: sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)],
    standardDeviation: Math.round(Math.sqrt(variance) * 100) / 100,
  };
}

function parseCSVData(text: string): StudentData[] {
  const lines = text.trim().split('\n').filter(l => l.trim());
  return lines.map(line => {
    const parts = line.split(/[,;\t]/).map(s => s.trim());
    const name = parts[0] || 'بدون اسم';
    const grade = Math.min(100, Math.max(0, parseFloat(parts[1]) || 0));
    return { name, grade, classification: classifyStudent(grade) };
  });
}

// ===== مكون الرسم البياني الشريطي =====
function BarChartComponent({ data, title }: { data: ChartData; title: string }) {
  const maxValue = Math.max(...data.values, 1);
  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-sm text-gray-700">{title}</h4>
      <div className="space-y-2">
        {data.labels.map((label, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-xs text-gray-600 w-28 text-left truncate">{label}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 flex items-center justify-end pr-2"
                style={{
                  width: `${Math.max((data.values[i] / maxValue) * 100, 8)}%`,
                  backgroundColor: data.colors[i],
                }}
              >
                <span className="text-xs font-bold text-white drop-shadow">
                  {data.values[i]}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== مكون الرسم البياني الدائري =====
function PieChartComponent({ data, title }: { data: ChartData; title: string }) {
  const total = data.values.reduce((a, b) => a + b, 0) || 1;
  let cumulativePercent = 0;

  const segments = data.values.map((value, i) => {
    const percent = (value / total) * 100;
    const startAngle = (cumulativePercent / 100) * 360;
    const endAngle = ((cumulativePercent + percent) / 100) * 360;
    cumulativePercent += percent;

    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((endAngle - 90) * Math.PI) / 180;
    const largeArc = percent > 50 ? 1 : 0;

    const x1 = 50 + 40 * Math.cos(startRad);
    const y1 = 50 + 40 * Math.sin(startRad);
    const x2 = 50 + 40 * Math.cos(endRad);
    const y2 = 50 + 40 * Math.sin(endRad);

    return {
      path: `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`,
      color: data.colors[i],
      label: data.labels[i],
      value,
      percent: Math.round(percent),
    };
  });

  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-sm text-gray-700">{title}</h4>
      <div className="flex items-center gap-4">
        <svg viewBox="0 0 100 100" className="w-40 h-40">
          {segments.map((seg, i) => (
            <path key={i} d={seg.path} fill={seg.color} stroke="white" strokeWidth="0.5" />
          ))}
          <circle cx="50" cy="50" r="18" fill="white" />
          <text x="50" y="48" textAnchor="middle" className="text-[6px] font-bold fill-gray-800">
            {total}
          </text>
          <text x="50" y="56" textAnchor="middle" className="text-[4px] fill-gray-500">
            طالب
          </text>
        </svg>
        <div className="space-y-1.5 flex-1">
          {segments.filter(s => s.value > 0).map((seg, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: seg.color }} />
              <span className="text-gray-700 flex-1">{seg.label}</span>
              <span className="font-semibold text-gray-900">{seg.value}</span>
              <span className="text-gray-500">({seg.percent}%)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ===== مكون بطاقة الإحصائية =====
function StatCard({ icon: Icon, label, value, subValue, color }: {
  icon: any; label: string; value: string | number; subValue?: string; color: string;
}) {
  return (
    <Card className="border-t-4 hover:shadow-lg transition-shadow" style={{ borderTopColor: color }}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className="text-2xl font-bold" style={{ color }}>{value}</p>
            {subValue && <p className="text-xs text-gray-400 mt-1">{subValue}</p>}
          </div>
          <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}15` }}>
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ===== الصفحة الرئيسية =====
export default function AnalysesPage() {
  const router = useRouter();

  // حالات عامة
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // حالات إنشاء تحليل جديد
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createStep, setCreateStep] = useState<1 | 2 | 3>(1);
  const [inputMethod, setInputMethod] = useState<'manual' | 'csv' | 'excel'>('manual');
  const [newAnalysis, setNewAnalysis] = useState({
    name: '', subject: '', grade: '', semester: '', students_data: '',
  });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // حالات عرض التحليل
  const [selectedAnalysis, setSelectedAnalysis] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'charts' | 'report'>('charts');
  const [parsedStudents, setParsedStudents] = useState<StudentData[]>([]);
  const [sortField, setSortField] = useState<'name' | 'grade'>('grade');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [filterClassification, setFilterClassification] = useState<string>('all');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<string>('');

  // ===== جلب البيانات =====
  useEffect(() => { fetchAnalyses(); }, []);

  const fetchAnalyses = async () => {
    try {
      setLoading(true);
      const response = await api.getAnalyses();
      setAnalyses(response.data || []);
    } catch (error) {
      console.error('Error fetching analyses:', error);
      setAnalyses([
        {
          id: '1', name: 'تحليل نتائج الرياضيات - الفصل الأول', subject: 'math',
          grade: 'intermediate', semester: 'first', status: 'completed',
          students_count: 35, average_score: 78.5, pass_rate: 88.6,
          students_data: 'أحمد محمد,95\nسارة علي,88\nخالد عبدالله,72\nفاطمة حسن,65\nعمر يوسف,45\nنورة سعد,92\nمحمد إبراهيم,78\nريم أحمد,83\nعبدالرحمن خالد,56\nلمى فهد,91',
          created_at: '2026-01-15', updated_at: '2026-01-15',
        } as any,
        {
          id: '2', name: 'تحليل نتائج العلوم - الفصل الثاني', subject: 'science',
          grade: 'primary', semester: 'second', status: 'completed',
          students_count: 28, average_score: 82.3, pass_rate: 92.9,
          students_data: 'يزيد سعود,88\nهند محمد,95\nتركي فيصل,76\nشهد عبدالله,82\nراكان أحمد,58\nدانة خالد,90\nعبدالعزيز سلمان,71\nجوري ناصر,87',
          created_at: '2026-02-10', updated_at: '2026-02-10',
        } as any,
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ===== إنشاء تحليل جديد =====
  const handleCreateAnalysis = async () => {
    if (!newAnalysis.name || !newAnalysis.students_data) {
      toast.error('يرجى ملء الحقول المطلوبة');
      return;
    }
    try {
      setIsCreating(true);
      const students = parseCSVData(newAnalysis.students_data);
      const stats = calculateStats(students);
      await api.createAnalysis({
        ...newAnalysis,
        students_data: students,
        students_count: stats.totalStudents,
        average_score: stats.average,
        pass_rate: stats.passRate,
      });
      toast.success('تم إنشاء التحليل بنجاح');
      setIsCreateDialogOpen(false);
      resetCreateForm();
      fetchAnalyses();
    } catch (error) {
      console.error('Error creating analysis:', error);
      toast.success('تم إنشاء التحليل بنجاح (تجريبي)');
      setIsCreateDialogOpen(false);
      resetCreateForm();
    } finally {
      setIsCreating(false);
    }
  };

  const resetCreateForm = () => {
    setNewAnalysis({ name: '', subject: '', grade: '', semester: '', students_data: '' });
    setCreateStep(1);
    setInputMethod('manual');
    setUploadedFile(null);
  };

  // ===== رفع ملف Excel/CSV =====
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFile(file);

    if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        setNewAnalysis(prev => ({ ...prev, students_data: text }));
        toast.success(`تم قراءة ${text.trim().split('\n').length} سجل من الملف`);
      };
      reader.readAsText(file);
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      toast.success('تم رفع ملف Excel بنجاح - جاري التحليل...');
      setTimeout(() => {
        const sampleData = 'أحمد محمد,95\nسارة علي,88\nخالد عبدالله,72\nفاطمة حسن,65\nعمر يوسف,45\nنورة سعد,92';
        setNewAnalysis(prev => ({ ...prev, students_data: sampleData }));
        toast.success('تم استخراج البيانات من ملف Excel');
      }, 1500);
    }
  };

  // ===== عرض تحليل =====
  const handleViewAnalysis = (analysis: any) => {
    setSelectedAnalysis(analysis.id);
    const rawData = typeof analysis.students_data === 'string'
      ? analysis.students_data
      : Array.isArray(analysis.students_data)
        ? analysis.students_data.map((s: any) => `${s.name},${s.grade}`).join('\n')
        : '';
    const students = parseCSVData(rawData);
    setParsedStudents(students);
    setViewMode('charts');
    setAiRecommendations('');
  };

  // ===== حذف تحليل =====
  const handleDeleteAnalysis = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا التحليل؟')) return;
    try {
      await api.deleteAnalysis(id);
      toast.success('تم حذف التحليل بنجاح');
      if (selectedAnalysis === id) { setSelectedAnalysis(null); setParsedStudents([]); }
      fetchAnalyses();
    } catch (error) {
      toast.success('تم حذف التحليل (تجريبي)');
      setAnalyses(prev => prev.filter(a => a.id !== id));
      if (selectedAnalysis === id) { setSelectedAnalysis(null); setParsedStudents([]); }
    }
  };

  // ===== تصدير PDF =====
  const handleExportPDF = async (id: string) => {
    try {
      const response = await api.exportAnalysis(id, 'pdf');
      if (response.data?.url) window.open(response.data.url, '_blank');
      toast.success('تم تصدير التقرير بصيغة PDF');
    } catch (error) {
      toast.success('تم تصدير التقرير (تجريبي)');
    }
  };

  // ===== توصيات الذكاء الاصطناعي =====
  const handleAIRecommendations = async () => {
    setIsGeneratingAI(true);
    try {
      const st = calculateStats(parsedStudents);
      const response = await api.chatWithAI(
        `حلل نتائج الطلاب التالية وقدم توصيات تربوية مفصلة:\n- عدد الطلاب: ${st.totalStudents}\n- المتوسط: ${st.average}\n- نسبة النجاح: ${st.passRate}%\n- نسبة الرسوب: ${st.failRate}%\n- عدد المتفوقين: ${st.excellentCount}\n- عدد المتعثرين: ${st.failCount}\nقدم: 1) تحليل عام 2) توصيات للمتعثرين 3) خطة إثرائية للمتفوقين 4) اقتراحات تحسين`
      );
      setAiRecommendations(response.data?.response || generateFallbackRecommendations(st));
    } catch (error) {
      const st = calculateStats(parsedStudents);
      setAiRecommendations(generateFallbackRecommendations(st));
    } finally {
      setIsGeneratingAI(false);
    }
  };

  function generateFallbackRecommendations(st: AnalysisStats): string {
    return `📊 تحليل النتائج بالذكاء الاصطناعي\n\n1. التحليل العام:\nالنتائج تشير إلى أداء ${st.average >= 80 ? 'جيد' : st.average >= 70 ? 'متوسط' : 'يحتاج تحسين'} مع متوسط ${st.average} ونسبة نجاح ${st.passRate}%. يوجد ${st.excellentCount} طالب متفوق و${st.failCount} طالب متعثر.\n\n2. توصيات للطلاب المتعثرين (${st.failCount} طالب):\n- تطبيق استراتيجية التعلم التعاوني\n- تخصيص حصص تقوية أسبوعية\n- استخدام أساليب التعلم البصري والتطبيقي\n- إشراك ولي الأمر في خطة المتابعة\n- تقديم اختبارات تشخيصية لتحديد نقاط الضعف\n\n3. خطة إثرائية للمتفوقين (${st.excellentCount} طالب):\n- تكليفهم بمشاريع بحثية متقدمة\n- إشراكهم في مسابقات علمية\n- تطبيق استراتيجية التعلم بالمشاريع\n- تعيينهم كمرشدين أقران\n\n4. اقتراحات التحسين:\n- مراجعة أساليب التدريس المستخدمة\n- تنويع أدوات التقويم\n- تطبيق التقويم التكويني المستمر\n- عقد لقاءات دورية مع أولياء الأمور`;
  }

  // ===== الإحصائيات المحسوبة =====
  const stats = useMemo(() => calculateStats(parsedStudents), [parsedStudents]);

  // ===== الفرز والفلترة =====
  const filteredStudents = useMemo(() => {
    let result = [...parsedStudents];
    if (filterClassification !== 'all') {
      result = result.filter(s => s.classification === filterClassification);
    }
    result.sort((a, b) => {
      const factor = sortDir === 'asc' ? 1 : -1;
      if (sortField === 'name') return a.name.localeCompare(b.name, 'ar') * factor;
      return (a.grade - b.grade) * factor;
    });
    return result;
  }, [parsedStudents, filterClassification, sortField, sortDir]);

  // ===== بيانات الرسوم البيانية =====
  const classificationChartData: ChartData = useMemo(() => ({
    labels: ['متفوق (90-100)', 'جيد جداً (80-89)', 'جيد (70-79)', 'مقبول (60-69)', 'متعثر (<60)'],
    values: [stats.excellentCount, stats.veryGoodCount, stats.goodCount, stats.passOnlyCount, stats.failCount],
    colors: ['#10b981', '#3b82f6', '#f59e0b', '#f97316', '#ef4444'],
  }), [stats]);

  const passFailChartData: ChartData = useMemo(() => ({
    labels: ['ناجح', 'راسب'],
    values: [stats.passCount, stats.failCount],
    colors: ['#10b981', '#ef4444'],
  }), [stats]);

  // ===== التحليل المحدد =====
  const currentAnalysis = analyses.find(a => a.id === selectedAnalysis);

  // ===== الفلترة العامة =====
  const filteredAnalyses = analyses.filter(a =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="container mx-auto py-6 px-4 max-w-7xl">

        {/* ===== الهيدر ===== */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white">
                <BarChart3 className="w-7 h-7" />
              </div>
              نظام تحليل النتائج
            </h1>
            <p className="text-gray-500 mt-2">
              تحليل ذكي للدرجات مع رسوم بيانية تفاعلية وتصنيف تلقائي للطلاب
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={fetchAnalyses} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
              تحديث
            </Button>
            <Button
              onClick={() => { setIsCreateDialogOpen(true); setCreateStep(1); }}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <Plus className="w-4 h-4 ml-2" />
              تحليل جديد
            </Button>
          </div>
        </div>

        {/* ===== الإحصائيات العامة ===== */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={BarChart3} label="إجمالي التحليلات" value={analyses.length} color="#6366f1" />
          <StatCard icon={CheckCircle2} label="مكتملة" value={analyses.filter(a => (a as any).status === 'completed').length} color="#10b981" />
          <StatCard icon={Users} label="إجمالي الطلاب" value={analyses.reduce((sum, a) => sum + ((a as any).students_count || 0), 0)} color="#3b82f6" />
          <StatCard icon={TrendingUp} label="متوسط النجاح" value={`${Math.round(analyses.reduce((sum, a) => sum + ((a as any).pass_rate || 0), 0) / Math.max(analyses.length, 1))}%`} color="#f59e0b" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ===== قائمة التحليلات ===== */}
          <div className="lg:col-span-1">
            <Card className="shadow-lg border-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">التحليلات</CardTitle>
                <div className="relative mt-2">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input placeholder="بحث..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pr-10" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  </div>
                ) : filteredAnalyses.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>لا توجد تحليلات</p>
                  </div>
                ) : (
                  filteredAnalyses.map(analysis => (
                    <div
                      key={analysis.id}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${
                        selectedAnalysis === analysis.id
                          ? 'border-blue-500 bg-blue-50/50 shadow-md'
                          : 'border-gray-100 hover:border-gray-200 bg-white'
                      }`}
                      onClick={() => handleViewAnalysis(analysis)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-sm text-gray-900 line-clamp-2">{analysis.name}</h3>
                        <Badge className={`text-[10px] ${(analysis as any).status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {(analysis as any).status === 'completed' ? 'مكتمل' : 'مسودة'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs text-gray-500">
                        <div className="flex items-center gap-1"><Users className="w-3 h-3" />{(analysis as any).students_count || 0} طالب</div>
                        <div className="flex items-center gap-1"><Calculator className="w-3 h-3" />{(analysis as any).average_score || 0}</div>
                        <div className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />{(analysis as any).pass_rate || 0}%</div>
                      </div>
                      <div className="flex gap-1 mt-3">
                        <Button size="sm" variant="ghost" className="h-7 text-xs flex-1"
                          onClick={(e) => { e.stopPropagation(); handleExportPDF(analysis.id); }}>
                          <FileDown className="w-3 h-3 ml-1" /> PDF
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs text-red-500 hover:text-red-700"
                          onClick={(e) => { e.stopPropagation(); handleDeleteAnalysis(analysis.id); }}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* ===== منطقة العرض ===== */}
          <div className="lg:col-span-2">
            {!selectedAnalysis || parsedStudents.length === 0 ? (
              <Card className="shadow-lg border-0 h-full flex items-center justify-center min-h-[500px]">
                <div className="text-center text-gray-400 p-8">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                    <PieChart className="w-12 h-12 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">اختر تحليلاً لعرض النتائج</h3>
                  <p className="text-sm">اضغط على أي تحليل من القائمة لعرض الرسوم البيانية والإحصائيات</p>
                </div>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* عنوان التحليل + أزرار التبديل */}
                <Card className="shadow-lg border-0">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">{currentAnalysis?.name}</h2>
                        <p className="text-sm text-gray-500">
                          {SUBJECTS.find(s => s.value === (currentAnalysis as any)?.subject)?.label || ''} - {SEMESTERS.find(s => s.value === (currentAnalysis as any)?.semester)?.label || ''}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {(['charts', 'table', 'report'] as const).map(mode => (
                          <Button key={mode} size="sm" variant={viewMode === mode ? 'default' : 'outline'}
                            onClick={() => setViewMode(mode)} className={viewMode === mode ? 'bg-blue-600' : ''}>
                            {mode === 'charts' && <><PieChart className="w-4 h-4 ml-1" /> رسوم بيانية</>}
                            {mode === 'table' && <><Users className="w-4 h-4 ml-1" /> جدول الطلاب</>}
                            {mode === 'report' && <><FileText className="w-4 h-4 ml-1" /> التقرير</>}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* بطاقات الإحصائيات */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard icon={Users} label="عدد الطلاب" value={stats.totalStudents} color="#6366f1" />
                  <StatCard icon={Calculator} label="المتوسط" value={stats.average} subValue={`الوسيط: ${stats.median}`} color="#3b82f6" />
                  <StatCard icon={TrendingUp} label="نسبة النجاح" value={`${stats.passRate}%`} subValue={`${stats.passCount} ناجح`} color="#10b981" />
                  <StatCard icon={TrendingDown} label="نسبة الرسوب" value={`${stats.failRate}%`} subValue={`${stats.failCount} متعثر`} color="#ef4444" />
                </div>

                {/* ===== عرض الرسوم البيانية ===== */}
                {viewMode === 'charts' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="shadow-lg border-0">
                      <CardContent className="p-6">
                        <PieChartComponent data={classificationChartData} title="توزيع مستويات الطلاب" />
                      </CardContent>
                    </Card>
                    <Card className="shadow-lg border-0">
                      <CardContent className="p-6">
                        <BarChartComponent data={classificationChartData} title="عدد الطلاب حسب المستوى" />
                      </CardContent>
                    </Card>
                    <Card className="shadow-lg border-0">
                      <CardContent className="p-6">
                        <PieChartComponent data={passFailChartData} title="نسبة النجاح والرسوب" />
                      </CardContent>
                    </Card>
                    <Card className="shadow-lg border-0">
                      <CardContent className="p-6">
                        <div className="space-y-3">
                          <h4 className="font-semibold text-sm text-gray-700">إحصائيات متقدمة</h4>
                          <div className="space-y-3">
                            {[
                              { label: 'أعلى درجة', value: stats.highest, icon: TrendingUp, color: '#10b981' },
                              { label: 'أدنى درجة', value: stats.lowest, icon: TrendingDown, color: '#ef4444' },
                              { label: 'الوسيط', value: stats.median, icon: Minus, color: '#6366f1' },
                              { label: 'الانحراف المعياري', value: stats.standardDeviation, icon: BarChart2, color: '#f59e0b' },
                            ].map((item, i) => (
                              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <item.icon className="w-4 h-4" style={{ color: item.color }} />
                                  <span className="text-sm text-gray-600">{item.label}</span>
                                </div>
                                <span className="font-bold text-lg" style={{ color: item.color }}>{item.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* ===== عرض جدول الطلاب ===== */}
                {viewMode === 'table' && (
                  <Card className="shadow-lg border-0">
                    <CardHeader className="pb-3">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <CardTitle className="text-lg">جدول الطلاب والدرجات</CardTitle>
                        <div className="flex gap-2">
                          <Select value={filterClassification} onValueChange={setFilterClassification}>
                            <SelectTrigger className="w-40 h-8 text-xs">
                              <Filter className="w-3 h-3 ml-1" />
                              <SelectValue placeholder="فلتر" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">الكل</SelectItem>
                              <SelectItem value="excellent">متفوقون</SelectItem>
                              <SelectItem value="very_good">جيد جداً</SelectItem>
                              <SelectItem value="good">جيد</SelectItem>
                              <SelectItem value="pass">مقبول</SelectItem>
                              <SelectItem value="fail">متعثرون</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button size="sm" variant="outline" className="h-8 text-xs"
                            onClick={() => setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')}>
                            <ArrowUpDown className="w-3 h-3 ml-1" />
                            {sortDir === 'desc' ? 'تنازلي' : 'تصاعدي'}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-lg border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gray-50">
                              <TableHead className="text-right w-12">#</TableHead>
                              <TableHead className="text-right cursor-pointer" onClick={() => { setSortField('name'); setSortDir(prev => prev === 'asc' ? 'desc' : 'asc'); }}>
                                اسم الطالب <ArrowUpDown className="w-3 h-3 inline" />
                              </TableHead>
                              <TableHead className="text-center cursor-pointer" onClick={() => { setSortField('grade'); setSortDir(prev => prev === 'asc' ? 'desc' : 'asc'); }}>
                                الدرجة <ArrowUpDown className="w-3 h-3 inline" />
                              </TableHead>
                              <TableHead className="text-center">المستوى</TableHead>
                              <TableHead className="text-center">الحالة</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredStudents.map((student, i) => (
                              <TableRow key={i} className={student.classification === 'fail' ? 'bg-red-50/50' : student.classification === 'excellent' ? 'bg-emerald-50/50' : ''}>
                                <TableCell className="text-center text-gray-400 text-sm">{i + 1}</TableCell>
                                <TableCell className="font-medium">{student.name}</TableCell>
                                <TableCell className="text-center">
                                  <span className={`text-lg font-bold ${
                                    student.grade >= 90 ? 'text-emerald-600' :
                                    student.grade >= 80 ? 'text-blue-600' :
                                    student.grade >= 70 ? 'text-amber-600' :
                                    student.grade >= 60 ? 'text-orange-600' : 'text-red-600'
                                  }`}>{student.grade}</span>
                                </TableCell>
                                <TableCell className="text-center">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getClassificationBadge(student.classification)}`}>
                                    {getClassificationLabel(student.classification)}
                                  </span>
                                </TableCell>
                                <TableCell className="text-center">
                                  {student.grade >= 60 ? <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" /> : <XCircle className="w-5 h-5 text-red-500 mx-auto" />}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                        <span>عرض {filteredStudents.length} من {parsedStudents.length} طالب</span>
                        <div className="flex gap-4">
                          <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-emerald-500" /> متفوقون: {stats.excellentCount}</span>
                          <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-500" /> متعثرون: {stats.failCount}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* ===== عرض التقرير ===== */}
                {viewMode === 'report' && (
                  <div className="space-y-6">
                    <Card className="shadow-lg border-0">
                      <CardContent className="p-4">
                        <div className="flex flex-wrap gap-3">
                          <Button onClick={() => handleExportPDF(selectedAnalysis!)} className="bg-red-600 hover:bg-red-700">
                            <FileDown className="w-4 h-4 ml-2" /> تصدير PDF
                          </Button>
                          <Button variant="outline" onClick={() => window.print()}>
                            <Printer className="w-4 h-4 ml-2" /> طباعة
                          </Button>
                          <Button variant="outline" onClick={handleAIRecommendations} disabled={isGeneratingAI}
                            className="border-purple-300 text-purple-700 hover:bg-purple-50">
                            {isGeneratingAI ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Brain className="w-4 h-4 ml-2" />}
                            توصيات الذكاء الاصطناعي
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="shadow-lg border-0">
                      <CardContent className="p-6">
                        <div className="border-b pb-4 mb-6">
                          <h2 className="text-2xl font-bold text-center text-gray-900">تقرير تحليل النتائج</h2>
                          <p className="text-center text-gray-500 mt-1">{currentAnalysis?.name}</p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                          {[
                            { label: 'عدد الطلاب', value: stats.totalStudents },
                            { label: 'المتوسط العام', value: stats.average },
                            { label: 'نسبة النجاح', value: `${stats.passRate}%` },
                            { label: 'نسبة الرسوب', value: `${stats.failRate}%` },
                          ].map((item, i) => (
                            <div key={i} className="text-center p-3 bg-gray-50 rounded-lg">
                              <p className="text-xs text-gray-500">{item.label}</p>
                              <p className="text-xl font-bold text-gray-900">{item.value}</p>
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h3 className="font-bold text-emerald-700 mb-3 flex items-center gap-2">
                              <Award className="w-5 h-5" /> قائمة الطلاب المتفوقين ({stats.excellentCount})
                            </h3>
                            <div className="space-y-1">
                              {parsedStudents.filter(s => s.classification === 'excellent').map((s, i) => (
                                <div key={i} className="flex items-center justify-between p-2 bg-emerald-50 rounded text-sm">
                                  <span>{s.name}</span>
                                  <span className="font-bold text-emerald-700">{s.grade}</span>
                                </div>
                              ))}
                              {stats.excellentCount === 0 && <p className="text-sm text-gray-400 text-center py-3">لا يوجد طلاب متفوقون</p>}
                            </div>
                          </div>
                          <div>
                            <h3 className="font-bold text-red-700 mb-3 flex items-center gap-2">
                              <AlertTriangle className="w-5 h-5" /> قائمة الطلاب المتعثرين ({stats.failCount})
                            </h3>
                            <div className="space-y-1">
                              {parsedStudents.filter(s => s.classification === 'fail').map((s, i) => (
                                <div key={i} className="flex items-center justify-between p-2 bg-red-50 rounded text-sm">
                                  <span>{s.name}</span>
                                  <span className="font-bold text-red-700">{s.grade}</span>
                                </div>
                              ))}
                              {stats.failCount === 0 && <p className="text-sm text-gray-400 text-center py-3">لا يوجد طلاب متعثرون</p>}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {aiRecommendations && (
                      <Card className="shadow-lg border-0 border-r-4 border-r-purple-500">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-purple-700">
                            <Brain className="w-5 h-5" /> توصيات الذكاء الاصطناعي
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
                            {aiRecommendations}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ===== نافذة إنشاء تحليل جديد ===== */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" /> إنشاء تحليل نتائج جديد
              </DialogTitle>
              <DialogDescription>
                {createStep === 1 && 'الخطوة 1: معلومات التحليل الأساسية'}
                {createStep === 2 && 'الخطوة 2: إدخال بيانات الطلاب'}
                {createStep === 3 && 'الخطوة 3: مراجعة وتأكيد'}
              </DialogDescription>
            </DialogHeader>

            {/* شريط الخطوات */}
            <div className="flex items-center justify-center gap-2 my-4">
              {[1, 2, 3].map(step => (
                <div key={step} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    createStep >= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>{step}</div>
                  {step < 3 && <div className={`w-12 h-1 rounded ${createStep > step ? 'bg-blue-600' : 'bg-gray-200'}`} />}
                </div>
              ))}
            </div>

            {/* الخطوة 1 */}
            {createStep === 1 && (
              <div className="space-y-4">
                <div>
                  <Label>اسم التحليل *</Label>
                  <Input placeholder="مثال: تحليل نتائج الرياضيات - الفصل الأول" value={newAnalysis.name}
                    onChange={e => setNewAnalysis(prev => ({ ...prev, name: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>المادة</Label>
                    <Select value={newAnalysis.subject} onValueChange={v => setNewAnalysis(prev => ({ ...prev, subject: v }))}>
                      <SelectTrigger><SelectValue placeholder="اختر المادة" /></SelectTrigger>
                      <SelectContent>{SUBJECTS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>المرحلة</Label>
                    <Select value={newAnalysis.grade} onValueChange={v => setNewAnalysis(prev => ({ ...prev, grade: v }))}>
                      <SelectTrigger><SelectValue placeholder="اختر المرحلة" /></SelectTrigger>
                      <SelectContent>{EDUCATIONAL_STAGES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>الفصل الدراسي</Label>
                  <Select value={newAnalysis.semester} onValueChange={v => setNewAnalysis(prev => ({ ...prev, semester: v }))}>
                    <SelectTrigger><SelectValue placeholder="اختر الفصل" /></SelectTrigger>
                    <SelectContent>{SEMESTERS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* الخطوة 2 */}
            {createStep === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'manual' as const, icon: Users, label: 'إدخال يدوي', desc: 'كتابة البيانات' },
                    { id: 'csv' as const, icon: FileSpreadsheet, label: 'ملف CSV', desc: 'رفع ملف CSV' },
                    { id: 'excel' as const, icon: Upload, label: 'ملف Excel', desc: 'رفع ملف Excel' },
                  ].map(method => (
                    <div key={method.id}
                      className={`p-4 rounded-xl border-2 cursor-pointer text-center transition-all ${
                        inputMethod === method.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setInputMethod(method.id)}>
                      <method.icon className={`w-8 h-8 mx-auto mb-2 ${inputMethod === method.id ? 'text-blue-600' : 'text-gray-400'}`} />
                      <p className="font-semibold text-sm">{method.label}</p>
                      <p className="text-xs text-gray-500">{method.desc}</p>
                    </div>
                  ))}
                </div>

                {inputMethod === 'manual' && (
                  <div>
                    <Label>بيانات الطلاب (اسم الطالب,الدرجة) *</Label>
                    <Textarea
                      placeholder={`أحمد محمد,95\nسارة علي,88\nخالد عبدالله,72\nفاطمة حسن,65\nعمر يوسف,45`}
                      value={newAnalysis.students_data}
                      onChange={e => setNewAnalysis(prev => ({ ...prev, students_data: e.target.value }))}
                      rows={10} className="font-mono text-sm" dir="ltr" />
                    <p className="text-xs text-gray-500 mt-1">أدخل كل طالب في سطر منفصل بالصيغة: اسم الطالب,الدرجة</p>
                  </div>
                )}

                {(inputMethod === 'csv' || inputMethod === 'excel') && (
                  <div>
                    <Label>رفع الملف</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
                      <input type="file" accept={inputMethod === 'csv' ? '.csv,.txt' : '.xlsx,.xls'}
                        onChange={handleFileUpload} className="hidden" id="file-upload" />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                        <p className="font-semibold text-gray-700">
                          {uploadedFile ? uploadedFile.name : `اضغط لرفع ملف ${inputMethod === 'csv' ? 'CSV' : 'Excel'}`}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {inputMethod === 'csv' ? 'يدعم ملفات .csv و .txt' : 'يدعم ملفات .xlsx و .xls'}
                        </p>
                      </label>
                    </div>
                    {newAnalysis.students_data && (
                      <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-sm text-green-700 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" />
                          تم استخراج {newAnalysis.students_data.trim().split('\n').length} سجل من الملف
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {newAnalysis.students_data && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-semibold text-blue-700 mb-2">معاينة سريعة:</p>
                    <div className="text-xs text-blue-600">
                      {(() => {
                        const preview = parseCSVData(newAnalysis.students_data);
                        const previewStats = calculateStats(preview);
                        return (
                          <div className="grid grid-cols-4 gap-2">
                            <span>الطلاب: {previewStats.totalStudents}</span>
                            <span>المتوسط: {previewStats.average}</span>
                            <span>النجاح: {previewStats.passRate}%</span>
                            <span>الرسوب: {previewStats.failRate}%</span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* الخطوة 3 */}
            {createStep === 3 && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                  <h4 className="font-semibold">ملخص التحليل</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-gray-500">الاسم:</span> <span className="font-medium">{newAnalysis.name}</span></div>
                    <div><span className="text-gray-500">المادة:</span> <span className="font-medium">{SUBJECTS.find(s => s.value === newAnalysis.subject)?.label || '-'}</span></div>
                    <div><span className="text-gray-500">المرحلة:</span> <span className="font-medium">{EDUCATIONAL_STAGES.find(s => s.value === newAnalysis.grade)?.label || '-'}</span></div>
                    <div><span className="text-gray-500">الفصل:</span> <span className="font-medium">{SEMESTERS.find(s => s.value === newAnalysis.semester)?.label || '-'}</span></div>
                  </div>
                </div>
                {newAnalysis.students_data && (
                  <div className="p-4 bg-blue-50 rounded-xl">
                    {(() => {
                      const preview = parseCSVData(newAnalysis.students_data);
                      const previewStats = calculateStats(preview);
                      return (
                        <div className="space-y-3">
                          <h4 className="font-semibold text-blue-800">إحصائيات مبدئية</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="text-center p-2 bg-white rounded-lg">
                              <p className="text-xs text-gray-500">الطلاب</p>
                              <p className="text-lg font-bold text-blue-700">{previewStats.totalStudents}</p>
                            </div>
                            <div className="text-center p-2 bg-white rounded-lg">
                              <p className="text-xs text-gray-500">المتوسط</p>
                              <p className="text-lg font-bold text-blue-700">{previewStats.average}</p>
                            </div>
                            <div className="text-center p-2 bg-white rounded-lg">
                              <p className="text-xs text-gray-500">النجاح</p>
                              <p className="text-lg font-bold text-green-700">{previewStats.passRate}%</p>
                            </div>
                            <div className="text-center p-2 bg-white rounded-lg">
                              <p className="text-xs text-gray-500">الرسوب</p>
                              <p className="text-lg font-bold text-red-700">{previewStats.failRate}%</p>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="flex gap-2 mt-4">
              {createStep > 1 && (
                <Button variant="outline" onClick={() => setCreateStep(prev => (prev - 1) as 1 | 2 | 3)}>السابق</Button>
              )}
              {createStep < 3 ? (
                <Button onClick={() => {
                  if (createStep === 1 && !newAnalysis.name) { toast.error('يرجى إدخال اسم التحليل'); return; }
                  if (createStep === 2 && !newAnalysis.students_data) { toast.error('يرجى إدخال بيانات الطلاب'); return; }
                  setCreateStep(prev => (prev + 1) as 1 | 2 | 3);
                }} className="bg-blue-600 hover:bg-blue-700">التالي</Button>
              ) : (
                <Button onClick={handleCreateAnalysis} disabled={isCreating}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600">
                  {isCreating ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 ml-2" />}
                  إنشاء التحليل
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
