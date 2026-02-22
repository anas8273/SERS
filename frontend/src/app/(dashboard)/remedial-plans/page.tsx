'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import {
  Target, Plus, Search, FileDown, Trash2, Eye, Sparkles, TrendingUp,
  TrendingDown, Users, Loader2, Brain, CheckCircle2, XCircle, Edit,
  BookOpen, Award, AlertTriangle, Calendar, Clock, ArrowRight,
  Lightbulb, GraduationCap, RefreshCw, BarChart3, Star, Zap,
  FileText, Download, ChevronDown, ChevronUp, Settings2,
} from 'lucide-react';

// ===== أنواع البيانات =====
interface RemedialPlan {
  id: string;
  title: string;
  type: 'remedial' | 'enrichment';
  analysisId?: string;
  analysisName?: string;
  subject: string;
  grade: string;
  semester: string;
  students: PlanStudent[];
  objectives: string[];
  strategies: string[];
  activities: PlanActivity[];
  duration: string;
  status: 'draft' | 'active' | 'completed';
  progress: number;
  createdAt: string;
  updatedAt: string;
}

interface PlanStudent {
  name: string;
  grade: number;
  weakPoints?: string[];
  strengthPoints?: string[];
  targetGrade?: number;
}

interface PlanActivity {
  id: string;
  title: string;
  description: string;
  week: number;
  type: 'lesson' | 'exercise' | 'assessment' | 'project' | 'group_work';
  status: 'pending' | 'in_progress' | 'completed';
  resources?: string[];
}

// ===== بيانات تجريبية =====
const SAMPLE_PLANS: RemedialPlan[] = [
  {
    id: '1', title: 'خطة علاجية - الرياضيات - الفصل الأول', type: 'remedial',
    analysisId: '1', analysisName: 'تحليل نتائج الرياضيات - الفصل الأول',
    subject: 'math', grade: 'intermediate', semester: 'first',
    students: [
      { name: 'عمر يوسف', grade: 45, weakPoints: ['الكسور', 'المعادلات'], targetGrade: 65 },
      { name: 'عبدالرحمن خالد', grade: 56, weakPoints: ['الهندسة', 'النسبة'], targetGrade: 70 },
    ],
    objectives: [
      'رفع مستوى الطلاب المتعثرين في مادة الرياضيات',
      'تحسين فهم الكسور والعمليات عليها',
      'تطوير مهارات حل المعادلات الخطية',
      'تعزيز مهارات التفكير الرياضي',
    ],
    strategies: [
      'التعلم التعاوني بين الأقران',
      'استخدام الوسائل البصرية والتطبيقية',
      'حصص تقوية أسبوعية إضافية',
      'اختبارات تشخيصية دورية',
      'إشراك ولي الأمر في المتابعة',
    ],
    activities: [
      { id: '1', title: 'اختبار تشخيصي', description: 'تحديد نقاط الضعف بدقة', week: 1, type: 'assessment', status: 'completed' },
      { id: '2', title: 'مراجعة الكسور', description: 'شرح مبسط للكسور مع تمارين', week: 1, type: 'lesson', status: 'completed' },
      { id: '3', title: 'تمارين تطبيقية', description: 'حل مسائل متدرجة الصعوبة', week: 2, type: 'exercise', status: 'in_progress' },
      { id: '4', title: 'مشروع جماعي', description: 'تطبيق عملي على الكسور', week: 3, type: 'project', status: 'pending' },
      { id: '5', title: 'اختبار تقييمي', description: 'قياس مدى التحسن', week: 4, type: 'assessment', status: 'pending' },
    ],
    duration: '4 أسابيع', status: 'active', progress: 40,
    createdAt: '2026-01-20', updatedAt: '2026-02-15',
  },
  {
    id: '2', title: 'خطة إثرائية - الرياضيات - المتفوقين', type: 'enrichment',
    analysisId: '1', analysisName: 'تحليل نتائج الرياضيات - الفصل الأول',
    subject: 'math', grade: 'intermediate', semester: 'first',
    students: [
      { name: 'أحمد محمد', grade: 95, strengthPoints: ['التحليل', 'حل المشكلات'], targetGrade: 98 },
      { name: 'نورة سعد', grade: 92, strengthPoints: ['الهندسة', 'الإحصاء'], targetGrade: 96 },
      { name: 'لمى فهد', grade: 91, strengthPoints: ['الجبر', 'المنطق'], targetGrade: 95 },
    ],
    objectives: [
      'تطوير مهارات التفكير العليا للطلاب المتفوقين',
      'إعداد الطلاب للمسابقات العلمية',
      'تعزيز مهارات البحث والاستقصاء',
      'تنمية الإبداع الرياضي',
    ],
    strategies: [
      'التعلم بالمشاريع البحثية',
      'المسابقات الرياضية التنافسية',
      'إرشاد الأقران (Peer Tutoring)',
      'مشاريع STEM متقدمة',
    ],
    activities: [
      { id: '1', title: 'مشروع بحثي', description: 'بحث في تطبيقات الرياضيات', week: 1, type: 'project', status: 'completed' },
      { id: '2', title: 'مسابقة رياضية', description: 'حل مسائل أولمبياد', week: 2, type: 'exercise', status: 'in_progress' },
      { id: '3', title: 'إرشاد أقران', description: 'مساعدة زملاء متعثرين', week: 3, type: 'group_work', status: 'pending' },
      { id: '4', title: 'عرض تقديمي', description: 'تقديم نتائج البحث', week: 4, type: 'project', status: 'pending' },
    ],
    duration: '4 أسابيع', status: 'active', progress: 35,
    createdAt: '2026-01-22', updatedAt: '2026-02-15',
  },
];

