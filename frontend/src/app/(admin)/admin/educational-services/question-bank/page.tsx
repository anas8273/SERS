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
import { Database, Search, Trash2, Edit, Eye, Loader2, FileText, RefreshCw, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/i18n/useTranslation';

const QUESTION_TYPES = ['اختيار من متعدد', 'صح وخطأ', 'ملء الفراغ', 'إجابة قصيرة', 'مقالي'];
const DIFFICULTIES = ['سهل', 'متوسط', 'صعب'];
const BLOOM_LEVELS = ['تذكر', 'فهم', 'تطبيق', 'تحليل', 'تقييم', 'إبداع'];

interface Question {
    id: string; user_id?: string; user_name?: string;
    question: string; type: string; difficulty?: string;
    bloom_level?: string; subject?: string; answer?: string;
    choices?: string[]; marks?: number; created_at?: string;
}

export default function AdminQuestionBankPage() {
    const { dir, t } = useTranslation();
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [entries, setEntries] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterDiff, setFilterDiff] = useState('all');
    const [editingEntry, setEditingEntry] = useState<Question | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editForm, setEditForm] = useState({ question: '', type: '', difficulty: 'متوسط', bloom_level: '', subject: '', answer: '', marks: '1' });
    const [isSaving, setIsSaving] = useState(false);
    const [viewEntry, setViewEntry] = useState<Question | null>(null);

    const fetchEntries = async () => {
        setIsLoading(true);
        try { const res = await api.get('/admin/educational-services/question-bank') as any; setEntries(res.data || res || []); }
        catch { setEntries([]); toast.error(t('common.error')); } finally { setIsLoading(false); }
    };
    useEffect(() => { fetchEntries(); }, []);

    const handleDelete = async (id: string) => {
        if (!confirm(ta('هل أنت متأكد من الحذف؟', 'Are you sure you want to delete?'))) return;
        try { await api.delete(`/admin/educational-services/question-bank/${id}`); toast.success(t('common.delete')); fetchEntries(); }
        catch { toast.error(t('common.error')); }
    };
    const handleOpenEdit = (entry: Question) => {
        setEditingEntry(entry);
        setEditForm({ question: entry.question, type: entry.type, difficulty: entry.difficulty || 'متوسط', bloom_level: entry.bloom_level || '', subject: entry.subject || '', answer: entry.answer || '', marks: String(entry.marks || 1) });
        setIsEditOpen(true);
    };
    const handleSaveEdit = async () => {
        if (!editingEntry) return; setIsSaving(true);
        try { await api.put(`/admin/educational-services/question-bank/${editingEntry.id}`, { ...editForm, marks: Number(editForm.marks) }) as any; toast.success(ta('تم التحديث', 'Updated')); setIsEditOpen(false); fetchEntries(); }
        catch { toast.error(ta('فشل التحديث', 'Update failed')); } finally { setIsSaving(false); }
    };

    const filtered = entries.filter(e => {
        const matchSearch = e.question.toLowerCase().includes(search.toLowerCase()) || (e.subject || '').includes(search);
        const matchType = filterType === 'all' || e.type === filterType;
        const matchDiff = filterDiff === 'all' || e.difficulty === filterDiff;
        return matchSearch && matchType && matchDiff;
    });

    const diffColors: Record<string, string> = { 'سهل': 'bg-emerald-100 text-emerald-700', 'متوسط': 'bg-amber-100 text-amber-700', 'صعب': 'bg-red-100 text-red-700' };

    return (
        <div className="space-y-6" dir={dir}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link href="/admin/educational-services" className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 transition-colors"><ArrowRight className="w-4 h-4" /></Link>
                    <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-rose-500/20"><Database className="w-5 h-5 text-white" /></div>
                    <div><h1 className="text-xl font-black text-gray-900 dark:text-white">{ta('بنك الأسئلة', 'Question Bank')}</h1><p className="text-xs text-gray-500 dark:text-gray-400">{ta('إدارة جميع الأسئلة لجميع المعلمين', 'Manage all questions')}</p></div>
                </div>
                <Button variant="outline" size="sm" onClick={fetchEntries} className="gap-2 rounded-xl"><RefreshCw className="w-4 h-4" /> {ta('تحديث', 'Refresh')}</Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: ta('إجمالي الأسئلة', 'Total Questions'), value: entries.length, color: 'from-rose-500 to-pink-600' },
                    { label: ta('سهلة', 'Easy'), value: entries.filter(e => e.difficulty === 'سهل').length, color: 'from-emerald-500 to-green-600' },
                    { label: ta('متوسطة', 'Intermediate School'), value: entries.filter(e => e.difficulty === 'متوسط').length, color: 'from-amber-500 to-orange-600' },
                    { label: ta('صعبة', 'Hard'), value: entries.filter(e => e.difficulty === 'صعب').length, color: 'from-red-500 to-rose-600' },
                ].map((s, i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow flex-shrink-0`}><FileText className="w-5 h-5 text-white" /></div>
                        <div><p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p><p className="text-xl font-black text-gray-900 dark:text-white">{s.value}</p></div>
                    </div>
                ))}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1"><Search className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><Input placeholder={ta("بحث في الأسئلة...", "Search questions...")} className="pr-10 rounded-xl" value={search} onChange={e => setSearch(e.target.value)} /></div>
                <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-[180px] rounded-xl"><SelectValue placeholder={ta("نوع السؤال", "Question Type")} /></SelectTrigger>
                    <SelectContent><SelectItem value="all">{ta('جميع الأنواع', 'All Types')}</SelectItem>{QUESTION_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={filterDiff} onValueChange={setFilterDiff}>
                    <SelectTrigger className="w-[140px] rounded-xl"><SelectValue placeholder={ta("الصعوبة", "Difficulty")} /></SelectTrigger>
                    <SelectContent><SelectItem value="all">{ta('جميع المستويات', 'All Levels')}</SelectItem>{DIFFICULTIES.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700"><p className="text-sm font-bold text-gray-900 dark:text-white">{filtered.length} {ta('سؤال', 'questions')}</p></div>
                {isLoading ? <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-rose-500" /></div>
                : filtered.length === 0 ? <div className="flex flex-col items-center justify-center py-16"><Database className="w-12 h-12 text-gray-200 dark:text-gray-700 mb-3" /><p className="text-sm font-bold text-gray-500">{ta('لا توجد أسئلة', 'No questions')}</p></div>
                : <div className="overflow-x-auto"><table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs font-bold text-gray-500 dark:text-gray-400">
                        <tr><th className="text-start px-5 py-3">{ta('السؤال', 'Question')}</th><th className="text-start px-5 py-3">{ta('المعلم', 'Teacher')}</th><th className="text-start px-5 py-3">{ta('المادة', 'Subject')}</th><th className="text-start px-5 py-3">{ta('النوع', 'Type')}</th><th className="text-start px-5 py-3">{ta('الصعوبة', 'Difficulty')}</th><th className="text-start px-5 py-3">{ta('الدرجة', 'Score')}</th><th className="px-5 py-3"></th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                        {filtered.map(entry => (
                            <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                <td className="px-5 py-3 font-medium text-gray-900 dark:text-white max-w-[200px] truncate">{entry.question}</td>
                                <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{entry.user_name || '—'}</td>
                                <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{entry.subject || '—'}</td>
                                <td className="px-5 py-3"><Badge className="bg-rose-100 text-rose-700">{entry.type}</Badge></td>
                                <td className="px-5 py-3"><Badge className={diffColors[entry.difficulty || ''] || 'bg-gray-100 text-gray-700'}>{entry.difficulty || '—'}</Badge></td>
                                <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{entry.marks || 1}</td>
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
                    <DialogHeader><DialogTitle>{ta('تعديل السؤال', 'Edit Question')}</DialogTitle><DialogDescription>{ta('تعديل بيانات السؤال', 'Edit question data')}</DialogDescription></DialogHeader>
                    <div className="grid gap-4 py-2">
                        <div className="grid gap-2"><Label>{ta('نص السؤال *', 'Question *')}</Label><Textarea value={editForm.question} onChange={e => setEditForm({ ...editForm, question: e.target.value })} className="min-h-[80px]" /></div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-2"><Label>{ta('النوع', 'Type')}</Label>
                                <Select value={editForm.type} onValueChange={v => setEditForm({ ...editForm, type: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>{QUESTION_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2"><Label>{ta('الصعوبة', 'Difficulty')}</Label>
                                <Select value={editForm.difficulty} onValueChange={v => setEditForm({ ...editForm, difficulty: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>{DIFFICULTIES.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-2"><Label>{ta('المادة', 'Subject')}</Label><Input value={editForm.subject} onChange={e => setEditForm({ ...editForm, subject: e.target.value })} /></div>
                            <div className="grid gap-2"><Label>{ta('الدرجة', 'Score')}</Label><Input type="number" min="1" value={editForm.marks} onChange={e => setEditForm({ ...editForm, marks: e.target.value })} /></div>
                        </div>
                        <div className="grid gap-2"><Label>{ta('الإجابة النموذجية', 'Model Answer')}</Label><Textarea value={editForm.answer} onChange={e => setEditForm({ ...editForm, answer: e.target.value })} className="min-h-[60px]" /></div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>{t('common.cancel')}</Button>
                        <Button onClick={handleSaveEdit} disabled={isSaving} className="bg-rose-600 hover:bg-rose-700">{isSaving ? <><Loader2 className="w-4 h-4 animate-spin ms-2" />{t('common.loading')}</> : t('common.save')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!viewEntry} onOpenChange={open => { if (!open) setViewEntry(null); }}>
                <DialogContent className="max-w-lg" dir={dir}>
                    <DialogHeader><DialogTitle>{ta('تفاصيل السؤال', 'Question Details')}</DialogTitle></DialogHeader>
                    {viewEntry && <div className="space-y-3 text-sm">
                        <div><p className="font-bold text-gray-500 mb-1">{ta('السؤال:', 'Question:')}</p><p className="text-gray-900 dark:text-white font-medium">{viewEntry.question}</p></div>
                        <div className="flex gap-4 flex-wrap">
                            <div className="flex gap-2"><span className="font-bold text-gray-500">{ta('النوع:', 'Type:')}</span><Badge className="bg-rose-100 text-rose-700">{viewEntry.type}</Badge></div>
                            <div className="flex gap-2"><span className="font-bold text-gray-500">{ta('الصعوبة:', 'Difficulty:')}</span><Badge className={diffColors[viewEntry.difficulty || ''] || 'bg-gray-100 text-gray-700'}>{viewEntry.difficulty || '—'}</Badge></div>
                            <div className="flex gap-2"><span className="font-bold text-gray-500">{ta('الدرجة:', 'Score:')}</span><span>{viewEntry.marks || 1}</span></div>
                        </div>
                        {viewEntry.answer && <div><p className="font-bold text-gray-500 mb-1">{ta('الإجابة النموذجية:', 'Model Answer:')}</p><p className="text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-700 rounded-lg p-3">{viewEntry.answer}</p></div>}
                        {viewEntry.choices && viewEntry.choices.length > 0 && (
                            <div><p className="font-bold text-gray-500 mb-1">{ta('الخيارات:', 'Options:')}</p>
                                <ul className="space-y-1">{viewEntry.choices.map((c, i) => <li key={i} className="flex items-center gap-2 text-gray-700 dark:text-gray-300"><span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 text-xs flex items-center justify-center font-bold">{String.fromCharCode(65 + i)}</span>{c}</li>)}</ul>
                            </div>
                        )}
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
