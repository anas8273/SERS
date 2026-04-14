'use client';

import { ta } from '@/i18n/auto-translations';
import { useTranslation } from '@/i18n/useTranslation';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import toast from 'react-hot-toast';
import { FileText, Plus, Search, Trash2, Loader2, Download, Image as ImageIcon, RefreshCw, BookOpen, Layers, Sparkles } from 'lucide-react';
import { FileUpload, type Attachment } from '@/components/shared/FileUpload';
import { exportToPDF, exportToImage, qrCodeToDataURL } from '@/lib/export-utils';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import { Textarea } from '@/components/ui/textarea';
import { TopNavBar } from '@/components/layout/TopNavBar';



interface Worksheet {
    id: string; title: string; subject: string; grade: string;
    worksheetType: string; content: string;
    instructions: string; createdAt: string; attachments: Attachment[];
}

export default function WorksheetsPage() {
    const { dir, t, locale } = useTranslation();
    const isEn = locale === 'en';
    const WORKSHEET_TYPES = isEn
      ? ['Exercises', 'Problem Solving', 'Reading Comprehension', 'Creative Writing', 'Research & Inquiry', 'Coloring & Design', 'Mind Map']
      : ['تمارين', 'حل مسائل', 'قراءة وفهم', 'كتابة إبداعية', 'بحث وتقصي', 'تلوين وتصميم', 'خريطة ذهنية'];
    const [worksheets, setWorksheets] = useState<Worksheet[]>([]);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [aiLoading, setAiLoading] = useState<boolean>(false);
    const [newAttachments, setNewAttachments] = useState<Attachment[]>([]);
    const [previewWs, setPreviewWs] = useState<Worksheet | null>(null);
    const previewRef = useRef<HTMLDivElement>(null);
    const [newWs, setNewWs] = useState({
        title: '', subject: '', grade: '',
        worksheetType: '' as string,
        content: '', instructions: '',
    });

    useEffect(() => { fetchWorksheets(); }, []);

    const fetchWorksheets = async () => {
        setIsLoading(true);
        try {
            const response = await api.getEducationalServices('worksheets');
            const items = response?.data || [];
            setWorksheets(items.map((item: any) => ({
                id: item.id, title: item.title || '', subject: item.subject || '',
                grade: item.grade || '', worksheetType: item.worksheetType || item.worksheet_type || WORKSHEET_TYPES[0],
                content: item.content || '', instructions: item.instructions || '',
                createdAt: item.createdAt || item.created_at || new Date().toISOString(),
                attachments: item.attachments || [],
            })));
        } catch { } finally { setIsLoading(false); }
    };

    const handleCreate = async () => {
        if (!newWs.title) { toast.error(t('worksheets.title')); return; }
        setIsCreating(true);
        try {
            const payload = { ...newWs, attachments: [...newAttachments] };
            const response = await api.createEducationalService('worksheets', payload);
            const ws: Worksheet = { id: response?.data?.id || Date.now().toString(), ...newWs, createdAt: new Date().toISOString(), attachments: [...newAttachments] };
            setWorksheets(prev => [ws, ...prev]);
            toast.success(t('worksheets.add'));
            setIsCreateOpen(false);
            setNewWs({ title: '', subject: '', grade: '', worksheetType: WORKSHEET_TYPES[0], content: '', instructions: '' });
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

    const handleDelete = async (id: string) => {
        try { await api.deleteEducationalService('worksheets', id); } catch {}
        setWorksheets(prev => prev.filter(w => w.id !== id)); toast.success(t('common.delete'));
    };

    const handleExportPDF = async (ws: Worksheet) => {
        setPreviewWs(ws); setIsExporting(true);
        await new Promise(r => setTimeout(r, 300));
        if (previewRef.current) { try { await exportToPDF(previewRef.current, `worksheet_${ws.title}`, { title: t('worksheets.title'), includeQR: true, qrData: `SERS-WS:${ws.id}` }); toast.success('PDF'); } catch { toast.error(t('common.error')); } }
        setIsExporting(false); setPreviewWs(null);
    };

    const handleExportImage = async (ws: Worksheet) => {
        setPreviewWs(ws); setIsExporting(true);
        await new Promise(r => setTimeout(r, 300));
        if (previewRef.current) { try { await exportToImage(previewRef.current, `worksheet_${ws.title}`); toast.success(t('followUp.successImage')); } catch { toast.error(t('common.error')); } }
        setIsExporting(false); setPreviewWs(null);
    };

    const filtered = worksheets.filter(w => (w.title + w.subject + w.grade).includes(searchQuery));

    return (
        <>
        <TopNavBar title={t('worksheets.title')} />
        <div className="container mx-auto py-6 px-4" dir={dir}>
            {/* Gradient Hero */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-cyan-500 to-sky-600 rounded-2xl p-6 md:p-8 mb-8 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-10" />
                <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg"><FileText className="h-6 w-6" /></div>
                        <div>
                            <h1 className="text-2xl font-black">{t('worksheets.title')}</h1>
                            <p className="text-white/80 text-sm mt-0.5">{t('worksheets.subtitle')}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={fetchWorksheets} disabled={isLoading} className="border-white/30 text-white hover:bg-white/10"><RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /></Button>
                        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                            <DialogTrigger asChild><Button className="gap-2 bg-white text-cyan-600 hover:bg-gray-100 font-bold"><Plus className="h-4 w-4" /> {t('worksheets.add')}</Button></DialogTrigger>
                            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir={dir}>
                                <DialogHeader><DialogTitle>{t('worksheets.add')}</DialogTitle><DialogDescription>{t('worksheets.subtitle')}</DialogDescription></DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2"><Label>{t('worksheets.title2')} *</Label><Input placeholder={isEn ? 'Addition and subtraction worksheet' : ta('ورقة عمل الجمع والطرح', 'Addition and Subtraction Worksheet') } value={newWs.title} onChange={e => setNewWs({ ...newWs, title: e.target.value })} /></div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="grid gap-2"><Label>{t('plans.subject')}</Label><Input placeholder={isEn ? 'Mathematics' : ta('الرياضيات', 'Mathematics') } value={newWs.subject} onChange={e => setNewWs({ ...newWs, subject: e.target.value })} /></div>
                                        <div className="grid gap-2"><Label>{t('worksheets.grade')}</Label><Input placeholder={isEn ? '3rd Grade' : ta('الثالث ابتدائي', 'Third Grade (Primary)') } value={newWs.grade} onChange={e => setNewWs({ ...newWs, grade: e.target.value })} /></div>
                                        <div className="grid gap-2"><Label>{t('questionBank.type')}</Label><Select value={newWs.worksheetType} onValueChange={v => setNewWs({ ...newWs, worksheetType: v as any })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{WORKSHEET_TYPES.map(wt => <SelectItem key={wt} value={wt}>{wt}</SelectItem>)}</SelectContent></Select></div>
                                    </div>
                                    <div className="grid gap-2"><Label>{t('worksheets.instructions')}</Label><Textarea className="min-h-[60px]" placeholder={isEn ? 'Answer the following questions...' : ta('أجب عن الأسئلة التالية...', 'Answer the following questions...') } value={newWs.instructions} onChange={e => setNewWs({ ...newWs, instructions: e.target.value })} /></div>
                                    {/* Inline AI for worksheet content */}
                                    <div className="grid gap-2">
                                        <div className="flex items-center justify-between">
                                            <Label>{t('worksheets.content')}</Label>
                                            <button type="button" disabled={aiLoading}
                                                onClick={() => aiAssist(
                                                    `أنشئ ورقة عمل تعليمية من نوع "${newWs.worksheetType}" لمادة "${newWs.subject}" لصف "${newWs.grade}" بعنوان "${newWs.title}". اكتب 5-7 أسئلة متدرجة الصعوبة مع مساحة للإجابة، بصيغة احترافية وتربوية.`,
                                                    text => setNewWs(p => ({ ...p, content: text }))
                                                )}
                                                className="flex items-center gap-1 text-xs font-bold text-cyan-600 bg-cyan-50 hover:bg-cyan-100 px-2 py-1 rounded-lg transition-colors disabled:opacity-50">
                                                {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                                ✨ {t('services.tryAI')}
                                            </button>
                                        </div>
                                        <Textarea className="min-h-[150px]" placeholder={isEn ? 'Worksheet content (questions, exercises...)...' : ta('محتوى ورقة العمل (أسئلة، تمارين...)...', 'Worksheet content (questions, exercises...)...') } value={newWs.content} onChange={e => setNewWs({ ...newWs, content: e.target.value })} />
                                    </div>
                                    <FileUpload attachments={newAttachments} onAttachmentsChange={setNewAttachments} label={t('followUp.attachment')} maxFiles={3} compact />
                                </div>
                                <DialogFooter><Button variant="outline" onClick={() => setIsCreateOpen(false)}>{t('common.cancel')}</Button><Button onClick={handleCreate} disabled={isCreating} className="bg-cyan-600 hover:bg-cyan-700">{isCreating ? <><Loader2 className="h-4 w-4 animate-spin ms-2" />{t('common.save')}...</> : <><FileText className="h-4 w-4 me-2" />{t('worksheets.add')}</>}</Button></DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                {[
                    { labelKey: 'worksheets.title', value: worksheets.length, icon: FileText, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
                    { labelKey: 'plans.subject', value: new Set(worksheets.map(w => w.subject).filter(Boolean)).size, icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { labelKey: 'questionBank.type', value: new Set(worksheets.map(w => w.worksheetType)).size, icon: Layers, color: 'text-green-500', bg: 'bg-green-500/10' },
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

            <div className="flex items-center gap-4 mb-6"><div className="relative flex-1 max-w-sm"><Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder={t('common.search')} className="pr-10" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /></div></div>

            {isLoading ? (
                <Card className="border-0 shadow-sm"><CardContent className="flex flex-col items-center justify-center py-16"><Loader2 className="h-12 w-12 text-cyan-500 animate-spin mb-4" /><p className="text-muted-foreground">{t('common.loading')}</p></CardContent></Card>
            ) : filtered.length === 0 ? (
                <Card className="border-0 shadow-sm"><CardContent className="flex flex-col items-center justify-center py-16 text-center"><div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center mb-4"><FileText className="h-8 w-8 text-cyan-500" /></div><h3 className="text-lg font-bold mb-2">{t('worksheets.noItems')}</h3><p className="text-muted-foreground mb-4 text-sm">{t('worksheets.noItemsDesc')}</p><Button onClick={() => setIsCreateOpen(true)} className="rounded-xl gap-2 bg-cyan-600 hover:bg-cyan-700"><Plus className="h-4 w-4" /> {t('worksheets.add')}</Button></CardContent></Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((ws, index) => (
                        <motion.div key={ws.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} whileHover={{ y: -4 }}>
                        <Card className="border-0 shadow-sm hover:shadow-lg transition-all rounded-2xl border-r-4 border-cyan-500">
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between"><Badge className="bg-cyan-500 rounded-lg">{ws.worksheetType}</Badge><span className="text-xs text-muted-foreground">{new Date(ws.createdAt).toLocaleDateString(locale === 'en' ? 'en-US' : 'ar-SA')}</span></div>
                                <CardTitle className="text-lg mt-2">📄 {ws.title}</CardTitle>
                                <CardDescription>{ws.subject} {ws.grade && `- ${ws.grade}`}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {ws.content && <p className="text-xs text-muted-foreground mb-3 line-clamp-3">{ws.content.substring(0, 150)}</p>}
                                {ws.attachments.length > 0 && <p className="text-xs text-muted-foreground mb-3">📎 {ws.attachments.length} {t('followUp.attachments')}</p>}
                                <div className="flex items-center gap-1.5">
                                    <Button variant="outline" size="sm" className="flex-1 gap-1 rounded-lg" onClick={() => handleExportPDF(ws)} disabled={isExporting}><Download className="h-3.5 w-3.5" /> PDF</Button>
                                    <Button variant="outline" size="sm" className="flex-1 gap-1 rounded-lg" onClick={() => handleExportImage(ws)} disabled={isExporting}><ImageIcon className="h-3.5 w-3.5" /> {t('followUp.btnImage')}</Button>
                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(ws.id)}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                            </CardContent>
                        </Card>
                        </motion.div>
                    ))}
                </div>
            )}

            {previewWs && (
                <div className="fixed left-[-9999px] top-0">
                    <div ref={previewRef} className="w-[793px] bg-white p-10 font-sans" dir={dir}>
                        <div className="border-b-4 border-cyan-500 pb-4 mb-6">
                            <div className="flex justify-between items-start"><div><h1 className="text-2xl font-bold">{t('worksheets.title')}</h1><p className="text-cyan-600 font-semibold mt-1">{previewWs.subject} - {previewWs.grade}</p></div><div className="text-start text-sm"><p className="text-gray-500">{isEn ? 'Name' : ta('الاسم', 'Name') }: ____________</p><p className="text-gray-500 mt-1">{isEn ? 'Class' : ta('الصف', 'Grade') }: ____________</p></div></div>
                        </div>
                        <h2 className="text-xl font-bold mb-4">{previewWs.title}</h2>
                        {previewWs.instructions && <div className="bg-cyan-50 rounded-lg p-3 mb-4"><p className="text-sm font-medium text-cyan-800">📌 {previewWs.instructions}</p></div>}
                        {previewWs.content && <div className="text-sm whitespace-pre-line mb-6">{previewWs.content}</div>}
                        <div className="border-t-2 pt-4 mt-6 flex justify-between items-end"><p className="text-xs text-gray-400">SERS - {t('worksheets.title')}</p><img src={qrCodeToDataURL(`SERS-WS:${previewWs.id}`, 80)} alt="QR" className="inline-block" /></div>
                    </div>
                </div>
            )}
        </div>
        </>
    );
}
