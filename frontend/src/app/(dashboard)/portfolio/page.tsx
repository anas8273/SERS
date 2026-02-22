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
  FolderOpen, Plus, Search, FileDown, Trash2, Eye, Sparkles,
  Calendar, Clock, BookOpen, Award, Star, Edit, Image,
  FileText, Download, CheckCircle2, Loader2, Brain, TrendingUp,
  BarChart3, Users, Briefcase, GraduationCap, Target, Lightbulb,
  PenTool, Camera, Link, Paperclip, Grid3X3, List, Filter,
} from 'lucide-react';

// ===== أنواع البيانات =====
interface PortfolioEntry {
  id: string;
  title: string;
  category: 'teaching' | 'training' | 'achievement' | 'research' | 'community' | 'professional' | 'daily_note';
  description: string;
  date: string;
  attachments: string[];
  tags: string[];
  rating?: number;
  isPublic: boolean;
}

interface DailyNote {
  id: string;
  date: string;
  content: string;
  mood: 'great' | 'good' | 'neutral' | 'bad';
  achievements: string[];
  challenges: string[];
  tomorrow_goals: string[];
}

// ===== ثوابت =====
const CATEGORIES = {
  teaching: { label: 'التدريس', icon: BookOpen, color: 'bg-blue-100 text-blue-700' },
  training: { label: 'التدريب والتطوير', icon: GraduationCap, color: 'bg-purple-100 text-purple-700' },
  achievement: { label: 'الإنجازات', icon: Award, color: 'bg-amber-100 text-amber-700' },
  research: { label: 'البحث والإنتاج المعرفي', icon: Lightbulb, color: 'bg-green-100 text-green-700' },
  community: { label: 'خدمة المجتمع', icon: Users, color: 'bg-pink-100 text-pink-700' },
  professional: { label: 'التطوير المهني', icon: Briefcase, color: 'bg-indigo-100 text-indigo-700' },
  daily_note: { label: 'مفكرة يومية', icon: PenTool, color: 'bg-teal-100 text-teal-700' },
};

const MOODS = {
  great: { label: 'ممتاز', emoji: '🌟', color: 'bg-emerald-100 text-emerald-700' },
  good: { label: 'جيد', emoji: '😊', color: 'bg-blue-100 text-blue-700' },
  neutral: { label: 'عادي', emoji: '😐', color: 'bg-gray-100 text-gray-700' },
  bad: { label: 'صعب', emoji: '😓', color: 'bg-red-100 text-red-700' },
};

// ===== بيانات تجريبية =====
const SAMPLE_ENTRIES: PortfolioEntry[] = [
  {
    id: '1', title: 'تطبيق استراتيجية التعلم التعاوني', category: 'teaching',
    description: 'تم تطبيق استراتيجية التعلم التعاوني في حصة الرياضيات للصف الثالث المتوسط. أظهر الطلاب تفاعلاً ملحوظاً وتحسناً في فهم المفاهيم.',
    date: '2026-02-20', attachments: ['صور_الحصة.jpg', 'ورقة_العمل.pdf'], tags: ['تعلم تعاوني', 'رياضيات'], rating: 5, isPublic: true,
  },
  {
    id: '2', title: 'حضور ورشة عمل التقويم التكويني', category: 'training',
    description: 'حضور ورشة عمل متقدمة عن التقويم التكويني المستمر وأساليبه الحديثة في التعليم.',
    date: '2026-02-18', attachments: ['شهادة_الورشة.pdf'], tags: ['تقويم', 'تطوير مهني'], rating: 4, isPublic: true,
  },
  {
    id: '3', title: 'الفوز بجائزة المعلم المتميز', category: 'achievement',
    description: 'الحصول على جائزة المعلم المتميز على مستوى المنطقة التعليمية للعام الدراسي 1447هـ.',
    date: '2026-02-15', attachments: ['الجائزة.jpg'], tags: ['جائزة', 'تميز'], rating: 5, isPublic: true,
  },
  {
    id: '4', title: 'نشر بحث تربوي', category: 'research',
    description: 'نشر بحث بعنوان "أثر استخدام التقنية في تحسين التحصيل الدراسي" في مجلة التربية والتعليم.',
    date: '2026-02-10', attachments: ['البحث.pdf'], tags: ['بحث', 'تقنية'], rating: 5, isPublic: true,
  },
];

