'use client';
import { ta } from '@/i18n/auto-translations';
import { useTranslation } from '@/i18n/useTranslation';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import toast from 'react-hot-toast';
import { BookOpen, Plus, Search, Trash2, Loader2, Target, CheckCircle, Calendar, ClipboardList, Sparkles, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import { TopNavBar } from '@/components/layout/TopNavBar';

interface Plan {
  id: string;
  title: string;
  subject: string;
  grade: string;
  type: string;
  status: string;
  description: string;
  objectives: string[];
  activities: string;
  assessment: string;
  notes: string;
  startDate: string;
  endDate: string;
  createdAt?: string;
}

interface UnitPlan {
  id: string;
  unitTitle: string;
  subject: string;
  grade: string;
  semester: string;
  weeks: number;
  objectives: string[];
  lessons: string[];
  assessment: string;
  createdAt?: string;
}

export default function PlansPage() {
  const { dir, t, locale } = useTranslation();
  const isEn = locale === 'en';

  const SUBJECTS = isEn
    ? ['Quran', 'Tawheed', 'Fiqh', 'Tafsir', 'Hadith', 'Arabic', 'Math', 'Science', 'History', 'Geography', 'Civics', 'English', 'Computer', 'PE', 'Art', 'Home Economics']
    : ['القرآن الكريم', 'التوحيد', 'الفقه', 'التفسير', 'الحديث', 'اللغة العربية', 'الرياضيات', 'العلوم', 'التاريخ', 'الجغرافيا', 'التربية الوطنية', 'الإنجليزية', 'الحاسب', 'التربية البدنية', 'الفنون', 'اقتصاد منزلي'];
  const ALL_GRADES = isEn
    ? ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']
    : ['الصف الأول', 'الصف الثاني', 'الصف الثالث', 'الصف الرابع', 'الصف الخامس', 'الصف السادس', 'الصف الأول المتوسط', 'الصف الثاني المتوسط', 'الصف الثالث المتوسط', 'الصف الأول الثانوي', 'الصف الثاني الثانوي', 'الصف الثالث الثانوي'];
  const PLAN_TYPES = isEn
    ? ['Daily Plan', 'Weekly Plan', 'Unit Plan', 'Semester Plan', 'Annual Plan', 'Remedial Plan', 'Enrichment Plan'] as const
    : ['خطة يومية', 'خطة أسبوعية', 'خطة وحدة', 'خطة فصلية', 'خطة سنوية', 'خطة علاجية', 'خطة إثرائية'] as const;
  const PLAN_STATUSES = isEn
    ? ['Active', 'Completed', 'On Hold'] as const
    : ['نشطة', 'مكتملة', 'معلقة'] as const;
  const SEMESTERS = isEn
    ? ['Semester 1', 'Semester 2', 'Semester 3']
    : ['الفصل الأول', 'الفصل الثاني', 'الفصل الثالث'];

  const statusColor = (s: string) => {
    const map: Record<string, string> = {};
    map[PLAN_STATUSES[0]] = 'bg-blue-500/10 text-blue-700';
    map[PLAN_STATUSES[1]] = 'bg-green-500/10 text-green-700';
    map[PLAN_STATUSES[2]] = 'bg-yellow-500/10 text-yellow-700';
    return map[s] || 'bg-gray-100 text-gray-700';
  };
  const [tab, setTab] = useState('remedial');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [unitPlans, setUnitPlans] = useState<UnitPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [aiLoading, setAiLoading] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  // Plan form
  const [planDialog, setPlanDialog] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [planForm, setPlanForm] = useState({ title: '', subject: '', grade: '', type: '' as string, status: '' as string, description: '', objectives: '', activities: '', assessment: '', notes: '', startDate: new Date().toISOString().split('T')[0], endDate: '' });

  // Unit plan form
  const [unitDialog, setUnitDialog] = useState(false);
  const [savingUnit, setSavingUnit] = useState(false);
  const [unitForm, setUnitForm] = useState({ unitTitle: '', subject: '', grade: '', semester: SEMESTERS[0], weeks: 4, objectives: '', lessons: '', assessment: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchAll(); }, []);
  const fetchAll = async () => {
    setLoading(true);
    try {
      const [pRes, uRes] = await Promise.allSettled([api.getEducationalServices('plans'), api.getEducationalServices('unit-plans')]);
      if (pRes.status === 'fulfilled') setPlans((pRes.value?.data || []).map((item: any) => ({ ...item, objectives: Array.isArray(item.objectives) ? item.objectives : (item.objectives || '').split('\n').filter(Boolean) })));
      if (uRes.status === 'fulfilled') setUnitPlans((uRes.value?.data || []).map((item: any) => ({ ...item, objectives: Array.isArray(item.objectives) ? item.objectives : (item.objectives || '').split('\n').filter(Boolean), lessons: Array.isArray(item.lessons) ? item.lessons : (item.lessons || '').split('\n').filter(Boolean) })));
    } catch {} finally { setLoading(false); }
  };

  const aiAssist = async (prompt: string, onResult: (text: string) => void) => {
    setAiLoading(true);
    try {
      const res = await api.chatWithAI(prompt);
      const text = res?.data?.message || res?.data?.response || res?.data?.content || '';
      if (text) onResult(text);
      else toast.error(t('common.aiNoReply'));
    } catch { toast.error(t('common.aiError')); } finally { setAiLoading(false); }
  };

  // AI from file: reads file text and generates plan content
  const aiAssistFromFile = (onResult: (text: string) => void) => {
    (fileInputRef.current as any)._onResult = onResult;
    fileInputRef.current?.click();
  };
  const handleFileRead = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const content = (ev.target?.result as string).substring(0, 3000);
      const prompt = `بناءً على محتوى هذا الملف:\n${content}\n\nاقترح أهدافاً سلوكية وأنشطة تعليمية لخطة دراسية وفق المنهج السعودي. اكتب كل هدف في سطر منفصل.`;
      const cb = (fileInputRef.current as any)._onResult;
      if (cb) await aiAssist(prompt, cb);
      toast.success(t('toast.plan.fileParsed'));
    };
    reader.onerror = () => toast.error(t('toast.plan.fileError'));
    reader.readAsText(file);
    e.target.value = '';
  };

  const savePlan = async () => {
    if (!planForm.title && !planForm.subject) { toast.error(t('plans.noPlans')); return; }
    setSavingPlan(true);
    try {
      const payload = { ...planForm, objectives: planForm.objectives.split('\n').filter(Boolean) };
      const res = await api.createEducationalService('plans', payload);
      setPlans(p => [{ id: res?.data?.id || Date.now().toString(), ...payload, createdAt: new Date().toISOString() }, ...p]);
      toast.success(t('plans.add')); setPlanDialog(false);
      setPlanForm({ title: '', subject: '', grade: '', type: PLAN_TYPES[5], status: PLAN_STATUSES[0], description: '', objectives: '', activities: '', assessment: '', notes: '', startDate: new Date().toISOString().split('T')[0], endDate: '' });
    } catch { toast.error(t('common.error')); } finally { setSavingPlan(false); }
  };

  const saveUnit = async () => {
    if (!unitForm.unitTitle) { toast.error(t('plans.noPlans')); return; }
    setSavingUnit(true);
    try {
      const payload = { ...unitForm, objectives: unitForm.objectives.split('\n').filter(Boolean), lessons: unitForm.lessons.split('\n').filter(Boolean), assessment: '' };
      const res = await api.createEducationalService('unit-plans', payload);
      setUnitPlans(p => [{ id: res?.data?.id || Date.now().toString(), ...payload, createdAt: new Date().toISOString() }, ...p]);
      toast.success(t('plans.add')); setUnitDialog(false);
      setUnitForm({ unitTitle: '', subject: '', grade: '', semester: SEMESTERS[0], weeks: 4, objectives: '', lessons: '', assessment: '' });
    } catch { toast.error(t('common.error')); } finally { setSavingUnit(false); }
  };

  const deletePlan = async (id: string) => { try { await api.deleteEducationalService('plans', id); } catch {} setPlans(p => p.filter(x => x.id !== id)); toast.success(t('common.delete')); };
  const deleteUnit = async (id: string) => { try { await api.deleteEducationalService('unit-plans', id); } catch {} setUnitPlans(p => p.filter(x => x.id !== id)); toast.success(t('common.delete')); };

  const activePlans = plans.filter(p => [PLAN_TYPES[5], PLAN_TYPES[6], PLAN_TYPES[0], PLAN_TYPES[1]].includes(p.type as any));
  const semesterPlans = plans.filter(p => [PLAN_TYPES[3], PLAN_TYPES[4]].includes(p.type as any));
  const filteredPlans = activePlans.filter(p => (filterType === 'all' || p.type === filterType) && (p.title + p.subject).toLowerCase().includes(search.toLowerCase()));
  const filteredSemester = semesterPlans.filter(p => (p.title + p.subject).toLowerCase().includes(search.toLowerCase()));
  const filteredUnits = unitPlans.filter(u => (u.unitTitle + u.subject).toLowerCase().includes(search.toLowerCase()));

  const statsData = [
    { label: t('plans.title'), value: plans.length + unitPlans.length, icon: BookOpen },
    { label: t('plans.active'), value: plans.filter(p => p.status === PLAN_STATUSES[0]).length, icon: Target },
    { label: t('plans.completed'), value: plans.filter(p => p.status === PLAN_STATUSES[1]).length, icon: CheckCircle },
    { label: t('distributions.title'), value: unitPlans.length, icon: ClipboardList },
  ];

  return (
    <>
    <TopNavBar title={t('plans.title')} />
    <div className="container mx-auto py-6 px-4" dir={dir}>
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 md:p-8 mb-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-10" />
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center"><ClipboardList className="h-6 w-6" /></div>
            <div>
              <h1 className="text-2xl font-black">{t('plans.title')}</h1>
              <p className="text-white/80 text-sm mt-0.5">{t('plans.subtitle')}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchAll} disabled={loading} className="bg-white/20 hover:bg-white/30 border-white/30 text-white rounded-xl">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <div className="relative grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          {statsData.map(s => <div key={s.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center"><p className="text-xl font-bold">{s.value}</p><p className="text-xs text-white/70">{s.label}</p></div>)}
        </div>
      </motion.div>

      {/* Search + Filter */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t('common.search')} className="pr-10" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder={t('plans.type')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('dash.all')}</SelectItem>
            {PLAN_TYPES.map(pt => <SelectItem key={pt} value={pt}>{pt}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-6 w-full md:w-auto">
          <TabsTrigger value="remedial" className="gap-2"><Target className="h-4 w-4" />{t('plans.remedial')} & {t('plans.enrichment')}</TabsTrigger>
          <TabsTrigger value="semester" className="gap-2"><Calendar className="h-4 w-4" />{isEn ? 'Semester Plans' : ta('الخطط الفصلية', 'Semester Plans') }</TabsTrigger>
          <TabsTrigger value="units" className="gap-2"><ClipboardList className="h-4 w-4" />{isEn ? 'Unit Plans' : ta('خطط الوحدات', 'Unit Plans') }</TabsTrigger>
        </TabsList>

        {/* ─── TAB 1: Remedial & Enrichment Plans ─── */}
        <TabsContent value="remedial">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">{t('plans.remedial')} & {t('plans.enrichment')}</h2>
            <Dialog open={planDialog} onOpenChange={setPlanDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="h-4 w-4" />{t('plans.add')}</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir={dir}>
                <DialogHeader><DialogTitle>{t('plans.add')}</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-2">
                      <Label>{t('plans.title')} *</Label>
                      <Input placeholder={isEn ? 'Remedial math plan' : ta('خطة علاجية لمادة الرياضيات', 'Remedial Plan for Mathematics') } value={planForm.title} onChange={e => setPlanForm(p => ({ ...p, title: e.target.value }))} />
                    </div>
                    <div className="grid gap-2">
                      <Label>{t('plans.type')}</Label>
                      <Select value={planForm.type} onValueChange={v => setPlanForm(p => ({ ...p, type: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{PLAN_TYPES.map(pt => <SelectItem key={pt} value={pt}>{pt}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-2">
                      <Label>{t('plans.subject')} *</Label>
                      <Select value={planForm.subject} onValueChange={v => setPlanForm(p => ({ ...p, subject: v }))}>
                        <SelectTrigger><SelectValue placeholder={t('plans.subject')} /></SelectTrigger>
                        <SelectContent>{SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>{t('plans.student')}</Label>
                      <Select value={planForm.grade} onValueChange={v => setPlanForm(p => ({ ...p, grade: v }))}>
                        <SelectTrigger><SelectValue placeholder={isEn ? 'Select Grade' : ta('اختر الصف', 'Select Grade') } /></SelectTrigger>
                        <SelectContent>{ALL_GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-2">
                      <Label>{t('plans.startDate')}</Label>
                      <Input type="date" value={planForm.startDate} onChange={e => setPlanForm(p => ({ ...p, startDate: e.target.value }))} />
                    </div>
                    <div className="grid gap-2">
                      <Label>{t('plans.status')}</Label>
                      <Select value={planForm.status} onValueChange={v => setPlanForm(p => ({ ...p, status: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{PLAN_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>{t('plans.description')}</Label>
                    <Textarea className="min-h-[70px]" value={planForm.description} onChange={e => setPlanForm(p => ({ ...p, description: e.target.value }))} />
                  </div>
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label>{t('plans.objectives')}</Label>
                      <div className="flex gap-1.5">
                        <button type="button" disabled={aiLoading}
                          onClick={() => aiAssist(`اقترح أهدافاً سلوكية محددة لـ${planForm.type} في مادة ${planForm.subject} للصف ${planForm.grade}. كل هدف في سطر.`, text => setPlanForm(p => ({ ...p, objectives: text })))}
                          className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 hover:bg-green-100 px-2 py-1 rounded-lg transition-colors disabled:opacity-50">
                          {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} {t('plans.aiGenerate')}
                        </button>
                        <button type="button" disabled={aiLoading}
                          onClick={() => aiAssistFromFile(text => setPlanForm(p => ({ ...p, objectives: text })))}
                          className="flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-lg transition-colors disabled:opacity-50">
                          📄 {t('plans.fromFile')}
                        </button>
                      </div>
                    </div>
                    <Textarea className="min-h-[80px]" placeholder={ta('الهدف الأول&#10;الهدف الثاني', 'First Objective&#10;Second Objective')} value={planForm.objectives} onChange={e => setPlanForm(p => ({ ...p, objectives: e.target.value }))} />
                  </div>
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label>{t('plans.activities')}</Label>
                      <button type="button" disabled={aiLoading}
                        onClick={() => aiAssist(`اقترح أنشطة تعليمية مناسبة لـ${planForm.type} في مادة ${planForm.subject}.`, text => setPlanForm(p => ({ ...p, activities: text })))}
                        className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 hover:bg-green-100 px-2 py-1 rounded-lg transition-colors disabled:opacity-50">
                        {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} {t('plans.aiActivities')}
                      </button>
                    </div>
                    <Textarea className="min-h-[70px]" value={planForm.activities} onChange={e => setPlanForm(p => ({ ...p, activities: e.target.value }))} />
                  </div>
                  <div className="grid gap-2">
                    <Label>{t('plans.assessment')}</Label>
                    <Textarea className="min-h-[60px]" value={planForm.assessment} onChange={e => setPlanForm(p => ({ ...p, assessment: e.target.value }))} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setPlanDialog(false)}>{t('common.cancel')}</Button>
                  <Button onClick={savePlan} disabled={savingPlan} className="bg-green-600 hover:bg-green-700">
                    {savingPlan ? <><Loader2 className="h-4 w-4 animate-spin ms-2" />{t('common.save')}...</> : <><BookOpen className="h-4 w-4 ms-2" />{t('plans.add')}</>}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          {loading
            ? <Card><CardContent className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-green-500" /></CardContent></Card>
            : filteredPlans.length === 0
              ? <Card className="border-0 shadow-sm"><CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mb-4"><ClipboardList className="h-8 w-8 text-green-500" /></div>
                  <h3 className="text-lg font-bold mb-2">{t('plans.noPlans')}</h3>
                  <p className="text-muted-foreground mb-4 text-sm">{t('plans.noPlansDesc')}</p>
                  <Button onClick={() => setPlanDialog(true)} className="gap-2"><Plus className="h-4 w-4" />{t('plans.add')}</Button>
                </CardContent></Card>
              : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPlans.map((plan, i) => (
                    <motion.div key={plan.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ y: -4 }}>
                      <Card className="border-0 shadow-sm hover:shadow-lg transition-all rounded-2xl">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between"><Badge className={statusColor(plan.status)}>{plan.status}</Badge><Badge variant="outline">{plan.type}</Badge></div>
                          <CardTitle className="text-lg mt-2">{plan.title || plan.subject}</CardTitle>
                          <CardDescription>{plan.subject} {plan.grade && `- ${plan.grade}`}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {plan.objectives?.length > 0 && <div className="mb-3">
                            <p className="text-xs font-medium text-muted-foreground mb-1">{isEn ? 'Objectives:' : ta('الأهداف:', 'Objectives:') }</p>
                            <ul className="text-xs space-y-1">
                              {plan.objectives.slice(0, 3).map((o, j) => <li key={j} className="flex items-center gap-1"><Target className="h-3 w-3 text-green-500" />{o}</li>)}
                              {plan.objectives.length > 3 && <li className="text-muted-foreground">+{plan.objectives.length - 3} {t('plans.moreObjectives')}</li>}
                            </ul>
                          </div>}
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                            <Calendar className="h-3 w-3" /> {plan.startDate && new Date(plan.startDate).toLocaleDateString(locale === 'en' ? 'en-US' : 'ar-SA')}
                          </div>
                          <div className="flex justify-end"><Button variant="ghost" size="icon" className="text-destructive" onClick={() => deletePlan(plan.id)}><Trash2 className="h-4 w-4" /></Button></div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
          }
        </TabsContent>

        {/* ─── TAB 2: Semester Plans ─── */}
        <TabsContent value="semester">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">{isEn ? 'Semester & Annual Plans' : ta('الخطط الفصلية والسنوية', 'Semester and Annual Plans') }</h2>
            <Dialog open={planDialog} onOpenChange={setPlanDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-blue-600 hover:bg-blue-700"><Plus className="h-4 w-4" />{isEn ? 'Semester Plan' : ta('خطة فصلية', 'Semester Plan') }</Button>
              </DialogTrigger>
            </Dialog>
          </div>
          {filteredSemester.length === 0
            ? <Card className="border-0 shadow-sm"><CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4"><Calendar className="h-8 w-8 text-blue-500" /></div>
                <h3 className="text-lg font-bold mb-2">{t('plans.semester.empty')}</h3>
                <p className="text-muted-foreground mb-4 text-sm">{t('plans.semester.emptyDesc')}</p>
                <Button onClick={() => { setPlanForm(p => ({ ...p, type: PLAN_TYPES[3] })); setPlanDialog(true); }} className="gap-2 bg-blue-600 hover:bg-blue-700"><Plus className="h-4 w-4" />{isEn ? 'Semester Plan' : ta('خطة فصلية', 'Semester Plan') }</Button>
              </CardContent></Card>
            : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSemester.map((plan, i) => (
                  <motion.div key={plan.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ y: -4 }}>
                    <Card className="border-0 shadow-sm hover:shadow-lg transition-all rounded-2xl">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between"><Badge className="bg-blue-500">{plan.type}</Badge><Badge className={statusColor(plan.status)}>{plan.status}</Badge></div>
                        <CardTitle className="text-lg mt-2">{plan.title || plan.subject}</CardTitle>
                        <CardDescription>{plan.subject} {plan.grade && `- ${plan.grade}`}</CardDescription>
                      </CardHeader>
                      <CardContent><div className="flex justify-end"><Button variant="ghost" size="icon" className="text-destructive" onClick={() => deletePlan(plan.id)}><Trash2 className="h-4 w-4" /></Button></div></CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
          }
        </TabsContent>

        {/* ─── TAB 3: Unit Plans ─── */}
        <TabsContent value="units">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">{isEn ? 'Unit Study Plans' : ta('خطط الوحدات الدراسية', 'Academic Unit Plans') }</h2>
            <Dialog open={unitDialog} onOpenChange={setUnitDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-purple-600 hover:bg-purple-700"><Plus className="h-4 w-4" />{t('plans.units.add')}</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir={dir}>
                <DialogHeader><DialogTitle>{t('plans.unit.title')}</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>{t('plans.unit.name')}</Label>
                    <Input placeholder={isEn ? 'Unit 1: Natural Numbers' : ta('الوحدة الأولى: الأعداد الطبيعية', 'Unit One: Natural Numbers') } value={unitForm.unitTitle} onChange={e => setUnitForm(p => ({ ...p, unitTitle: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-2">
                      <Label>{t('plans.subject')}</Label>
                      <Select value={unitForm.subject} onValueChange={v => setUnitForm(p => ({ ...p, subject: v }))}>
                        <SelectTrigger><SelectValue placeholder={t('plans.subject')} /></SelectTrigger>
                        <SelectContent>{SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>{t('plans.student')}</Label>
                      <Input placeholder={isEn ? 'Grade 1' : ta('الصف الأول', 'First Grade') } value={unitForm.grade} onChange={e => setUnitForm(p => ({ ...p, grade: e.target.value }))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-2">
                      <Label>{t('plans.unit.semester')}</Label>
                      <Select value={unitForm.semester} onValueChange={v => setUnitForm(p => ({ ...p, semester: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{SEMESTERS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>{t('plans.unit.weeks')}</Label>
                      <Input type="number" min={1} max={12} value={unitForm.weeks} onChange={e => setUnitForm(p => ({ ...p, weeks: +e.target.value }))} />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label>{t('plans.unit.objectives')}</Label>
                      <button type="button" disabled={aiLoading}
                        onClick={() => aiAssist(`اقترح أهداف خطة وحدة "${unitForm.unitTitle}" في مادة ${unitForm.subject} للصف ${unitForm.grade}. كل هدف في سطر.`, text => setUnitForm(p => ({ ...p, objectives: text })))}
                        className="flex items-center gap-1 text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded-lg transition-colors disabled:opacity-50">
                        {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} {t('plans.unit.generate')}
                      </button>
                    </div>
                    <Textarea className="min-h-[80px]" placeholder={isEn ? 'Unit objectives...' : ta('أهداف الوحدة...', 'Unit objectives...') } value={unitForm.objectives} onChange={e => setUnitForm(p => ({ ...p, objectives: e.target.value }))} />
                  </div>
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label>{t('plans.unit.lessons')}</Label>
                      <button type="button" disabled={aiLoading}
                        onClick={() => aiAssist(`اقترح قائمة بالدروس التفصيلية لوحدة "${unitForm.unitTitle}" في مادة ${unitForm.subject} للصف ${unitForm.grade}. كل درس في سطر.`, text => setUnitForm(p => ({ ...p, lessons: text })))}
                        className="flex items-center gap-1 text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded-lg transition-colors disabled:opacity-50">
                        {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} {t('plans.unit.generateLessons')}
                      </button>
                    </div>
                    <Textarea className="min-h-[80px]" placeholder={ta('الدرس الأول&#10;الدرس الثاني', 'First Lesson&#10;Second Lesson')} value={unitForm.lessons} onChange={e => setUnitForm(p => ({ ...p, lessons: e.target.value }))} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setUnitDialog(false)}>{t('common.cancel')}</Button>
                  <Button onClick={saveUnit} disabled={savingUnit} className="bg-purple-600 hover:bg-purple-700">
                    {savingUnit ? <><Loader2 className="h-4 w-4 animate-spin ms-2" />{t('common.save')}...</> : <><ClipboardList className="h-4 w-4 ms-2" />{t('plans.add')}</>}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          {filteredUnits.length === 0
            ? <Card className="border-0 shadow-sm"><CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-4"><ClipboardList className="h-8 w-8 text-purple-500" /></div>
                <h3 className="text-lg font-bold mb-2">{t('plans.units.empty')}</h3>
                <p className="text-muted-foreground mb-4 text-sm">{t('plans.units.emptyDesc')}</p>
                <Button onClick={() => setUnitDialog(true)} className="gap-2 bg-purple-600 hover:bg-purple-700"><Plus className="h-4 w-4" />{t('plans.units.add')}</Button>
              </CardContent></Card>
            : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUnits.map((u, i) => (
                  <motion.div key={u.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ y: -4 }}>
                    <Card className="border-0 shadow-sm hover:shadow-lg transition-all rounded-2xl">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between"><Badge className="bg-purple-500">{u.subject}</Badge><Badge variant="outline">{u.weeks} {t('plans.weeks')}</Badge></div>
                        <CardTitle className="text-lg mt-2">{u.unitTitle}</CardTitle>
                        <CardDescription>{u.grade} • {u.semester}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {u.lessons?.length > 0 && <div className="mb-3">
                          <p className="text-xs font-medium text-muted-foreground mb-1">{t('plans.lessons')} ({u.lessons.length}):</p>
                          <ul className="text-xs space-y-1">
                            {u.lessons.slice(0, 4).map((l, j) => <li key={j} className="flex items-center gap-1"><BookOpen className="h-3 w-3 text-purple-500" />{l}</li>)}
                            {u.lessons.length > 4 && <li className="text-muted-foreground">+{u.lessons.length - 4} {t('plans.moreLessons')}</li>}
                          </ul>
                        </div>}
                        <div className="flex justify-end"><Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteUnit(u.id)}><Trash2 className="h-4 w-4" /></Button></div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
          }
        </TabsContent>
      </Tabs>
      <div className="fixed left-[-9999px] top-0" ref={previewRef} />
      {/* Hidden file input for AI-from-file */}
      <input ref={fileInputRef} type="file" accept=".txt,.pdf,.doc,.docx,.csv" className="hidden" onChange={handleFileRead} />
    </div>
    </>
  );
}
