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
import { Lightbulb, Plus, Search, Trash2, Loader2, Download, Image as ImageIcon, RefreshCw, BookOpen, Edit, Sparkles } from 'lucide-react';
import { FileUpload, type Attachment } from '@/components/shared/FileUpload';
import { exportToPDF, exportToImage, qrCodeToDataURL } from '@/lib/export-utils';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Textarea } from '@/components/ui/textarea';
import { TopNavBar } from '@/components/layout/TopNavBar';


interface KnowledgeProduction {
    id: string; title: string; type: string;
    description: string; status: string; date: string;
    createdAt: string; attachments: Attachment[];
}

export default function KnowledgeProductionPage() {
    const { dir, t, locale } = useTranslation();
    const isEn = locale === 'en';
    const PRODUCTION_TYPES = isEn
      ? ['Research Paper', 'Educational Article', 'Book', 'Workshop', 'Training Course', 'Innovation', 'Training Kit', 'Other']
      : ['بحث علمي', 'مقال تربوي', 'كتاب', 'ورشة عمل', 'دورة تدريبية', 'ابتكار', 'حقيبة تدريبية', 'أخرى'];
    const STATUSES = isEn
      ? ['Draft', 'Under Review', 'Published']
      : ['مسودة', 'قيد المراجعة', 'منشور'];
    const [productions, setProductions] = useState<KnowledgeProduction[]>([]);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [isCreating, setIsCreating] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [newAttachments, setNewAttachments] = useState<Attachment[]>([]);
    const [previewProd, setPreviewProd] = useState<KnowledgeProduction | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const previewRef = useRef<HTMLDivElement>(null);
    const [newProd, setNewProd] = useState({
        title: '', type: '' as string,
        description: '', status: '' as string,
        date: new Date().toISOString().split('T')[0],
    });

    const [aiLoading, setAiLoading] = (useState<boolean>)(false);

    useEffect(() => { fetchProductions(); }, []);

    const fetchProductions = async () => {
        setIsLoading(true);
        try {
            const response = await api.getEducationalServices('knowledge-production');
            const items = response?.data || [];
            setProductions(items.map((item: any) => ({
                id: item.id, title: item.title || '', type: item.type || PRODUCTION_TYPES[0],
                description: item.description || '', status: item.status || STATUSES[0],
                date: item.date || '', createdAt: item.createdAt || item.created_at || new Date().toISOString(),
                attachments: item.attachments || [],
            })));
        } catch { } finally { setIsLoading(false); }
    };

    const aiAssist = async (prompt: string, onResult: (text: string) => void) => {
        setAiLoading(true);
        try {
            const res = await api.chatWithAI(prompt);
            const text = res?.data?.message || res?.data?.response || res?.data?.content || '';
            if (text) onResult(text); else toast.error(t('common.error'));
        } catch { toast.error(t('common.error')); } finally { setAiLoading(false); }
    };

    const handleCreateOrUpdate = async () => {
        if (!newProd.title) { toast.error(t('knowledge.title2')); return; }
        setIsCreating(true);
        try {
            const payload = { ...newProd, attachments: [...newAttachments] };
            if (editingId) {
                await api.updateEducationalService('knowledge-production', editingId, payload);
                setProductions(prev => prev.map(p => p.id === editingId ? { ...p, ...newProd, attachments: [...newAttachments] } as KnowledgeProduction : p));
                toast.success(t('knowledge.edit'));
            } else {
                const response = await api.createEducationalService('knowledge-production', payload);
                const prod: KnowledgeProduction = { id: response?.data?.id || Date.now().toString(), ...newProd, createdAt: new Date().toISOString(), attachments: [...newAttachments] };
                setProductions(prev => [prod, ...prev]);
                toast.success(t('knowledge.add'));
            }
            setIsCreateOpen(false);
            setEditingId(null);
            setNewProd({ title: '', type: PRODUCTION_TYPES[0], description: '', status: STATUSES[0], date: new Date().toISOString().split('T')[0] });
            setNewAttachments([]);
        } catch { toast.error(t('common.error')); } finally { setIsCreating(false); }
    };

    const handleEditClick = (prod: KnowledgeProduction) => {
        setEditingId(prod.id);
        setNewProd({ title: prod.title, type: prod.type, description: prod.description || '', status: prod.status, date: prod.date || new Date().toISOString().split('T')[0] });
        setNewAttachments(prod.attachments || []);
        setIsCreateOpen(true);
    };

    const handleDelete = async (id: string) => {
        try { await api.deleteEducationalService('knowledge-production', id); } catch {}
        setProductions(prev => prev.filter(p => p.id !== id)); toast.success(t('common.delete'));
    };

    const handleExportPDF = async (prod: KnowledgeProduction) => {
        setPreviewProd(prod); setIsExporting(true);
        await new Promise(r => setTimeout(r, 300));
        if (previewRef.current) { try { await exportToPDF(previewRef.current, `kp_${prod.title}`, { title: t('knowledge.title'), includeQR: true, qrData: `SERS-KP:${prod.id}` }); toast.success('PDF'); } catch { toast.error(t('common.error')); } }
        setIsExporting(false); setPreviewProd(null);
    };

    const handleExportImage = async (prod: KnowledgeProduction) => {
        setPreviewProd(prod); setIsExporting(true);
        await new Promise(r => setTimeout(r, 300));
        if (previewRef.current) { try { await exportToImage(previewRef.current, `kp_${prod.title}`); toast.success(t('followUp.successImage')); } catch { toast.error(t('common.error')); } }
        setIsExporting(false); setPreviewProd(null);
    };

    const statusColors: Record<string, string> = isEn
      ? { 'Draft': 'bg-gray-500', 'Under Review': 'bg-amber-500', 'Published': 'bg-green-500' }
      : { 'مسودة': 'bg-gray-500', 'قيد المراجعة': 'bg-amber-500', 'منشور': 'bg-green-500' };
    const filtered = productions.filter(p => (p.title + p.description).includes(searchQuery) && (filterType === 'all' || p.type === filterType));

    return (
        <>
        <TopNavBar title={t('knowledge.title')} />
        <div className="container mx-auto py-6 px-4" dir={dir}>
            {/* Gradient Hero */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-yellow-500 to-amber-600 rounded-2xl p-6 md:p-8 mb-8 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-10" />
                <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg"><Lightbulb className="h-6 w-6" /></div>
                        <div>
                            <h1 className="text-2xl font-black">{t('knowledge.title')}</h1>
                            <p className="text-white/80 text-sm mt-0.5">{t('knowledge.subtitle')}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={fetchProductions} disabled={isLoading} className="bg-white/20 hover:bg-white/30 border-white/30 text-white rounded-xl"><RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /></Button>
                        <Dialog open={isCreateOpen} onOpenChange={(open) => {
                            setIsCreateOpen(open);
                            if (!open) { setEditingId(null); setNewProd({ title: '', type: PRODUCTION_TYPES[0], description: '', status: STATUSES[0], date: new Date().toISOString().split('T')[0] }); setNewAttachments([]); }
                        }}>
                            <DialogTrigger asChild><Button className="gap-2 bg-amber-600 hover:bg-amber-700"><Plus className="h-4 w-4" /> {t('knowledge.add')}</Button></DialogTrigger>
                            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir={dir}>
                                <DialogHeader><DialogTitle>{editingId ? t('knowledge.edit') : t('knowledge.add')}</DialogTitle><DialogDescription>{t('knowledge.subtitle')}</DialogDescription></DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2"><Label>{t('knowledge.title2')} *</Label><Input placeholder={isEn ? 'Impact of active learning on achievement' : ta('أثر التعلم النشط في التحصيل الدراسي', 'Effect of active learning on academic achievement') } value={newProd.title} onChange={e => setNewProd({ ...newProd, title: e.target.value })} /></div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2"><Label>{t('knowledge.type')}</Label><Select value={newProd.type} onValueChange={v => setNewProd({ ...newProd, type: v as any })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PRODUCTION_TYPES.map(pt => <SelectItem key={pt} value={pt}>{pt}</SelectItem>)}</SelectContent></Select></div>
                                        <div className="grid gap-2"><Label>{t('plans.status')}</Label><Select value={newProd.status} onValueChange={v => setNewProd({ ...newProd, status: v as any })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
                                    </div>
                                    <div className="grid gap-2"><Label>{t('knowledge.date')}</Label><Input type="date" value={newProd.date} onChange={e => setNewProd({ ...newProd, date: e.target.value })} /></div>
                                    {/* Inline AI for abstract */}
                                    <div className="grid gap-2">
                                        <div className="flex items-center justify-between">
                                            <Label>{t('achievements.description')}</Label>
                                            <button type="button" disabled={aiLoading}
                                                onClick={() => aiAssist(
                                                    `اكتب ملخصاً أكاديمياً مختصراً لـ${newProd.type} بعنوان "${newProd.title}". الملخص يجب أن يكون 3-5 أسطر ويتضمن الهدف والمنهجية والنتائج المتوقعة.`,
                                                    text => setNewProd(p => ({ ...p, description: text }))
                                                )}
                                                className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded-lg transition-colors disabled:opacity-50">
                                                {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                                ✨ {t('services.tryAI')}
                                            </button>
                                        </div>
                                        <Textarea className="min-h-[100px]" placeholder={isEn ? 'Research abstract or production description...' : ta('ملخص البحث أو وصف الإنتاج...', 'Research summary or production description...') } value={newProd.description} onChange={e => setNewProd({ ...newProd, description: e.target.value })} />
                                    </div>
                                    <FileUpload attachments={newAttachments} onAttachmentsChange={setNewAttachments} label={t('followUp.attachment')} maxFiles={5} compact />
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsCreateOpen(false)}>{t('common.cancel')}</Button>
                                    <Button onClick={handleCreateOrUpdate} disabled={isCreating} className="bg-amber-600 hover:bg-amber-700">
                                        {isCreating ? <><Loader2 className="h-4 w-4 animate-spin ms-2" />{t('common.save')}...</> : <><Lightbulb className="h-4 w-4 ms-2" />{editingId ? t('knowledge.edit') : t('knowledge.add')}</>}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                {[
                    { labelKey: 'knowledge.title', value: productions.length, icon: Lightbulb, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
                    { labelKey: 'plans.completed', value: productions.filter(i => i.status === STATUSES[2]).length, icon: BookOpen, color: 'text-green-500', bg: 'bg-green-500/10' },
                    { labelKey: 'knowledge.type', value: new Set(productions.map(i => i.type)).size, icon: BookOpen, color: 'text-purple-500', bg: 'bg-purple-500/10' },
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
                <Select value={filterType} onValueChange={setFilterType}><SelectTrigger className="w-[200px]"><SelectValue placeholder={t('knowledge.type')} /></SelectTrigger><SelectContent><SelectItem value="all">{t('dash.all')}</SelectItem>{PRODUCTION_TYPES.map(pt => <SelectItem key={pt} value={pt}>{pt}</SelectItem>)}</SelectContent></Select>
            </div>

            {isLoading ? (
                <Card><CardContent className="flex flex-col items-center justify-center py-12"><Loader2 className="h-12 w-12 text-amber-500 animate-spin mb-4" /><p className="text-muted-foreground">{t('common.loading')}</p></CardContent></Card>
            ) : filtered.length === 0 ? (
                <Card className="border-0 shadow-sm"><CardContent className="flex flex-col items-center justify-center py-16 text-center"><div className="w-16 h-16 rounded-2xl bg-yellow-500/10 flex items-center justify-center mb-4"><Lightbulb className="h-8 w-8 text-yellow-500" /></div><h3 className="text-lg font-bold mb-2">{t('knowledge.noItems')}</h3><p className="text-muted-foreground mb-4 text-sm">{t('knowledge.noItemsDesc')}</p><Button onClick={() => setIsCreateOpen(true)} className="rounded-xl gap-2"><Plus className="h-4 w-4" /> {t('knowledge.add')}</Button></CardContent></Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((prod, index) => (
                        <motion.div key={prod.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} whileHover={{ y: -4 }}>
                        <Card className="border-0 shadow-sm hover:shadow-lg transition-all rounded-2xl">
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between"><Badge variant="outline" className="rounded-lg">{prod.type}</Badge><Badge className={`${statusColors[prod.status] || 'bg-gray-500'} rounded-lg`}>{prod.status}</Badge></div>
                                <CardTitle className="text-lg mt-2">💡 {prod.title}</CardTitle>
                                <CardDescription>{prod.date && new Date(prod.date).toLocaleDateString(locale === 'en' ? 'en-US' : 'ar-SA')}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {prod.description && <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{prod.description.substring(0, 120)}</p>}
                                {prod.attachments.length > 0 && <p className="text-xs text-muted-foreground mb-3">📎 {prod.attachments.length} {t('followUp.attachments')}</p>}
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <Button variant="outline" size="sm" className="flex-1 gap-1 rounded-lg" onClick={() => handleExportPDF(prod)} disabled={isExporting}><Download className="h-3.5 w-3.5" /> PDF</Button>
                                    <Button variant="outline" size="sm" className="flex-1 gap-1 rounded-lg" onClick={() => handleExportImage(prod)} disabled={isExporting}><ImageIcon className="h-3.5 w-3.5" /> {t('followUp.btnImage')}</Button>
                                    <Button variant="outline" size="icon" className="text-blue-600 hover:text-blue-700 rounded-lg shrink-0" onClick={() => handleEditClick(prod)}><Edit className="h-4 w-4" /></Button>
                                    <Button variant="outline" size="icon" className="text-destructive hover:text-destructive shrink-0 rounded-lg hover:bg-red-50" onClick={() => handleDelete(prod.id)}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                            </CardContent>
                        </Card>
                        </motion.div>
                    ))}
                </div>
            )}

            {previewProd && (
                <div className="fixed left-[-9999px] top-0">
                    <div ref={previewRef} className="w-[793px] bg-white p-10 font-sans" dir={dir}>
                        <div className="border-b-4 border-amber-500 pb-4 mb-6"><h1 className="text-2xl font-bold">{t('knowledge.title')}</h1><p className="text-amber-600 font-semibold mt-1">{previewProd.type} - {previewProd.status}</p></div>
                        <h2 className="text-xl font-bold mb-4">{previewProd.title}</h2>
                        {previewProd.description && <p className="text-sm text-gray-600 whitespace-pre-line mb-6">{previewProd.description}</p>}
                        <div className="border-t-2 pt-4 mt-6 flex justify-between items-end"><p className="text-xs text-gray-400">SERS - {previewProd.date && new Date(previewProd.date).toLocaleDateString(locale === 'en' ? 'en-US' : 'ar-SA')}</p><img src={qrCodeToDataURL(`SERS-KP:${previewProd.id}`, 80)} alt="QR" className="inline-block" /></div>
                    </div>
                </div>
            )}
        </div>
        </>
    );
}
