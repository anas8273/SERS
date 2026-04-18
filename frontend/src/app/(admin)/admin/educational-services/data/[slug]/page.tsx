'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { ta } from '@/i18n/auto-translations';
import { useTranslation } from '@/i18n/useTranslation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import toast from 'react-hot-toast';
import { DEFAULT_SERVICES } from '@/lib/default-services';
import {
    ArrowRight, Database, Trash2, Edit, Eye, Search, X, RefreshCw,
    Download, Calendar, User, ChevronDown, ChevronUp, FileText,
    ArrowLeft, ExternalLink, BarChart3,
} from 'lucide-react';

interface ServiceRecord {
    id: string;
    title?: string;
    description?: string;
    status?: string;
    user_id?: string;
    user_name?: string;
    created_at?: string;
    updated_at?: string;
    [key: string]: any;
}

export default function AdminServiceDataPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params?.slug as string;
    const { dir, locale } = useTranslation();
    const isAr = locale === 'ar';

    const serviceDef = DEFAULT_SERVICES.find(s => s.slug === slug);
    const serviceName = isAr ? (serviceDef?.name_ar || slug) : (serviceDef?.name_en || slug);

    const [records, setRecords] = useState<ServiceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedRecord, setExpandedRecord] = useState<string | null>(null);
    const [editingRecord, setEditingRecord] = useState<ServiceRecord | null>(null);
    const [editData, setEditData] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [meta, setMeta] = useState({ total: 0, current_page: 1, last_page: 1 });
    const [page, setPage] = useState(1);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const res: any = await api.get(`/admin/educational-services/${slug}?page=${page}&per_page=20`);
            setRecords(res?.data || []);
            setMeta(res?.meta || { total: res?.data?.length || 0, current_page: 1, last_page: 1 });
        } catch (err) {
            console.error(err);
            toast.error(ta('خطأ في تحميل البيانات', 'Error loading data'));
        } finally {
            setLoading(false);
        }
    }, [slug, page]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleDelete = async (id: string) => {
        if (!confirm(ta('هل أنت متأكد من حذف هذا السجل؟', 'Delete this record?'))) return;
        try {
            await api.delete(`/admin/educational-services/${slug}/${id}`);
            toast.success(ta('تم الحذف ✅', 'Deleted ✅'));
            loadData();
        } catch {
            toast.error(ta('خطأ في الحذف', 'Delete error'));
        }
    };

    const handleSaveEdit = async () => {
        if (!editingRecord) return;
        setSaving(true);
        try {
            await api.put(`/admin/educational-services/${slug}/${editingRecord.id}`, editData);
            toast.success(ta('تم التحديث ✅', 'Updated ✅'));
            setEditingRecord(null);
            loadData();
        } catch {
            toast.error(ta('خطأ في التحديث', 'Update error'));
        } finally {
            setSaving(false);
        }
    };

    const startEdit = (record: ServiceRecord) => {
        setEditingRecord(record);
        const data: Record<string, string> = {};
        Object.entries(record).forEach(([k, v]) => {
            if (!['id', 'user_id', 'user_name', 'created_at', 'updated_at', 'deleted_at'].includes(k) && typeof v === 'string') {
                data[k] = v;
            }
        });
        setEditData(data);
    };

    const filtered = records.filter(r => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (r.title?.toLowerCase().includes(q) || r.user_name?.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q) || JSON.stringify(r).toLowerCase().includes(q));
    });

    const formatDate = (d?: string) => {
        if (!d) return '—';
        try { return new Date(d).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' }); } catch { return d; }
    };

    const renderFieldValue = (key: string, value: any): string => {
        if (value === null || value === undefined) return '—';
        if (typeof value === 'object') return JSON.stringify(value, null, 2);
        return String(value);
    };

    const SKIP_KEYS = new Set(['id', 'user_id', 'created_at', 'updated_at', 'deleted_at', 'user_name']);

    return (
        <div className="space-y-6" dir={dir}>
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden bg-gradient-to-l from-blue-500/5 via-indigo-500/5 to-violet-500/5 dark:from-blue-500/10 dark:via-indigo-500/10 dark:to-violet-500/10 rounded-2xl p-6 border border-gray-100 dark:border-gray-700/50">
                <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -translate-x-10 -translate-y-10 pointer-events-none" />
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.push('/admin/educational-services')}
                            className="p-2 rounded-xl bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-600 transition-colors">
                            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400 rtl:rotate-180" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                                <span className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl text-white shadow-lg shadow-blue-500/20">
                                    <Database className="w-6 h-6" />
                                </span>
                                {ta('بيانات', 'Data')}: {serviceName}
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {ta('عرض وإدارة جميع سجلات المستخدمين لهذه الخدمة', 'View and manage all user records for this service')}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm px-3 py-1">
                            <BarChart3 className="w-4 h-4 me-1" /> {meta.total} {ta('سجل', 'records')}
                        </Badge>
                        <Button size="sm" variant="outline" onClick={loadData} disabled={loading}>
                            <RefreshCw className={`w-4 h-4 me-1.5 ${loading ? 'animate-spin' : ''}`} />
                            {ta('تحديث', 'Refresh')}
                        </Button>
                        <a href={serviceDef?.route || '#'} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="outline">
                                <ExternalLink className="w-4 h-4 me-1.5" />
                                {ta('معاينة الصفحة', 'Preview Page')}
                            </Button>
                        </a>
                    </div>
                </div>
            </motion.div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                    placeholder={ta('بحث في السجلات...', 'Search records...')}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="ps-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                />
                {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute end-3 top-1/2 -translate-y-1/2">
                        <X className="w-4 h-4 text-gray-400" />
                    </button>
                )}
            </div>

            {/* Edit Modal */}
            <AnimatePresence>
                {editingRecord && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setEditingRecord(null)}>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6"
                            onClick={e => e.stopPropagation()}>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <Edit className="w-5 h-5 text-blue-600" />
                                {ta('تعديل السجل', 'Edit Record')}
                            </h3>
                            <div className="space-y-3">
                                {Object.entries(editData).map(([key, value]) => (
                                    <div key={key}>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 capitalize">
                                            {key.replace(/_/g, ' ')}
                                        </label>
                                        {value.length > 100 ? (
                                            <textarea
                                                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm resize-y min-h-[80px]"
                                                value={value}
                                                onChange={e => setEditData({ ...editData, [key]: e.target.value })}
                                            />
                                        ) : (
                                            <Input
                                                value={value}
                                                onChange={e => setEditData({ ...editData, [key]: e.target.value })}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <Button variant="outline" onClick={() => setEditingRecord(null)}>
                                    {ta('إلغاء', 'Cancel')}
                                </Button>
                                <Button onClick={handleSaveEdit} disabled={saving}
                                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                                    {saving ? ta('جاري الحفظ...', 'Saving...') : ta('حفظ التعديلات', 'Save Changes')}
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Records List */}
            {loading ? (
                <div className="flex justify-center py-16">
                    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : filtered.length === 0 ? (
                <EmptyState
                    title={ta('لا توجد سجلات', 'No records found')}
                    description={ta('لم يقم أي مستخدم بإنشاء سجلات لهذه الخدمة بعد', 'No users have created records for this service yet')}
                    icon="📋"
                />
            ) : (
                <div className="space-y-3">
                    {filtered.map((record, idx) => {
                        const isExpanded = expandedRecord === record.id;
                        const displayFields = Object.entries(record).filter(([k]) => !SKIP_KEYS.has(k));
                        return (
                            <motion.div
                                key={record.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.03 }}
                                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
                            >
                                {/* Record Header */}
                                <div className="p-4 flex items-center gap-3 cursor-pointer" onClick={() => setExpandedRecord(isExpanded ? null : record.id)}>
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md text-sm font-bold">
                                        {idx + 1 + (page - 1) * 20}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                            {record.title || record.name || ta('بدون عنوان', 'Untitled')}
                                        </h4>
                                        <div className="flex items-center gap-3 text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                                            <span className="flex items-center gap-1">
                                                <User className="w-3 h-3" /> {record.user_name || ta('مستخدم', 'User')}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" /> {formatDate(record.created_at)}
                                            </span>
                                            {record.status && (
                                                <Badge variant="outline" className="text-[10px] h-4">{record.status}</Badge>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <button onClick={e => { e.stopPropagation(); startEdit(record); }}
                                            className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-400 hover:text-blue-600 transition-colors" title={ta('تعديل', 'Edit')}>
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button onClick={e => { e.stopPropagation(); handleDelete(record.id); }}
                                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 transition-colors" title={ta('حذف', 'Delete')}>
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="border-t border-gray-100 dark:border-gray-700"
                                        >
                                            <div className="p-4 bg-gray-50/50 dark:bg-gray-900/30 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {displayFields.map(([key, value]) => (
                                                    <div key={key} className={`${String(value).length > 100 ? 'sm:col-span-2' : ''}`}>
                                                        <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">
                                                            {key.replace(/_/g, ' ')}
                                                        </span>
                                                        <span className="block text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                                                            {renderFieldValue(key, value)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            {meta.last_page > 1 && (
                <div className="flex justify-center items-center gap-3 pt-4">
                    <Button
                        size="sm" variant="outline"
                        disabled={page <= 1}
                        onClick={() => setPage(p => p - 1)}
                    >
                        {ta('السابق', 'Previous')}
                    </Button>
                    <span className="text-sm font-bold text-gray-600 dark:text-gray-400">
                        {page} / {meta.last_page}
                    </span>
                    <Button
                        size="sm" variant="outline"
                        disabled={page >= meta.last_page}
                        onClick={() => setPage(p => p + 1)}
                    >
                        {ta('التالي', 'Next')}
                    </Button>
                </div>
            )}
        </div>
    );
}
