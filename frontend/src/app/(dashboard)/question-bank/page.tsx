'use client';
import { ta } from '@/i18n/auto-translations';

import { useTranslation } from '@/i18n/useTranslation';
import { TopNavBar } from '@/components/layout/TopNavBar';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import toast from 'react-hot-toast';
import { HelpCircle, Plus, Search, Trash2, Loader2, Download, RefreshCw, BookOpen, Tag, BarChart3, Edit, Sparkles } from 'lucide-react';
import { exportToPDF } from '@/lib/export-utils';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import { Textarea } from '@/components/ui/textarea';
import { useLocalizedTypes } from '@/hooks/useLocalizedTypes';



interface Question {
    id: string; questionText: string; answer: string;
    questionType: string; difficulty: string;
    bloomLevel: string; subject: string; unit: string;
    createdAt: string;
}

export default function QuestionBankPage() {
    const { dir, t, locale } = useTranslation();
    const isEn = locale === 'en';
    const { bloomLevels, difficultyLevels } = useLocalizedTypes();
    const questionTypeOptions = isEn
      ? ['Multiple Choice', 'True/False', 'Completion', 'Essay', 'Matching', 'Reasoning'] as const
      : ['اختيار من متعدد', 'صواب وخطأ', 'إكمال', 'مقالي', 'ربط', 'تعلّل'] as const;
    const difficultyOptions = [difficultyLevels.easy, difficultyLevels.medium, difficultyLevels.hard];
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterDifficulty, setFilterDifficulty] = useState('all');
    const [isCreating, setIsCreating] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [aiLoading, setAiLoading] = useState<boolean>(false);
    const [isExporting, setIsExporting] = useState(false);
    const previewRef = useRef<HTMLDivElement>(null);
    const [newQ, setNewQ] = useState({
        questionText: '', answer: '', questionType: '',
        difficulty: '',
        bloomLevel: '',
        subject: '', unit: '',
    });
    const [editingId, setEditingId] = useState<string | null>(null);

    useEffect(() => { fetchQuestions(); }, []);

    const fetchQuestions = async () => {
        setIsLoading(true);
        try {
            const response = await api.getEducationalServices('question-bank');
            const items = response?.data || [];
            setQuestions(items.map((item: any) => ({
                id: item.id, questionText: item.questionText || item.question_text || '',
                answer: item.answer || '', questionType: item.questionType || item.question_type || questionTypeOptions[0],
                difficulty: item.difficulty || difficultyOptions[1], bloomLevel: item.bloomLevel || item.bloom_level || bloomLevels[1],
                subject: item.subject || '', unit: item.unit || '',
                createdAt: item.createdAt || item.created_at || new Date().toISOString(),
            })));
        } catch { } finally { setIsLoading(false); }
    };

    const handleCreateOrUpdate = async () => {
        if (!newQ.questionText) { toast.error(t('questionBank.question')); return; }
        setIsCreating(true);
        try {
            if (editingId) {
                await api.updateEducationalService('question-bank', editingId, newQ);
                setQuestions(prev => prev.map(q => q.id === editingId ? { ...q, ...newQ } as Question : q));
                toast.success(t('questionBank.edit'));
            } else {
                const response = await api.createEducationalService('question-bank', newQ);
                const q: Question = { id: response?.data?.id || Date.now().toString(), ...newQ, createdAt: new Date().toISOString() };
                setQuestions(prev => [q, ...prev]);
                toast.success(t('questionBank.add'));
            }
            setIsCreateOpen(false);
            setEditingId(null);
            setNewQ({ questionText: '', answer: '', questionType: questionTypeOptions[0], difficulty: difficultyOptions[1], bloomLevel: bloomLevels[1], subject: '', unit: '' });
        } catch { toast.error(t('common.error')); } finally { setIsCreating(false); }
    };

    const aiAssist = async (prompt: string, onResult: (text: string) => void) => {
        setAiLoading(true);
        try {
            const res = await api.chatWithAI(prompt);
            const text = res?.data?.message || res?.data?.response || res?.data?.content || '';
            if (text) onResult(text); else toast.error(t('common.error'));
        } catch { toast.error(t('common.error')); } finally { setAiLoading(false); }
    };

    const handleEditClick = (q: Question) => {
        setEditingId(q.id);
        setNewQ({ questionText: q.questionText, answer: q.answer, questionType: q.questionType, difficulty: q.difficulty, bloomLevel: q.bloomLevel, subject: q.subject, unit: q.unit });
        setIsCreateOpen(true);
    };

    const handleDelete = async (id: string) => {
        try { await api.deleteEducationalService('question-bank', id); } catch {}
        setQuestions(prev => prev.filter(q => q.id !== id)); toast.success(t('common.delete'));
    };

    const handleExportExam = async () => {
        if (filtered.length === 0) { toast.error(t('questionBank.noQuestions')); return; }
        setIsExporting(true);
        await new Promise(r => setTimeout(r, 300));
        if (previewRef.current) {
            try { await exportToPDF(previewRef.current, 'question_bank', { title: t('questionBank.title') }); toast.success('PDF'); } catch { toast.error(t('common.error')); }
        }
        setIsExporting(false);
    };

    const difficultyColors: Record<string, string> = { [difficultyLevels.easy]: 'bg-green-500', [difficultyLevels.medium]: 'bg-amber-500', [difficultyLevels.hard]: 'bg-red-500' };
    const bloomColors: Record<string, string> = {};
    bloomLevels.forEach((b, i) => { const c = ['bg-blue-100 text-blue-700','bg-cyan-100 text-cyan-700','bg-green-100 text-green-700','bg-amber-100 text-amber-700','bg-orange-100 text-orange-700','bg-purple-100 text-purple-700']; bloomColors[b] = c[i] || c[0]; });

    const filtered = questions.filter(q =>
        (q.questionText + q.subject + q.unit).includes(searchQuery) &&
        (filterType === 'all' || q.questionType === filterType) &&
        (filterDifficulty === 'all' || q.difficulty === filterDifficulty)
    );

    return (
    <>
    <TopNavBar title={ta('بنك الأسئلة', 'Question Bank' )} />
        <div className="container mx-auto py-6 px-4" dir={dir}>
            {/* Gradient Hero */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-2xl p-6 md:p-8 mb-8 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-10" />
                <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg"><HelpCircle className="h-6 w-6" /></div>
                        <div>
                            <h1 className="text-2xl font-black">{t('questionBank.title')}</h1>
                            <p className="text-white/80 text-sm mt-0.5">{t('questionBank.subtitle')}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleExportExam} disabled={isExporting || filtered.length === 0} className="border-white/30 text-white hover:bg-white/10 rounded-xl"><Download className="h-4 w-4 ms-1" /> {t('questionBank.exportExam')}</Button>
                        <Button variant="outline" size="sm" onClick={fetchQuestions} disabled={isLoading} className="border-white/30 text-white hover:bg-white/10"><RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /></Button>
                        <Dialog open={isCreateOpen} onOpenChange={(open) => {
                            setIsCreateOpen(open);
                            if (!open) { setEditingId(null); setNewQ({ questionText: '', answer: '', questionType: questionTypeOptions[0], difficulty: difficultyOptions[1], bloomLevel: bloomLevels[1], subject: '', unit: '' }); }
                        }}>
                            <DialogTrigger asChild><Button className="gap-2 bg-white text-violet-600 hover:bg-gray-100 font-bold"><Plus className="h-4 w-4" /> {t('questionBank.add')}</Button></DialogTrigger>
                            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir={dir}>
                                <DialogHeader><DialogTitle>{editingId ? t('questionBank.edit') : t('questionBank.add')}</DialogTitle><DialogDescription>{t('questionBank.subtitle')}</DialogDescription></DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2"><Label>{t('plans.subject')}</Label><Input placeholder={isEn ? 'Mathematics' : ta('الرياضيات', 'Mathematics') } value={newQ.subject} onChange={e => setNewQ({ ...newQ, subject: e.target.value })} /></div>
                                        <div className="grid gap-2"><Label>{t('distributions.unit')}</Label><Input placeholder={isEn ? 'Unit 1' : ta('الوحدة الأولى', 'Unit One') } value={newQ.unit} onChange={e => setNewQ({ ...newQ, unit: e.target.value })} /></div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="grid gap-2"><Label>{t('questionBank.type')}</Label><Select value={newQ.questionType} onValueChange={v => setNewQ({ ...newQ, questionType: v as any })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{questionTypeOptions.map(qt => <SelectItem key={qt} value={qt}>{qt}</SelectItem>)}</SelectContent></Select></div>
                                        <div className="grid gap-2"><Label>{t('questionBank.difficulty')}</Label><Select value={newQ.difficulty} onValueChange={v => setNewQ({ ...newQ, difficulty: v as any })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{difficultyOptions.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select></div>
                                        <div className="grid gap-2"><Label>{t('questionBank.bloom')}</Label><Select value={newQ.bloomLevel} onValueChange={v => setNewQ({ ...newQ, bloomLevel: v as any })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{bloomLevels.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent></Select></div>
                                    </div>
                                    {/* Inline AI question generation */}
                                    <div className="grid gap-2">
                                        <div className="flex items-center justify-between">
                                            <Label>{t('questionBank.question')} *</Label>
                                            <button type="button" disabled={aiLoading}
                                                onClick={() => aiAssist(
                                                    `اكتب سؤال ${newQ.questionType} بمستوى ${newQ.difficulty} ومستوى بلوم "${newQ.bloomLevel}" لمادة "${newQ.subject}" وحدة "${newQ.unit}". اكتب السؤال فقط دون إجابة.`,
                                                    text => setNewQ(p => ({ ...p, questionText: text }))
                                                )}
                                                className="flex items-center gap-1 text-xs font-bold text-violet-600 bg-violet-50 hover:bg-violet-100 px-2 py-1 rounded-lg transition-colors disabled:opacity-50">
                                                {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                                ? {t('services.tryAI')}
                                            </button>
                                        </div>
                                        <Textarea className="min-h-[80px]" placeholder={isEn ? 'Question text...' : ta('نص السؤال...', 'Question text...') } value={newQ.questionText} onChange={e => setNewQ({ ...newQ, questionText: e.target.value })} />
                                    </div>
                                    {/* AI answer suggestion */}
                                    <div className="grid gap-2">
                                        <div className="flex items-center justify-between">
                                            <Label>{t('questionBank.answer')}</Label>
                                            <button type="button" disabled={aiLoading}
                                                onClick={() => aiAssist(
                                                    `أجب على هذا السؤال بشكل مختصر ودقيق: ${newQ.questionText}`,
                                                    text => setNewQ(p => ({ ...p, answer: text }))
                                                )}
                                                className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 hover:bg-green-100 px-2 py-1 rounded-lg transition-colors disabled:opacity-50">
                                                {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                                ? {t('services.tryAI')}
                                            </button>
                                        </div>
                                        <Textarea className="min-h-[60px]" placeholder={isEn ? 'Correct answer...' : ta('الإجابة الصحيحة...', 'Correct answer...') } value={newQ.answer} onChange={e => setNewQ({ ...newQ, answer: e.target.value })} />
                                    </div>
                                </div>
                                <DialogFooter><Button variant="outline" onClick={() => setIsCreateOpen(false)}>{t('common.cancel')}</Button><Button onClick={handleCreateOrUpdate} disabled={isCreating} className="bg-violet-600 hover:bg-violet-700">{isCreating ? <><Loader2 className="h-4 w-4 animate-spin ms-2" />{t('common.save')}...</> : <><HelpCircle className="h-4 w-4 ms-2" />{editingId ? t('questionBank.edit') : t('questionBank.add')}</>}</Button></DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    { labelKey: 'questionBank.title', value: questions.length, icon: HelpCircle, color: 'text-violet-500', bg: 'bg-violet-500/10' },
                    { labelKey: 'plans.subject', value: new Set(questions.map(q => q.subject).filter(Boolean)).size, icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { labelKey: 'questionBank.type', value: new Set(questions.map(q => q.questionType)).size, icon: Tag, color: 'text-green-500', bg: 'bg-green-500/10' },
                    { labelKey: 'questionBank.hard', value: questions.filter(q => q.difficulty === difficultyLevels.hard).length, icon: BarChart3, color: 'text-red-500', bg: 'bg-red-500/10' },
                ].map((stat, i) => {
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

            <div className="flex flex-wrap items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-sm"><Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder={t('common.search')} className="pr-10" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /></div>
                <Select value={filterType} onValueChange={setFilterType}><SelectTrigger className="w-[180px]"><SelectValue placeholder={t('questionBank.type')} /></SelectTrigger><SelectContent><SelectItem value="all">{t('dash.all')}</SelectItem>{questionTypeOptions.map(qt => <SelectItem key={qt} value={qt}>{qt}</SelectItem>)}</SelectContent></Select>
                <Select value={filterDifficulty} onValueChange={setFilterDifficulty}><SelectTrigger className="w-[150px]"><SelectValue placeholder={t('questionBank.difficulty')} /></SelectTrigger><SelectContent><SelectItem value="all">{t('dash.all')}</SelectItem>{difficultyOptions.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select>
            </div>

            {isLoading ? (
                <Card className="border-0 shadow-sm"><CardContent className="flex flex-col items-center justify-center py-16"><Loader2 className="h-12 w-12 text-violet-500 animate-spin mb-4" /><p className="text-muted-foreground">{t('common.loading')}</p></CardContent></Card>
            ) : filtered.length === 0 ? (
                <Card className="border-0 shadow-sm"><CardContent className="flex flex-col items-center justify-center py-16 text-center"><div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mb-4"><HelpCircle className="h-8 w-8 text-violet-500" /></div><h3 className="text-lg font-bold mb-2">{t('questionBank.noQuestions')}</h3><p className="text-muted-foreground mb-4 text-sm">{t('questionBank.noQuestionsDesc')}</p><Button onClick={() => setIsCreateOpen(true)} className="rounded-xl gap-2 bg-violet-600 hover:bg-violet-700"><Plus className="h-4 w-4" /> {t('questionBank.add')}</Button></CardContent></Card>
            ) : (
                <div className="space-y-3">
                    {filtered.map((q, idx) => (
                        <motion.div key={q.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }} whileHover={{ y: -2 }}>
                        <Card className="border-0 shadow-sm hover:shadow-lg transition-all rounded-2xl">
                            <CardContent className="py-4">
                                <div className="flex items-start gap-4">
                                    <span className="text-lg font-bold text-muted-foreground min-w-[30px]">{idx + 1}</span>
                                    <div className="flex-1">
                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                            <Badge variant="outline" className="text-xs rounded-lg">{q.questionType}</Badge>
                                            <Badge className={`text-xs rounded-lg ${difficultyColors[q.difficulty]}`}>{q.difficulty}</Badge>
                                            <Badge className={`text-xs rounded-lg ${bloomColors[q.bloomLevel]}`}>{q.bloomLevel}</Badge>
                                            {q.subject && <Badge variant="secondary" className="text-xs rounded-lg">{q.subject}</Badge>}
                                            {q.unit && <Badge variant="secondary" className="text-xs rounded-lg">{q.unit}</Badge>}
                                        </div>
                                        <p className="text-sm font-medium mb-1 whitespace-pre-line">{q.questionText}</p>
                                        {q.answer && <p className="text-xs text-green-600 mt-2">? {q.answer}</p>}
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <Button variant="ghost" size="icon" className="text-blue-500 hover:text-blue-600 hover:bg-blue-50" onClick={() => handleEditClick(q)}><Edit className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(q.id)}><Trash2 className="h-4 w-4" /></Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Hidden PDF exam template */}
            <div className="fixed left-[-9999px] top-0">
                <div ref={previewRef} className="w-[793px] bg-white p-10 font-sans" dir={dir}>
                    <div className="text-center border-b-4 border-violet-500 pb-4 mb-6"><h1 className="text-2xl font-bold">{isEn ? 'Exam' : ta('اختبار', 'Test') }</h1><p className="text-violet-600">{new Set(filtered.map(q => q.subject)).size > 0 && `${[...new Set(filtered.map(q => q.subject))].join(' • ')}`}</p></div>
                    <div className="space-y-4">{filtered.map((q, idx) => (
                        <div key={q.id} className="border-b pb-3">
                            <p className="text-sm font-medium">{isEn ? 'Q' : 'س'}{idx + 1}: {q.questionText}</p>
                            <div className="flex gap-4 mt-1 text-xs text-gray-500"><span>{q.questionType}</span><span>{q.difficulty}</span><span>{q.bloomLevel}</span></div>
                        </div>
                    ))}</div>
                    <div className="border-t-2 pt-4 mt-6 text-center"><p className="text-xs text-gray-400">SERS - {isEn ? 'Question Bank' : ta('بنك الأسئلة', 'Question Bank') } | {new Date().toLocaleDateString(locale === 'en' ? 'en-US' : 'ar-SA')}</p></div>
                </div>
            </div>
        </div>
    </>
    );
}
