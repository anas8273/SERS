'use client';
import { ta } from '@/i18n/auto-translations';

import { useTranslation } from '@/i18n/useTranslation';
import { TopNavBar } from '@/components/layout/TopNavBar';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import toast from 'react-hot-toast';
import { FileQuestion, Plus, Search, Trash2, Loader2, Calendar, CheckCircle, BookOpen, Download, Image as ImageIcon, RefreshCw, BarChart3, Sparkles } from 'lucide-react';
import { FileUpload, type Attachment } from '@/components/shared/FileUpload';
import { exportToPDF, exportToImage, qrCodeToDataURL } from '@/lib/export-utils';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';



interface Test {
  id: string; title: string; testType: string;
  subject: string; grade: string; date: string; maxScore: number;
  studentCount: number; notes: string; createdAt: string; attachments: Attachment[];
  status?: string;
}

export default function TestsPage() {
  const { dir, t, locale } = useTranslation();
  const isEn = locale === 'en';
  const testTypeOptions = isEn
    ? ['Monthly Exam', 'Final Exam', 'Quiz', 'Homework', 'Project', 'Practical'] as const
    : ['اختبار شهري', 'اختبار نهائي', 'اختبار قصير', 'واجب', 'مشروع', 'عملي'] as const;
  const statusUpcoming = isEn ? 'Upcoming' : 'قادم';
  const statusDone = isEn ? 'Completed' : 'مكتمل';
  const router = useRouter();
  const [tests, setTests] = useState<Test[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [newAttachments, setNewAttachments] = useState<Attachment[]>([]);
  const [previewTest, setPreviewTest] = useState<Test | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [newTest, setNewTest] = useState({
    title: '', testType: '',
    subject: '', grade: '', date: new Date().toISOString().split('T')[0],
    maxScore: 100, studentCount: 30, notes: '', status: 'upcoming',
  });

  useEffect(() => { fetchTests(); }, []);

  const fetchTests = async () => {
    setIsLoading(true);
    try {
      const response = await api.getEducationalServices('tests');
      const items = response?.data || [];
      setTests(items.map((item: any) => ({
        id: item.id, title: item.title || '',
        testType: item.testType || item.test_type || testTypeOptions[0],
        subject: item.subject || '', grade: item.grade || '', date: item.date || '',
        maxScore: item.maxScore || item.max_score || 100,
        studentCount: item.studentCount || item.student_count || 0,
        notes: item.notes || '',
        createdAt: item.createdAt || item.created_at || new Date().toISOString(),
        attachments: item.attachments || [],
        status: item.status || 'upcoming',
      })));
    } catch { } finally { setIsLoading(false); }
  };

  const aiAssist = async (prompt: string, onResult: (text: string) => void) => {
    setAiLoading(true);
    try {
      const res = await api.chatWithAI(prompt);
      const text = res?.data?.message || res?.data?.response || res?.data?.content || '';
      if (text) onResult(text);
      else toast.error(t('common.error'));
    } catch { toast.error(t('common.error')); } finally { setAiLoading(false); }
  };

  const handleCreate = async () => {
    if (!newTest.subject) { toast.error(t('plans.subject')); return; }
    setIsCreating(true);
    try {
      const payload = { ...newTest, attachments: [...newAttachments], status: 'upcoming' };
      const response = await api.createEducationalService('tests', payload);
      const test: Test = { id: response?.data?.id || Date.now().toString(), ...newTest, createdAt: new Date().toISOString(), attachments: [...newAttachments], status: 'upcoming' };
      setTests(prev => [test, ...prev]);
      toast.success(t('tests.add'));
      setIsCreateOpen(false);
      setNewTest({ title: '', testType: testTypeOptions[0], subject: '', grade: '', date: new Date().toISOString().split('T')[0], maxScore: 100, studentCount: 30, notes: '', status: 'upcoming' });
      setNewAttachments([]);
    } catch { toast.error(t('common.error')); } finally { setIsCreating(false); }
  };

  const handleDelete = async (id: string) => {
    try { await api.deleteEducationalService('tests', id); } catch {}
    setTests(prev => prev.filter(x => x.id !== id));
    toast.success(t('common.delete'));
  };

  const handleExportPDF = async (test: Test) => {
    setPreviewTest(test); setIsExporting(true);
    await new Promise(r => setTimeout(r, 300));
    if (previewRef.current) {
      try { await exportToPDF(previewRef.current, `test_${test.subject}`, { title: test.testType, includeQR: true, qrData: `SERS-Test:${test.id}` }); toast.success('PDF'); }
      catch { toast.error(t('common.error')); }
    }
    setIsExporting(false); setPreviewTest(null);
  };

  const handleExportImage = async (test: Test) => {
    setPreviewTest(test); setIsExporting(true);
    await new Promise(r => setTimeout(r, 300));
    if (previewRef.current) {
      try { await exportToImage(previewRef.current, `test_${test.subject}`); toast.success(t('followUp.successImage')); }
      catch { toast.error(t('common.error')); }
    }
    setIsExporting(false); setPreviewTest(null);
  };

  const filtered = tests.filter(x => (x.title + x.subject + x.grade + x.testType).includes(searchQuery));

  const statsData = [
    { labelKey: 'tests.title', value: tests.length, icon: FileQuestion, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
    { labelKey: 'tests.duration', value: tests.filter(x => x.status === 'upcoming').length, icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { labelKey: 'plans.completed', value: tests.filter(x => x.status === 'completed').length, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' },
    { labelKey: 'plans.subject', value: new Set(tests.map(x => x.subject)).size, icon: BookOpen, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ];

  return (
    <>
    <TopNavBar title={ta('الاختبارات', 'Tests' )} />
    <div className="container mx-auto py-6 px-4" dir={dir}>
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl p-6 md:p-8 mb-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-10" />
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg"><FileQuestion className="h-6 w-6" /></div>
            <div>
              <h1 className="text-2xl font-black">{t('tests.title')}</h1>
              <p className="text-white/80 text-sm mt-0.5">{t('tests.subtitle')}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm border-white/30 text-white rounded-xl" onClick={() => router.push('/analyses')}>
              <BarChart3 className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border-white/30 text-white rounded-xl" onClick={fetchTests} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 rounded-xl"><Plus className="h-4 w-4" /> {t('tests.add')}</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir={dir}>
                <DialogHeader>
                  <DialogTitle>{t('tests.add')}</DialogTitle>
                  <DialogDescription>{t('tests.subtitle')}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>{t('plans.title')}</Label>
                      <Input placeholder={isEn ? 'Unit 1 Test' : ta('اختبار الوحدة الأولى', 'Unit One Test') } value={newTest.title} onChange={e => setNewTest({ ...newTest, title: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                      <Label>{t('tests.title')}</Label>
                      <Select value={newTest.testType} onValueChange={v => setNewTest({ ...newTest, testType: v as any })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{testTypeOptions.map(tt => <SelectItem key={tt} value={tt}>{tt}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>{t('plans.subject')} *</Label>
                      <Input placeholder={isEn ? 'Mathematics' : ta('الرياضيات', 'Mathematics') } value={newTest.subject} onChange={e => setNewTest({ ...newTest, subject: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                      <Label>{t('plans.student')}</Label>
                      <Input placeholder={isEn ? 'Grade 10' : ta('الأول ثانوي', 'First Secondary') } value={newTest.grade} onChange={e => setNewTest({ ...newTest, grade: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label>{t('plans.startDate')}</Label>
                      <Input type="date" value={newTest.date} onChange={e => setNewTest({ ...newTest, date: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                      <Label>{t('tests.totalMarks')}</Label>
                      <Input type="number" min={1} value={newTest.maxScore} onChange={e => setNewTest({ ...newTest, maxScore: parseInt(e.target.value) || 100 })} />
                    </div>
                    <div className="grid gap-2">
                      <Label>{t('tests.questions')}</Label>
                      <Input type="number" min={1} value={newTest.studentCount} onChange={e => setNewTest({ ...newTest, studentCount: parseInt(e.target.value) || 30 })} />
                    </div>
                  </div>
                  {/* AI-assisted notes field */}
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label>{t('followUp.labelDetails')}</Label>
                      <button type="button" disabled={aiLoading}
                        onClick={() => aiAssist(
                          `اكتب أسئلة اختبار متنوعة المستويات لمادة ${newTest.subject} للصف ${newTest.grade}. نوع الاختبار: ${newTest.testType}. الدرجة: ${newTest.maxScore}. استخدم مستويات بلوم (تذكر، فهم، تطبيق، تحليل).`,
                          text => setNewTest(p => ({ ...p, notes: text }))
                        )}
                        className="flex items-center gap-1 text-xs font-bold text-cyan-600 bg-cyan-50 hover:bg-cyan-100 px-2 py-1 rounded-lg transition-colors disabled:opacity-50">
                        {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        ? {t('tests.questions')}
                      </button>
                    </div>
                    <Textarea className="min-h-[80px]" placeholder={isEn ? 'Notes or suggested questions...' : ta('ملاحظات أو أسئلة مقترحة...', 'Notes or suggested questions...') } value={newTest.notes} onChange={e => setNewTest({ ...newTest, notes: e.target.value })} />
                  </div>
                  <FileUpload attachments={newAttachments} onAttachmentsChange={setNewAttachments} label={`${t('followUp.attachment')}`} maxFiles={3} compact />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>{t('common.cancel')}</Button>
                  <Button onClick={handleCreate} disabled={isCreating} className="bg-cyan-600 hover:bg-cyan-700">
                    {isCreating ? <><Loader2 className="h-4 w-4 animate-spin ms-2" />{t('common.save')}...</> : <><FileQuestion className="h-4 w-4 ms-2" />{t('tests.add')}</>}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {statsData.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.labelKey} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl ${stat.bg} flex items-center justify-center`}><Icon className={`h-5 w-5 ${stat.color}`} /></div>
                  <div><p className="text-xs text-muted-foreground">{t(stat.labelKey as any)}</p><p className="text-xl font-black">{stat.value}</p></div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Search */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t('common.search')} className="pr-10" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-12"><Loader2 className="h-12 w-12 text-cyan-500 animate-spin mb-4" /><p className="text-muted-foreground">{t('common.loading')}</p></CardContent></Card>
      ) : filtered.length === 0 ? (
        <Card className="border-0 shadow-sm"><CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center mb-4"><FileQuestion className="h-8 w-8 text-cyan-500" /></div>
          <h3 className="text-lg font-bold mb-2">{t('tests.noTests')}</h3>
          <p className="text-muted-foreground mb-4 text-sm">{t('tests.noTestsDesc')}</p>
          <Button onClick={() => setIsCreateOpen(true)} className="rounded-xl gap-2"><Plus className="h-4 w-4" /> {t('tests.add')}</Button>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((test, index) => (
            <motion.div key={test.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} whileHover={{ y: -4 }}>
              <Card className="border-0 shadow-sm hover:shadow-lg transition-all rounded-2xl">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <Badge className="bg-cyan-600">{test.testType}</Badge>
                    <span className="text-xs text-muted-foreground">{test.date && new Date(test.date).toLocaleDateString(locale === 'en' ? 'en-US' : 'ar-SA')}</span>
                  </div>
                  <CardTitle className="text-lg mt-2">{test.title || test.subject}</CardTitle>
                  <CardDescription>{test.subject} {test.grade && `- ${test.grade}`}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                    <span>?? {t('tests.totalMarks')}: {test.maxScore}</span>
                    <span>?? {t('tests.questions')}: {test.studentCount}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => handleExportPDF(test)} disabled={isExporting}><Download className="h-3.5 w-3.5" /> PDF</Button>
                    <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => handleExportImage(test)} disabled={isExporting}><ImageIcon className="h-3.5 w-3.5" /> {t('followUp.btnImage')}</Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(test.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Hidden PDF Preview */}
      {previewTest && (
        <div className="fixed left-[-9999px] top-0">
          <div ref={previewRef} className="w-[793px] bg-white p-10 font-sans" dir={dir}>
            <div className="border-b-4 border-cyan-500 pb-4 mb-6">
              <h1 className="text-2xl font-bold">{previewTest.testType}</h1>
              <p className="text-cyan-600 font-semibold mt-1">{previewTest.subject} - {previewTest.grade}</p>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
              <div className="bg-gray-50 rounded-lg p-3"><p className="text-gray-500">{t('plans.startDate')}</p><p className="font-bold">{previewTest.date && new Date(previewTest.date).toLocaleDateString(locale === 'en' ? 'en-US' : 'ar-SA')}</p></div>
              <div className="bg-gray-50 rounded-lg p-3"><p className="text-gray-500">{t('tests.totalMarks')}</p><p className="font-bold">{previewTest.maxScore}</p></div>
              <div className="bg-gray-50 rounded-lg p-3"><p className="text-gray-500">{t('tests.questions')}</p><p className="font-bold">{previewTest.studentCount}</p></div>
            </div>
            {previewTest.notes && <div className="mb-6"><h3 className="font-bold text-gray-700 mb-2">{t('followUp.labelDetails')}:</h3><p className="text-sm text-gray-600 whitespace-pre-line">{previewTest.notes}</p></div>}
            <div className="border-t-2 pt-4 mt-6 flex justify-between items-end">
              <p className="text-xs text-gray-400">SERS</p>
              <img src={qrCodeToDataURL(`SERS-Test:${previewTest.id}`, 80)} alt="QR" className="inline-block" />
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
