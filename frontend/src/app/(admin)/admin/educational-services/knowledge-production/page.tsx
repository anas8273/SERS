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
import { ta } from '@/i18n/auto-translations';
import {
    BookOpen, Search, Trash2, Edit, Eye, Loader2,
    Users, FileText, RefreshCw, ArrowRight, Download
} from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/i18n/useTranslation';

const TYPES = ['بحث', 'مقال', 'كتاب', 'ورقة عمل', 'عرض تقديمي', 'دورة تدريبية', 'أخرى'];

interface Entry {
    id: string;
    user_id?: string;
    user_name?: string;
    title: string;
    type: string;
    description: string;
    date: string;
    url?: string;
    attachments?: string[];
    created_at?: string;
}

export default function AdminKnowledgeProductionPage() {
    const { dir, t } = useTranslation();
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [entries, setEntries] = useState<Entry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editForm, setEditForm] = useState({ title: '', type: '', description: '', url: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [viewEntry, setViewEntry] = useState<Entry | null>(null);

    const fetchEntries = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/admin/educational-services/knowledge-production') as any;
            setEntries((res as any)?.data || res || []);
        } catch { setEntries([]); toast.error(t('common.error')); } finally { setIsLoading(false); }
    };

    useEffect(() => { fetchEntries(); }, []);

    const handleDelete = async (id: string) => {
        if (!confirm(ta('هل أنت متأكد من الحذف؟', 'Are you sure you want to delete?'))) return;
        try { await api.delete(`/admin/educational-services/knowledge-production/${id}`); toast.success(t('common.delete')); fetchEntries(); }
        catch { toast.error(t('common.error')); }
    };

    const handleOpenEdit = (entry: Entry) => {
        setEditingEntry(entry);
        setEditForm({ title: entry.title, type: entry.type, description: entry.description, url: entry.url || '' });
        setIsEditOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!editingEntry) return;
        setIsSaving(true);
        try {
            await api.put(`/admin/educational-services/knowledge-production/${editingEntry.id}`, editForm);
            toast.success(ta('تم التحديث', 'Updated')); setIsEditOpen(false); fetchEntries();
        } catch { toast.error(ta('فشل التحديث', 'Update failed')); } finally { setIsSaving(false); }
    };

    const filtered = entries.filter(e => {
        const matchSearch = e.title.toLowerCase().includes(search.toLowerCase()) || (e.user_name || '').includes(search);
        const matchType = filterType === 'all' || e.type === filterType;
        return matchSearch && matchType;
    });

    const typeColors: Record<string, string> = {
        'بحث': 'bg-blue-100 text-blue-700', 'مقال': 'bg-green-100 text-green-700',
        'كتاب': 'bg-amber-100 text-amber-700', 'ورقة عمل': 'bg-purple-100 text-purple-700',
        'عرض تقديمي': 'bg-rose-100 text-rose-700', 'دورة تدريبية': 'bg-cyan-100 text-cyan-700',
        'أخرى': 'bg-gray-100 text-gray-700',
    };

    return (
        <div className="space-y-6" dir={dir}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link href="/admin/educational-services" className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 transition-colors"><ArrowRight className="w-4 h-4" /></Link>
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20"><BookOpen className="w-5 h-5 text-white" /></div>
                    <div>
                        <h1 className="text-xl font-black text-gray-900 dark:text-white">{ta('الإنتاج المعرفي', 'Knowledge Production')}</h1>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{ta('إدارة الأبحاث والمقالات والإنتاج المعرفي', 'Manage research, articles and knowledge production')}</p>
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={fetchEntries} className="gap-2 rounded-xl"><RefreshCw className="w-4 h-4" /> {ta('تحديث', 'Refresh')}</Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: ta('إجمالي', 'Total'), value: entries.length, color: 'from-blue-500 to-indigo-600' },
                    { label: ta('أبحاث', 'Research'), value: entries.filter(e => e.type === 'بحث').length, color: 'from-violet-500 to-purple-600' },
                    { label: ta('مقالات', 'Articles'), value: entries.filter(e => e.type === 'مقال').length, color: 'from-emerald-500 to-green-600' },
                    { label: ta('المعلمون', 'Teachers'), value: new Set(entries.map(e => e.user_id)).size, color: 'from-amber-500 to-orange-600' },
                ].map((s, i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow flex-shrink-0`}><FileText className="w-5 h-5 text-white" /></div>
                        <div><p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p><p className="text-xl font-black text-gray-900 dark:text-white">{s.value}</p></div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1"><Search className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><Input placeholder={ta("بحث...", "Search")} className="pr-10 rounded-xl" value={search} onChange={e => setSearch(e.target.value)} /></div>
                <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-[180px] rounded-xl"><SelectValue placeholder={ta("النوع", "Type")} /></SelectTrigger>
                    <SelectContent><SelectItem value="all">{ta('جميع الأنواع', 'All Types')}</SelectItem>{TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700"><p className="text-sm font-bold text-gray-900 dark:text-white">{filtered.length} {ta('نتيجة', 'results')}</p></div>
                {isLoading ? (
                    <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center"><BookOpen className="w-12 h-12 text-gray-200 dark:text-gray-700 mb-3" /><p className="text-sm font-bold text-gray-500">{ta('لا توجد نتائج', 'No results')}</p></div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs font-bold text-gray-500 dark:text-gray-400">
                                <tr><th className="text-start px-5 py-3">{ta('العنوان', 'Title')}</th><th className="text-start px-5 py-3">{ta('المعلم', 'Teacher')}</th><th className="text-start px-5 py-3">{ta('النوع', 'Type')}</th><th className="text-start px-5 py-3">{ta('التاريخ', 'Date')}</th><th className="px-5 py-3"></th></tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                                {filtered.map(entry => (
                                    <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                        <td className="px-5 py-3 font-medium text-gray-900 dark:text-white max-w-[200px] truncate">{entry.title}</td>
                                        <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{entry.user_name || '—'}</td>
                                        <td className="px-5 py-3"><Badge className={typeColors[entry.type] || 'bg-gray-100 text-gray-700'}>{entry.type}</Badge></td>
                                        <td className="px-5 py-3 text-gray-500 dark:text-gray-400 text-xs">{entry.date ? new Date(entry.date).toLocaleDateString('ar-SA') : '—'}</td>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-2">
                                                <Button variant="ghost" size="icon" className="w-8 h-8 text-blue-500 hover:bg-blue-50" onClick={() => setViewEntry(entry)}><Eye className="w-4 h-4" /></Button>
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
                    <DialogHeader><DialogTitle>{ta('تعديل الإنتاج المعرفي', 'Edit Knowledge Production')}</DialogTitle><DialogDescription>{ta('تعديل بيانات السجل', 'Edit record data')}</DialogDescription></DialogHeader>
                    <div className="grid gap-4 py-2">
                        <div className="grid gap-2"><Label>{ta('العنوان *', 'Title')}</Label><Input value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} /></div>
                        <div className="grid gap-2"><Label>{ta('النوع', 'Type')}</Label>
                            <Select value={editForm.type} onValueChange={v => setEditForm({ ...editForm, type: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2"><Label>{ta('رابط (اختياري)', 'Link (optional)')}</Label><Input value={editForm.url} onChange={e => setEditForm({ ...editForm, url: e.target.value })} placeholder="https://" /></div>
                        <div className="grid gap-2"><Label>{ta('الوصف', 'Description')}</Label><Textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} className="min-h-[80px]" /></div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>{t('common.cancel')}</Button>
                        <Button onClick={handleSaveEdit} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
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
                            <div className="flex gap-2"><span className="font-bold text-gray-500">{ta('النوع:', 'Type:')}</span><Badge className={typeColors[viewEntry.type] || 'bg-gray-100 text-gray-700'}>{viewEntry.type}</Badge></div>
                            <div className="flex gap-2"><span className="font-bold text-gray-500">{ta('التاريخ:', 'Date:')}</span><span>{viewEntry.date ? new Date(viewEntry.date).toLocaleDateString('ar-SA') : '—'}</span></div>
                            {viewEntry.url && <div className="flex gap-2"><span className="font-bold text-gray-500">{ta('الرابط:', 'Link:')}</span><a href={viewEntry.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">{viewEntry.url}</a></div>}
                            <div><p className="font-bold text-gray-500 mb-1">{ta('الوصف:', 'Description:')}</p><p className="text-gray-700 dark:text-gray-300 leading-relaxed">{viewEntry.description}</p></div>
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
