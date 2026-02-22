'use client';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  ClipboardCheck, Plus, Search, FileDown, Trash2, Eye, Sparkles,
  Calendar, CheckCircle2, Loader2, Brain, TrendingUp, Edit,
  BarChart3, FileText, Download, Upload, Printer, Star,
  AlertCircle, Clock, Target, Award, Shield, BookOpen,
  Users, Settings, Briefcase, GraduationCap, Heart, Lightbulb,
} from 'lucide-react';

// ===== 11 بند لشواهد الأداء الوظيفي =====
const PERFORMANCE_CRITERIA = [
  {
    id: 1, title: 'التخطيط للتعلم', icon: Target,
    description: 'إعداد خطط دراسية واضحة ومتنوعة تراعي الفروق الفردية',
    subItems: ['الخطة الفصلية', 'التحضير اليومي', 'تنويع الاستراتيجيات', 'مراعاة الفروق الفردية'],
    maxScore: 10, color: '#3b82f6',
  },
  {
    id: 2, title: 'تهيئة بيئة التعلم', icon: BookOpen,
    description: 'توفير بيئة تعليمية آمنة ومحفزة وداعمة للتعلم',
    subItems: ['تنظيم الفصل', 'الوسائل التعليمية', 'التقنيات الحديثة', 'البيئة المحفزة'],
    maxScore: 10, color: '#8b5cf6',
  },
  {
    id: 3, title: 'تنفيذ التعلم', icon: GraduationCap,
    description: 'تنفيذ الدروس بفاعلية مع استخدام استراتيجيات تدريس متنوعة',
    subItems: ['إدارة وقت الحصة', 'التعلم النشط', 'الأنشطة التفاعلية', 'ربط المحتوى بالواقع'],
    maxScore: 10, color: '#10b981',
  },
  {
    id: 4, title: 'تقويم التعلم', icon: ClipboardCheck,
    description: 'استخدام أساليب تقويم متنوعة لقياس تحصيل الطلاب',
    subItems: ['التقويم التشخيصي', 'التقويم التكويني', 'التقويم الختامي', 'تحليل النتائج'],
    maxScore: 10, color: '#f59e0b',
  },
  {
    id: 5, title: 'الأنشطة المدرسية', icon: Star,
    description: 'المشاركة الفعالة في الأنشطة المدرسية اللاصفية',
    subItems: ['الأنشطة اللاصفية', 'المسابقات', 'الفعاليات المدرسية', 'الرحلات التعليمية'],
    maxScore: 10, color: '#ef4444',
  },
  {
    id: 6, title: 'التطوير المهني', icon: TrendingUp,
    description: 'السعي المستمر للتطوير المهني والتعلم الذاتي',
    subItems: ['الدورات التدريبية', 'ورش العمل', 'القراءة المهنية', 'التعلم الذاتي'],
    maxScore: 10, color: '#06b6d4',
  },
  {
    id: 7, title: 'المسؤولية المهنية', icon: Shield,
    description: 'الالتزام بأخلاقيات المهنة والمسؤوليات الوظيفية',
    subItems: ['الانضباط', 'الالتزام بالأنظمة', 'أخلاقيات المهنة', 'السرية المهنية'],
    maxScore: 10, color: '#64748b',
  },
  {
    id: 8, title: 'التعامل مع أولياء الأمور', icon: Users,
    description: 'بناء علاقات إيجابية مع أولياء الأمور والتواصل الفعال',
    subItems: ['الاجتماعات الدورية', 'التواصل الإلكتروني', 'تقارير الأداء', 'المشاركة في القرارات'],
    maxScore: 10, color: '#ec4899',
  },
  {
    id: 9, title: 'التعامل مع الزملاء', icon: Heart,
    description: 'التعاون مع الزملاء وتبادل الخبرات المهنية',
    subItems: ['العمل الجماعي', 'تبادل الخبرات', 'الزيارات الصفية', 'المجتمعات المهنية'],
    maxScore: 10, color: '#f97316',
  },
  {
    id: 10, title: 'استخدام التقنية', icon: Settings,
    description: 'توظيف التقنية في العملية التعليمية بشكل فعال',
    subItems: ['المنصات التعليمية', 'الأدوات الرقمية', 'المحتوى الرقمي', 'التعليم عن بعد'],
    maxScore: 10, color: '#14b8a6',
  },
  {
    id: 11, title: 'الإبداع والابتكار', icon: Lightbulb,
    description: 'تقديم أفكار إبداعية ومبادرات تطويرية',
    subItems: ['المبادرات', 'الأفكار الإبداعية', 'المشاريع التطويرية', 'الحلول المبتكرة'],
    maxScore: 10, color: '#a855f7',
  },
];

interface EvidenceRecord {
  id: string;
  criterionId: number;
  title: string;
  description: string;
  score: number;
  attachments: string[];
  date: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
}

