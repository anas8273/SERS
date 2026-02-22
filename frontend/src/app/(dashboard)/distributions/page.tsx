'use client';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  CalendarDays, Plus, Search, FileDown, Trash2, Eye, Sparkles,
  Calendar, CheckCircle2, Loader2, Brain, Edit, BookOpen,
  FileText, Download, Clock, Filter, BarChart3, Copy,
  Printer, Table, Grid3X3, List, ArrowRight, ChevronLeft,
  ChevronRight, GraduationCap, Target, Layers, Settings,
} from 'lucide-react';

// ===== أنواع التوزيعات =====
const DISTRIBUTION_TYPES = {
  weekly: { label: 'خطة أسبوعية', icon: Calendar, color: 'bg-blue-100 text-blue-700', gradient: 'from-blue-500 to-blue-600' },
  monthly: { label: 'خطة شهرية', icon: CalendarDays, color: 'bg-purple-100 text-purple-700', gradient: 'from-purple-500 to-purple-600' },
  semester: { label: 'خطة فصلية', icon: Layers, color: 'bg-green-100 text-green-700', gradient: 'from-green-500 to-green-600' },
  curriculum: { label: 'توزيع منهج', icon: BookOpen, color: 'bg-amber-100 text-amber-700', gradient: 'from-amber-500 to-amber-600' },
};

interface DistributionPlan {
  id: string;
  title: string;
  type: keyof typeof DISTRIBUTION_TYPES;
  subject: string;
  grade: string;
  semester: string;
  year: string;
  startDate: string;
  endDate: string;
  status: 'draft' | 'active' | 'completed';
  weeks: WeekPlan[];
  totalHours: number;
  completedHours: number;
}

interface WeekPlan {
  weekNumber: number;
  startDate: string;
  endDate: string;
  topic: string;
  objectives: string[];
  activities: string[];
  assessment: string;
  notes: string;
  isCompleted: boolean;
}

const STATUS_MAP = {
  draft: { label: 'مسودة', color: 'bg-gray-100 text-gray-700' },
  active: { label: 'نشط', color: 'bg-emerald-100 text-emerald-700' },
  completed: { label: 'مكتمل', color: 'bg-blue-100 text-blue-700' },
};

const SAMPLE_PLANS: DistributionPlan[] = [
  {
    id: '1', title: 'توزيع منهج الرياضيات - 3م', type: 'semester',
    subject: 'الرياضيات', grade: 'الثالث المتوسط', semester: 'الفصل الثاني',
    year: '1447هـ', startDate: '2026-01-18', endDate: '2026-05-30',
    status: 'active', totalHours: 60, completedHours: 20,
    weeks: [
      { weekNumber: 1, startDate: '2026-01-18', endDate: '2026-01-22', topic: 'المعادلات الخطية', objectives: ['حل المعادلات من الدرجة الأولى', 'تمثيل المعادلات بيانياً'], activities: ['حل تمارين', 'نشاط جماعي'], assessment: 'واجب منزلي', notes: '', isCompleted: true },
      { weekNumber: 2, startDate: '2026-01-25', endDate: '2026-01-29', topic: 'المتباينات', objectives: ['حل المتباينات', 'تمثيل المتباينات على خط الأعداد'], activities: ['ورقة عمل', 'تعلم تعاوني'], assessment: 'اختبار قصير', notes: '', isCompleted: true },
      { weekNumber: 3, startDate: '2026-02-01', endDate: '2026-02-05', topic: 'الدوال', objectives: ['مفهوم الدالة', 'تمثيل الدوال'], activities: ['استكشاف', 'تطبيق عملي'], assessment: 'مشروع', notes: '', isCompleted: true },
      { weekNumber: 4, startDate: '2026-02-08', endDate: '2026-02-12', topic: 'الدوال الخطية', objectives: ['الميل', 'معادلة الخط المستقيم'], activities: ['GeoGebra', 'حل مسائل'], assessment: 'واجب', notes: '', isCompleted: true },
      { weekNumber: 5, startDate: '2026-02-15', endDate: '2026-02-19', topic: 'أنظمة المعادلات', objectives: ['حل نظام معادلتين', 'طريقة الحذف والتعويض'], activities: ['تعلم نشط', 'مسائل حياتية'], assessment: 'اختبار فترة', notes: 'اختبار الفترة الأولى', isCompleted: false },
      { weekNumber: 6, startDate: '2026-02-22', endDate: '2026-02-26', topic: 'الأشكال الهندسية', objectives: ['خصائص المثلثات', 'التطابق'], activities: ['أنشطة عملية', 'قياسات'], assessment: 'ورقة عمل', notes: '', isCompleted: false },
    ],
  },
  {
    id: '2', title: 'خطة أسبوعية - الأسبوع 5', type: 'weekly',
    subject: 'الرياضيات', grade: 'الثالث المتوسط', semester: 'الفصل الثاني',
    year: '1447هـ', startDate: '2026-02-15', endDate: '2026-02-19',
    status: 'active', totalHours: 5, completedHours: 3,
    weeks: [
      { weekNumber: 1, startDate: '2026-02-15', endDate: '2026-02-19', topic: 'أنظمة المعادلات', objectives: ['حل نظام معادلتين بالحذف', 'حل نظام معادلتين بالتعويض', 'تطبيقات حياتية'], activities: ['شرح + أمثلة', 'تعلم تعاوني', 'حل مسائل', 'مراجعة'], assessment: 'اختبار فترة', notes: '', isCompleted: false },
    ],
  },
];

