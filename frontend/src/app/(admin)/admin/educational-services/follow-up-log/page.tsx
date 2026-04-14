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
import { ta, tDate } from '@/i18n/auto-translations';
import { ClipboardList, Search, Trash2, Edit, Eye, Loader2, FileText, RefreshCw, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/i18n/useTranslation';

const STATUSES = ['مكتملة', 'جارية', 'متأخرة', 'ملغاة'];

interface Entry {
    id: string; user_id?: string; user_name?: string;
    student_name?: string; subject?: string; notes: string;
    status?: string; date: string; created_at?: string;
}

export default function AdminFollowUpLogPage() {
    const { dir, t } = useTranslation();
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [entries, setEntries] = useState<Entry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editForm, setEditForm] = useState({ student_name: '', subject: '', notes: '', status: ta('جارية', 'Ongoing') });
    const [isSaving, setIsSaving] = useState(false);
    const [viewEntry, setViewEntry] = useState<Entry | null>(null);

    const fetchEntries = async () => {
        setIsLoading(true);
        try { const res = await api.get('/admin/educational-services/follow-up-log') as any; setEntries(res.data || res || []); }
        catch { setEntries([]); toast.error(t('common.error')); } finally { setIsLoading(false); }
    };
    useEffect(() => { fetchEntries(); }, []);

    const handleDelete = async (id: string) => {
        if (!confirm(ta('هل أنت متأكد؟', 'Are you sure?'))) return;
        try { await api.delete(`/admin/educational-services/follow-up-log/${id}`); toast.success(t('common.delete')); fetchEntries(); }
        catch { toast.error(t('common.error')); }
    };
    const handleOpenEdit = (entry: Entry) => {
        setEditingEntry(entry);
        setEditForm({ student_name: entry.student_name || '', subject: entry.subject || '', notes: entry.notes, status: entry.status || ta('جارية', 'In Progress') });
        setIsEditOpen(true);
    };
    const handleSaveEdit = async () => {
        if (!editingEntry) return; setIsSaving(true);
        try { await api.put(`/admin/educational-services/follow-up-log/${editingEntry.id}`, editForm) as any; toast.success(ta('تم التحديث', 'Updated')); setIsEditOpen(false); fetchEntries(); }
        catch { toast.error(ta('فشل التحديث', 'Update failed')); } finally { setIsSaving(false); }
    };

    const filtered = entries.filter(e => {
        const matchSearch = (e.student_name || '').includes(search) || (e.subject || '').includes(search) || (e.user_name || '').includes(search);
        const matchStatus = filterStatus === 'all' || e.status === filterStatus;
        return matchSearch && matchStatus;
    });

    const statusColors: Record<string, string> = { [ta('مكتملة', 'Completed')]: 'bg-emerald-100 text-emerald-700', [ta('جارية', 'In Progress')]: 'bg-blue-100 text-blue-700', [ta('متأخرة', 'Overdue')]: 'bg-red-100 text-red-700', [ta('ملغاة', 'Cancelled')]: 'bg-gray-100 text-gray-700' };

    return (
        <div className="space-y-6" dir={dir}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link href="/admin/educational-services" className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 transition-colors"><ArrowRight className="w-4 h-4" /></Link>
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20"><ClipboardList className="w-5 h-5 text-white" /></div>
                    <div><h1 className="text-xl font-black text-gray-900 dark:text-white">{ta('سجل المتابعة', 'Follow-up Log')}</h1><p className="text-xs text-gray-500 dark:text-gray-400">{ta('إدارة سجلات متابعة الطلاب', 'Manage Student Follow-up Records')}</p></div>
                </div>
                <Button variant="outline" size="sm" onClick={fetchEntries} className="gap-2 rounded-xl"><RefreshCw className="w-4 h-4" /> {ta('تحديث', 'Refresh')}</Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: ta('إجمالي', 'Total'), value: entries.length, color: 'from-amber-500 to-orange-600' },
                    { label: ta('مكتملة', 'Completed'), value: entries.filter(e => e.status === 'مكتملة').length, color: 'from-emerald-500 to-green-600' },
                    { label: ta('جارية', 'Ongoing'), value: entries.filter(e => e.status === 'جارية').length, color: 'from-blue-500 to-indigo-600' },
                    { label: ta('متأخرة', 'Late'), value: entries.filter(e => e.status === 'متأخرة').length, color: 'from-red-500 to-rose-600' },
                ].map((s, i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow flex-shrink-0`}><FileText className="w-5 h-5 text-white" /></div>
                        <div><p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p><p className="text-xl font-black text-gray-900 dark:text-white">{s.value}</p></div>
                    </div>
                ))}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1"><Search className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><Input placeholder={ta("بحث...", "Search")} className="pr-10 rounded-xl" value={search} onChange={e => setSearch(e.target.value)} /></div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[160px] rounded-xl"><SelectValue placeholder={ta("الحالة", "Status")} /></SelectTrigger>
                    <SelectContent><SelectItem value="all">{ta('جميع الحالات', 'All Statuses')}</SelectItem>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700"><p className="text-sm font-bold text-gray-900 dark:text-white">{filtered.length} {ta('نتيجة', 'results')}</p></div>
                {isLoading ? <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>
                : filtered.length === 0 ? <div className="flex flex-col items-center justify-center py-16"><ClipboardList className="w-12 h-12 text-gray-200 dark:text-gray-700 mb-3" /><p className="text-sm font-bold text-gray-500">{ta('لا توجد نتائج', 'No results')}</p></div>
                : <div className="overflow-x-auto"><table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs font-bold text-gray-500 dark:text-gray-400">
                        <tr><th className="text-start px-5 py-3">{ta('الطالب', 'Student')}</th><th className="text-start px-5 py-3">{ta('المادة', 'Subject')}</th><th className="text-start px-5 py-3">{ta('المعلم', 'Teacher')}</th><th className="text-start px-5 py-3">{ta('الحالة', 'Status')}</th><th className="text-start px-5 py-3">{ta('التاريخ', 'Date')}</th><th className="px-5 py-3"></th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                        {filtered.map(entry => (
                            <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">{entry.student_name || '—'}</td>
                                <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{entry.subject || '—'}</td>
                                <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{entry.user_name || '—'}</td>
                                <td className="px-5 py-3"><Badge className={statusColors[entry.status || ''] || 'bg-gray-100 text-gray-700'}>{entry.status || '—'}</Badge></td>
                                <td className="px-5 py-3 text-gray-500 dark:text-gray-400 text-xs">{tDate(entry.date)}</td>
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
                    <DialogHeader><DialogTitle>{ta('تعديل سجل المتابعة', 'Edit Follow-up')}</DialogTitle><DialogDescription>{ta('تعديل بيانات السجل', 'Edit record data')}</DialogDescription></DialogHeader>
                    <div className="grid gap-4 py-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-2"><Label>{ta('اسم الطالب', 'Student Name')}</Label><Input value={editForm.student_name} onChange={e => setEditForm({ ...editForm, student_name: e.target.value })} /></div>
                            <div className="grid gap-2"><Label>{ta('المادة', 'Subject')}</Label><Input value={editForm.subject} onChange={e => setEditForm({ ...editForm, subject: e.target.value })} /></div>
                        </div>
                        <div className="grid gap-2"><Label>{ta('الحالة', 'Status')}</Label>
                            <Select value={editForm.status} onValueChange={v => setEditForm({ ...editForm, status: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2"><Label>{ta('الملاحظات', 'Notes')}</Label><Textarea value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} className="min-h-[80px]" /></div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>{t('common.cancel')}</Button>
                        <Button onClick={handleSaveEdit} disabled={isSaving} className="bg-amber-600 hover:bg-amber-700">{isSaving ? <><Loader2 className="w-4 h-4 animate-spin ms-2" />{t('common.loading')}</> : t('common.save')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!viewEntry} onOpenChange={open => { if (!open) setViewEntry(null); }}>
                <DialogContent className="max-w-lg" dir={dir}>
                    <DialogHeader><DialogTitle>سجل متابعة — {viewEntry?.student_name || ta('طالب', 'Student')}</DialogTitle></DialogHeader>
                    {viewEntry && <div className="space-y-3 text-sm">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex gap-2"><span className="font-bold text-gray-500">{ta('الطالب:', 'Student:')}</span><span>{viewEntry.student_name || '—'}</span></div>
                            <div className="flex gap-2"><span className="font-bold text-gray-500">{ta('المادة:', 'Subject:')}</span><span>{viewEntry.subject || '—'}</span></div>
                        </div>
                        <div className="flex gap-2"><span className="font-bold text-gray-500">{ta('الحالة:', 'Status:')}</span><Badge className={statusColors[viewEntry.status || ''] || 'bg-gray-100 text-gray-700'}>{viewEntry.status || '—'}</Badge></div>
                        <div><p className="font-bold text-gray-500 mb-1">{ta('الملاحظات:', 'Notes:')}</p><p className="text-gray-700 dark:text-gray-300 leading-relaxed">{viewEntry.notes}</p></div>
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
