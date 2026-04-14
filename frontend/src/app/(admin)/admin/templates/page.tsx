'use client';

import { logger } from '@/lib/logger';

import { useEffect, useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { SafeImage } from '@/components/ui/safe-image';
import { api } from '@/lib/api';
import { getServiceCategories } from '@/lib/firestore-service';
import { Button } from '@/components/ui/button';
import { BulkActionBar } from '@/components/admin/BulkActionBar';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import toast from 'react-hot-toast';
import { ta } from '@/i18n/auto-translations';
import {
    FileText,
    Plus,
    Search,
    Edit,
    Trash2,
    Eye,
    EyeOff,
    ExternalLink,
    Package,
    Loader2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    FolderOpen,
    X,
    TrendingUp,
    DollarSign,
    Download,
    Star,
    ToggleLeft,
    ToggleRight,
} from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import type { Template, Section } from '@/types';
import { useTranslation } from '@/i18n/useTranslation';

interface FirestoreCat { id: string; name_ar: string; icon?: string; }

export default function AdminTemplatesPage() {
  const { dir } = useTranslation();
    return (
        <Suspense fallback={<div dir={dir} className="flex items-center justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
            <AdminTemplatesPageInner />
        </Suspense>
    );
}

function AdminTemplatesPageInner() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [categories, setCategories] = useState<FirestoreCat[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
    const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [categoryFilter, setCategoryFilter] = useState<string>('');
    const [sectionFilter, setSectionFilter] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [togglingStatus, setTogglingStatus] = useState<string | null>(null);
    const [togglingFeatured, setTogglingFeatured] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 15;

    const fetchTemplates = async () => {
        try {
            const [templatesRes, cats, sectionsRes] = await Promise.all([
                api.getAdminTemplates(),
                getServiceCategories().catch(() => []),
                api.getSections().catch(() => ({ data: [] })),
            ]);
            setTemplates(templatesRes.data || []);
            setCategories(cats.map((c: any) => ({ id: c.id, name_ar: c.name_ar, icon: c.icon })));
            const sd = sectionsRes.data || sectionsRes || [];
            setSections(Array.isArray(sd) ? sd : []);
        } catch (error) {
            logger.error('Failed to fetch templates:', error);
            toast.error(ta('فشل في جلب القوالب', 'Failed to fetch templates'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    // Read URL params for section_id filter
    const searchParams = useSearchParams();
    useEffect(() => {
        const sectionId = searchParams.get('section_id');
        if (sectionId) setSectionFilter(sectionId);
    }, [searchParams]);

    // ── Stats ──
    const stats = useMemo(() => {
        const active = templates.filter(t => t.is_active).length;
        const totalRevenue = templates.reduce((sum, t) => sum + (Number(t.price) || 0), 0);
        const totalDownloads = templates.reduce((sum, t) => sum + (t.downloads_count || 0), 0);
        const featured = templates.filter(t => t.is_featured).length;
        return { total: templates.length, active, totalRevenue, totalDownloads, featured };
    }, [templates]);

    // Single delete
    const handleDelete = async (id: string) => {
        try {
            const response = await api.deleteTemplate(id);
            if (response.success) {
                toast.success(ta('✅ تم حذف القالب بنجاح', '✅ Template deleted successfully'));
                setTemplates(templates.filter((t) => t.id !== id));
                selectedIds.delete(id);
                setSelectedIds(new Set(selectedIds));
            } else {
                toast.error(`❌ ${response.message || ta('فشل في حذف القالب — قد يكون مرتبطاً بطلبات نشطة', 'Failed to delete — template may have active orders')}`);
            }
        } catch (error: any) {
            const status = error.response?.status;
            if (status === 401) toast.error(ta('🔒 انتهت الجلسة — سجّل دخولك مرة أخرى', '🔒 Session expired'));
            else if (status === 403) toast.error(ta('🚫 ليس لديك صلاحية الحذف', '🚫 No delete permission'));
            else if (status === 404) toast.error(ta('⚠️ القالب غير موجود — ربما تم حذفه مسبقاً', '⚠️ Template not found'));
            else toast.error(`❌ ${error.response?.data?.message || ta('حدث خطأ أثناء الحذف. حاول مرة أخرى', 'Delete failed. Try again')}`);
        } finally {
            setDeleteConfirm(null);
        }
    };

    // Toggle status
    const handleToggleStatus = async (template: Template) => {
        setTogglingStatus(template.id);
        try {
            const response = await api.updateAdminTemplate(template.id, {
                is_active: !template.is_active,
            });
            if (response.success || response.data) {
                setTemplates(prev => prev.map(t =>
                    t.id === template.id ? { ...t, is_active: !t.is_active } : t
                ));
                toast.success(template.is_active
                    ? ta('⏸️ تم إخفاء القالب من المتجر', '⏸️ Template hidden from store')
                    : ta('✅ تم تفعيل القالب — أصبح مرئياً في المتجر', '✅ Template activated — now visible in store'));
            }
        } catch (error: any) {
            const msg = error.response?.data?.message;
            toast.error(`❌ ${msg || ta('فشل تغيير حالة القالب — تحقق من الاتصال وحاول مرة أخرى', 'Failed to toggle status — check connection')}`);
        } finally {
            setTogglingStatus(null);
        }
    };

    // Toggle featured
    const handleToggleFeatured = async (template: Template) => {
        setTogglingFeatured(template.id);
        try {
            const response = await api.toggleTemplateFeatured(template.id);
            if (response.success || response.data) {
                setTemplates(prev => prev.map(t =>
                    t.id === template.id ? { ...t, is_featured: !t.is_featured } : t
                ));
                toast.success(template.is_featured
                    ? ta('تم إلغاء التمييز — لن يظهر في الصفحة الرئيسية', 'Unfeatured — removed from homepage')
                    : ta('⭐ تم تمييز القالب — سيظهر في الصفحة الرئيسية', '⭐ Featured — will appear on homepage'));
            }
        } catch (error: any) {
            const msg = error.response?.data?.message;
            toast.error(`❌ ${msg || ta('فشل تغيير حالة التمييز — حاول مرة أخرى', 'Failed to toggle featured — try again')}`);
        } finally {
            setTogglingFeatured(null);
        }
    };

    // Bulk delete selected
    const handleBulkDelete = async () => {
        setIsBulkDeleting(true);
        const idsToDelete = Array.from(selectedIds);
        let successCount = 0;
        let failCount = 0;

        for (const id of idsToDelete) {
            try {
                const response = await api.deleteTemplate(id);
                if (response.success) successCount++;
                else failCount++;
            } catch {
                failCount++;
            }
        }

        setTemplates(prev => prev.filter(t => !selectedIds.has(t.id)));
        setSelectedIds(new Set());
        setShowBulkDeleteConfirm(false);
        setShowDeleteAllConfirm(false);
        setIsBulkDeleting(false);

        if (successCount > 0) toast.success(ta(`✅ تم حذف ${successCount} قالب بنجاح`, `✅ ${successCount} templates deleted`));
        if (failCount > 0) toast.error(ta(`❌ فشل حذف ${failCount} قالب — قد تكون مرتبطة بطلبات نشطة`, `❌ Failed to delete ${failCount} templates`));
    };

    // Delete all
    const handleDeleteAll = async () => {
        setSelectedIds(new Set(filteredTemplates.map(t => t.id)));
        await handleBulkDelete();
    };

    // Toggle selection
    const toggleSelect = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const selectAll = () => setSelectedIds(new Set(filteredTemplates.map(t => t.id)));
    const deselectAll = () => setSelectedIds(new Set());

    // Filters
    const filteredTemplates = templates.filter((t) => {
        const matchesSearch = t.name_ar.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (t.slug && t.slug.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesCategory = !categoryFilter || (t as any).category_id === categoryFilter;
        const matchesSection = !sectionFilter || (t as any).section_id === sectionFilter;
        const matchesStatus = !statusFilter ||
            (statusFilter === 'active' && t.is_active) ||
            (statusFilter === 'inactive' && !t.is_active) ||
            (statusFilter === 'featured' && t.is_featured) ||
            (statusFilter === 'free' && Number(t.price) <= 0);
        return matchesSearch && matchesCategory && matchesSection && matchesStatus;
    });

    // Pagination
    const totalPages = Math.ceil(filteredTemplates.length / ITEMS_PER_PAGE);
    const paginatedTemplates = filteredTemplates.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const isAllSelected = filteredTemplates.length > 0 && filteredTemplates.every(t => selectedIds.has(t.id));
    const activeFilterCount = [categoryFilter, sectionFilter, statusFilter].filter(Boolean).length;

    // Helpers
    const getCategoryName = (catId: string) => categories.find(c => c.id === catId)?.name_ar || '—';
    const getCategoryIcon = (catId: string) => categories.find(c => c.id === catId)?.icon || '📁';
    const getSectionName = (secId: string) => sections.find(s => s.id === secId)?.name_ar || '—';

    return (
        <div className="space-y-6">
            {/* ═══════════ Header ═══════════ */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                        <FileText className="w-7 h-7 text-primary" />
                        {ta('إدارة القوالب', 'Template Management')}
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {templates.length} قالب في المتجر • {stats.active} نشط
                    </p>
                </div>
                <Link href="/admin/templates/create">
                    <Button className="rounded-xl gap-2 font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow">
                        <Plus className="w-4 h-4" />
                        {ta('إضافة قالب جديد', 'Add New Template')}
                    </Button>
                </Link>
            </div>

            {/* ═══════════ Stats Cards ═══════════ */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <p className="text-2xl font-black text-gray-900 dark:text-white">{stats.total}</p>
                        <p className="text-xs text-gray-500">{ta('إجمالي القوالب', 'Total Templates')}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-2xl font-black text-gray-900 dark:text-white">{stats.active}</p>
                        <p className="text-xs text-gray-500">{ta('قالب نشط', 'Active Template')}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                        <Download className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                        <p className="text-2xl font-black text-gray-900 dark:text-white">{stats.totalDownloads}</p>
                        <p className="text-xs text-gray-500">{ta('إجمالي التحميلات', 'Total Downloads')}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
                        <Star className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div>
                        <p className="text-2xl font-black text-gray-900 dark:text-white">{stats.featured}</p>
                        <p className="text-xs text-gray-500">{ta('مميز', 'Featured')}</p>
                    </div>
                </div>
            </div>

            {/* ═══════════ Search + Filters ═══════════ */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={ta('بحث عن قالب...', 'Search for a template...')}
                        className="w-full ps-4 pe-10 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                {/* Section Filter */}
                <select
                    value={sectionFilter}
                    onChange={(e) => setSectionFilter(e.target.value)}
                    className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none min-w-[140px]"
                >
                    <option value="">{ta('كل الأقسام', 'All Sections')}</option>
                    {sections.map(sec => (
                        <option key={sec.id} value={sec.id}>{sec.icon ? `${sec.icon} ` : '📁 '}{sec.name_ar}</option>
                    ))}
                </select>

                {/* Category Filter */}
                <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none min-w-[140px]"
                >
                    <option value="">{ta('كل الفئات', 'All Categories')}</option>
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.icon ? `${cat.icon} ` : ''}{cat.name_ar}</option>
                    ))}
                </select>

                {/* Status Filter */}
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none min-w-[120px]"
                >
                    <option value="">{ta('كل الحالات', 'All Statuses')}</option>
                    <option value="active">{ta('✅ نشط', '✅ Active')}</option>
                    <option value="inactive">{ta('🚫 معطل', '🚫 Disabled')}</option>
                    <option value="featured">{ta('⭐ مميز', '⭐ Featured')}</option>
                    <option value="free">{ta('🆓 مجاني', '🆓 Free')}</option>
                </select>

                {activeFilterCount > 0 && (
                    <button
                        onClick={() => { setCategoryFilter(''); setSectionFilter(''); setStatusFilter(''); setSearchQuery(''); }}
                        className="text-xs font-bold text-red-500 hover:text-red-600 px-2.5 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 whitespace-nowrap"
                    >
                        مسح الفلاتر ({activeFilterCount})
                    </button>
                )}
            </div>

            {/* Bulk Actions Bar */}
            <BulkActionBar
                selectedCount={selectedIds.size}
                totalCount={filteredTemplates.length}
                onSelectAll={selectAll}
                onDeselectAll={deselectAll}
                onDeleteSelected={() => setShowBulkDeleteConfirm(true)}
                onDeleteAll={() => setShowDeleteAllConfirm(true)}
                isAllSelected={isAllSelected}
                entityName={ta("قالب", "templates")}
            />

            {/* ═══════════ Templates Table ═══════════ */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center text-gray-400">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-primary" />
                        <p>{ta('جاري تحميل القوالب...', 'Loading templates...')}</p>
                    </div>
                ) : filteredTemplates.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        <Package className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                        <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">{ta('لا توجد قوالب', 'No templates')}</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">{ta('ابدأ بإضافة أول قالب لك', 'Start by adding your first template')}</p>
                        <Link href="/admin/templates/create">
                            <Button className="rounded-xl gap-2">
                                <Plus className="w-4 h-4" />
                                {ta('إضافة قالب', 'Add Template')}
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-900/50">
                                <tr className="text-start text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    <th className="px-4 py-4 w-10">
                                        <input
                                            type="checkbox"
                                            checked={isAllSelected}
                                            onChange={isAllSelected ? deselectAll : selectAll}
                                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/20 cursor-pointer"
                                        />
                                    </th>
                                    <th className="px-4 py-4">{ta('القالب', 'Template')}</th>
                                    <th className="px-4 py-4 hidden lg:table-cell">{ta('القسم', 'Section')}</th>
                                    <th className="px-4 py-4 hidden sm:table-cell">{ta('الفئة', 'Category')}</th>
                                    <th className="px-4 py-4">{ta('السعر', 'Price')}</th>
                                    <th className="px-4 py-4 text-center">{ta('مميز', 'Featured')}</th>
                                    <th className="px-4 py-4">{ta('الحالة', 'Status')}</th>
                                    <th className="px-4 py-4 text-center">{ta('إجراءات', 'Actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                                {paginatedTemplates.map((template) => (
                                    <tr
                                        key={template.id}
                                        className={cn(
                                            "hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group",
                                            selectedIds.has(template.id) && "bg-primary/5 dark:bg-primary/10"
                                        )}
                                    >
                                        <td className="py-4 px-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.has(template.id)}
                                                onChange={() => toggleSelect(template.id)}
                                                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/20 cursor-pointer"
                                            />
                                        </td>
                                        <td className="py-4 px-4 max-w-[250px]">
                                            <div className="flex items-center gap-4">
                                                <div className="relative w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden flex-shrink-0">
                                                    <SafeImage
                                                        src={template.thumbnail_url}
                                                        alt={template.name_ar}
                                                        fill
                                                        className="object-cover"
                                                        fallback={
                                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/10">
                                                                <FileText className="w-5 h-5 text-primary/50" />
                                                            </div>
                                                        }
                                                    />
                                                    {template.is_featured && (
                                                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center shadow-sm">
                                                            <Star className="w-3 h-3 text-white fill-white" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate group-hover:text-primary transition-colors" title={template.name_ar}>
                                                        {template.name_ar}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                                                            📄 {((template as any).format || 'PDF').toUpperCase()}
                                                        </span>
                                                        {(template.downloads_count || 0) > 0 && (
                                                            <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                                                                <Download className="w-2.5 h-2.5" />
                                                                {template.downloads_count}
                                                            </span>
                                                        )}
                                                        <span className="text-[10px] text-gray-400 hidden sm:inline truncate max-w-[100px]">{template.slug}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        {/* القسم = Section (MySQL) */}
                                        <td className="py-4 px-4 hidden lg:table-cell">
                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 px-2 py-1 rounded-lg">
                                                <FolderOpen className="w-3 h-3" />
                                                {getSectionName((template as any).section_id)}
                                            </span>
                                        </td>
                                        {/* الفئة = Category (Firestore) */}
                                        <td className="py-4 px-4 hidden sm:table-cell">
                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-300">
                                                <span>{getCategoryIcon((template as any).category_id)}</span>
                                                {getCategoryName((template as any).category_id)}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 whitespace-nowrap">
                                            <div>
                                                {Number(template.price) <= 0 ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                                                        {ta('مجاني', 'Free')}
                                                    </span>
                                                ) : (
                                                    <>
                                                        <span className="font-bold text-sm text-gray-900 dark:text-gray-100">
                                                            {formatPrice(template.discount_price || template.price)}
                                                        </span>
                                                        {template.discount_price && template.discount_price < template.price && (
                                                            <span className="block text-xs text-gray-400 line-through">
                                                                {formatPrice(template.price)}
                                                            </span>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                        {/* مميز */}
                                        <td className="py-4 px-4 text-center">
                                            <button
                                                onClick={() => handleToggleFeatured(template)}
                                                disabled={togglingFeatured === template.id}
                                                className={cn(
                                                    "p-1.5 rounded-lg transition-all hover:scale-110",
                                                    template.is_featured
                                                        ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                                                        : 'text-gray-300 dark:text-gray-600 hover:text-amber-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                                                )}
                                                title={template.is_featured ? ta('إلغاء التمييز', 'Un-feature') : ta('تمييز القالب', 'Feature Template') }
                                            >
                                                {togglingFeatured === template.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Star className={cn("w-4 h-4", template.is_featured && "fill-amber-500")} />
                                                )}
                                            </button>
                                        </td>
                                        <td className="py-4 px-4 whitespace-nowrap">
                                            <button
                                                onClick={() => handleToggleStatus(template)}
                                                disabled={togglingStatus === template.id}
                                                className={cn(
                                                    "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all hover:scale-105",
                                                    template.is_active
                                                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 hover:bg-emerald-100'
                                                        : 'bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-400 hover:bg-red-100'
                                                )}>
                                                {togglingStatus === template.id ? (
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : template.is_active ? (
                                                    <><ToggleRight className="w-3.5 h-3.5" /> {ta('نشط', 'Active')}</>
                                                ) : (
                                                    <><ToggleLeft className="w-3.5 h-3.5" /> {ta('معطل', 'Inactive')}</>
                                                )}
                                            </button>
                                        </td>
                                        <td className="py-4 px-4 whitespace-nowrap">
                                            <div className="flex items-center justify-center gap-1">
                                                <Link
                                                    href={`/marketplace/${template.slug}`}
                                                    target="_blank"
                                                    className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                                                    title={ta("عرض في المتجر", "View in Store")}
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </Link>
                                                <Link
                                                    href={`/admin/templates/${template.id}/edit`}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                    title={ta("تعديل", "Edit")}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Link>
                                                {deleteConfirm === template.id ? (
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => handleDelete(template.id)}
                                                            className="px-2.5 py-1 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors"
                                                        >
                                                            {ta('تأكيد', 'Confirm')}
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteConfirm(null)}
                                                            className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
                                                        >
                                                            {ta('إلغاء', 'Cancel')}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setDeleteConfirm(template.id)}
                                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                        title={ta("حذف", "Delete")}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {!isLoading && filteredTemplates.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        عرض {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredTemplates.length)} من {filteredTemplates.length} قالب
                        {filteredTemplates.length !== templates.length && (
                            <span className="text-gray-400"> (إجمالي {templates.length})</span>
                        )}
                    </div>
                    {totalPages > 1 && (
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                                .map((page, idx, arr) => (
                                    <span key={page} className="contents">
                                        {idx > 0 && arr[idx - 1] !== page - 1 && (
                                            <span className="px-1 text-gray-400 text-xs">…</span>
                                        )}
                                        <button
                                            onClick={() => setCurrentPage(page)}
                                            className={cn(
                                                "w-9 h-9 rounded-lg text-sm font-bold transition-all",
                                                currentPage === page
                                                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                            )}
                                        >
                                            {page}
                                        </button>
                                    </span>
                                ))
                            }
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Bulk Delete Confirmation */}
            <ConfirmDialog
                open={showBulkDeleteConfirm}
                title={`حذف ${selectedIds.size} قالب`}
                message={`هل أنت متأكد من حذف ${selectedIds.size} قالب محدد؟ هذا الإجراء لا يمكن التراجع عنه.`}
                confirmLabel={ta("حذف المحدد", "Delete Selected")}
                variant="danger"
                isLoading={isBulkDeleting}
                onConfirm={handleBulkDelete}
                onCancel={() => setShowBulkDeleteConfirm(false)}
            />

            {/* Delete All Confirmation */}
            <ConfirmDialog
                open={showDeleteAllConfirm}
                title={ta("حذف جميع القوالب", "Delete All Templates")}
                message={`هل أنت متأكد من حذف جميع القوالب (${filteredTemplates.length} قالب)؟ ⚠️ هذا الإجراء خطير ولا يمكن التراجع عنه!`}
                confirmLabel={ta("حذف الكل", "Delete All")}
                variant="danger"
                isLoading={isBulkDeleting}
                onConfirm={handleDeleteAll}
                onCancel={() => setShowDeleteAllConfirm(false)}
            />
        </div>
    );
}
