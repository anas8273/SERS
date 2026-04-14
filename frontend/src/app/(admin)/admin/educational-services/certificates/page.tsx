'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BulkActionBar } from '@/components/admin/BulkActionBar';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { ServiceDesigner } from '@/components/admin/ServiceDesigner';
import toast from 'react-hot-toast';
import {
    Award, Search, Trash2, Edit, Eye, Loader2, FileText,
    RefreshCw, PlusCircle, X, AlertTriangle,
    CheckCircle2, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useTranslation } from '@/i18n/useTranslation';
import { ta } from '@/i18n/auto-translations';
import { motion, AnimatePresence } from 'framer-motion';

const CERT_TYPES: Record<string, string> = {
    appreciation: ta('شهادة تقدير','Appreciation'), thankyou: ta('شهادة شكر','Thank You'),
    graduation: ta('شهادة تخرج','Graduation'), participation: ta('شهادة مشاركة','Participation'),
    excellence: ta('شهادة تميز','Excellence'), other: ta('أخرى','Other'),
};
const TYPE_COLORS: Record<string, string> = {
    appreciation: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    thankyou: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    graduation: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    participation: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    excellence: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
    other: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};
const PAGE_SIZE = 10;
const EMPTY_FORM = { title: '', type: 'appreciation', recipient_name: '', description: '', issued_by: '', date: '' };

interface Certificate {
    id: string; user_id?: string; user_name?: string;
    title: string; type: string; recipient_name: string;
    description?: string; date?: string; created_at?: string; issued_by?: string;
}

