'use client';
import { ta } from '@/i18n/auto-translations';

import { useTranslation } from '@/i18n/useTranslation';
import { TopNavBar } from '@/components/layout/TopNavBar';
import { useState, useRef, useEffect } from 'react';
import { PageBreadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import toast from 'react-hot-toast';
import { ShieldCheck, Plus, Search, Trash2, Loader2, Download, Image as ImageIcon, RefreshCw, Target, TrendingUp, Edit, Sparkles } from 'lucide-react';
import { FileUpload, type Attachment } from '@/components/shared/FileUpload';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Textarea } from '@/components/ui/textarea';
import { exportToPDF, exportToImage, qrCodeToDataURL } from '@/lib/export-utils';



interface WorkEvidence {
    id: string; title: string; category: string;
    description: string; score: number; date: string;
    createdAt: string; attachments: Attachment[];
}

export default function WorkEvidencePage() {
    const { dir, t, locale } = useTranslation();
    const isEn = locale === 'en';
    const EVIDENCE_CATEGORIES = isEn
      ? ['Professional Ethics', 'Professional Development', 'Interaction with Educators', 'Parent & Community Engagement', 'Language & Digital Skills', 'Learner Knowledge', 'Subject Content & Pedagogy', 'Instructional Planning', 'Interactive Learning Environments', 'Assessment', 'Extra Activities']
      : ['الالتزام بأخلاقيات المهنة', 'التطوير المهني المستمر', 'التفاعل المهني مع التربويين', 'التفاعل مع أولياء الأمور والمجتمع', 'الإلمام بالمهارات اللغوية والرقمية', 'المعرفة بالمتعلم وكيفية تعلمه', 'المعرفة بمحتوى التخصص وطرق تدريسه', 'التخطيط للتدريس وتنفيذه', 'تهيئة بيئات تعلم تفاعلية وداعمة', 'التقويم', 'أنشطة إضافية'];
    const scoreLabels = isEn ? ['Unsatisfactory','Satisfactory','Good','Excellent'] : ['غير مرضي','مرضي','جيد','ممتاز'];
    const [evidences, setEvidences] = useState<WorkEvidence[]>([]);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [isCreating, setIsCreating] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [aiLoading, setAiLoading] = useState<boolean>(false);
    const [newAttachments, setNewAttachments] = useState<Attachment[]>([]);
    const [previewEvidence, setPreviewEvidence] = useState<WorkEvidence | null>(null);
    const [editingEvidenceId, setEditingEvidenceId] = useState<string | null>(null);
    const previewRef = useRef<HTMLDivElement>(null);
    const [newEvidence, setNewEvidence] = useState({
        title: '', category: '',
        description: '', score: 4, date: new Date().toISOString().split('T')[0],
    });

    useEffect(() => { fetchEvidences(); }, []);

    const fetchEvidences = async () => {
        setIsLoading(true);
        try {
            const response = await api.getEducationalServices('work-evidence');
            const items = response?.data || [];
            setEvidences(items.map((item: any) => ({
                id: item.id, title: item.title || '', category: item.category || EVIDENCE_CATEGORIES[0],
                description: item.description || '', score: item.score || 4,
                date: item.date || '', createdAt: item.createdAt || item.created_at || new Date().toISOString(),
                attachments: item.attachments || [],
            })));
        } catch { } finally { setIsLoading(false); }
    };

    const handleCreateOrUpdate = async () => {
        if (!newEvidence.title) { toast.error(t('workEvidence.title2')); return; }
        setIsCreating(true);
        try {
            const payload = { ...newEvidence, attachments: [...newAttachments] };
            if (editingEvidenceId) {
                await api.updateEducationalService('work-evidence', editingEvidenceId, payload);
                setEvidences(prev => prev.map(e => e.id === editingEvidenceId ? { ...e, ...newEvidence, attachments: [...newAttachments] } as WorkEvidence : e));
                toast.success(t('workEvidence.edit'));
            } else {
                const response = await api.createEducationalService('work-evidence', payload);
                const evidence: WorkEvidence = { id: response?.data?.id || Date.now().toString(), ...newEvidence, createdAt: new Date().toISOString(), attachments: [...newAttachments] };
                setEvidences(prev => [evidence, ...prev]);
                toast.success(t('workEvidence.add'));
            }
            setIsCreateOpen(false);
            setEditingEvidenceId(null);
            setNewEvidence({ title: '', category: EVIDENCE_CATEGORIES[0], description: '', score: 4, date: new Date().toISOString().split('T')[0] });
            setNewAttachments([]);
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

    const handleEditClick = (evidence: WorkEvidence) => {
        setEditingEvidenceId(evidence.id);
        setNewEvidence({
            title: evidence.title,
            category: evidence.category,
            description: evidence.description || '',
            score: evidence.score || 4,
            date: evidence.date || new Date().toISOString().split('T')[0],
        });
        setNewAttachments(evidence.attachments || []);
        setIsCreateOpen(true);
    };

    const handleDelete = async (id: string) => {
        try { await api.deleteEducationalService('work-evidence', id); } catch {}
        setEvidences(prev => prev.filter(e => e.id !== id)); toast.success(t('common.delete'));
    };

    const handleExportPDF = async (evidence: WorkEvidence) => {
        setPreviewEvidence(evidence); setIsExporting(true);
        await new Promise(r => setTimeout(r, 300));
        if (previewRef.current) { try { await exportToPDF(previewRef.current, `evidence_${evidence.title}`, { title: t('workEvidence.title'), includeQR: true, qrData: `SERS-Evidence:${evidence.id}` }); toast.success('PDF'); } catch { toast.error(t('common.error')); } }
        setIsExporting(false); setPreviewEvidence(null);
    };

    const handleExportImage = async (evidence: WorkEvidence) => {
        setPreviewEvidence(evidence); setIsExporting(true);
        await new Promise(r => setTimeout(r, 300));
        if (previewRef.current) { try { await exportToImage(previewRef.current, `evidence_${evidence.title}`); toast.success(t('followUp.successImage')); } catch { toast.error(t('common.error')); } }
        setIsExporting(false); setPreviewEvidence(null);
    };

    const categoriesCovered = new Set(evidences.map(e => e.category)).size;
    const avgScore = evidences.length > 0 ? (evidences.reduce((s, e) => s + e.score, 0) / evidences.length).toFixed(1) : '0';
    const filtered = evidences.filter(e =>
        (e.title + e.description + e.category).includes(searchQuery) &&
        (filterCategory === 'all' || e.category === filterCategory)
    );

    return (
    <>
    <TopNavBar title={ta('شواهد الأداء', 'Performance Evidence' )} />
        <div className="container mx-auto py-6 px-4" dir={dir}>
            <PageBreadcrumb pageName={t('workEvidence.title')} parentName={t('nav.services')} parentHref="/services" />

            {/* Gradient Hero */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 md:p-8 mb-8 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-10" />
                <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg"><ShieldCheck className="h-6 w-6" /></div>
                        <div>
                            <h1 className="text-2xl font-black">{t('workEvidence.title')}</h1>
                            <p className="text-white/80 text-sm mt-0.5">{t('workEvidence.subtitle')}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={fetchEvidences} disabled={isLoading} className="border-white/30 text-white hover:bg-white/10"><RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /></Button>
                        <Dialog open={isCreateOpen} onOpenChange={(open) => {
                            setIsCreateOpen(open);
                            if (!open) {
                                setEditingEvidenceId(null);
                                setNewEvidence({ title: '', category: EVIDENCE_CATEGORIES[0], description: '', score: 4, date: new Date().toISOString().split('T')[0] });
                                setNewAttachments([]);
                            }
                        }}>
                            <DialogTrigger asChild><Button className="gap-2 bg-white text-emerald-600 hover:bg-gray-100 font-bold"><Plus className="h-4 w-4" /> {t('workEvidence.add')}</Button></DialogTrigger>
                            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir={dir}>
                                <DialogHeader><DialogTitle>{editingEvidenceId ? t('workEvidence.edit') : t('workEvidence.add')}</DialogTitle><DialogDescription>{t('workEvidence.subtitle')}</DialogDescription></DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2"><Label>{t('workEvidence.title2')} *</Label><Input placeholder={isEn ? 'Applying cooperative learning strategy' : ta('تطبيق استراتيجية التعلم التعاوني', 'Applying cooperative learning strategy') } value={newEvidence.title} onChange={e => setNewEvidence({ ...newEvidence, title: e.target.value })} /></div>
                                    <div className="grid gap-2"><Label>{t('workEvidence.category')}</Label><Select value={newEvidence.category} onValueChange={v => setNewEvidence({ ...newEvidence, category: v as any })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{EVIDENCE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2"><Label>{t('workEvidence.score')}</Label><Select value={String(newEvidence.score)} onValueChange={v => setNewEvidence({ ...newEvidence, score: parseInt(v) })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[1,2,3,4].map(s => <SelectItem key={s} value={String(s)}>{s} - {scoreLabels[s-1]}</SelectItem>)}</SelectContent></Select></div>
                                        <div className="grid gap-2"><Label>{t('plans.startDate')}</Label><Input type="date" value={newEvidence.date} onChange={e => setNewEvidence({ ...newEvidence, date: e.target.value })} /></div>
                                    </div>
                                    {/* Inline AI for evidence description */}
                                    <div className="grid gap-2">
                                        <div className="flex items-center justify-between">
                                            <Label>{t('followUp.labelDetails')}</Label>
                                            <button type="button" disabled={aiLoading}
                                                onClick={() => aiAssist(
                                                    `اكتب وصفاً تفصيلياً لشاهد أداء وظيفي بعنوان "${newEvidence.title}" ضمن معيار "${newEvidence.category}". الوصف يجب أن يوضح الكفاية المهنية، وأسلوب التطبيق، والنتائج التي حُققت. اكتفِ بـ 3-4 جمل واضحة ومهنية.`,
                                                    text => setNewEvidence(p => ({ ...p, description: text }))
                                                )}
                                                className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg transition-colors disabled:opacity-50">
                                                {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                                ? {t('services.tryAI')}
                                            </button>
                                        </div>
                                        <Textarea className="min-h-[100px]" placeholder={isEn ? 'Detailed description of the evidence...' : ta('وصف تفصيلي للشاهد يوضح الكفاية والمهارة...', 'Detailed description showing competency and skill...') } value={newEvidence.description} onChange={e => setNewEvidence({ ...newEvidence, description: e.target.value })} />
                                    </div>
                                    <FileUpload attachments={newAttachments} onAttachmentsChange={setNewAttachments} label={t('followUp.attachment')} maxFiles={5} compact />
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsCreateOpen(false)}>{t('common.cancel')}</Button>
                                    <Button onClick={handleCreateOrUpdate} disabled={isCreating} className="bg-emerald-600 hover:bg-emerald-700">{isCreating ? <><Loader2 className="h-4 w-4 animate-spin ms-2" />{t('common.save')}...</> : <><ShieldCheck className="h-4 w-4 ms-2" />{editingEvidenceId ? t('workEvidence.edit') : t('workEvidence.add')}</>}</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
                {/* Progress bar inside hero */}
                <div className="relative mt-5">
                    <div className="flex items-center justify-between mb-1.5"><span className="text-xs text-white/80">{t('workEvidence.coverage')}</span><span className="text-xs font-bold">{categoriesCovered} / {EVIDENCE_CATEGORIES.length}</span></div>
                    <div className="w-full bg-white/20 rounded-full h-2.5"><div className="bg-white h-2.5 rounded-full transition-all" style={{ width: `${(categoriesCovered / EVIDENCE_CATEGORIES.length) * 100}%` }} /></div>
                </div>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                {[
                    { labelKey: 'workEvidence.title', value: evidences.length, icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { labelKey: 'workEvidence.coverage', value: `${categoriesCovered}/${EVIDENCE_CATEGORIES.length}`, icon: Target, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { labelKey: 'workEvidence.avgScore', value: `${avgScore}/4`, icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-500/10' },
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
                <Select value={filterCategory} onValueChange={setFilterCategory}><SelectTrigger className="w-[250px]"><SelectValue placeholder={t('workEvidence.category')} /></SelectTrigger><SelectContent><SelectItem value="all">{t('dash.all')}</SelectItem>{EVIDENCE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
            </div>

            {isLoading ? (
                <Card className="border-0 shadow-sm"><CardContent className="flex flex-col items-center justify-center py-16"><Loader2 className="h-12 w-12 text-emerald-500 animate-spin mb-4" /><p className="text-muted-foreground">{t('common.loading')}</p></CardContent></Card>
            ) : filtered.length === 0 ? (
                <Card className="border-0 shadow-sm"><CardContent className="flex flex-col items-center justify-center py-16 text-center"><div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4"><ShieldCheck className="h-8 w-8 text-emerald-500" /></div><h3 className="text-lg font-bold mb-2">{t('workEvidence.noItems')}</h3><p className="text-muted-foreground mb-4 text-sm">{t('workEvidence.noItemsDesc')}</p><Button onClick={() => setIsCreateOpen(true)} className="rounded-xl gap-2 bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4" /> {t('workEvidence.add')}</Button></CardContent></Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((evidence, index) => (
                        <motion.div key={evidence.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} whileHover={{ y: -4 }}>
                        <Card className="border-0 shadow-sm hover:shadow-lg transition-all rounded-2xl border-r-4 border-emerald-500">
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between"><Badge className="bg-emerald-500 rounded-lg text-[10px]">{evidence.category.substring(0, 25)}...</Badge><Badge variant="outline" className={`rounded-lg ${evidence.score >= 3 ? 'text-green-600 border-green-300' : 'text-orange-600 border-orange-300'}`}>{evidence.score}/4</Badge></div>
                                <CardTitle className="text-base mt-2">{evidence.title}</CardTitle>
                                <CardDescription>{evidence.date && new Date(evidence.date).toLocaleDateString(locale === 'en' ? 'en-US' : 'ar-SA')}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {evidence.description && <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{evidence.description.substring(0, 120)}</p>}
                                {evidence.attachments.length > 0 && <p className="text-xs text-muted-foreground mb-3">?? {evidence.attachments.length} {t('followUp.attachments')}</p>}
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <Button variant="outline" size="sm" className="flex-1 gap-1 rounded-lg" onClick={() => handleExportPDF(evidence)} disabled={isExporting}><Download className="h-3.5 w-3.5" /> PDF</Button>
                                    <Button variant="outline" size="sm" className="flex-1 gap-1 rounded-lg" onClick={() => handleExportImage(evidence)} disabled={isExporting}><ImageIcon className="h-3.5 w-3.5" /> {t('followUp.btnImage')}</Button>
                                    <Button variant="outline" size="icon" className="text-blue-600 hover:text-blue-700 rounded-lg shrink-0" onClick={() => handleEditClick(evidence)}><Edit className="h-4 w-4" /></Button>
                                    <Button variant="outline" size="icon" className="text-destructive hover:text-destructive shrink-0 rounded-lg hover:bg-red-50" onClick={() => handleDelete(evidence.id)}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                            </CardContent>
                        </Card>
                        </motion.div>
                    ))}
                </div>
            )}

            {previewEvidence && (
                <div className="fixed left-[-9999px] top-0">
                    <div ref={previewRef} className="w-[793px] bg-white p-10 font-sans" dir={dir}>
                        <div className="border-b-4 border-emerald-500 pb-4 mb-6"><h1 className="text-2xl font-bold">{t('workEvidence.title')}</h1><p className="text-emerald-600 font-semibold mt-1">{previewEvidence.category}</p></div>
                        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                            <div className="bg-gray-50 rounded-lg p-3"><p className="text-gray-500">{t('workEvidence.title2')}</p><p className="font-bold">{previewEvidence.title}</p></div>
                            <div className="bg-gray-50 rounded-lg p-3"><p className="text-gray-500">{t('workEvidence.score')}</p><p className="font-bold">{previewEvidence.score}/4 - {scoreLabels[previewEvidence.score-1]}</p></div>
                        </div>
                        {previewEvidence.description && <div className="mb-6"><h3 className="font-bold text-gray-700 mb-2">{t('followUp.labelDetails')}:</h3><p className="text-sm text-gray-600 whitespace-pre-line">{previewEvidence.description}</p></div>}
                        <div className="border-t-2 pt-4 mt-6 flex justify-between items-end"><p className="text-xs text-gray-400">SERS</p><img src={qrCodeToDataURL(`SERS-Evidence:${previewEvidence.id}`, 80)} alt="QR" className="inline-block" /></div>
                    </div>
                </div>
            )}
        </div>
    </>
    );
}
