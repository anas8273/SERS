'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import toast from 'react-hot-toast';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { ta } from '@/i18n/auto-translations';
import { Target, Search, Trash2, Edit, Eye, Loader2, FileText, RefreshCw, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/i18n/useTranslation';

const PLAN_TYPES = ['يومية', 'أسبوعية', 'شهرية', 'فصلية', 'سنوية'];
const SUBJECTS = ['الرياضيات', 'العلوم', 'اللغة العربية', 'اللغة الإنجليزية', 'الاجتماعيات', 'التربية الإسلامية', 'التربية الفنية', 'الحاسب الآلي', 'أخرى'];

interface PlanEntry {
    id: string; user_id?: string; user_name?: string;
    title: string; type: string; subject?: string;
    objectives?: string; activities?: string;
    grade?: string; date?: string; created_at?: string;
}

export default function AdminPlansPage() {
    const { dir, t } = useTranslation();
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [entries, setEntries] = useState<PlanEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterSubject, setFilterSubject] = useState('all');
    const [editingEntry, setEditingEntry] = useState<PlanEntry | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editForm, setEditForm] = useState({ title: '', type: 'يومية', subject: '', objectives: '', activities: '', grade: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [viewEntry, setViewEntry] = useState<PlanEntry | null>(null);

    const fetchEntries = async () => {
        setIsLoading(true);
        try { const res = await api.get('/admin/educational-services/plans') as any; setEntries(res.data || res || []); }
        catch { setEntries([]); toast.error(t('common.error')); } finally { setIsLoading(false); }
    };
    useEffect(() => { fetchEntries(); }, []);

    const handleDelete = async (id: string) => {
        if (!confirm(ta('هل أنت متأكد؟', 'Are you sure?'))) return;
        try { await api.delete(`/admin/educational-services/plans/${id}`); toast.success(t('common.delete')); fetchEntries(); }
        catch { toast.error(t('common.error')); }
    };
    const handleOpenEdit = (entry: PlanEntry) => {
        setEditingEntry(entry);
        setEditForm({ title: entry.title, type: entry.type, subject: entry.subject || '', objectives: entry.objectives || '', activities: entry.activities || '', grade: entry.grade || '' });
        setIsEditOpen(true);
    };
    const handleSaveEdit = async () => {
        if (!editingEntry) return; setIsSaving(true);
        try { await api.put(`/admin/educational-services/plans/${editingEntry.id}`, editForm) as any; toast.success(ta('تم التحديث', 'Updated')); setIsEditOpen(false); fetchEntries(); }
        catch { toast.error(ta('فشل التحديث', 'Update failed')); } finally { setIsSaving(false); }
    };

    const filtered = entries.filter(e => {
        const matchSearch = e.title.toLowerCase().includes(search.toLowerCase()) || (e.user_name || '').includes(search);
        const matchType = filterType === 'all' || e.type === filterType;
        const matchSubject = filterSubject === 'all' || e.subject === filterSubject;
        return matchSearch && matchType && matchSubject;
    });

    const typeColors: Record<string, string> = { 'يومية': 'bg-blue-100 text-blue-700', 'أسبوعية': 'bg-green-100 text-green-700', 'شهرية': 'bg-purple-100 text-purple-700', 'فصلية': 'bg-orange-100 text-orange-700', 'سنوية': 'bg-red-100 text-red-700' };

    return (
        <div className="space-y-6" dir={dir}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link href="/admin/educational-services" className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 transition-colors"><ArrowRight className="w-4 h-4" /></Link>
                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20"><Target className="w-5 h-5 text-white" /></div>
                    <div><h1 className="text-xl font-black text-gray-900 dark:text-white">{ta('الخطط التعليمية', 'Educational Plans')}</h1><p className="text-xs text-gray-500 dark:text-gray-400">{ta('إدارة جميع الخطط التعليمية', 'Manage all educational plans')}</p></div>
                </div>
                <Button variant="outline" size="sm" onClick={fetchEntries} className="gap-2 rounded-xl"><RefreshCw className="w-4 h-4" /> {ta('تحديث', 'Refresh')}</Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                    { label: ta('إجمالي الخطط', 'Total Plans'), value: entries.length, color: 'from-cyan-500 to-teal-600' },
                    { label: ta('المواد', 'Subjects'), value: new Set(entries.map(e => e.subject)).size, color: 'from-blue-500 to-indigo-600' },
                    { label: ta('المعلمون', 'Teachers'), value: new Set(entries.map(e => e.user_id)).size, color: 'from-violet-500 to-purple-600' },
                ].map((s, i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow flex-shrink-0`}><FileText className="w-5 h-5 text-white" /></div>
                        <div><p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p><p className="text-xl font-black text-gray-900 dark:text-white">{s.value}</p></div>
                    </div>
                ))}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1"><Search className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><Input placeholder={ta("بحث...", "Search")} className="pr-10 rounded-xl" value={search} onChange={e => setSearch(e.target.value)} /></div>
                <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-[150px] rounded-xl"><SelectValue placeholder={ta("النوع", "Type")} /></SelectTrigger>
                    <SelectContent><SelectItem value="all">{ta('جميع الأنواع', 'All Types')}</SelectItem>{PLAN_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={filterSubject} onValueChange={setFilterSubject}>
                    <SelectTrigger className="w-[170px] rounded-xl"><SelectValue placeholder={ta("المادة", "Subject")} /></SelectTrigger>
                    <SelectContent><SelectItem value="all">{ta('جميع المواد', 'All Subjects')}</SelectItem>{SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700"><p className="text-sm font-bold text-gray-900 dark:text-white">{filtered.length} {ta('نتيجة', 'results')}</p></div>
                {isLoading ? <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-cyan-500" /></div>
                : filtered.length === 0 ? <div className="flex flex-col items-center justify-center py-16"><Target className="w-12 h-12 text-gray-200 dark:text-gray-700 mb-3" /><p className="text-sm font-bold text-gray-500">{ta('لا توجد خطط', 'No plans')}</p></div>
                : <div className="overflow-x-auto"><table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs font-bold text-gray-500 dark:text-gray-400">
                        <tr><th className="text-start px-5 py-3">{ta('العنوان', 'Title')}</th><th className="text-start px-5 py-3">{ta('المعلم', 'Teacher')}</th><th className="text-start px-5 py-3">{ta('المادة', 'Subject')}</th><th className="text-start px-5 py-3">{ta('النوع', 'Type')}</th><th className="text-start px-5 py-3">{ta('الصف', 'Grade')}</th><th className="px-5 py-3"></th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                        {filtered.map(entry => (
                            <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                <td className="px-5 py-3 font-medium text-gray-900 dark:text-white max-w-[180px] truncate">{entry.title}</td>
                                <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{entry.user_name || '—'}</td>
                                <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{entry.subject || '—'}</td>
                                <td className="px-5 py-3"><Badge className={typeColors[entry.type] || 'bg-gray-100 text-gray-700'}>{entry.type}</Badge></td>
                                <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{entry.grade || '—'}</td>
                                <td className="px-5 py-3"><div className="flex items-center gap-2">
                                    <Button variant="ghost" size="icon" className="w-8 h-8 text-blue-500 hover:bg-blue-50" onClick={() => setViewEntry(entry)}><Eye className="w-4 h-4" /></Button>
                                    <Button variant="ghost" size="icon" className="w-8 h-8 text-emerald-500 hover:bg-emerald-50" onClick={() => handleOpenEdit(entry)}><Edit className="w-4 h-4" /></Button>
                                    <Button variant="ghost" size="icon" className="w-8 h-8 text-red-500 hover:bg-red-50" onClick={() => setDeleteConfirmId(entry.id)}><Trash2 className="w-4 h-4" /></Button>
                                </div></td>
                            </tr>
                        ))}
                    </tbody>
                </table></div>}
            </div>

            <Dialog open={isEditOpen} onOpenChange={open => { setIsEditOpen(open); if (!open) setEditingEntry(null); }}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir={dir}>
                    <DialogHeader><DialogTitle>{ta('تعديل الخطة', 'Edit Plan')}</DialogTitle><DialogDescription>{ta('تعديل بيانات الخطة', 'Edit plan data')}</DialogDescription></DialogHeader>
                    <div className="grid gap-4 py-2">
                        <div className="grid gap-2"><Label>{ta('العنوان *', 'Title')}</Label><Input value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} /></div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-2"><Label>{ta('النوع', 'Type')}</Label>
                                <Select value={editForm.type} onValueChange={v => setEditForm({ ...editForm, type: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>{PLAN_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2"><Label>{ta('المادة', 'Subject')}</Label>
                                <Select value={editForm.subject} onValueChange={v => setEditForm({ ...editForm, subject: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>{SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid gap-2"><Label>{ta('الصف', 'Grade')}</Label><Input value={editForm.grade} onChange={e => setEditForm({ ...editForm, grade: e.target.value })} placeholder={ta('مثال: ثالث متوسط', 'Example: Third Intermediate')} /></div>
                        <div className="grid gap-2"><Label>{ta('الأهداف', 'Objectives')}</Label><Textarea value={editForm.objectives} onChange={e => setEditForm({ ...editForm, objectives: e.target.value })} className="min-h-[80px]" /></div>
                        <div className="grid gap-2"><Label>{ta('الأنشطة', 'Activities')}</Label><Textarea value={editForm.activities} onChange={e => setEditForm({ ...editForm, activities: e.target.value })} className="min-h-[80px]" /></div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>{t('common.cancel')}</Button>
                        <Button onClick={handleSaveEdit} disabled={isSaving} className="bg-cyan-600 hover:bg-cyan-700">{isSaving ? <><Loader2 className="w-4 h-4 animate-spin ms-2" />{t('common.loading')}</> : t('common.save')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!viewEntry} onOpenChange={open => { if (!open) setViewEntry(null); }}>
                <DialogContent className="max-w-lg" dir={dir}>
                    <DialogHeader><DialogTitle>{viewEntry?.title}</DialogTitle></DialogHeader>
                    {viewEntry && <div className="space-y-3 text-sm">
                        <div className="flex gap-4 flex-wrap">
                            <div className="flex gap-2"><span className="font-bold text-gray-500">{ta('النوع:', 'Type:')}</span><Badge className={typeColors[viewEntry.type] || 'bg-gray-100 text-gray-700'}>{viewEntry.type}</Badge></div>
                            <div className="flex gap-2"><span className="font-bold text-gray-500">{ta('المادة:', 'Subject:')}</span><span>{viewEntry.subject || '—'}</span></div>
                            <div className="flex gap-2"><span className="font-bold text-gray-500">{ta('الصف:', 'Grade:')}</span><span>{viewEntry.grade || '—'}</span></div>
                        </div>
                        {viewEntry.objectives && <div><p className="font-bold text-gray-500 mb-1">{ta('الأهداف:', 'Objectives:')}</p><p className="text-gray-700 dark:text-gray-300 leading-relaxed">{viewEntry.objectives}</p></div>}
                        {viewEntry.activities && <div><p className="font-bold text-gray-500 mb-1">{ta('الأنشطة:', 'Activities:')}</p><p className="text-gray-700 dark:text-gray-300 leading-relaxed">{viewEntry.activities}</p></div>}
                    </div>}
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