function TableSkeleton() {
    return (
        <div className="animate-pulse divide-y divide-gray-50 dark:divide-gray-700/50">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4">
                    <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/5 hidden sm:block" />
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20" />
                    <div className="flex gap-2">
                        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function AdminCertificatesPage() {
    const { dir } = useTranslation();
    const [entries, setEntries] = useState<Certificate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState(false);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [page, setPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
    const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [viewEntry, setViewEntry] = useState<Certificate | null>(null);
    const [editingEntry, setEditingEntry] = useState<Certificate | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editForm, setEditForm] = useState({ ...EMPTY_FORM });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const h = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { setViewEntry(null); setIsEditOpen(false); setIsAddOpen(false); setDeleteConfirm(null); }
        };
        document.addEventListener('keydown', h);
        return () => document.removeEventListener('keydown', h);
    }, []);

    const fetchEntries = useCallback(async () => {
        setIsLoading(true); setFetchError(false);
        try { const r = await api.get('/admin/educational-services/certificates') as any; setEntries((r as any).data || r || []); }
        catch { setFetchError(true); setEntries([]); } finally { setIsLoading(false); }
    }, []);
    useEffect(() => { fetchEntries(); }, [fetchEntries]);

    const handleDelete = async (id: string) => {
        try { await api.delete(`/admin/educational-services/certificates/${id}`); toast.success(ta('تم الحذف', 'Deleted')); setDeleteConfirm(null); fetchEntries(); }
        catch { toast.error(ta('فشل الحذف', 'Delete failed')); }
    };
    const openEdit = (e: Certificate) => { setEditingEntry(e); setEditForm({ title: e.title, type: e.type, recipient_name: e.recipient_name || '', description: e.description || '', issued_by: e.issued_by || '', date: e.date || '' }); setIsEditOpen(true); };
    const openAdd = () => { setEditingEntry(null); setEditForm({ ...EMPTY_FORM }); setIsAddOpen(true); };
    const handleSave = async () => {
        if (!editForm.title.trim()) { toast.error(ta('العنوان مطلوب', 'Title is required')); return; }
        setIsSaving(true);
        try {
            if (editingEntry) { await api.put(`/admin/educational-services/certificates/${editingEntry.id}`, editForm); toast.success(ta('تم التحديث', 'Updated')); setIsEditOpen(false); }
            else { await api.post('/admin/educational-services/certificates', editForm); toast.success(ta('تمت الإضافة', 'Added')); setIsAddOpen(false); }
            fetchEntries();
        } catch { toast.error(ta('فشلت العملية', 'Operation failed')); } finally { setIsSaving(false); }
    };

    const toggleSelect = (id: string) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    const deselectAll = () => setSelectedIds(new Set());
    const handleBulkDelete = async (idsToDelete?: Set<string>) => {
        const ids = idsToDelete ?? selectedIds;
        setIsBulkDeleting(true);
        let ok = 0;
        await Promise.allSettled(Array.from(ids).map(async id => { try { await api.delete(`/admin/educational-services/certificates/${id}`); ok++; } catch {} }));
        setEntries(prev => prev.filter(e => !ids.has(e.id)));
        setSelectedIds(new Set()); setShowBulkDeleteConfirm(false); setShowDeleteAllConfirm(false); setIsBulkDeleting(false);
        if (ok > 0) toast.success(ta('تم حذف', 'Deleted') + ` ${ok} شهادة`);
    };

    const filtered = entries.filter(e => {
        const q = search.toLowerCase();
        return ((e.title || '').toLowerCase().includes(q) || (e.user_name || '').includes(search) || (e.recipient_name || '').includes(search))
            && (filterType === 'all' || e.type === filterType);
    });
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const isAllSelected = filtered.length > 0 && filtered.every(e => selectedIds.has(e.id));
    const selectAll = () => setSelectedIds(new Set(filtered.map(e => e.id)));

    const stats = [
        { label: ta('إجمالي الشهادات', 'Total Certificates'), value: entries.length, color: 'from-amber-500 to-orange-600', icon: Award },
        { label: ta('أنواع مختلفة', 'Various types'), value: new Set(entries.map(e => e.type)).size, color: 'from-blue-500 to-indigo-600', icon: FileText },
        { label: ta('المعلمون', 'Teachers'), value: new Set(entries.map(e => e.user_id).filter(Boolean)).size, color: 'from-violet-500 to-purple-600', icon: FileText },
        {
            label: ta('هذا الشهر', 'This Month'), color: 'from-emerald-500 to-green-600', icon: CheckCircle2,
            value: entries.filter(e => { const d = e.created_at || e.date; if (!d) return false; const now = new Date(); const dt = new Date(d); return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear(); }).length,
        },
    ];

    const FormBody = () => (
        <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>{ta('العنوان', 'Title')} <span className="text-red-500">*</span></Label><Input placeholder={ta('عنوان الشهادة', 'Certificate Title')} value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} className="rounded-xl" /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>{ta('نوع الشهادة', 'Certificate Type')}</Label><Select value={editForm.type} onValueChange={v => setEditForm(p => ({ ...p, type: v }))}><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(CERT_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-1.5"><Label>{ta('اسم المستلم', 'Recipient Name')}</Label><Input placeholder={ta("اسم الشخص المُمنح", "Recipient name")} value={editForm.recipient_name} onChange={e => setEditForm(p => ({ ...p, recipient_name: e.target.value }))} className="rounded-xl" /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>{ta('جهة الإصدار', 'Issuing Authority')}</Label><Input placeholder={ta("المدرسة / الجهة", "School / Organization")} value={editForm.issued_by} onChange={e => setEditForm(p => ({ ...p, issued_by: e.target.value }))} className="rounded-xl" /></div>
                <div className="space-y-1.5"><Label>{ta('التاريخ', 'Date')}</Label><Input type="date" value={editForm.date} onChange={e => setEditForm(p => ({ ...p, date: e.target.value }))} className="rounded-xl" /></div>
            </div>
            <div className="space-y-1.5"><Label>{ta('الوصف / سبب المنح', 'Description / Reason')}</Label><Textarea placeholder={ta("وصف الشهادة أو سبب المنح...", "Certificate description or reason...")} value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} className="min-h-[90px] rounded-xl resize-none" /></div>
        </div>
    );

    // ── The CRUD Table content (Tab 1 of ServiceDesigner) ──
    const tableContent = (
        <div className="space-y-4" dir={dir}>
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {stats.map((s, i) => { const Icon = s.icon; return (
                    <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow flex-shrink-0`}><Icon className="w-5 h-5 text-white" /></div>
                        <div className="min-w-0"><p className="text-xs text-gray-500 dark:text-gray-400 truncate">{s.label}</p><p className="text-xl font-black text-gray-900 dark:text-white">{isLoading ? <span className="inline-block w-8 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" /> : s.value}</p></div>
                    </motion.div>
                ); })}
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1"><Search className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" /><Input placeholder={ta("بحث بالعنوان أو المعلم أو المستلم...", "بحث بالعنوان أو المعلم أو المستلم...")} className="pe-10 rounded-xl" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /></div>
                    <Select value={filterType} onValueChange={v => { setFilterType(v); setPage(1); }}><SelectTrigger className="w-full sm:w-[200px] rounded-xl"><SelectValue placeholder={ta('جميع الأنواع', 'All Types')} /></SelectTrigger><SelectContent><SelectItem value="all">{ta('جميع الأنواع', 'All Types')}</SelectItem>{Object.entries(CERT_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select>
                    <Button size="sm" onClick={openAdd} className="gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-md shrink-0">
                        <PlusCircle className="w-4 h-4" />{ta('إضافة شهادة', 'Add Certificate')}
                    </Button>
                    <Button variant="outline" size="sm" onClick={fetchEntries} disabled={isLoading} className="gap-2 rounded-xl shrink-0">
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}{ta('تحديث', 'Refresh')}
                    </Button>
                </div>
            </div>

            {/* Bulk Action Bar */}
            <BulkActionBar selectedCount={selectedIds.size} totalCount={filtered.length} onSelectAll={selectAll} onDeselectAll={deselectAll} onDeleteSelected={() => setShowBulkDeleteConfirm(true)} onDeleteAll={() => setShowDeleteAllConfirm(true)} isAllSelected={isAllSelected} entityName={ta("شهادة", "certificate")} />

            {/* Table Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{isLoading ? '...' : `${filtered.length} ${ta('نتيجة', 'results')}`}</p>
                    {!isLoading && totalPages > 1 && <p className="text-xs text-gray-400">{ta('صفحة', 'Page')} {page} {ta('من', 'of')} {totalPages}</p>}
                </div>
                {isLoading && <TableSkeleton />}
                {!isLoading && fetchError && (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <div className="w-14 h-14 bg-red-100 dark:bg-red-900/20 rounded-2xl flex items-center justify-center"><AlertTriangle className="w-7 h-7 text-red-500" /></div>
                        <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{ta('فشل تحميل البيانات', 'Failed to load data')}</p>
                        <Button variant="outline" size="sm" onClick={fetchEntries} className="gap-2 rounded-xl"><RefreshCw className="w-4 h-4" />{ta('إعادة المحاولة', 'Retry')}</Button>
                    </div>
                )}
                {!isLoading && !fetchError && filtered.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center"><Award className="w-8 h-8 text-amber-400" /></div>
                        <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{search ? [ta('لا توجد نتائج مطابقة', 'No matching results')]: ta('لا توجد شهادات بعد', 'No certificates yet') }</p>
                        {!search && <Button size="sm" onClick={openAdd} className="gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white"><PlusCircle className="w-4 h-4" />{ta("إضافة أول شهادة", "Add First Certificate")}</Button>}
                    </div>
                )}
                {!isLoading && !fetchError && paginated.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm" style={{ minWidth: '680px' }}>
                            <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs font-bold text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                                <tr>
                                    <th className="py-3 px-4 w-10"><input type="checkbox" checked={isAllSelected} onChange={isAllSelected ? deselectAll : selectAll} className="w-4 h-4 rounded border-gray-300 cursor-pointer" /></th>
                                    <th className="text-start px-4 py-3 w-[30%]">{ta('العنوان', 'Title')}</th>
                                    <th className="text-start px-4 py-3 hidden sm:table-cell w-[16%]">{ta('المعلم', 'Teacher')}</th>
                                    <th className="text-start px-4 py-3 hidden sm:table-cell w-[14%]">{ta('المستلم', 'Recipient')}</th>
                                    <th className="text-start px-4 py-3 w-[14%]">{ta('النوع', 'Type')}</th>
                                    <th className="text-start px-4 py-3 hidden md:table-cell w-[12%]">{ta('التاريخ', 'Date')}</th>
                                    <th className="text-center px-4 py-3 w-[9%]">{ta('الإجراءات', 'Actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                                <AnimatePresence>
                                    {paginated.map((entry, idx) => (
                                        <motion.tr key={entry.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.03 }} className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group ${selectedIds.has(entry.id) ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}`}>
                                            <td className="py-3.5 px-4"><input type="checkbox" checked={selectedIds.has(entry.id)} onChange={() => toggleSelect(entry.id)} className="w-4 h-4 rounded border-gray-300 cursor-pointer" /></td>
                                            <td className="px-4 py-3.5">
                                                <span className="font-semibold text-gray-900 dark:text-white line-clamp-1 max-w-[200px] block">{entry.title}</span>
                                                {entry.issued_by && <span className="text-xs text-gray-400 mt-0.5 block">{entry.issued_by}</span>}
                                            </td>
                                            <td className="px-4 py-3.5 text-gray-500 dark:text-gray-400 hidden sm:table-cell whitespace-nowrap">{entry.user_name || <span className="text-gray-300 dark:text-gray-600">—</span>}</td>
                                            <td className="px-4 py-3.5 text-gray-500 dark:text-gray-400 hidden sm:table-cell whitespace-nowrap">{entry.recipient_name || <span className="text-gray-300 dark:text-gray-600">—</span>}</td>
                                            <td className="px-4 py-3.5 whitespace-nowrap"><span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold ${TYPE_COLORS[entry.type] || TYPE_COLORS.other}`}>{CERT_TYPES[entry.type] || entry.type}</span></td>
                                            <td className="px-4 py-3.5 text-gray-400 text-xs whitespace-nowrap hidden md:table-cell">{entry.date ? new Date(entry.date).toLocaleDateString('ar-SA') : '—'}</td>
                                            <td className="px-4 py-3.5 whitespace-nowrap">
                                                <div className="flex items-center justify-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => setViewEntry(entry)} title={ta("عرض", "View")} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"><Eye className="w-4 h-4" /></button>
                                                    <button onClick={() => openEdit(entry)} title={ta("تعديل", "Edit")} className="p-1.5 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                                                    {deleteConfirm === entry.id ? (
                                                        <div className="flex gap-1">
                                                            <button onClick={() => handleDelete(entry.id)} className="px-2 py-1 bg-red-600 text-white text-xs rounded-lg">{ta('تأكيد', 'Confirm')}</button>
                                                            <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1 bg-gray-200 dark:bg-gray-600 text-xs rounded-lg">{ta('إلغاء', 'Cancel')}</button>
                                                        </div>
                                                    ) : (
                                                        <button onClick={() => setDeleteConfirm(entry.id)} title={ta("حذف", "Delete")} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                    )}
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                )}
                {!isLoading && !fetchError && totalPages > 1 && (
                    <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                        <p className="text-xs text-gray-500 dark:text-gray-400">{ta('عرض', 'Showing')} {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} {ta('من', 'of')} {filtered.length}</p>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
                            {[...Array(Math.min(5, totalPages))].map((_, i) => { const p = i + 1; return <button key={p} onClick={() => setPage(p)} className={`w-7 h-7 rounded-lg text-xs font-bold ${p === page ? 'bg-amber-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>{p}</button>; })}
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                        </div>
                    </div>
                )}
            </div>

            {/* Confirm Dialogs */}
            <ConfirmDialog open={showBulkDeleteConfirm} title={`${ta("حذف", "Delete")} ${selectedIds.size} ${ta("شهادة", "certificates")}`} message={ta("هل أنت متأكد من حذف الشهادات المحددة؟ لا يمكن التراجع.", "Are you sure you want to delete the selected certificates? This cannot be undone.")} confirmLabel={ta("حذف المحدد", "Delete Selected")} variant="danger" isLoading={isBulkDeleting} onConfirm={() => handleBulkDelete()} onCancel={() => setShowBulkDeleteConfirm(false)} />
            <ConfirmDialog open={showDeleteAllConfirm} title={ta("حذف جميع الشهادات", "Delete All Certificates")} message={`${ta("حذف", "Delete")} ${entries.length} ${ta("شهادة", "certificates")}? ⚠️ ${ta("هذا خطر!", "This is dangerous!")}`} confirmLabel={ta("حذف الكل", "Delete All")} variant="danger" isLoading={isBulkDeleting} onConfirm={() => handleBulkDelete(new Set(entries.map(e => e.id)))} onCancel={() => setShowDeleteAllConfirm(false)} />

            {/* Add Modal */}
            <Dialog open={isAddOpen} onOpenChange={open => { if (!open) setIsAddOpen(false); }}>
                <DialogContent className="max-w-lg rounded-2xl" dir={dir}>
                    <DialogHeader><DialogTitle className="flex items-center gap-2"><PlusCircle className="w-5 h-5 text-amber-500" />{ta('إضافة شهادة جديدة', 'Add New Certificate')}</DialogTitle><DialogDescription>{ta('أدخل بيانات الشهادة', 'Enter certificate details')}</DialogDescription></DialogHeader>
                    <FormBody />
                    <DialogFooter className="gap-2"><Button variant="outline" onClick={() => setIsAddOpen(false)}>{ta('إلغاء', 'Cancel')}</Button><Button onClick={handleSave} disabled={isSaving} className="bg-amber-600 hover:bg-amber-700 text-white gap-2">{isSaving ? <><Loader2 className="w-4 h-4 animate-spin" />{ta('جاري...', 'Saving...')}</> : <><PlusCircle className="w-4 h-4" />{ta(ta('إضافة', 'Add'), 'Add')}</>}</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Modal */}
            <Dialog open={isEditOpen} onOpenChange={open => { if (!open) { setIsEditOpen(false); setEditingEntry(null); } }}>
                <DialogContent className="max-w-lg rounded-2xl" dir={dir}>
                    <DialogHeader><DialogTitle className="flex items-center gap-2"><Edit className="w-5 h-5 text-emerald-500" />{ta('تعديل الشهادة', 'Edit Certificate')}</DialogTitle><DialogDescription>{editingEntry?.title}</DialogDescription></DialogHeader>
                    <FormBody />
                    <DialogFooter className="gap-2"><Button variant="outline" onClick={() => setIsEditOpen(false)}>{ta('إلغاء', 'Cancel')}</Button><Button onClick={handleSave} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">{isSaving ? <><Loader2 className="w-4 h-4 animate-spin" />{ta('جاري...', 'Saving...')}</> : <><CheckCircle2 className="w-4 h-4" />{ta('حفظ', 'Save')}</>}</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Modal */}
            <Dialog open={!!viewEntry} onOpenChange={open => { if (!open) setViewEntry(null); }}>
                <DialogContent className="max-w-md rounded-2xl" dir={dir}>
                    <DialogHeader><DialogTitle className="flex items-center gap-2 text-base"><Award className="w-5 h-5 text-amber-500 flex-shrink-0" /><span className="truncate">{viewEntry?.title}</span></DialogTitle></DialogHeader>
                    {viewEntry && (
                        <div className="space-y-3 text-sm py-1">
                            <div><span className={`inline-flex px-3 py-1 rounded-xl text-xs font-bold ${TYPE_COLORS[viewEntry.type] || TYPE_COLORS.other}`}>{CERT_TYPES[viewEntry.type] || viewEntry.type}</span></div>
                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-2.5">
                                {[{ label: ta('المعلم', 'Teacher'), value: viewEntry.user_name }, { label: ta('المستلم', 'Recipient'), value: viewEntry.recipient_name }, { label: ta('جهة الإصدار', 'Issuing Authority'), value: viewEntry.issued_by }, { label: ta('التاريخ', 'History'), value: viewEntry.date ? new Date(viewEntry.date).toLocaleDateString('ar-SA') : undefined }].map(row => row.value && (<div key={row.label} className="flex items-start gap-2"><span className="text-xs font-bold text-gray-500 dark:text-gray-400 w-24 flex-shrink-0">{row.label}:</span><span className="text-gray-800 dark:text-gray-200">{row.value}</span></div>))}
                            </div>
                            {viewEntry.description && <div><p className="text-xs font-bold text-gray-500 mb-1.5">{ta('الوصف', 'Description')}:</p><p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 leading-relaxed">{viewEntry.description}</p></div>}
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setViewEntry(null)} className="gap-2"><X className="w-4 h-4" />{ta('إغلاق', 'Close')}</Button>
                        {viewEntry && <Button onClick={() => { setViewEntry(null); openEdit(viewEntry); }} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"><Edit className="w-4 h-4" />{ta('تعديل', 'Edit')}</Button>}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );

    // ── Render with ServiceDesigner tabs ──────────────────────────────────
    return (
        <ServiceDesigner
            serviceId="edu-certificates"
            serviceName={ta("الشهادات والتقدير", "Certificates & Awards")}
            serviceSlug="certificates"
            serviceColor="from-amber-500 to-orange-600"
            serviceIcon={<Award className="w-5 h-5 text-white" />}
            hasVisualDesigner={true}
        >
            {tableContent}
        </ServiceDesigner>
    );
}