const SAMPLE_RECORDS: EvidenceRecord[] = [
  { id: '1', criterionId: 1, title: 'خطة فصلية للرياضيات', description: 'إعداد خطة فصلية شاملة لمادة الرياضيات للصف الثالث المتوسط', score: 9, attachments: ['خطة_فصلية.pdf'], date: '2026-02-20', status: 'approved' },
  { id: '2', criterionId: 3, title: 'تطبيق التعلم التعاوني', description: 'تنفيذ حصة نموذجية باستخدام استراتيجية التعلم التعاوني', score: 8, attachments: ['صور_الحصة.jpg'], date: '2026-02-18', status: 'submitted' },
  { id: '3', criterionId: 6, title: 'شهادة دورة تدريبية', description: 'حضور دورة تدريبية في التقويم التكويني المستمر', score: 10, attachments: ['شهادة.pdf'], date: '2026-02-15', status: 'approved' },
  { id: '4', criterionId: 4, title: 'تحليل نتائج الاختبار', description: 'تحليل شامل لنتائج اختبار الفترة الأولى مع خطط علاجية', score: 9, attachments: ['تحليل.xlsx'], date: '2026-02-10', status: 'approved' },
];

const STATUS_MAP = {
  draft: { label: 'مسودة', color: 'bg-gray-100 text-gray-700', icon: Edit },
  submitted: { label: 'مُرسل', color: 'bg-blue-100 text-blue-700', icon: Clock },
  approved: { label: 'معتمد', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  rejected: { label: 'مرفوض', color: 'bg-red-100 text-red-700', icon: AlertCircle },
};

export default function WorkEvidencePage() {
  const [records, setRecords] = useState<EvidenceRecord[]>(SAMPLE_RECORDS);
  const [selectedCriterion, setSelectedCriterion] = useState<number | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [newRecord, setNewRecord] = useState({
    criterionId: 1, title: '', description: '', score: 8,
  });

  // إحصائيات
  const stats = useMemo(() => {
    const totalMaxScore = PERFORMANCE_CRITERIA.length * 10;
    const criteriaScores = PERFORMANCE_CRITERIA.map(c => {
      const criterionRecords = records.filter(r => r.criterionId === c.id && r.status === 'approved');
      const avgScore = criterionRecords.length > 0
        ? criterionRecords.reduce((sum, r) => sum + r.score, 0) / criterionRecords.length
        : 0;
      return { ...c, avgScore, recordCount: criterionRecords.length };
    });
    const totalScore = criteriaScores.reduce((sum, c) => sum + c.avgScore, 0);
    const percentage = Math.round((totalScore / totalMaxScore) * 100);
    return { totalScore: totalScore.toFixed(1), totalMaxScore, percentage, criteriaScores, totalRecords: records.length };
  }, [records]);

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const matchSearch = r.title.includes(searchQuery) || r.description.includes(searchQuery);
      const matchCriterion = selectedCriterion === null || r.criterionId === selectedCriterion;
      return matchSearch && matchCriterion;
    });
  }, [records, searchQuery, selectedCriterion]);

  const handleCreateRecord = () => {
    if (!newRecord.title) { toast.error('يرجى إدخال العنوان'); return; }
    const record: EvidenceRecord = {
      id: Date.now().toString(), criterionId: newRecord.criterionId,
      title: newRecord.title, description: newRecord.description,
      score: newRecord.score, attachments: [], date: new Date().toISOString().split('T')[0],
      status: 'draft',
    };
    setRecords(prev => [record, ...prev]);
    setIsCreateDialogOpen(false);
    setNewRecord({ criterionId: 1, title: '', description: '', score: 8 });
    toast.success('تم إضافة الشاهد بنجاح');
  };

  const handleGenerateReport = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      toast.success('تم توليد تقرير شواهد الأداء الوظيفي بنجاح');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/20">
      <div className="container mx-auto py-6 px-4 max-w-7xl">

        {/* ===== الهيدر ===== */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl text-white">
                <ClipboardCheck className="w-7 h-7" />
              </div>
              شواهد الأداء الوظيفي
            </h1>
            <p className="text-gray-500 mt-2">توثيق الأداء الوظيفي وفق 11 معيار معتمد مع تقارير رسمية</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleGenerateReport} disabled={isGenerating}>
              {isGenerating ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <FileDown className="w-4 h-4 ml-2" />}
              تقرير PDF
            </Button>
            <Button onClick={() => setIsCreateDialogOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600">
              <Plus className="w-4 h-4 ml-2" /> إضافة شاهد
            </Button>
          </div>
        </div>

        {/* ===== ملخص الأداء ===== */}
        <Card className="mb-6 shadow-lg border-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="text-center">
                <div className="relative w-32 h-32">
                  <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="10" />
                    <circle cx="60" cy="60" r="50" fill="none" stroke="white" strokeWidth="10"
                      strokeDasharray={`${stats.percentage * 3.14} ${314 - stats.percentage * 3.14}`}
                      strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold">{stats.percentage}%</span>
                    <span className="text-xs opacity-80">الأداء العام</span>
                  </div>
                </div>
              </div>
              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center p-3 bg-white/10 rounded-xl">
                  <p className="text-2xl font-bold">{stats.totalScore}</p>
                  <p className="text-xs opacity-80">الدرجة الكلية</p>
                </div>
                <div className="text-center p-3 bg-white/10 rounded-xl">
                  <p className="text-2xl font-bold">{stats.totalMaxScore}</p>
                  <p className="text-xs opacity-80">الدرجة القصوى</p>
                </div>
                <div className="text-center p-3 bg-white/10 rounded-xl">
                  <p className="text-2xl font-bold">{stats.totalRecords}</p>
                  <p className="text-xs opacity-80">إجمالي الشواهد</p>
                </div>
                <div className="text-center p-3 bg-white/10 rounded-xl">
                  <p className="text-2xl font-bold">{records.filter(r => r.status === 'approved').length}</p>
                  <p className="text-xs opacity-80">شواهد معتمدة</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ===== البنود الـ 11 ===== */}
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600" /> معايير الأداء (11 بند)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
          {stats.criteriaScores.map(criterion => {
            const CriterionIcon = criterion.icon;
            const scorePercent = (criterion.avgScore / criterion.maxScore) * 100;
            const isSelected = selectedCriterion === criterion.id;
            return (
              <Card key={criterion.id}
                className={`shadow-md border-0 cursor-pointer transition-all hover:shadow-lg ${
                  isSelected ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedCriterion(isSelected ? null : criterion.id)}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: criterion.color + '20', color: criterion.color }}>
                      <CriterionIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-sm text-gray-900 truncate">{criterion.id}. {criterion.title}</h3>
                        <Badge variant="outline" className="text-xs">{criterion.recordCount} شاهد</Badge>
                      </div>
                      <p className="text-xs text-gray-500 mb-2 line-clamp-1">{criterion.description}</p>
                      <div className="flex items-center gap-2">
                        <Progress value={scorePercent} className="h-2 flex-1" />
                        <span className="text-xs font-bold" style={{ color: criterion.color }}>
                          {criterion.avgScore.toFixed(1)}/{criterion.maxScore}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ===== الشواهد ===== */}
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="بحث في الشواهد..." value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)} className="pr-10" />
          </div>
          {selectedCriterion && (
            <Button variant="outline" size="sm" onClick={() => setSelectedCriterion(null)}>
              إلغاء الفلتر
            </Button>
          )}
        </div>

        <div className="space-y-3">
          {filteredRecords.map(record => {
            const criterion = PERFORMANCE_CRITERIA.find(c => c.id === record.criterionId)!;
            const CriterionIcon = criterion.icon;
            const statusInfo = STATUS_MAP[record.status];
            const StatusIcon = statusInfo.icon;
            return (
              <Card key={record.id} className="shadow-md border-0 hover:shadow-lg transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: criterion.color + '20', color: criterion.color }}>
                      <CriterionIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{record.title}</h3>
                        <Badge className={statusInfo.color + ' text-xs'}>
                          <StatusIcon className="w-3 h-3 ml-1" /> {statusInfo.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 mb-2">{record.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {record.date}
                        </span>
                        <span style={{ color: criterion.color }}>
                          البند {criterion.id}: {criterion.title}
                        </span>
                        <span className="font-bold" style={{ color: criterion.color }}>
                          {record.score}/{criterion.maxScore}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost"><Eye className="w-4 h-4 text-gray-400" /></Button>
                      <Button size="sm" variant="ghost"><Edit className="w-4 h-4 text-gray-400" /></Button>
                      <Button size="sm" variant="ghost"><Trash2 className="w-4 h-4 text-red-400" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ===== نافذة إضافة شاهد ===== */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-blue-600" /> إضافة شاهد أداء جديد
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>البند *</Label>
                <Select value={String(newRecord.criterionId)} onValueChange={v => setNewRecord(prev => ({ ...prev, criterionId: Number(v) }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PERFORMANCE_CRITERIA.map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.id}. {c.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>العنوان *</Label>
                <Input placeholder="عنوان الشاهد" value={newRecord.title}
                  onChange={e => setNewRecord(prev => ({ ...prev, title: e.target.value }))} />
              </div>
              <div>
                <Label>الوصف</Label>
                <Textarea placeholder="وصف تفصيلي..." value={newRecord.description}
                  onChange={e => setNewRecord(prev => ({ ...prev, description: e.target.value }))} rows={3} />
              </div>
              <div>
                <Label>الدرجة (من 10)</Label>
                <Input type="number" min={0} max={10} value={newRecord.score}
                  onChange={e => setNewRecord(prev => ({ ...prev, score: Number(e.target.value) }))} />
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> يمكنك إرفاق ملفات (صور، PDF، مستندات) بعد الحفظ
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>إلغاء</Button>
              <Button onClick={handleCreateRecord} className="bg-blue-600 hover:bg-blue-700">
                <CheckCircle2 className="w-4 h-4 ml-2" /> إضافة
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