export default function DistributionsPage() {
  const [plans, setPlans] = useState<DistributionPlan[]>(SAMPLE_PLANS);
  const [selectedPlan, setSelectedPlan] = useState<DistributionPlan | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAIGenerating, setIsAIGenerating] = useState(false);

  const [newPlan, setNewPlan] = useState({
    title: '', type: 'semester' as keyof typeof DISTRIBUTION_TYPES,
    subject: '', grade: '', semester: '', weeksCount: 16,
  });

  const stats = useMemo(() => ({
    total: plans.length,
    active: plans.filter(p => p.status === 'active').length,
    completed: plans.filter(p => p.status === 'completed').length,
    avgProgress: plans.length > 0
      ? Math.round(plans.reduce((sum, p) => sum + (p.totalHours > 0 ? (p.completedHours / p.totalHours * 100) : 0), 0) / plans.length)
      : 0,
  }), [plans]);

  const filteredPlans = useMemo(() => {
    return plans.filter(p => {
      const matchSearch = p.title.includes(searchQuery) || p.subject.includes(searchQuery);
      const matchType = filterType === 'all' || p.type === filterType;
      return matchSearch && matchType;
    });
  }, [plans, searchQuery, filterType]);

  const handleAIGenerate = () => {
    setIsAIGenerating(true);
    setTimeout(() => {
      setIsAIGenerating(false);
      toast.success('تم توليد التوزيع بالذكاء الاصطناعي! يمكنك التعديل عليه.');
      setIsCreateDialogOpen(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-cyan-50/20">
      <div className="container mx-auto py-6 px-4 max-w-7xl">

        {/* ===== الهيدر ===== */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-xl text-white">
                <CalendarDays className="w-7 h-7" />
              </div>
              التوزيعات والخطط
            </h1>
            <p className="text-gray-500 mt-2">إدارة توزيعات المنهج والخطط الأسبوعية والشهرية والفصلية</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline"><FileDown className="w-4 h-4 ml-2" /> تصدير</Button>
            <Button onClick={() => setIsCreateDialogOpen(true)}
              className="bg-gradient-to-r from-cyan-600 to-blue-600">
              <Plus className="w-4 h-4 ml-2" /> خطة جديدة
            </Button>
          </div>
        </div>

        {/* ===== الإحصائيات ===== */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { icon: CalendarDays, label: 'إجمالي الخطط', value: stats.total, color: '#0891b2' },
            { icon: CheckCircle2, label: 'نشطة', value: stats.active, color: '#10b981' },
            { icon: Target, label: 'مكتملة', value: stats.completed, color: '#3b82f6' },
            { icon: BarChart3, label: 'متوسط التقدم', value: `${stats.avgProgress}%`, color: '#8b5cf6' },
          ].map((s, i) => (
            <Card key={i} className="border-t-4" style={{ borderTopColor: s.color }}>
              <CardContent className="p-3 text-center">
                <s.icon className="w-5 h-5 mx-auto mb-1" style={{ color: s.color }} />
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ===== الفلاتر ===== */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="بحث..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pr-10" />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-44"><SelectValue placeholder="النوع" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأنواع</SelectItem>
              {Object.entries(DISTRIBUTION_TYPES).map(([key, type]) => (
                <SelectItem key={key} value={key}>{type.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ===== عرض الخطط ===== */}
        {!selectedPlan ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPlans.map(plan => {
              const typeInfo = DISTRIBUTION_TYPES[plan.type];
              const TypeIcon = typeInfo.icon;
              const statusInfo = STATUS_MAP[plan.status];
              const progress = plan.totalHours > 0 ? Math.round((plan.completedHours / plan.totalHours) * 100) : 0;
              return (
                <Card key={plan.id} className="shadow-md border-0 hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => setSelectedPlan(plan)}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`p-2 rounded-lg ${typeInfo.color}`}>
                        <TypeIcon className="w-5 h-5" />
                      </div>
                      <Badge className={statusInfo.color + ' text-xs'}>{statusInfo.label}</Badge>
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">{plan.title}</h3>
                    <p className="text-sm text-gray-500 mb-3">
                      {plan.subject} - {plan.grade} - {plan.semester} {plan.year}
                    </p>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-2">
                        <div className={`h-2 rounded-full ${progress >= 80 ? 'bg-emerald-500' : progress >= 50 ? 'bg-blue-500' : 'bg-amber-500'}`}
                          style={{ width: `${progress}%` }} />
                      </div>
                      <span className="text-sm font-bold text-gray-700">{progress}%</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>{plan.completedHours}/{plan.totalHours} ساعة</span>
                      <span>{plan.weeks.length} أسبوع</span>
                      <span>{plan.startDate} → {plan.endDate}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          /* ===== تفاصيل الخطة ===== */
          <div>
            <Button variant="ghost" onClick={() => setSelectedPlan(null)} className="mb-4">
              <ChevronRight className="w-4 h-4 ml-2" /> العودة للقائمة
            </Button>

            <Card className="shadow-lg border-0 mb-6">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedPlan.title}</h2>
                    <p className="text-gray-500 mt-1">
                      {selectedPlan.subject} - {selectedPlan.grade} - {selectedPlan.semester} {selectedPlan.year}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm"><Printer className="w-4 h-4 ml-1" /> طباعة</Button>
                    <Button variant="outline" size="sm"><FileDown className="w-4 h-4 ml-1" /> PDF</Button>
                    <Button variant="outline" size="sm"><Copy className="w-4 h-4 ml-1" /> نسخ</Button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex-1 bg-gray-100 rounded-full h-3">
                    <div className="h-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                      style={{ width: `${Math.round((selectedPlan.completedHours / selectedPlan.totalHours) * 100)}%` }} />
                  </div>
                  <span className="text-sm font-bold">
                    {Math.round((selectedPlan.completedHours / selectedPlan.totalHours) * 100)}%
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* جدول الأسابيع */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white rounded-xl shadow-lg overflow-hidden">
                <thead>
                  <tr className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white">
                    <th className="p-3 text-right text-sm">الأسبوع</th>
                    <th className="p-3 text-right text-sm">التاريخ</th>
                    <th className="p-3 text-right text-sm">الموضوع</th>
                    <th className="p-3 text-right text-sm">الأهداف</th>
                    <th className="p-3 text-right text-sm">الأنشطة</th>
                    <th className="p-3 text-right text-sm">التقويم</th>
                    <th className="p-3 text-center text-sm">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPlan.weeks.map(week => (
                    <tr key={week.weekNumber} className={`border-b hover:bg-gray-50 ${week.isCompleted ? 'bg-emerald-50/50' : ''}`}>
                      <td className="p-3 text-sm font-bold text-center">{week.weekNumber}</td>
                      <td className="p-3 text-xs text-gray-500">
                        {week.startDate}<br />{week.endDate}
                      </td>
                      <td className="p-3 text-sm font-medium">{week.topic}</td>
                      <td className="p-3 text-xs">
                        <ul className="space-y-1">
                          {week.objectives.map((o, i) => <li key={i}>• {o}</li>)}
                        </ul>
                      </td>
                      <td className="p-3 text-xs">
                        <ul className="space-y-1">
                          {week.activities.map((a, i) => <li key={i}>• {a}</li>)}
                        </ul>
                      </td>
                      <td className="p-3 text-xs">{week.assessment}</td>
                      <td className="p-3 text-center">
                        {week.isCompleted ? (
                          <Badge className="bg-emerald-100 text-emerald-700"><CheckCircle2 className="w-3 h-3 ml-1" /> مكتمل</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-700"><Clock className="w-3 h-3 ml-1" /> قادم</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===== نافذة إنشاء خطة ===== */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-cyan-600" /> إنشاء خطة جديدة
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>نوع الخطة</Label>
                <Select value={newPlan.type} onValueChange={v => setNewPlan(prev => ({ ...prev, type: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(DISTRIBUTION_TYPES).map(([key, type]) => (
                      <SelectItem key={key} value={key}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>العنوان</Label>
                <Input placeholder="توزيع منهج الرياضيات - 3م" value={newPlan.title}
                  onChange={e => setNewPlan(prev => ({ ...prev, title: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>المادة</Label>
                  <Input placeholder="الرياضيات" value={newPlan.subject}
                    onChange={e => setNewPlan(prev => ({ ...prev, subject: e.target.value }))} />
                </div>
                <div>
                  <Label>الصف</Label>
                  <Input placeholder="الثالث المتوسط" value={newPlan.grade}
                    onChange={e => setNewPlan(prev => ({ ...prev, grade: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>الفصل الدراسي</Label>
                <Input placeholder="الفصل الثاني 1447هـ" value={newPlan.semester}
                  onChange={e => setNewPlan(prev => ({ ...prev, semester: e.target.value }))} />
              </div>
              <div>
                <Label>عدد الأسابيع</Label>
                <Input type="number" min={1} max={52} value={newPlan.weeksCount}
                  onChange={e => setNewPlan(prev => ({ ...prev, weeksCount: Number(e.target.value) }))} />
              </div>

              <div className="p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl">
                <h4 className="font-semibold text-cyan-800 mb-2 flex items-center gap-2">
                  <Brain className="w-4 h-4" /> توليد ذكي بالذكاء الاصطناعي
                </h4>
                <p className="text-xs text-cyan-700 mb-3">
                  يمكن للذكاء الاصطناعي توليد توزيع كامل للمنهج بناءً على المعلومات المدخلة
                </p>
                <Button className="w-full bg-gradient-to-r from-cyan-600 to-blue-600" onClick={handleAIGenerate} disabled={isAIGenerating}>
                  {isAIGenerating ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Sparkles className="w-4 h-4 ml-2" />}
                  توليد التوزيع تلقائياً
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>إلغاء</Button>
              <Button className="bg-cyan-600 hover:bg-cyan-700">
                <CheckCircle2 className="w-4 h-4 ml-2" /> إنشاء يدوياً
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