const SAMPLE_NOTES: DailyNote[] = [
  {
    id: '1', date: '2026-02-22', content: 'يوم حافل بالإنجازات. تم تطبيق الاستراتيجية الجديدة بنجاح.',
    mood: 'great', achievements: ['تطبيق استراتيجية جديدة', 'تحسن ملحوظ في أداء الطلاب'],
    challenges: ['ضيق الوقت في الحصة'], tomorrow_goals: ['إعداد اختبار تشخيصي'],
  },
  {
    id: '2', date: '2026-02-21', content: 'يوم عادي مع بعض التحديات في إدارة الصف.',
    mood: 'good', achievements: ['إنهاء الوحدة الثالثة'], challenges: ['سلوك بعض الطلاب'],
    tomorrow_goals: ['تطبيق استراتيجية التعلم التعاوني'],
  },
];

export default function PortfolioPage() {
  const [entries, setEntries] = useState<PortfolioEntry[]>(SAMPLE_ENTRIES);
  const [dailyNotes, setDailyNotes] = useState<DailyNote[]>(SAMPLE_NOTES);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'portfolio' | 'diary' | 'reports'>('portfolio');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDiaryDialogOpen, setIsDiaryDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<PortfolioEntry | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // حالات الإنشاء
  const [newEntry, setNewEntry] = useState({
    title: '', category: 'teaching' as keyof typeof CATEGORIES,
    description: '', tags: '', isPublic: true,
  });
  const [newNote, setNewNote] = useState({
    content: '', mood: 'good' as keyof typeof MOODS,
    achievements: '', challenges: '', tomorrow_goals: '',
  });

  // إحصائيات
  const stats = useMemo(() => ({
    total: entries.length,
    byCategory: Object.keys(CATEGORIES).map(cat => ({
      key: cat, ...CATEGORIES[cat as keyof typeof CATEGORIES],
      count: entries.filter(e => e.category === cat).length,
    })),
    totalNotes: dailyNotes.length,
    avgRating: entries.filter(e => e.rating).length > 0
      ? (entries.reduce((sum, e) => sum + (e.rating || 0), 0) / entries.filter(e => e.rating).length).toFixed(1)
      : '0',
  }), [entries, dailyNotes]);

  // فلترة
  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      const matchSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = filterCategory === 'all' || e.category === filterCategory;
      return matchSearch && matchCategory;
    });
  }, [entries, searchQuery, filterCategory]);

  // إنشاء إدخال جديد
  const handleCreateEntry = () => {
    if (!newEntry.title) { toast.error('يرجى إدخال العنوان'); return; }
    const entry: PortfolioEntry = {
      id: Date.now().toString(), title: newEntry.title, category: newEntry.category,
      description: newEntry.description, date: new Date().toISOString().split('T')[0],
      attachments: [], tags: newEntry.tags.split(',').map(t => t.trim()).filter(t => t),
      rating: 0, isPublic: newEntry.isPublic,
    };
    setEntries(prev => [entry, ...prev]);
    setIsCreateDialogOpen(false);
    setNewEntry({ title: '', category: 'teaching', description: '', tags: '', isPublic: true });
    toast.success('تم إضافة الإدخال بنجاح');
  };

  // إنشاء ملاحظة يومية
  const handleCreateNote = () => {
    if (!newNote.content) { toast.error('يرجى كتابة ملاحظة'); return; }
    const note: DailyNote = {
      id: Date.now().toString(), date: new Date().toISOString().split('T')[0],
      content: newNote.content, mood: newNote.mood,
      achievements: newNote.achievements.split('\n').filter(a => a.trim()),
      challenges: newNote.challenges.split('\n').filter(c => c.trim()),
      tomorrow_goals: newNote.tomorrow_goals.split('\n').filter(g => g.trim()),
    };
    setDailyNotes(prev => [note, ...prev]);
    setIsDiaryDialogOpen(false);
    setNewNote({ content: '', mood: 'good', achievements: '', challenges: '', tomorrow_goals: '' });
    toast.success('تم حفظ الملاحظة اليومية');
  };

  // توليد تقرير
  const handleGenerateReport = async (type: 'weekly' | 'monthly' | 'semester') => {
    setIsGeneratingReport(true);
    setTimeout(() => {
      setIsGeneratingReport(false);
      toast.success(`تم توليد التقرير ${type === 'weekly' ? 'الأسبوعي' : type === 'monthly' ? 'الشهري' : 'الفصلي'} بنجاح`);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/20 to-orange-50/20">
      <div className="container mx-auto py-6 px-4 max-w-7xl">

        {/* ===== الهيدر ===== */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl text-white">
                <FolderOpen className="w-7 h-7" />
              </div>
              ملف الإنجاز المهني
            </h1>
            <p className="text-gray-500 mt-2">توثيق الإنجازات والأنشطة المهنية مع مفكرة يومية وتقارير ذكية</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsDiaryDialogOpen(true)}>
              <PenTool className="w-4 h-4 ml-2" /> مفكرة اليوم
            </Button>
            <Button onClick={() => setIsCreateDialogOpen(true)}
              className="bg-gradient-to-r from-amber-600 to-orange-600">
              <Plus className="w-4 h-4 ml-2" /> إضافة إنجاز
            </Button>
          </div>
        </div>

        {/* ===== التبويبات ===== */}
        <div className="flex gap-2 mb-6 border-b pb-3">
          {[
            { id: 'portfolio' as const, label: 'ملف الإنجاز', icon: FolderOpen },
            { id: 'diary' as const, label: 'المفكرة اليومية', icon: PenTool },
            { id: 'reports' as const, label: 'التقارير', icon: BarChart3 },
          ].map(tab => (
            <Button key={tab.id} variant={activeTab === tab.id ? 'default' : 'ghost'} size="sm"
              onClick={() => setActiveTab(tab.id)}
              className={activeTab === tab.id ? 'bg-amber-600 hover:bg-amber-700' : ''}>
              <tab.icon className="w-4 h-4 ml-2" /> {tab.label}
            </Button>
          ))}
        </div>

        {/* ===== الإحصائيات ===== */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { icon: FolderOpen, label: 'إجمالي الإدخالات', value: stats.total, color: '#f59e0b' },
            { icon: PenTool, label: 'الملاحظات اليومية', value: stats.totalNotes, color: '#14b8a6' },
            { icon: Star, label: 'متوسط التقييم', value: stats.avgRating, color: '#6366f1' },
            { icon: Award, label: 'الإنجازات', value: entries.filter(e => e.category === 'achievement').length, color: '#ef4444' },
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

        {/* ===== تبويب ملف الإنجاز ===== */}
        {activeTab === 'portfolio' && (
          <>
            <div className="flex flex-col md:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input placeholder="بحث..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pr-10" />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-48"><Filter className="w-4 h-4 ml-2" /><SelectValue placeholder="التصنيف" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  {Object.entries(CATEGORIES).map(([key, cat]) => (
                    <SelectItem key={key} value={key}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-1">
                <Button size="sm" variant={viewMode === 'grid' ? 'default' : 'outline'} onClick={() => setViewMode('grid')}>
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button size="sm" variant={viewMode === 'list' ? 'default' : 'outline'} onClick={() => setViewMode('list')}>
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
              {filteredEntries.map(entry => {
                const cat = CATEGORIES[entry.category];
                const CatIcon = cat.icon;
                return (
                  <Card key={entry.id} className="shadow-md border-0 hover:shadow-lg transition-all cursor-pointer"
                    onClick={() => setSelectedEntry(entry)}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className={`p-2 rounded-lg ${cat.color}`}><CatIcon className="w-5 h-5" /></div>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} className={`w-3 h-3 ${s <= (entry.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
                          ))}
                        </div>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{entry.title}</h3>
                      <p className="text-sm text-gray-500 mb-3 line-clamp-2">{entry.description}</p>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {entry.tags.map((tag, i) => (
                          <Badge key={i} variant="outline" className="text-[10px]">{tag}</Badge>
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {entry.date}</span>
                        {entry.attachments.length > 0 && (
                          <span className="flex items-center gap-1"><Paperclip className="w-3 h-3" /> {entry.attachments.length} مرفق</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        {/* ===== تبويب المفكرة اليومية ===== */}
        {activeTab === 'diary' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">المفكرة اليومية</h2>
              <Button onClick={() => setIsDiaryDialogOpen(true)} className="bg-teal-600 hover:bg-teal-700">
                <Plus className="w-4 h-4 ml-2" /> ملاحظة جديدة
              </Button>
            </div>
            {dailyNotes.map(note => (
              <Card key={note.id} className="shadow-md border-0 border-r-4 border-r-teal-500">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{MOODS[note.mood].emoji}</span>
                      <div>
                        <p className="font-semibold text-gray-900">{note.date}</p>
                        <Badge className={MOODS[note.mood].color + ' text-xs'}>{MOODS[note.mood].label}</Badge>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost"><Trash2 className="w-4 h-4 text-red-400" /></Button>
                  </div>
                  <p className="text-gray-700 mb-4">{note.content}</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 bg-emerald-50 rounded-lg">
                      <h4 className="text-xs font-semibold text-emerald-700 mb-2 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> الإنجازات
                      </h4>
                      <ul className="space-y-1">
                        {note.achievements.map((a, i) => (
                          <li key={i} className="text-xs text-emerald-600">• {a}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg">
                      <h4 className="text-xs font-semibold text-red-700 mb-2 flex items-center gap-1">
                        <Target className="w-3 h-3" /> التحديات
                      </h4>
                      <ul className="space-y-1">
                        {note.challenges.map((c, i) => (
                          <li key={i} className="text-xs text-red-600">• {c}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <h4 className="text-xs font-semibold text-blue-700 mb-2 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> أهداف الغد
                      </h4>
                      <ul className="space-y-1">
                        {note.tomorrow_goals.map((g, i) => (
                          <li key={i} className="text-xs text-blue-600">• {g}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* ===== تبويب التقارير ===== */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { type: 'weekly' as const, label: 'تقرير أسبوعي', desc: 'ملخص الأسبوع الحالي', icon: Calendar, color: 'from-blue-500 to-blue-600' },
                { type: 'monthly' as const, label: 'تقرير شهري', desc: 'ملخص الشهر الحالي', icon: BarChart3, color: 'from-purple-500 to-purple-600' },
                { type: 'semester' as const, label: 'تقرير فصلي', desc: 'ملخص الفصل الدراسي', icon: Award, color: 'from-amber-500 to-amber-600' },
              ].map(report => (
                <Card key={report.type} className="shadow-lg border-0 hover:shadow-xl transition-all cursor-pointer"
                  onClick={() => handleGenerateReport(report.type)}>
                  <CardContent className="p-6 text-center">
                    <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-br ${report.color} rounded-2xl flex items-center justify-center`}>
                      <report.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-bold text-lg text-gray-900 mb-1">{report.label}</h3>
                    <p className="text-sm text-gray-500 mb-4">{report.desc}</p>
                    <Button className={`w-full bg-gradient-to-r ${report.color}`} disabled={isGeneratingReport}>
                      {isGeneratingReport ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <FileDown className="w-4 h-4 ml-2" />}
                      توليد التقرير
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" /> توليد تقرير ذكي بالذكاء الاصطناعي
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  يقوم الذكاء الاصطناعي بتحليل جميع إدخالاتك وملاحظاتك اليومية لتوليد تقرير شامل يتضمن:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {['ملخص الإنجازات', 'تحليل نقاط القوة', 'مجالات التحسين', 'توصيات مهنية'].map((item, i) => (
                    <div key={i} className="p-3 bg-purple-50 rounded-lg text-center">
                      <p className="text-sm font-medium text-purple-700">{item}</p>
                    </div>
                  ))}
                </div>
                <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 w-full" disabled={isGeneratingReport}>
                  {isGeneratingReport ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Sparkles className="w-4 h-4 ml-2" />}
                  توليد تقرير ذكي شامل
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ===== نافذة إضافة إنجاز ===== */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-amber-600" /> إضافة إنجاز جديد
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>العنوان *</Label>
                <Input placeholder="عنوان الإنجاز" value={newEntry.title}
                  onChange={e => setNewEntry(prev => ({ ...prev, title: e.target.value }))} />
              </div>
              <div>
                <Label>التصنيف</Label>
                <Select value={newEntry.category} onValueChange={v => setNewEntry(prev => ({ ...prev, category: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORIES).filter(([k]) => k !== 'daily_note').map(([key, cat]) => (
                      <SelectItem key={key} value={key}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>الوصف</Label>
                <Textarea placeholder="وصف تفصيلي للإنجاز..." value={newEntry.description}
                  onChange={e => setNewEntry(prev => ({ ...prev, description: e.target.value }))} rows={4} />
              </div>
              <div>
                <Label>الوسوم (مفصولة بفاصلة)</Label>
                <Input placeholder="تعلم تعاوني, رياضيات, تميز" value={newEntry.tags}
                  onChange={e => setNewEntry(prev => ({ ...prev, tags: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>إلغاء</Button>
              <Button onClick={handleCreateEntry} className="bg-amber-600 hover:bg-amber-700">
                <CheckCircle2 className="w-4 h-4 ml-2" /> إضافة
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ===== نافذة المفكرة اليومية ===== */}
        <Dialog open={isDiaryDialogOpen} onOpenChange={setIsDiaryDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <PenTool className="w-5 h-5 text-teal-600" /> ملاحظة يومية جديدة
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>كيف كان يومك؟</Label>
                <div className="flex gap-2 mt-2">
                  {Object.entries(MOODS).map(([key, mood]) => (
                    <div key={key}
                      className={`flex-1 p-3 rounded-xl border-2 cursor-pointer text-center transition-all ${
                        newNote.mood === key ? 'border-teal-500 bg-teal-50' : 'border-gray-200'
                      }`}
                      onClick={() => setNewNote(prev => ({ ...prev, mood: key as any }))}>
                      <span className="text-2xl">{mood.emoji}</span>
                      <p className="text-xs mt-1">{mood.label}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label>ملاحظات اليوم *</Label>
                <Textarea placeholder="ماذا حدث اليوم؟" value={newNote.content}
                  onChange={e => setNewNote(prev => ({ ...prev, content: e.target.value }))} rows={3} />
              </div>
              <div>
                <Label>الإنجازات (سطر لكل إنجاز)</Label>
                <Textarea placeholder="تطبيق استراتيجية جديدة&#10;تحسن أداء الطلاب" value={newNote.achievements}
                  onChange={e => setNewNote(prev => ({ ...prev, achievements: e.target.value }))} rows={2} />
              </div>
              <div>
                <Label>التحديات</Label>
                <Textarea placeholder="ضيق الوقت&#10;سلوك بعض الطلاب" value={newNote.challenges}
                  onChange={e => setNewNote(prev => ({ ...prev, challenges: e.target.value }))} rows={2} />
              </div>
              <div>
                <Label>أهداف الغد</Label>
                <Textarea placeholder="إعداد اختبار&#10;تحضير درس جديد" value={newNote.tomorrow_goals}
                  onChange={e => setNewNote(prev => ({ ...prev, tomorrow_goals: e.target.value }))} rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDiaryDialogOpen(false)}>إلغاء</Button>
              <Button onClick={handleCreateNote} className="bg-teal-600 hover:bg-teal-700">
                <CheckCircle2 className="w-4 h-4 ml-2" /> حفظ
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
