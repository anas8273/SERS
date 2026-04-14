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
import { Layers, Search, Trash2, Edit, Eye, Loader2, FileText, RefreshCw, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/i18n/useTranslation';

const GRADES = ['أول', 'ثاني', 'ثالث', 'رابع', 'خامس', 'سادس', 'سابع', 'ثامن', 'تاسع', 'عاشر', 'حادي عشر', 'ثاني عشر'];
const SEMESTERS = ['الأول', 'الثاني', 'الثالث'];

interface Entry {
    id: string; user_id?: string; user_name?: string;
    title: string; subject?: string; grade?: string; semester?: string;
    description?: string; date: string;
}

export default function AdminDistributionsPage() {
    const { dir, t } = useTranslation();
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [entries, setEntries] = useState<Entry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterGrade, setFilterGrade] = useState('all');
    const [filterSemester, setFilterSemester] = useState('all');
    const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editForm, setEditForm] = useState({ title: '', subject: '', grade: '', semester: '', description: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [viewEntry, setViewEntry] = useState<Entry | null>(null);

    const fetchEntries = async () => {
        setIsLoading(true);
        try { const res = await api.get('/admin/educational-services/distributions') as any; setEntries(res.data || res || []); }
        catch { setEntries([]); toast.error(t('common.error')); } finally { setIsLoading(false); }
    };
    useEffect(() => { fetchEntries(); }, []);

    const handleDelete = async (id: string) => {
        if (!confirm(ta('هل أنت متأكد؟', 'Are you sure?'))) return;
        try { await api.delete(`/admin/educational-services/distributions/${id}`); toast.success(t('common.delete')); fetchEntries(); }
        catch { toast.error(t('common.error')); }
    };
    const handleOpenEdit = (entry: Entry) => {
        setEditingEntry(entry);
        setEditForm({ title: entry.title, subject: entry.subject || '', grade: entry.grade || '', semester: entry.semester || '', description: entry.description || '' });
        setIsEditOpen(true);
    };
    const handleSaveEdit = async () => {
        if (!editingEntry) return; setIsSaving(true);
        try { await api.put(`/admin/educational-services/distributions/${editingEntry.id}`, editForm) as any; toast.success(ta('تم التحديث', 'Updated')); setIsEditOpen(false); fetchEntries(); }
        catch { toast.error(ta('فشل التحديث', 'Update failed')); } finally { setIsSaving(false); }
    };

    const filtered = entries.filter(e => {
        const matchSearch = e.title.toLowerCase().includes(search.toLowerCase()) || (e.subject || '').includes(search) || (e.user_name || '').includes(search);
        const matchGrade = filterGrade === 'all' || e.grade === filterGrade;
        const matchSemester = filterSemester === 'all' || e.semester === filterSemester;
        return matchSearch && matchGrade && matchSemester;
    });

    return (
        <div className="space-y-6" dir={dir}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link href="/admin/educational-services" className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 transition-colors"><ArrowRight className="w-4 h-4" /></Link>
                    <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20"><Layers className="w-5 h-5 text-white" /></div>
                    <div><h1 className="text-xl font-black text-gray-900 dark:text-white">{ta('التوزيعات', 'Distributions')}</h1><p className="text-xs text-gray-500 dark:text-gray-400">{ta('إدارة توزيعات المقررات والحصص', 'Manage course distributions')}</p></div>
                </div>
                <Button variant="outline" size="sm" onClick={fetchEntries} className="gap-2 rounded-xl"><RefreshCw className="w-4 h-4" /> {ta('تحديث', 'Refresh')}</Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                    { label: ta('إجمالي التوزيعات', 'Total Distributions'), value: entries.length, color: 'from-violet-500 to-purple-600' },
                    { label: ta('المواد', 'Subjects'), value: new Set(entries.map(e => e.subject)).size, color: 'from-blue-500 to-indigo-600' },
                    { label: ta('المعلمون', 'Teachers'), value: new Set(entries.map(e => e.user_id)).size, color: 'from-emerald-500 to-green-600' },
                ].map((s, i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow flex-shrink-0`}><FileText className="w-5 h-5 text-white" /></div>
                        <div><p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p><p className="text-xl font-black text-gray-900 dark:text-white">{s.value}</p></div>
                    </div>
                ))}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1"><Search className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><Input placeholder={ta("بحث...", "Search")} className="pr-10 rounded-xl" value={search} onChange={e => setSearch(e.target.value)} /></div>
                <Select value={filterGrade} onValueChange={setFilterGrade}>
                    <SelectTrigger className="w-[150px] rounded-xl"><SelectValue placeholder={ta("الصف", "Grade")} /></SelectTrigger>
                    <SelectContent><SelectItem value="all">{ta('جميع الصفوف', 'All Grades')}</SelectItem>{GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={filterSemester} onValueChange={setFilterSemester}>
                    <SelectTrigger className="w-[150px] rounded-xl"><SelectValue placeholder={ta("الفصل", "Semester")} /></SelectTrigger>
                    <SelectContent><SelectItem value="all">{ta('جميع الفصول', 'All Classes')}</SelectItem>{SEMESTERS.map(s => <SelectItem key={s} value={s}>الفصل {s}</SelectItem>)}</SelectContent>
                </Select>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700"><p className="text-sm font-bold text-gray-900 dark:text-white">{filtered.length} {ta('نتيجة', 'results')}</p></div>
                {isLoading ? <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-violet-500" /></div>
                : filtered.length === 0 ? <div className="flex flex-col items-center justify-center py-16"><Layers className="w-12 h-12 text-gray-200 dark:text-gray-700 mb-3" /><p className="text-sm font-bold text-gray-500">{ta('لا توجد نتائج', 'No results')}</p></div>
                : <div className="overflow-x-auto"><table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs font-bold text-gray-500 dark:text-gray-400">
                        <tr><th className="text-start px-5 py-3">{ta('العنوان', 'Title')}</th><th className="text-start px-5 py-3">{ta('المعلم', 'Teacher')}</th><th className="text-start px-5 py-3">{ta('المادة', 'Subject')}</th><th className="text-start px-5 py-3">{ta('الصف', 'Grade')}</th><th className="text-start px-5 py-3">{ta('الفصل', 'Semester')}</th><th className="px-5 py-3"></th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                        {filtered.map(entry => (
                            <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                <td className="px-5 py-3 font-medium text-gray-900 dark:text-white max-w-[180px] truncate">{entry.title}</td>
                                <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{entry.user_name || '—'}</td>
                                <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{entry.subject || '—'}</td>
                                <td className="px-5 py-3"><Badge className="bg-violet-100 text-violet-700">{entry.grade || '—'}</Badge></td>
                                <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{entry.semester ? `الفصل ${entry.semester}` : '—'}</td>
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
                <DialogContent className="max-w-lg" dir={dir}>
                    <DialogHeader><DialogTitle>{ta('تعديل التوزيعة', 'Edit Distribution')}</DialogTitle><DialogDescription>{ta('تعديل بيانات التوزيعة', 'Edit Distribution Data')}</DialogDescription></DialogHeader>
                    <div className="grid gap-4 py-2">
                        <div className="grid gap-2"><Label>{ta('العنوان *', 'Title')}</Label><Input value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} /></div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-2"><Label>{ta('المادة', 'Subject')}</Label><Input value={editForm.subject} onChange={e => setEditForm({ ...editForm, subject: e.target.value })} /></div>
                            <div className="grid gap-2"><Label>{ta('الصف', 'Grade')}</Label>
                                <Select value={editForm.grade} onValueChange={v => setEditForm({ ...editForm, grade: v })}>
                                    <SelectTrigger><SelectValue placeholder={ta('اختر', 'Select')} /></SelectTrigger>
                                    <SelectContent>{GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid gap-2"><Label>{ta('الفصل الدراسي', 'Academic Semester')}</Label>
                            <Select value={editForm.semester} onValueChange={v => setEditForm({ ...editForm, semester: v })}>
                                <SelectTrigger><SelectValue placeholder={ta('اختر', 'Select')} /></SelectTrigger>
                                <SelectContent>{SEMESTERS.map(s => <SelectItem key={s} value={s}>الفصل {s}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2"><Label>{ta('الوصف', 'Description')}</Label><Textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} className="min-h-[80px]" /></div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>{t('common.cancel')}</Button>
                        <Button onClick={handleSaveEdit} disabled={isSaving} className="bg-violet-600 hover:bg-violet-700">{isSaving ? <><Loader2 className="w-4 h-4 animate-spin ms-2" />{t('common.loading')}</> : t('common.save')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!viewEntry} onOpenChange={open => { if (!open) setViewEntry(null); }}>
                <DialogContent className="max-w-lg" dir={dir}>
                    <DialogHeader><DialogTitle>{viewEntry?.title}</DialogTitle></DialogHeader>
                    {viewEntry && <div className="space-y-3 text-sm">
                        <div className="grid grid-cols-3 gap-3">
                            <div><span className="font-bold text-gray-500 block">{ta('المادة', 'Subject')}</span><span>{viewEntry.subject || '—'}</span></div>
                            <div><span className="font-bold text-gray-500 block">{ta('الصف', 'Grade')}</span><span>{viewEntry.grade || '—'}</span></div>
                            <div><span className="font-bold text-gray-500 block">{ta('الفصل', 'Semester')}</span><span>{viewEntry.semester ? `الفصل ${viewEntry.semester}` : '—'}</span></div>
                        </div>
                        {viewEntry.description && <div><p className="font-bold text-gray-500 mb-1">{ta('الوصف:', 'Description:')}</p><p className="text-gray-700 dark:text-gray-300 leading-relaxed">{viewEntry.description}</p></div>}
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
