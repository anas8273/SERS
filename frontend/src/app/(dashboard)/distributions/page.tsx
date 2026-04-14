'use client';
import { ta } from '@/i18n/auto-translations';
import { useTranslation } from '@/i18n/useTranslation';
import { TopNavBar } from '@/components/layout/TopNavBar';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import toast from 'react-hot-toast';
import { CalendarDays, Plus, Search, Trash2, Loader2, BookOpen, Calendar, Download, Sparkles, FileText, ClipboardList, RefreshCw } from 'lucide-react';
import { exportToPDF } from '@/lib/export-utils';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';



interface Distribution { id: string; subject: string; stage: string; grade: string; semester: string; weeks: number; startDate: string; topics: string[]; createdAt: string; }
interface WeeklyPlan { id: string; subject: string; grade: string; semester: string; week: string; days: Record<string, string>; objectives: string; createdAt: string; }
interface LessonPrep { id: string; subject: string; grade: string; lesson: string; objectives: string; content: string; activities: string; assessment: string; notes: string; duration: number; createdAt: string; }

export default function DistributionsPage() {
  const { dir, t, locale } = useTranslation();
  const isEn = locale === 'en';
  const STAGES = isEn ? ['Primary Stage', 'Intermediate Stage', 'Secondary Stage'] : ['المرحلة الابتدائية', 'المرحلة المتوسطة', 'المرحلة الثانوية'];
  const GRADES_MAP: Record<string, string[]> = isEn ? {
    'Primary Stage': ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'],
    'Intermediate Stage': ['Grade 7', 'Grade 8', 'Grade 9'],
    'Secondary Stage': ['Grade 10', 'Grade 11', 'Grade 12'],
  } : {
    'المرحلة الابتدائية': ['الصف الأول', 'الصف الثاني', 'الصف الثالث', 'الصف الرابع', 'الصف الخامس', 'الصف السادس'],
    'المرحلة المتوسطة': ['الصف الأول المتوسط', 'الصف الثاني المتوسط', 'الصف الثالث المتوسط'],
    'المرحلة الثانوية': ['الصف الأول الثانوي', 'الصف الثاني الثانوي', 'الصف الثالث الثانوي'],
  };
  const SUBJECTS = isEn ? ['Quran', 'Tawhid', 'Fiqh', 'Tafsir', 'Hadith', 'Arabic', 'Mathematics', 'Science', 'History', 'Geography', 'Civics', 'English', 'Computer', 'P.E.', 'Arts', 'Home Economics'] : ['القرآن الكريم', 'التوحيد', 'الفقه', 'التفسير', 'الحديث', 'اللغة العربية', 'الرياضيات', 'العلوم', 'التاريخ', 'الجغرافيا', 'التربية الوطنية', 'الإنجليزية', 'الحاسب', 'التربية البدنية', 'الفنون', 'اقتصاد منزلي'];
  const SEMESTERS = isEn ? ['Semester 1', 'Semester 2', 'Semester 3'] : ['الفصل الأول', 'الفصل الثاني', 'الفصل الثالث'];
  const WEEKS = Array.from({ length: 18 }, (_, i) => isEn ? `Week ${i + 1}` : `الأسبوع ${i + 1}`);
  const DAYS = isEn ? ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'] : ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
  const [tab, setTab] = useState('curriculum');
  // Curriculum Distribution
  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [distLoading, setDistLoading] = useState(true);
  const [distDialog, setDistDialog] = useState(false);
  const [distForm, setDistForm] = useState({ subject: '', stage: STAGES[0], grade: '', semester: SEMESTERS[0], weeks: 16, startDate: new Date().toISOString().split('T')[0], topics: '' });
  const [savingDist, setSavingDist] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  // Weekly Plans
  const [weeklyPlans, setWeeklyPlans] = useState<WeeklyPlan[]>([]);
  const [weeklyLoading, setWeeklyLoading] = useState(true);
  const [weeklyDialog, setWeeklyDialog] = useState(false);
  const [weeklyForm, setWeeklyForm] = useState({ subject: '', grade: '', semester: SEMESTERS[0], week: WEEKS[0], days: {} as Record<string, string>, objectives: '' });
  const [savingWeekly, setSavingWeekly] = useState(false);
  // Lesson Prep
  const [lessons, setLessons] = useState<LessonPrep[]>([]);
  const [lessonLoading, setLessonLoading] = useState(true);
  const [lessonDialog, setLessonDialog] = useState(false);
  const [lessonForm, setLessonForm] = useState({ subject: '', grade: '', lesson: '', objectives: '', content: '', activities: '', assessment: '', notes: '', duration: 45 });
  const [savingLesson, setSavingLesson] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [pdfPreviewDist, setPdfPreviewDist] = useState<Distribution | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileAiTarget, setFileAiTarget] = useState<'topics' | 'objectives' | 'content' | null>(null);

  useEffect(() => { fetchAll(); }, []);
  const fetchAll = async () => {
    setDistLoading(true); setWeeklyLoading(true); setLessonLoading(true);
    try {
      const [d, w, l] = await Promise.allSettled([
        api.getEducationalServices('distributions'),
        api.getEducationalServices('weekly-plans'),
        api.getEducationalServices('lesson-preparations'),
      ]);
      if (d.status === 'fulfilled') setDistributions(d.value?.data || []);
      if (w.status === 'fulfilled') setWeeklyPlans(w.value?.data || []);
      if (l.status === 'fulfilled') setLessons(l.value?.data || []);
    } catch {}
    setDistLoading(false); setWeeklyLoading(false); setLessonLoading(false);
  };

  // ── AI Assist ─────────────────────────────────────────────────────────────
  const aiAssist = async (prompt: string, onResult: (text: string) => void) => {
    setAiLoading(true);
    try {
      const res = await api.chatWithAI(prompt);
      const text = res?.data?.message || res?.data?.response || res?.data?.content || '';
      if (text) onResult(text);
      else toast.error(t('common.aiNoReply'));
    } catch { toast.error(t('common.aiError')); }
    finally { setAiLoading(false); }
  };

  // ── AI Assist from File ────────────────────────────────────────────────────
  const aiAssistFromFile = (onResult: (text: string) => void, hint?: string) => {
    setFileAiTarget(hint as any || 'topics');
    (fileInputRef.current as any)._onResult = onResult;
    fileInputRef.current?.click();
  };

  const handleFileRead = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const fileContent = (ev.target?.result as string).substring(0, 3000);
      const prompt = `بناءً على محتوى هذا الملف:\n${fileContent}\n\nاقترح توزيعاً للمنهج أو قائمة بالوحدات والدروس مناسبة للمنهج السعودي. ضع كل وحدة أو موضوع في سطر منفصل.`;
      const cb = (fileInputRef.current as any)._onResult;
      if (cb) await aiAssist(prompt, cb);
      toast.success(t('toast.achievement.fileAnalyzed'));
    };
    reader.onerror = () => toast.error(t('common.error'));
    reader.readAsText(file);
    e.target.value = '';
  };

  // ── Curriculum Distribution CRUD ──────────────────────────────────────────
  const saveDist = async () => {
    if (!distForm.subject) { toast.error(t('eduPage.dist.subjectPlaceholder')); return; }
    setSavingDist(true);
    try {
      const payload = { ...distForm, topics: distForm.topics.split('\n').filter(Boolean) };
      const res = await api.createEducationalService('distributions', payload);
      setDistributions(p => [{ id: res?.data?.id || Date.now().toString(), ...payload, createdAt: new Date().toISOString() }, ...p]);
      toast.success(t('toast.saved')); setDistDialog(false);
      setDistForm({ subject: '', stage: STAGES[0], grade: '', semester: SEMESTERS[0], weeks: 16, startDate: new Date().toISOString().split('T')[0], topics: '' });
    } catch { toast.error(t('common.error')); } finally { setSavingDist(false); }
  };
  const deleteDist = async (id: string) => { try { await api.deleteEducationalService('distributions', id); } catch {} setDistributions(p => p.filter(x => x.id !== id)); toast.success(t('common.delete')); };
  const exportDist = async (d: Distribution) => {
    setPdfPreviewDist(d);
    // Wait a tick for React to render the preview into previewRef
    await new Promise(r => setTimeout(r, 400));
    if (previewRef.current) {
      try {
        await exportToPDF(previewRef.current, `توزيع_${d.subject}_${d.grade}`, { title: `توزيع منهج — ${d.subject}`, includeQR: true, qrData: `SERS:dist:${d.id}` });
        toast.success(t('toast.achievement.exported'));
      } catch { toast.error(t('common.error')); }
    }
    setPdfPreviewDist(null);
  };

  // ── Weekly Plans CRUD ─────────────────────────────────────────────────────
  const saveWeekly = async () => {
    if (!weeklyForm.subject) { toast.error(t('eduPage.dist.subjectPlaceholder')); return; }
    setSavingWeekly(true);
    try {
      const res = await api.createEducationalService('weekly-plans', weeklyForm);
      setWeeklyPlans(p => [{ id: res?.data?.id || Date.now().toString(), ...weeklyForm, createdAt: new Date().toISOString() }, ...p]);
      toast.success(t('toast.saved')); setWeeklyDialog(false);
      setWeeklyForm({ subject: '', grade: '', semester: SEMESTERS[0], week: WEEKS[0], days: {}, objectives: '' });
    } catch { toast.error(t('common.error')); } finally { setSavingWeekly(false); }
  };
  const deleteWeekly = async (id: string) => { try { await api.deleteEducationalService('weekly-plans', id); } catch {} setWeeklyPlans(p => p.filter(x => x.id !== id)); toast.success(t('common.delete')); };

  // ── Lesson Prep CRUD ──────────────────────────────────────────────────────
  const saveLesson = async () => {
    if (!lessonForm.lesson) { toast.error(t('eduPage.dist.lessonNamePlaceholder')); return; }
    setSavingLesson(true);
    try {
      const res = await api.createEducationalService('lesson-preparations', lessonForm);
      setLessons(p => [{ id: res?.data?.id || Date.now().toString(), ...lessonForm, createdAt: new Date().toISOString() }, ...p]);
      toast.success(t('toast.saved')); setLessonDialog(false);
      setLessonForm({ subject: '', grade: '', lesson: '', objectives: '', content: '', activities: '', assessment: '', notes: '', duration: 45 });
    } catch { toast.error(t('common.error')); } finally { setSavingLesson(false); }
  };
  const deleteLesson = async (id: string) => { try { await api.deleteEducationalService('lesson-preparations', id); } catch {} setLessons(p => p.filter(x => x.id !== id)); toast.success(t('common.delete')); };

  const filteredDist = distributions.filter(d => d.subject.includes(search) || d.grade.includes(search));
  const filteredWeekly = weeklyPlans.filter(w => w.subject.includes(search) || w.grade.includes(search));
  const filteredLessons = lessons.filter(l => l.lesson.includes(search) || l.subject.includes(search));

  return (
    <>
    <TopNavBar title={ta('التوزيعات', 'Distributions')} />
    <div className="container mx-auto py-6 px-4" dir={dir}>
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl p-6 md:p-8 mb-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-10" />
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center"><CalendarDays className="h-6 w-6" /></div>
            <div>
              <h1 className="text-2xl font-black">{t('eduPage.heroTitle.distributions')}</h1>
              <p className="text-white/80 text-sm mt-0.5">{t('eduPage.heroDesc.distributions')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchAll} className="bg-white/20 hover:bg-white/30 border-white/30 text-white rounded-xl"><RefreshCw className="h-4 w-4" /></Button>
          </div>
        </div>
        {/* Stats */}
        <div className="relative grid grid-cols-3 gap-3 mt-5">
          {[{ label: t('eduPage.stat.distributions'), value: distributions.length }, { label: t('eduPage.stat.weeklyPlans'), value: weeklyPlans.length }, { label: t('eduPage.stat.lessonPreps'), value: lessons.length }].map(s => (
            <div key={s.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-white/70">{s.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Search */}
      <div className="relative max-w-sm mb-6">
        <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder={t('common.search')} className="pr-10" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-6 w-full md:w-auto">
          <TabsTrigger value="curriculum" className="gap-2"><BookOpen className="h-4 w-4" />{t('eduPage.tab.curriculum')}</TabsTrigger>
          <TabsTrigger value="weekly" className="gap-2"><Calendar className="h-4 w-4" />{t('eduPage.tab.weekly')}</TabsTrigger>
          <TabsTrigger value="lesson" className="gap-2"><ClipboardList className="h-4 w-4" />{t('eduPage.tab.lesson')}</TabsTrigger>
        </TabsList>

        {/* ─── TAB 1: Curriculum Distribution ─── */}
        <TabsContent value="curriculum">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">{t('eduPage.dist.currTitle')}</h2>
            <Dialog open={distDialog} onOpenChange={setDistDialog}>
              <DialogTrigger asChild><Button className="gap-2 bg-teal-600 hover:bg-teal-700"><Plus className="h-4 w-4" />{t('eduPage.dist.newDist')}</Button></DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir={dir}>
                <DialogHeader><DialogTitle>{t('eduPage.dist.createDist')}</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-2">
                      <Label>{t('eduPage.dist.stage')}</Label>
                      <Select value={distForm.stage} onValueChange={v => setDistForm(p => ({ ...p, stage: v, grade: '' }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>{t('eduPage.dist.grade')}</Label>
                      <Select value={distForm.grade} onValueChange={v => setDistForm(p => ({ ...p, grade: v }))}>
                        <SelectTrigger><SelectValue placeholder={t('eduPage.dist.gradePlaceholder')} /></SelectTrigger>
                        <SelectContent>{(GRADES_MAP[distForm.stage] || []).map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-2">
                      <Label>{t('eduPage.dist.subject')}</Label>
                      <Select value={distForm.subject} onValueChange={v => setDistForm(p => ({ ...p, subject: v }))}>
                        <SelectTrigger><SelectValue placeholder={t('eduPage.dist.subjectPlaceholder')} /></SelectTrigger>
                        <SelectContent>{SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>{t('eduPage.dist.semester')}</Label>
                      <Select value={distForm.semester} onValueChange={v => setDistForm(p => ({ ...p, semester: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{SEMESTERS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-2"><Label>{t('eduPage.dist.weeksCount')}</Label><Input type="number" min={1} max={52} value={distForm.weeks} onChange={e => setDistForm(p => ({ ...p, weeks: +e.target.value }))} /></div>
                    <div className="grid gap-2"><Label>{t('eduPage.dist.startDate')}</Label><Input type="date" value={distForm.startDate} onChange={e => setDistForm(p => ({ ...p, startDate: e.target.value }))} /></div>
                  </div>
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label>{t('eduPage.dist.topics')}</Label>
                      <div className="flex gap-1.5">
                        <button type="button" disabled={aiLoading}
                          onClick={() => aiAssist(`اقترح توزيع وحدات ودروس مادة ${distForm.subject} للصف ${distForm.grade} ${distForm.semester} على ${distForm.weeks} أسبوعاً وفق المنهج السعودي. اكتب كل وحدة أو موضوع في سطر منفصل.`, text => setDistForm(p => ({ ...p, topics: text })))}
                          className="flex items-center gap-1 text-xs font-bold text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100 px-2 py-1 rounded-lg transition-colors disabled:opacity-50">
                          {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} {t('eduPage.ai.generateAI')}
                        </button>
                        <button type="button" disabled={aiLoading}
                          onClick={() => aiAssistFromFile(text => setDistForm(p => ({ ...p, topics: text })), 'topics')}
                          className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-lg transition-colors disabled:opacity-50">
                          {t('eduPage.dist.fromFile')}
                        </button>
                      </div>
                    </div>
                    <Textarea placeholder={isEn ? 'Unit 1: Numbers\nUnit 2: Arithmetic' : ta('الوحدة الأولى: الأعداد\nالوحدة الثانية: العمليات الحسابية', 'الوحدة الأولى: الأعداد\\nالوحدة الثانية: العمليات الحسابية') } className="min-h-[120px]" value={distForm.topics} onChange={e => setDistForm(p => ({ ...p, topics: e.target.value }))} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDistDialog(false)}>{t('common.cancel')}</Button>
                  <Button onClick={saveDist} disabled={savingDist} className="bg-teal-600 hover:bg-teal-700">{savingDist ? <><Loader2 className="h-4 w-4 animate-spin ms-2" />{t('eduPage.btn.saving')}</> : <><CalendarDays className="h-4 w-4 me-2" />{t('eduPage.dist.saveDist')}</>}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {distLoading ? <Card><CardContent className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-teal-500" /></CardContent></Card>
            : filteredDist.length === 0 ? (
              <Card className="border-0 shadow-sm"><CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-teal-500/10 flex items-center justify-center mb-4"><CalendarDays className="h-8 w-8 text-teal-500" /></div>
                <h3 className="text-lg font-bold mb-2">{t('eduPage.dist.emptyTitle')}</h3><p className="text-muted-foreground mb-4 text-sm">{t('eduPage.dist.emptyDesc')}</p>
                <Button onClick={() => setDistDialog(true)} className="gap-2 bg-teal-600 hover:bg-teal-700"><Plus className="h-4 w-4" />{t('eduPage.dist.newDist')}</Button>
              </CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDist.map((d, i) => (
                  <motion.div key={d.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ y: -4 }}>
                    <Card className="border-0 shadow-sm hover:shadow-lg transition-all rounded-2xl">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between"><Badge className="bg-teal-500">{d.semester}</Badge><Badge variant="outline">{d.weeks} {t('eduPage.week')}</Badge></div>
                        <CardTitle className="text-lg mt-2">{d.subject}</CardTitle>
                        <p className="text-sm text-muted-foreground">{d.grade} {d.stage && `• ${d.stage}`}</p>
                      </CardHeader>
                      <CardContent>
                        {d.topics?.length > 0 && <div className="mb-3"><p className="text-xs font-medium text-muted-foreground mb-1">{t('eduPage.dist.units')} ({d.topics.length}):</p><ul className="text-xs space-y-1">{d.topics.slice(0, 3).map((t, j) => <li key={j} className="flex items-start gap-1"><BookOpen className="h-3 w-3 text-teal-500 mt-0.5 shrink-0" />{t}</li>)}{d.topics.length > 3 && <li className="text-muted-foreground">+{d.topics.length - 3} {t('eduPage.dist.moreTopics')}</li>}</ul></div>}
                        <div className="flex items-center gap-1.5">
                          <Button variant="outline" size="sm" className="flex-1 gap-1 rounded-lg" onClick={() => exportDist(d)}><Download className="h-3.5 w-3.5" />PDF</Button>
                          <Button variant="ghost" size="icon" className="text-destructive rounded-lg" onClick={() => deleteDist(d.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
        </TabsContent>

        {/* ─── TAB 2: Weekly Plans ─── */}
        <TabsContent value="weekly">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">{t('eduPage.dist.weeklyTitle')}</h2>
            <Dialog open={weeklyDialog} onOpenChange={setWeeklyDialog}>
              <DialogTrigger asChild><Button className="gap-2 bg-blue-600 hover:bg-blue-700"><Plus className="h-4 w-4" />{t('eduPage.dist.newWeekly')}</Button></DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>{t('eduPage.dist.createWeekly')}</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-2">
                      <Label>{t('eduPage.dist.subject')}</Label>
                      <Select value={weeklyForm.subject} onValueChange={v => setWeeklyForm(p => ({ ...p, subject: v }))}>
                        <SelectTrigger><SelectValue placeholder={t('eduPage.dist.subjectPlaceholder')} /></SelectTrigger>
                        <SelectContent>{SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2"><Label>{t('eduPage.dist.grade')}</Label><Input placeholder={t('eduPage.dist.gradePlaceholder')} value={weeklyForm.grade} onChange={e => setWeeklyForm(p => ({ ...p, grade: e.target.value }))} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-2">
                      <Label>{t('eduPage.dist.semester')}</Label>
                      <Select value={weeklyForm.semester} onValueChange={v => setWeeklyForm(p => ({ ...p, semester: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{SEMESTERS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>{t('eduPage.dist.weekLabel')}</Label>
                      <Select value={weeklyForm.week} onValueChange={v => setWeeklyForm(p => ({ ...p, week: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{WEEKS.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  {/* Day grid */}
                  <div className="grid gap-2">
                    <Label>{t('eduPage.dist.dayContent')}</Label>
                    <div className="grid gap-2">
                      {DAYS.map(day => (
                        <div key={day} className="flex items-center gap-2">
                          <span className="w-20 text-sm font-medium text-muted-foreground shrink-0">{day}:</span>
                          <Input placeholder={isEn ? `${day} lesson...` : `درس ${day}...`} value={weeklyForm.days[day] || ''} onChange={e => setWeeklyForm(p => ({ ...p, days: { ...p.days, [day]: e.target.value } }))} className="flex-1" />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label>{t('eduPage.dist.weeklyObjectives')}</Label>
                      <button type="button" disabled={aiLoading} onClick={() => aiAssist(`اقترح أهداف أسبوعية لمادة ${weeklyForm.subject} للصف ${weeklyForm.grade} ${weeklyForm.week} من ${weeklyForm.semester} وفق المنهج السعودي.`, t => setWeeklyForm(p => ({ ...p, objectives: t })))} className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg transition-colors disabled:opacity-50">
                        {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} {t('eduPage.dist.suggestObjectives')}
                      </button>
                    </div>
                    <Textarea className="min-h-[80px]" placeholder={ta('أهداف هذا الأسبوع...', 'Objectives for this week...')} value={weeklyForm.objectives} onChange={e => setWeeklyForm(p => ({ ...p, objectives: e.target.value }))} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setWeeklyDialog(false)}>{t('common.cancel')}</Button>
                  <Button onClick={saveWeekly} disabled={savingWeekly} className="bg-blue-600 hover:bg-blue-700">{savingWeekly ? <><Loader2 className="h-4 w-4 animate-spin ms-2" />{t('eduPage.btn.saving')}</> : <><Calendar className="h-4 w-4 me-2" />{t('eduPage.dist.saveWeekly')}</>}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          {weeklyLoading ? <Card><CardContent className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></CardContent></Card>
            : filteredWeekly.length === 0 ? (
              <Card className="border-0 shadow-sm"><CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4"><Calendar className="h-8 w-8 text-blue-500" /></div>
                <h3 className="text-lg font-bold mb-2">{t('eduPage.dist.emptyWeeklyTitle')}</h3><p className="text-muted-foreground mb-4 text-sm">{t('eduPage.dist.emptyWeeklyDesc')}</p>
                <Button onClick={() => setWeeklyDialog(true)} className="gap-2 bg-blue-600 hover:bg-blue-700"><Plus className="h-4 w-4" />{t('eduPage.dist.newWeekly')}</Button>
              </CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredWeekly.map((w, i) => (
                  <motion.div key={w.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ y: -3 }}>
                    <Card className="border-0 shadow-sm hover:shadow-lg rounded-2xl transition-all">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between"><Badge className="bg-blue-500">{w.week}</Badge><Badge variant="outline">{w.semester}</Badge></div>
                        <CardTitle className="text-lg mt-2">{w.subject}</CardTitle>
                        <p className="text-sm text-muted-foreground">{w.grade}</p>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-1 mb-3">{DAYS.filter(d => w.days?.[d]).map(d => <div key={d} className="flex items-center gap-2 text-xs"><span className="w-16 font-medium text-muted-foreground">{d}:</span><span className="flex-1 bg-blue-50 dark:bg-blue-900/20 rounded px-2 py-0.5">{w.days[d]}</span></div>)}</div>
                        <div className="flex justify-end"><Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteWeekly(w.id)}><Trash2 className="h-4 w-4" /></Button></div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
        </TabsContent>

        {/* ─── TAB 3: Lesson Preparation ─── */}
        <TabsContent value="lesson">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">{t('eduPage.dist.lessonTitle')}</h2>
            <Dialog open={lessonDialog} onOpenChange={setLessonDialog}>
              <DialogTrigger asChild><Button className="gap-2 bg-purple-600 hover:bg-purple-700"><Plus className="h-4 w-4" />{t('eduPage.dist.newLesson')}</Button></DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>{t('eduPage.dist.createLesson')}</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-2">
                      <Label>{t('eduPage.dist.subject')}</Label>
                      <Select value={lessonForm.subject} onValueChange={v => setLessonForm(p => ({ ...p, subject: v }))}>
                        <SelectTrigger><SelectValue placeholder={t('eduPage.dist.subjectPlaceholder')} /></SelectTrigger>
                        <SelectContent>{SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2"><Label>{t('eduPage.dist.grade')}</Label><Input placeholder={t('eduPage.dist.gradePlaceholder')} value={lessonForm.grade} onChange={e => setLessonForm(p => ({ ...p, grade: e.target.value }))} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-2"><Label>{t('eduPage.dist.lessonName')}</Label><Input placeholder={t('eduPage.dist.lessonNamePlaceholder')} value={lessonForm.lesson} onChange={e => setLessonForm(p => ({ ...p, lesson: e.target.value }))} /></div>
                    <div className="grid gap-2"><Label>{t('eduPage.dist.duration')}</Label><Input type="number" min={20} max={120} value={lessonForm.duration} onChange={e => setLessonForm(p => ({ ...p, duration: +e.target.value }))} /></div>
                  </div>
                  {[
                    { key: 'objectives', label: t('eduPage.dist.objectives'), prompt: `اكتب أهدافاً سلوكية لدرس "${lessonForm.lesson}" في مادة ${lessonForm.subject} للصف ${lessonForm.grade} وفق المنهج السعودي.` },
                    { key: 'content', label: t('eduPage.dist.content'), prompt: `لخص محتوى درس "${lessonForm.lesson}" في مادة ${lessonForm.subject} للصف ${lessonForm.grade} وفق المنهج السعودي.` },
                    { key: 'activities', label: t('eduPage.dist.activities'), prompt: `اقترح أنشطة تعليمية ووسائل لدرس "${lessonForm.lesson}" في مادة ${lessonForm.subject}.` },
                    { key: 'assessment', label: t('eduPage.dist.assessment'), prompt: `اقترح أساليب تقويم لدرس "${lessonForm.lesson}" في مادة ${lessonForm.subject}.` },
                  ].map(f => (
                    <div key={f.key} className="grid gap-2">
                      <div className="flex items-center justify-between">
                        <Label>{f.label}</Label>
                        <button type="button" disabled={aiLoading || !lessonForm.lesson} onClick={() => aiAssist(f.prompt, t => setLessonForm(p => ({ ...p, [f.key]: t })))} className="flex items-center gap-1 text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded-lg transition-colors disabled:opacity-50">
                          {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} ✨
                        </button>
                      </div>
                      <Textarea className="min-h-[70px]" value={(lessonForm as any)[f.key]} onChange={e => setLessonForm(p => ({ ...p, [f.key]: e.target.value }))} />
                    </div>
                  ))}
                  <div className="grid gap-2"><Label>{t('eduPage.dist.notes')}</Label><Textarea className="min-h-[60px]" value={lessonForm.notes} onChange={e => setLessonForm(p => ({ ...p, notes: e.target.value }))} /></div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setLessonDialog(false)}>{t('common.cancel')}</Button>
                  <Button onClick={saveLesson} disabled={savingLesson} className="bg-purple-600 hover:bg-purple-700">{savingLesson ? <><Loader2 className="h-4 w-4 animate-spin ms-2" />{t('eduPage.btn.saving')}</> : <><FileText className="h-4 w-4 me-2" />{t('eduPage.dist.saveLesson')}</>}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          {lessonLoading ? <Card><CardContent className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-purple-500" /></CardContent></Card>
            : filteredLessons.length === 0 ? (
              <Card className="border-0 shadow-sm"><CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-4"><ClipboardList className="h-8 w-8 text-purple-500" /></div>
                <h3 className="text-lg font-bold mb-2">{t('eduPage.dist.emptyLessonTitle')}</h3><p className="text-muted-foreground mb-4 text-sm">{t('eduPage.dist.emptyLessonDesc')}</p>
                <Button onClick={() => setLessonDialog(true)} className="gap-2 bg-purple-600 hover:bg-purple-700"><Plus className="h-4 w-4" />{t('eduPage.dist.newLesson')}</Button>
              </CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredLessons.map((l, i) => (
                  <motion.div key={l.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ y: -3 }}>
                    <Card className="border-0 shadow-sm hover:shadow-lg rounded-2xl transition-all">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between"><Badge className="bg-purple-500">{l.subject}</Badge><Badge variant="outline">{l.duration} {t('eduPage.dist.minute')}</Badge></div>
                        <CardTitle className="text-lg mt-2">{l.lesson}</CardTitle>
                        <p className="text-sm text-muted-foreground">{l.grade}</p>
                      </CardHeader>
                      <CardContent>
                        {l.objectives && <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{l.objectives}</p>}
                        <div className="flex gap-2 flex-wrap mb-2">{l.content && <Badge variant="outline" className="text-xs">{t('eduPage.dist.contentCheck')}</Badge>}{l.activities && <Badge variant="outline" className="text-xs">{t('eduPage.dist.activitiesCheck')}</Badge>}{l.assessment && <Badge variant="outline" className="text-xs">{t('eduPage.dist.assessmentCheck')}</Badge>}</div>
                        <div className="flex justify-end"><Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteLesson(l.id)}><Trash2 className="h-4 w-4" /></Button></div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
        </TabsContent>
      </Tabs>

      {/* Hidden PDF template */}
      <div className="fixed left-[-9999px] top-0" ref={previewRef}>
        {pdfPreviewDist && (
          <div className="w-[793px] bg-white p-10 font-sans" dir={dir}>
            <div className="border-b-4 border-teal-500 pb-4 mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-gray-900">{isEn ? 'Saudi Curriculum Distribution' : ta('توزيع المنهج السعودي', 'Saudi Curriculum Distribution') }</h1>
                <p className="text-teal-600 font-semibold mt-1">{pdfPreviewDist.subject} — {pdfPreviewDist.grade}</p>
              </div>
              <div className="text-start text-xs text-gray-400">
                <p>{pdfPreviewDist.semester}</p>
                <p>{pdfPreviewDist.weeks} {isEn ? 'weeks' : ta('أسبوعاً', 'weeks') }</p>
                <p>{pdfPreviewDist.stage}</p>
              </div>
            </div>
            <h2 className="text-lg font-bold mb-4 text-gray-800">{isEn ? 'Units & Topics' : ta('الوحدات والمواضيع', 'Units and Topics') }</h2>
            <div className="space-y-2">
              {(pdfPreviewDist.topics || []).map((topic: string, i: number) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-teal-50 rounded-lg">
                  <span className="w-8 h-8 rounded-full bg-teal-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">{i + 1}</span>
                  <span className="text-sm text-gray-800">{topic}</span>
                </div>
              ))}
            </div>
            <div className="border-t-2 pt-4 mt-8 flex justify-between items-end">
              <p className="text-xs text-gray-400">SERS Platform — {pdfPreviewDist.createdAt && new Date(pdfPreviewDist.createdAt).toLocaleDateString(locale === 'en' ? 'en-US' : 'ar-SA')}</p>
            </div>
          </div>
        )}
      </div>

      {/* Hidden file input for AI-from-file feature */}
      <input ref={fileInputRef} type="file" accept=".txt,.pdf,.doc,.docx,.csv" className="hidden" onChange={handleFileRead} />
    </div>
    </>
  );
}