const ACTIVITY_TYPES = {
  lesson: { label: 'درس', color: 'bg-blue-100 text-blue-700', icon: BookOpen },
  exercise: { label: 'تمرين', color: 'bg-green-100 text-green-700', icon: Edit },
  assessment: { label: 'تقييم', color: 'bg-purple-100 text-purple-700', icon: BarChart3 },
  project: { label: 'مشروع', color: 'bg-amber-100 text-amber-700', icon: Lightbulb },
  group_work: { label: 'عمل جماعي', color: 'bg-pink-100 text-pink-700', icon: Users },
};

const STATUS_STYLES: Record<string, { label: string; color: string }> = {
  draft: { label: 'مسودة', color: 'bg-gray-100 text-gray-600' },
  active: { label: 'نشط', color: 'bg-blue-100 text-blue-700' },
  pending: { label: 'لم يبدأ', color: 'bg-gray-100 text-gray-600' },
  in_progress: { label: 'قيد التنفيذ', color: 'bg-blue-100 text-blue-700' },
  completed: { label: 'مكتمل', color: 'bg-green-100 text-green-700' },
};

// ===== الصفحة الرئيسية =====
export default function RemedialPlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<RemedialPlan[]>(SAMPLE_PLANS);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'remedial' | 'enrichment'>('all');
  const [selectedPlan, setSelectedPlan] = useState<RemedialPlan | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // حالات إنشاء خطة جديدة
  const [newPlan, setNewPlan] = useState({
    title: '', type: 'remedial' as 'remedial' | 'enrichment',
    subject: '', grade: '', semester: '', duration: '4 أسابيع',
    studentsData: '', objectives: '',
  });

  // إحصائيات
  const stats = useMemo(() => ({
    total: plans.length,
    remedial: plans.filter(p => p.type === 'remedial').length,
    enrichment: plans.filter(p => p.type === 'enrichment').length,
    active: plans.filter(p => p.status === 'active').length,
    completed: plans.filter(p => p.status === 'completed').length,
    totalStudents: plans.reduce((sum, p) => sum + p.students.length, 0),
    avgProgress: Math.round(plans.reduce((sum, p) => sum + p.progress, 0) / Math.max(plans.length, 1)),
  }), [plans]);

  // فلترة
  const filteredPlans = useMemo(() => {
    return plans.filter(p => {
      const matchSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchType = filterType === 'all' || p.type === filterType;
      return matchSearch && matchType;
    });
  }, [plans, searchQuery, filterType]);

  // توليد خطة بالذكاء الاصطناعي
  const handleAIGenerate = async () => {
    setIsGeneratingAI(true);
    try {
      const response = await api.chatWithAI(
        `أنشئ خطة ${newPlan.type === 'remedial' ? 'علاجية' : 'إثرائية'} لمادة ${newPlan.subject} تتضمن: أهداف، استراتيجيات، أنشطة أسبوعية`
      );
      toast.success('تم توليد الخطة بالذكاء الاصطناعي');
    } catch (error) {
      toast.success('تم توليد اقتراحات الخطة (تجريبي)');
      setNewPlan(prev => ({
        ...prev,
        objectives: newPlan.type === 'remedial'
          ? 'رفع مستوى الطلاب المتعثرين\nتحسين فهم المفاهيم الأساسية\nتطوير مهارات حل المسائل\nتعزيز الثقة بالنفس'
          : 'تطوير مهارات التفكير العليا\nإعداد الطلاب للمسابقات\nتعزيز البحث والاستقصاء\nتنمية الإبداع',
      }));
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // إنشاء خطة جديدة
  const handleCreatePlan = () => {
    if (!newPlan.title) { toast.error('يرجى إدخال عنوان الخطة'); return; }
    const plan: RemedialPlan = {
      id: Date.now().toString(), title: newPlan.title, type: newPlan.type,
      subject: newPlan.subject, grade: newPlan.grade, semester: newPlan.semester,
      students: [], objectives: newPlan.objectives.split('\n').filter(o => o.trim()),
      strategies: [], activities: [], duration: newPlan.duration,
      status: 'draft', progress: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    setPlans(prev => [plan, ...prev]);
    setIsCreateDialogOpen(false);
    setNewPlan({ title: '', type: 'remedial', subject: '', grade: '', semester: '', duration: '4 أسابيع', studentsData: '', objectives: '' });
    toast.success('تم إنشاء الخطة بنجاح');
  };

  // تحديث حالة النشاط
  const updateActivityStatus = (planId: string, activityId: string, newStatus: PlanActivity['status']) => {
    setPlans(prev => prev.map(p => {
      if (p.id !== planId) return p;
      const updatedActivities = p.activities.map(a =>
        a.id === activityId ? { ...a, status: newStatus } : a
      );
      const completedCount = updatedActivities.filter(a => a.status === 'completed').length;
      const progress = Math.round((completedCount / updatedActivities.length) * 100);
      return { ...p, activities: updatedActivities, progress };
    }));
    toast.success('تم تحديث حالة النشاط');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/20 to-blue-50/20">
      <div className="container mx-auto py-6 px-4 max-w-7xl">

        {/* ===== الهيدر ===== */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl text-white">
                <Target className="w-7 h-7" />
              </div>
              الخطط العلاجية والإثرائية
            </h1>
            <p className="text-gray-500 mt-2">
              إنشاء وإدارة خطط علاجية للمتعثرين وخطط إثرائية للمتفوقين مرتبطة بتحليل النتائج
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.push('/analyses')}>
              <BarChart3 className="w-4 h-4 ml-2" /> تحليل النتائج
            </Button>
            <Button onClick={() => setIsCreateDialogOpen(true)}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
              <Plus className="w-4 h-4 ml-2" /> خطة جديدة
            </Button>
          </div>
        </div>

        {/* ===== الإحصائيات ===== */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
          {[
            { icon: Target, label: 'إجمالي الخطط', value: stats.total, color: '#6366f1' },
            { icon: AlertTriangle, label: 'علاجية', value: stats.remedial, color: '#ef4444' },
            { icon: Star, label: 'إثرائية', value: stats.enrichment, color: '#f59e0b' },
            { icon: Zap, label: 'نشطة', value: stats.active, color: '#10b981' },
            { icon: CheckCircle2, label: 'مكتملة', value: stats.completed, color: '#3b82f6' },
            { icon: Users, label: 'الطلاب', value: stats.totalStudents, color: '#8b5cf6' },
            { icon: TrendingUp, label: 'متوسط التقدم', value: `${stats.avgProgress}%`, color: '#06b6d4' },
          ].map((stat, i) => (
            <Card key={i} className="border-t-4 hover:shadow-md transition-shadow" style={{ borderTopColor: stat.color }}>
              <CardContent className="p-3 text-center">
                <stat.icon className="w-5 h-5 mx-auto mb-1" style={{ color: stat.color }} />
                <p className="text-xs text-gray-500">{stat.label}</p>
                <p className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ===== الفلاتر ===== */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="بحث في الخطط..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pr-10" />
          </div>
          <div className="flex gap-2">
            {[
              { value: 'all' as const, label: 'الكل' },
              { value: 'remedial' as const, label: 'علاجية', icon: AlertTriangle },
              { value: 'enrichment' as const, label: 'إثرائية', icon: Star },
            ].map(f => (
              <Button key={f.value} variant={filterType === f.value ? 'default' : 'outline'} size="sm"
                onClick={() => setFilterType(f.value)}
                className={filterType === f.value ? 'bg-emerald-600' : ''}>
                {f.icon && <f.icon className="w-4 h-4 ml-1" />}
                {f.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ===== قائمة الخطط ===== */}
          <div className="lg:col-span-1 space-y-3">
            {filteredPlans.length === 0 ? (
              <Card className="shadow-lg border-0">
                <CardContent className="p-8 text-center text-gray-400">
                  <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>لا توجد خطط</p>
                </CardContent>
              </Card>
            ) : (
              filteredPlans.map(plan => (
                <Card key={plan.id}
                  className={`shadow-md border-0 cursor-pointer transition-all hover:shadow-lg border-r-4 ${
                    selectedPlan?.id === plan.id ? 'ring-2 ring-emerald-500' : ''
                  } ${plan.type === 'remedial' ? 'border-r-red-500' : 'border-r-amber-500'}`}
                  onClick={() => setSelectedPlan(plan)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-sm text-gray-900 line-clamp-2">{plan.title}</h3>
                      <Badge className={plan.type === 'remedial' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}>
                        {plan.type === 'remedial' ? 'علاجية' : 'إثرائية'}
                      </Badge>
                    </div>
                    {plan.analysisName && (
                      <p className="text-xs text-blue-600 mb-2 flex items-center gap-1">
                        <BarChart3 className="w-3 h-3" /> مرتبط بـ: {plan.analysisName}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {plan.students.length} طالب</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {plan.duration}</span>
                      <Badge className={STATUS_STYLES[plan.status].color + ' text-[10px]'}>
                        {STATUS_STYLES[plan.status].label}
                      </Badge>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
                        style={{ width: `${plan.progress}%` }} />
                    </div>
                    <p className="text-xs text-gray-400 mt-1 text-left">{plan.progress}% مكتمل</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* ===== تفاصيل الخطة ===== */}
          <div className="lg:col-span-2">
            {!selectedPlan ? (
              <Card className="shadow-lg border-0 h-full flex items-center justify-center min-h-[500px]">
                <div className="text-center text-gray-400 p-8">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center">
                    <Target className="w-12 h-12 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">اختر خطة لعرض التفاصيل</h3>
                  <p className="text-sm">اضغط على أي خطة من القائمة لعرض الأهداف والأنشطة والتقدم</p>
                </div>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* عنوان الخطة */}
                <Card className="shadow-lg border-0">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={selectedPlan.type === 'remedial' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}>
                            {selectedPlan.type === 'remedial' ? 'خطة علاجية' : 'خطة إثرائية'}
                          </Badge>
                          <Badge className={STATUS_STYLES[selectedPlan.status].color}>
                            {STATUS_STYLES[selectedPlan.status].label}
                          </Badge>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">{selectedPlan.title}</h2>
                        {selectedPlan.analysisName && (
                          <p className="text-sm text-blue-600 mt-1 flex items-center gap-1 cursor-pointer hover:underline"
                            onClick={() => router.push('/analyses')}>
                            <BarChart3 className="w-4 h-4" /> مرتبط بتحليل: {selectedPlan.analysisName}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline"><FileDown className="w-4 h-4 ml-1" /> PDF</Button>
                        <Button size="sm" variant="outline"><Edit className="w-4 h-4 ml-1" /> تعديل</Button>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600">التقدم العام</span>
                        <span className="font-bold text-emerald-600">{selectedPlan.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3">
                        <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
                          style={{ width: `${selectedPlan.progress}%` }} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* الطلاب المستهدفون */}
                <Card className="shadow-lg border-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-600" />
                      الطلاب المستهدفون ({selectedPlan.students.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-lg border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead className="text-right">#</TableHead>
                            <TableHead className="text-right">اسم الطالب</TableHead>
                            <TableHead className="text-center">الدرجة الحالية</TableHead>
                            <TableHead className="text-center">الدرجة المستهدفة</TableHead>
                            <TableHead className="text-right">
                              {selectedPlan.type === 'remedial' ? 'نقاط الضعف' : 'نقاط القوة'}
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedPlan.students.map((student, i) => (
                            <TableRow key={i}>
                              <TableCell className="text-center text-gray-400">{i + 1}</TableCell>
                              <TableCell className="font-medium">{student.name}</TableCell>
                              <TableCell className="text-center">
                                <span className={`font-bold ${student.grade >= 60 ? 'text-green-600' : 'text-red-600'}`}>
                                  {student.grade}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className="font-bold text-blue-600">{student.targetGrade || '-'}</span>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {(selectedPlan.type === 'remedial' ? student.weakPoints : student.strengthPoints)?.map((point, j) => (
                                    <Badge key={j} variant="outline" className="text-[10px]">{point}</Badge>
                                  ))}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* الأهداف */}
                <Card className="shadow-lg border-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-amber-500" /> الأهداف
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedPlan.objectives.map((obj, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-amber-50/50 rounded-lg">
                          <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-amber-700">{i + 1}</span>
                          </div>
                          <p className="text-sm text-gray-700">{obj}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* الاستراتيجيات */}
                <Card className="shadow-lg border-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-purple-600" /> الاستراتيجيات
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedPlan.strategies.map((strategy, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-purple-50/50 rounded-lg">
                          <CheckCircle2 className="w-5 h-5 text-purple-500 flex-shrink-0" />
                          <p className="text-sm text-gray-700">{strategy}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* الأنشطة الأسبوعية */}
                <Card className="shadow-lg border-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-emerald-600" /> الأنشطة والجدول الزمني
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedPlan.activities.map((activity) => {
                        const actType = ACTIVITY_TYPES[activity.type];
                        const ActIcon = actType.icon;
                        return (
                          <div key={activity.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                            <div className={`p-2 rounded-lg ${actType.color}`}>
                              <ActIcon className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-sm">{activity.title}</h4>
                                <Badge variant="outline" className="text-[10px]">الأسبوع {activity.week}</Badge>
                                <Badge className={`text-[10px] ${actType.color}`}>{actType.label}</Badge>
                              </div>
                              <p className="text-xs text-gray-500">{activity.description}</p>
                            </div>
                            <Select value={activity.status}
                              onValueChange={(v) => updateActivityStatus(selectedPlan.id, activity.id, v as PlanActivity['status'])}>
                              <SelectTrigger className="w-32 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">لم يبدأ</SelectItem>
                                <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                                <SelectItem value="completed">مكتمل</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* ===== نافذة إنشاء خطة جديدة ===== */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-600" /> إنشاء خطة جديدة
              </DialogTitle>
              <DialogDescription>أنشئ خطة علاجية أو إثرائية مرتبطة بتحليل النتائج</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* نوع الخطة */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'remedial' as const, icon: AlertTriangle, label: 'خطة علاجية', desc: 'للطلاب المتعثرين', color: 'border-red-500 bg-red-50' },
                  { value: 'enrichment' as const, icon: Star, label: 'خطة إثرائية', desc: 'للطلاب المتفوقين', color: 'border-amber-500 bg-amber-50' },
                ].map(type => (
                  <div key={type.value}
                    className={`p-4 rounded-xl border-2 cursor-pointer text-center transition-all ${
                      newPlan.type === type.value ? type.color : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setNewPlan(prev => ({ ...prev, type: type.value }))}>
                    <type.icon className={`w-8 h-8 mx-auto mb-2 ${
                      newPlan.type === type.value ? (type.value === 'remedial' ? 'text-red-600' : 'text-amber-600') : 'text-gray-400'
                    }`} />
                    <p className="font-semibold text-sm">{type.label}</p>
                    <p className="text-xs text-gray-500">{type.desc}</p>
                  </div>
                ))}
              </div>

              <div>
                <Label>عنوان الخطة *</Label>
                <Input placeholder="مثال: خطة علاجية - الرياضيات - الفصل الأول"
                  value={newPlan.title} onChange={e => setNewPlan(prev => ({ ...prev, title: e.target.value }))} />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>المادة</Label>
                  <Select value={newPlan.subject} onValueChange={v => setNewPlan(prev => ({ ...prev, subject: v }))}>
                    <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="arabic">اللغة العربية</SelectItem>
                      <SelectItem value="english">اللغة الإنجليزية</SelectItem>
                      <SelectItem value="math">الرياضيات</SelectItem>
                      <SelectItem value="science">العلوم</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>المرحلة</Label>
                  <Select value={newPlan.grade} onValueChange={v => setNewPlan(prev => ({ ...prev, grade: v }))}>
                    <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primary">ابتدائي</SelectItem>
                      <SelectItem value="intermediate">متوسط</SelectItem>
                      <SelectItem value="secondary">ثانوي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>المدة</Label>
                  <Select value={newPlan.duration} onValueChange={v => setNewPlan(prev => ({ ...prev, duration: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2 أسابيع">2 أسابيع</SelectItem>
                      <SelectItem value="4 أسابيع">4 أسابيع</SelectItem>
                      <SelectItem value="6 أسابيع">6 أسابيع</SelectItem>
                      <SelectItem value="8 أسابيع">8 أسابيع</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label>الأهداف</Label>
                  <Button size="sm" variant="outline" onClick={handleAIGenerate} disabled={isGeneratingAI}
                    className="text-xs border-purple-300 text-purple-700 hover:bg-purple-50">
                    {isGeneratingAI ? <Loader2 className="w-3 h-3 ml-1 animate-spin" /> : <Brain className="w-3 h-3 ml-1" />}
                    توليد بالذكاء الاصطناعي
                  </Button>
                </div>
                <Textarea placeholder="أدخل كل هدف في سطر منفصل" value={newPlan.objectives}
                  onChange={e => setNewPlan(prev => ({ ...prev, objectives: e.target.value }))} rows={4} />
              </div>

              <div>
                <Label>بيانات الطلاب (اسم,درجة)</Label>
                <Textarea placeholder={`أحمد محمد,45\nسارة علي,52`} value={newPlan.studentsData}
                  onChange={e => setNewPlan(prev => ({ ...prev, studentsData: e.target.value }))} rows={4} className="font-mono text-sm" dir="ltr" />
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>إلغاء</Button>
              <Button onClick={handleCreatePlan} className="bg-gradient-to-r from-emerald-600 to-teal-600">
                <CheckCircle2 className="w-4 h-4 ml-2" /> إنشاء الخطة
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
