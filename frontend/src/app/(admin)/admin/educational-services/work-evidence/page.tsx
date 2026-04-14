'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import toast from 'react-hot-toast';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { ta, tDate } from '@/i18n/auto-translations';
import {
    Shield, Search, Trash2, Edit, Eye, CheckCircle2, Loader2,
    Star, Users, FileText, Download, Filter, RefreshCw, ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/i18n/useTranslation';

const CRITERIA = [
    ta('التخطيط للتعليم والتعلم', 'Planning for Teaching & Learning'),
    'بيئة التعلم',
    ta('التدريس والتعلم', 'Teaching & Learning'),
    'التقويم وتحسين التعلم',
    'النمو المهني',
    'التعاون مع المجتمع',
    ta('الالتزام المهني والأخلاقي', 'Professional & Ethical Commitment'),
    ta('إدارة الفصل', 'Classroom Management'),
    'التواصل',
    ta('استخدام التكنولوجيا', 'Technology Use'),
    ta('الإبداع والابتكار', 'Creativity & Innovation'),
];

const RATINGS = [
    { value: '1', label: ta('1 - مبتدئ', '1 - Beginner') },
    { value: '2', label: ta('2 - متطور', '2 - Developing') },
    { value: '3', label: ta('3 - ماهر', '3 - Proficient') },
    { value: '4', label: ta('4 - متميز', '4 - Distinguished') },
];

interface Entry {
    id: string;
    user_id?: string;
    user_name?: string;
    title: string;
    criterion: string;
    rating: number;
    description: string;
    date: string;
    attachments?: string[];
    created_at?: string;
}

export default function AdminWorkEvidencePage() {
    const { dir, t } = useTranslation();
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [entries, setEntries] = useState<Entry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterCriterion, setFilterCriterion] = useState('all');
    const [filterRating, setFilterRating] = useState('all');
    const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editForm, setEditForm] = useState({ title: '', criterion: '', rating: '3', description: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [viewEntry, setViewEntry] = useState<Entry | null>(null);

    const fetchEntries = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/admin/educational-services/work-evidence') as any;
            setEntries(res.data || res || []);
        } catch {
            // fallback placeholder
            setEntries([]);
            toast.error(t('common.error'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchEntries(); }, []);

    const handleDelete = async (id: string) => {
        if (!confirm(ta('هل أنت متأكد من الحذف؟', 'Are you sure you want to delete?'))) return;
        try {
            await api.delete(`/admin/educational-services/work-evidence/${id}`) as any;
            toast.success(t('common.delete'));
            fetchEntries();
        } catch { toast.error(t('common.error')); }
    };

    const handleOpenEdit = (entry: Entry) => {
        setEditingEntry(entry);
        setEditForm({ title: entry.title, criterion: entry.criterion, rating: String(entry.rating), description: entry.description });
        setIsEditOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!editingEntry) return;
        setIsSaving(true);
        try {
            await api.put(`/admin/educational-services/work-evidence/${editingEntry.id}`, { ...editForm, rating: Number(editForm.rating) }) as any;
            toast.success(ta('تم التحديث', 'Updated'));
            setIsEditOpen(false);
            fetchEntries();
        } catch { toast.error(ta('فشل التحديث', 'Update failed')); } finally { setIsSaving(false); }
    };

    const filtered = entries.filter(e => {
        const matchSearch = e.title.toLowerCase().includes(search.toLowerCase()) || (e.user_name || '').includes(search);
        const matchCriterion = filterCriterion === 'all' || e.criterion === filterCriterion;
        const matchRating = filterRating === 'all' || String(e.rating) === filterRating;
        return matchSearch && matchCriterion && matchRating;
    });

    const ratingColors = ['', 'bg-red-100 text-red-700', 'bg-amber-100 text-amber-700', 'bg-blue-100 text-blue-700', 'bg-emerald-100 text-emerald-700'];
    const ratingLabels = ['', 'مبتدئ', 'متطور', 'ماهر', 'متميز'];

    return (
        <div className="space-y-6" dir={dir}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link href="/admin/educational-services" className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 transition-colors">
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-gray-900 dark:text-white">{ta('شواهد الأداء الوظيفي', 'Performance Evidence')}</h1>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{ta('إدارة وتدقيق جميع شواهد أداء المعلمين', 'Manage and audit all teacher performance evidence')}</p>
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={fetchEntries} className="gap-2 rounded-xl">
                    <RefreshCw className="w-4 h-4" /> {t('common.loading').replace('...', '')}
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: ta('إجمالي الشواهد', 'Total Evidence'), value: entries.length, icon: FileText, color: 'from-emerald-500 to-green-600' },
                    { label: ta('تقييم متميز (4)', 'Excellent Rating (4)'), value: entries.filter(e => e.rating === 4).length, icon: Star, color: 'from-amber-500 to-orange-600' },
                    { label: ta('تقييم ماهر (3)', 'Proficient Rating (3)'), value: entries.filter(e => e.rating === 3).length, icon: CheckCircle2, color: 'from-blue-500 to-indigo-600' },
                    { label: ta('المعلمون', 'Teachers'), value: new Set(entries.map(e => e.user_id)).size, icon: Users, color: 'from-violet-500 to-purple-600' },
                ].map((s, i) => { const Icon = s.icon; return (
                    <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow flex-shrink-0`}><Icon className="w-5 h-5 text-white" /></div>
                        <div><p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p><p className="text-xl font-black text-gray-900 dark:text-white">{s.value}</p></div>
                    </div>
                ); })}
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input placeholder={ta('بحث بالعنوان أو اسم المعلم...', 'Search by title or teacher name...')} className="pr-10 rounded-xl" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <Select value={filterCriterion} onValueChange={setFilterCriterion}>
                    <SelectTrigger className="w-[220px] rounded-xl"><SelectValue placeholder={ta('المعيار', 'Standard')} /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{ta('جميع المعايير', 'All Criteria')}</SelectItem>
                        {CRITERIA.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={filterRating} onValueChange={setFilterRating}>
                    <SelectTrigger className="w-[160px] rounded-xl"><SelectValue placeholder={ta("التقييم", "Rating")} /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{ta('جميع التقييمات', 'All Ratings')}</SelectItem>
                        {RATINGS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{filtered.length} {ta('نتيجة', 'results')}</p>
                </div>
                {isLoading ? (
                    <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <Shield className="w-12 h-12 text-gray-200 dark:text-gray-700 mb-3" />
                        <p className="text-sm font-bold text-gray-500">{ta('لا توجد نتائج', 'No results')}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs font-bold text-gray-500 dark:text-gray-400">
                                <tr><th className="text-start px-5 py-3">{ta('العنوان', 'Title')}</th><th className="text-start px-5 py-3">{ta('المعلم', 'Teacher')}</th><th className="text-start px-5 py-3">{ta('المعيار', 'Standard')}</th><th className="text-start px-5 py-3">{ta('التقييم', 'Rating')}</th><th className="text-start px-5 py-3">{ta('التاريخ', 'Date')}</th><th className="px-5 py-3"></th></tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                                {filtered.map(entry => (
                                    <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                        <td className="px-5 py-3 font-medium text-gray-900 dark:text-white max-w-[200px] truncate">{entry.title}</td>
                                        <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{entry.user_name || '—'}</td>
                                        <td className="px-5 py-3 text-gray-500 dark:text-gray-400 max-w-[180px] truncate">{entry.criterion}</td>
                                        <td className="px-5 py-3"><Badge className={ratingColors[entry.rating] || 'bg-gray-100 text-gray-700'}>{ratingLabels[entry.rating] || entry.rating}</Badge></td>
                                        <td className="px-5 py-3 text-gray-500 dark:text-gray-400 text-xs">{tDate(entry.date)}</td>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-2">
                                                <Button variant="ghost" size="icon" className="w-8 h-8 text-blue-500 hover:bg-blue-50" onClick={() => { setViewEntry(entry); }}><Eye className="w-4 h-4" /></Button>
                                                <Button variant="ghost" size="icon" className="w-8 h-8 text-emerald-500 hover:bg-emerald-50" onClick={() => handleOpenEdit(entry)}><Edit className="w-4 h-4" /></Button>
                                                <Button variant="ghost" size="icon" className="w-8 h-8 text-red-500 hover:bg-red-50" onClick={() => setDeleteConfirmId(entry.id)}><Trash2 className="w-4 h-4" /></Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={open => { setIsEditOpen(open); if (!open) setEditingEntry(null); }}>
                <DialogContent className="max-w-lg" dir={dir}>
                    <DialogHeader><DialogTitle>{editingEntry ? t('services.edit') : t('services.add')}</DialogTitle><DialogDescription>{t('workEvidence.title')}</DialogDescription></DialogHeader>
                    <div className="grid gap-4 py-2">
                        <div className="grid gap-2"><Label>{ta('العنوان *', 'Title')}</Label><Input value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} /></div>
                        <div className="grid gap-2"><Label>{ta('المعيار *', 'Criterion *')}</Label>
                            <Select value={editForm.criterion} onValueChange={v => setEditForm({ ...editForm, criterion: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{CRITERIA.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2"><Label>{ta('التقييم', 'Rating')}</Label>
                            <Select value={editForm.rating} onValueChange={v => setEditForm({ ...editForm, rating: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{RATINGS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2"><Label>{ta('الوصف', 'Description')}</Label><Textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} className="min-h-[80px]" /></div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>{t('common.cancel')}</Button>
                        <Button onClick={handleSaveEdit} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700">
                            {isSaving ? <><Loader2 className="w-4 h-4 animate-spin ms-2" />{t('common.loading')}</> : t('common.save')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Dialog */}
            <Dialog open={!!viewEntry} onOpenChange={open => { if (!open) setViewEntry(null); }}>
                <DialogContent className="max-w-lg" dir={dir}>
                    <DialogHeader><DialogTitle>{viewEntry?.title}</DialogTitle></DialogHeader>
                    {viewEntry && (
                        <div className="space-y-3 text-sm">
                            <div className="flex gap-2"><span className="font-bold text-gray-500">{ta('المعيار:', 'Criterion:')}</span><span>{viewEntry.criterion}</span></div>
                            <div className="flex gap-2"><span className="font-bold text-gray-500">{ta('التقييم:', 'Rating:')}</span><Badge className={ratingColors[viewEntry.rating]}>{ratingLabels[viewEntry.rating]}</Badge></div>
                            <div className="flex gap-2"><span className="font-bold text-gray-500">{ta('التاريخ:', 'Date:')}</span><span>{tDate(viewEntry.date)}</span></div>
                            <div><p className="font-bold text-gray-500 mb-1">{ta('الوصف:', 'Description:')}</p><p className="text-gray-700 dark:text-gray-300 leading-relaxed">{viewEntry.description}</p></div>
                            {viewEntry.attachments && viewEntry.attachments.length > 0 && (
                                <div><p className="font-bold text-gray-500 mb-1">المرفقات ({viewEntry.attachments.length}):</p>
                                    <div className="flex flex-wrap gap-2">{viewEntry.attachments.map((a, i) => <a key={i} href={a} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 underline flex items-center gap-1"><Download className="w-3 h-3" /> مرفق {i + 1}</a>)}</div>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        
            <ConfirmDialog
                open={!!deleteConfirmId}
                title={ta('تأكيد الحذف', 'Confirm Delete')}
                message={ta('هل أنت متأكد من حذف هذا العنصر نهائياً؟ لا يمكن التراجع عن هذا الإجراء.', 'Are you sure you want to permanently delete this item? This action cannot be undone.')}
                confirmLabel={ta('حذف نهائياً', 'Delete Permanently')}
                onConfirm={() => {
                    if (deleteConfirmId) handleDelete(deleteConfirmId);
                    setDeleteConfirmId(null);
                }}
                onCancel={() => setDeleteConfirmId(null)}
            />
        </div>
    );
}
