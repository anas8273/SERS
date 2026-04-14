'use client';

import { useEffect, useState, useMemo } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BulkActionBar } from '@/components/admin/BulkActionBar';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import toast from 'react-hot-toast';
import { ta } from '@/i18n/auto-translations';
import {
    Layers, Plus, Edit, Trash2, Check, X, Eye, EyeOff,
    Search, Loader2, FolderTree, CheckSquare, Square,
    GripVertical, Hash, FileText, ToggleLeft, ToggleRight,
    Palette, Save, ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useTranslation } from '@/i18n/useTranslation';

interface Section {
    id: string;
    name_ar: string;
    slug: string;
    description_ar: string;
    icon: string;
    color: string;
    sort_order: number;
    is_active: boolean;
    categories_count?: number;
    templates_count?: number;
}

const SECTION_ICONS = [
    { emoji: '📄', label: ta('مستندات', 'Documents') },
    { emoji: '📊', label: ta('تحليل', 'Analysis') },
    { emoji: '🏆', label: ta('إنجازات', 'Achievements') },
    { emoji: '📋', label: ta('خطط', 'Plans') },
    { emoji: '🎓', label: ta('تعليم', 'Education') },
    { emoji: '📁', label: ta('مجلد', 'Folder') },
    { emoji: '🎯', label: ta('أهداف', 'Objectives') },
    { emoji: '⭐', label: ta('مميز', 'Featured') },
    { emoji: '📅', label: ta('تقويم', 'Assessment') },
    { emoji: '🤖', label: ta('ذكاء', 'Intelligence') },
    { emoji: '💼', label: ta('عمل', 'Work') },
    { emoji: '📖', label: ta('كتاب', 'Book') },
    { emoji: '🗂️', label: ta('أرشيف', 'Archive') },
    { emoji: '✅', label: ta('تقييم', 'Rating') },
    { emoji: '💡', label: ta('أفكار', 'Ideas') },
    { emoji: '🎨', label: ta('فنون', 'Arts') },
];

const SECTION_COLORS = [
    { label: ta('أزرق', 'Blue'), value: 'blue', class: 'bg-blue-500', ring: 'ring-blue-300' },
    { label: ta('أخضر', 'Green'), value: 'green', class: 'bg-emerald-500', ring: 'ring-emerald-300' },
    { label: ta('بنفسجي', 'Purple'), value: 'purple', class: 'bg-purple-500', ring: 'ring-purple-300' },
    { label: ta('برتقالي', 'Orange'), value: 'orange', class: 'bg-orange-500', ring: 'ring-orange-300' },
    { label: ta('أحمر', 'Red'), value: 'red', class: 'bg-red-500', ring: 'ring-red-300' },
    { label: ta('وردي', 'Pink'), value: 'pink', class: 'bg-pink-500', ring: 'ring-pink-300' },
    { label: ta('سماوي', 'Light Blue'), value: 'cyan', class: 'bg-cyan-500', ring: 'ring-cyan-300' },
    { label: ta('ذهبي', 'Gold'), value: 'amber', class: 'bg-amber-500', ring: 'ring-amber-300' },
    { label: ta('نيلي', 'Indigo'), value: 'indigo', class: 'bg-indigo-500', ring: 'ring-indigo-300' },
    { label: ta('زمردي', 'Emerald'), value: 'teal', class: 'bg-teal-500', ring: 'ring-teal-300' },
];

function getColorClass(value: string) {
    return SECTION_COLORS.find(c => c.value === value)?.class || 'bg-blue-500';
}

// Map English icon names (from older backend data) to emojis
const ICON_NAME_MAP: Record<string, string> = {
    FolderTree: '📁', BookOpen: '📖', FileText: '📄', GraduationCap: '🎓',
    Trophy: '🏆', ClipboardList: '📋', Target: '🎯', Star: '⭐',
    Calendar: '📅', CalendarDays: '📅', Bot: '🤖', Briefcase: '💼',
    Archive: '🗂️', CheckCircle: '✅', Lightbulb: '💡', Palette: '🎨',
    BarChart: '📊', BarChart3: '📊', Layers: '📁', FolderOpen: '📂',
    Users: '👥', Settings: '⚙️', Heart: '❤️', Sparkles: '✨',
};
function resolveIcon(icon: string | undefined | null): string {
    if (!icon) return '📂';
    // Already an emoji (non-ASCII)
    if (/[^\x00-\x7F]/.test(icon)) return icon;
    return ICON_NAME_MAP[icon] || '📂';
}

const DEFAULT_NEW = { name_ar: '', slug: '', description_ar: '', icon: '📁', color: 'blue', is_active: true };

export default function AdminSectionsPage() {
  const { dir } = useTranslation();
    const [sections, setSections] = useState<Section[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Bulk operations
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // CRUD dialogs
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingSection, setEditingSection] = useState<Section | null>(null);
    const [formData, setFormData] = useState(DEFAULT_NEW);
    const [isSaving, setIsSaving] = useState(false);

    // Confirm dialogs
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
    const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    // Drag-and-drop ordering
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [dragOverId, setDragOverId] = useState<string | null>(null);
    const [orderChanged, setOrderChanged] = useState(false);
    const [isSavingOrder, setIsSavingOrder] = useState(false);

    // ===== Fetch =====
    const fetchSections = async () => {
        setIsLoading(true);
        try {
            const res = await api.getAdminSections();
            setSections(res.data || []);
        } catch {
            toast.error(ta('فشل في جلب الأقسام', 'Failed to fetch sections'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchSections(); }, []);

    // ===== Filters =====
    const filteredSections = useMemo(() =>
        sections.filter(s =>
            s.name_ar.includes(searchQuery) ||
            s.slug.includes(searchQuery.toLowerCase()) ||
            s.description_ar?.includes(searchQuery)
        ), [sections, searchQuery]
    );

    // ===== Selection =====
    const toggleSelect = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id); else next.add(id);
        setSelectedIds(next);
    };
    const selectAll = () => setSelectedIds(new Set(filteredSections.map(s => s.id)));
    const deselectAll = () => setSelectedIds(new Set());
    const isAllSelected = filteredSections.length > 0 && filteredSections.every(s => selectedIds.has(s.id));

    // ===== Create =====
    const openCreate = () => {
        setEditingSection(null);
        setFormData({ ...DEFAULT_NEW });
        setShowCreateForm(true);
    };

    // ===== Edit =====
    const openEdit = (section: Section) => {
        setEditingSection(section);
        setFormData({
            name_ar: section.name_ar,
            slug: section.slug,
            description_ar: section.description_ar || '',
            icon: section.icon || '📁',
            color: section.color || 'blue',
            is_active: section.is_active,
        });
        setShowCreateForm(true);
    };

    // ===== Save (create/update) =====
    const handleSave = async () => {
        if (!formData.name_ar.trim()) {
            toast.error(ta('يرجى إدخال اسم القسم', 'Please enter section name'));
            return;
        }
        setIsSaving(true);
        try {
            const slug = formData.slug || formData.name_ar.trim().toLowerCase().replace(/\s+/g, '-');
            const payload = { ...formData, slug };

            if (editingSection) {
                await api.updateSection(editingSection.id, payload);
                toast.success(ta('تم تحديث القسم بنجاح ✅', 'Section updated successfully ✅'));
            } else {
                await api.createSection(payload);
                toast.success(ta('تم إضافة القسم بنجاح 🎉', 'Section added'));
            }
            setShowCreateForm(false);
            setEditingSection(null);
            setFormData(DEFAULT_NEW);
            fetchSections();
        } catch (error: any) {
            toast.error(error.response?.data?.message || ta('حدث خطأ أثناء الحفظ', 'Error saving'));
        } finally {
            setIsSaving(false);
        }
    };

    // ===== Single Delete =====
    const handleDelete = async (id: string) => {
        try {
            await api.deleteSection(id);
            toast.success(ta('تم حذف القسم بنجاح', 'Section deleted'));
            setSections(prev => prev.filter(s => s.id !== id));
            selectedIds.delete(id);
            setSelectedIds(new Set(selectedIds));
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'لا يمكن حذف هذا القسم (قد يحتوي على تصنيفات)');
        } finally {
            setDeleteConfirmId(null);
        }
    };

    // ===== Bulk Delete =====
    const handleBulkDelete = async () => {
        setIsBulkDeleting(true);
        const ids = Array.from(selectedIds);
        let success = 0, fail = 0;
        for (const id of ids) {
            try {
                await api.deleteSection(id);
                success++;
            } catch { fail++; }
        }
        setSections(prev => prev.filter(s => !selectedIds.has(s.id)));
        setSelectedIds(new Set());
        setShowBulkDeleteConfirm(false);
        setShowDeleteAllConfirm(false);
        setIsBulkDeleting(false);
        if (success > 0) toast.success(`تم حذف ${success} قسم بنجاح`);
        if (fail > 0) toast.error(`فشل في حذف ${fail} قسم`);
    };

    const handleDeleteAll = () => {
        setSelectedIds(new Set(filteredSections.map(s => s.id)));
        setShowDeleteAllConfirm(true);
    };

    // ===== Toggle Active =====
    const handleToggleActive = async (section: Section) => {
        try {
            await api.updateSection(section.id, { is_active: !section.is_active });
            toast.success(section.is_active ? ta('تم تعطيل القسم', 'Section deactivated') : ta('تم تفعيل القسم', 'Section activated'));
            fetchSections();
        } catch {
            toast.error(ta('فشل في تحديث حالة القسم', 'Failed to update section status'));
        }
    };

    // ===== Drag-and-Drop Ordering =====
    const handleDragStart = (e: React.DragEvent, id: string) => {
        setDraggedId(id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, id: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (id !== draggedId) setDragOverId(id);
    };

    const handleDrop = (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        if (!draggedId || draggedId === targetId) return;
        setSections(prev => {
            const from = prev.findIndex(s => s.id === draggedId);
            const to = prev.findIndex(s => s.id === targetId);
            if (from === -1 || to === -1) return prev;
            const next = [...prev];
            const [moved] = next.splice(from, 1);
            next.splice(to, 0, moved);
            return next;
        });
        setOrderChanged(true);
        setDraggedId(null);
        setDragOverId(null);
    };

    const handleDragEnd = () => {
        setDraggedId(null);
        setDragOverId(null);
    };

    const handleSaveOrder = async () => {
        setIsSavingOrder(true);
        try {
            await api.reorderSections(sections.map(s => s.id));
            toast.success(ta('تم حفظ ترتيب الأقسام بنجاح ✅', 'Section order saved successfully ✅'));
            setOrderChanged(false);
        } catch {
            toast.error(ta('فشل في حفظ الترتيب', 'Failed to save order'));
        } finally {
            setIsSavingOrder(false);
        }
    };

    // ===== Stats =====
    const activeCount = sections.filter(s => s.is_active).length;
    const inactiveCount = sections.filter(s => !s.is_active).length;
    const totalCategories = sections.reduce((sum, s) => sum + (s.categories_count || 0), 0);
    const totalTemplates = sections.reduce((sum, s) => sum + (s.templates_count || 0), 0);

    return (
        <div className="space-y-6">
            {/* ===== Header ===== */}
            <div className="relative overflow-hidden bg-gradient-to-l from-primary/5 via-indigo-500/5 to-purple-500/5 dark:from-primary/10 dark:via-indigo-500/10 dark:to-purple-500/10 rounded-2xl p-6 border border-gray-100 dark:border-gray-700/50">
                <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -translate-x-10 -translate-y-10" />
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl translate-x-8 translate-y-8" />
                <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                            <span className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-lg shadow-indigo-500/20">
                                <Layers className="w-5 h-5" />
                            </span>
                            {ta('إدارة الأقسام', 'Section Management')}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                            {ta('الأقسام الرئيسية التي تحتوي على تصنيفات وقوالب المتجر', 'Main sections containing store categories and templates')}
                        </p>
                    </div>
                    <Button
                        onClick={openCreate}
                        className="bg-gradient-to-l from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all hover:-translate-y-0.5 rounded-xl gap-2 font-bold"
                    >
                        <Plus className="w-4 h-4" />
                        {ta('قسم جديد', 'New Section')}
                    </Button>
                </div>
            </div>

            {/* ===== Stats Cards ===== */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {[
                    { label: ta('إجمالي الأقسام', 'Total Sections'), value: sections.length, icon: <Layers className="w-5 h-5" />, color: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-500/20' },
                    { label: ta('أقسام نشطة', 'Active Sections'), value: activeCount, icon: <Eye className="w-5 h-5" />, color: 'from-emerald-500 to-green-600', shadow: 'shadow-emerald-500/20' },
                    { label: ta('أقسام معطلة', 'Disabled Sections'), value: inactiveCount, icon: <EyeOff className="w-5 h-5" />, color: 'from-gray-400 to-gray-500', shadow: 'shadow-gray-400/20' },
                    { label: ta('إجمالي التصنيفات', 'Total Categories'), value: totalCategories, icon: <FolderTree className="w-5 h-5" />, color: 'from-purple-500 to-violet-600', shadow: 'shadow-purple-500/20' },
                    { label: ta('إجمالي القوالب', 'Total Templates'), value: totalTemplates, icon: <FileText className="w-5 h-5" />, color: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-500/20' },
                ].map((stat) => (
                    <div key={stat.label} className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 flex items-center gap-4 hover:shadow-lg transition-all hover:-translate-y-0.5">
                        <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center text-white shadow-lg ${stat.shadow} group-hover:scale-110 transition-transform`}>
                            {stat.icon}
                        </div>
                        <div>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">{stat.value}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ===== Search + Bulk Actions ===== */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={ta('بحث في الأقسام...', 'Search sections...')}
                        className="w-full ps-4 pe-10 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
                <Badge variant="secondary" className="text-xs font-bold">
                    {filteredSections.length} قسم
                </Badge>
            </div>

            {/* ===== Bulk Action Bar ===== */}
            <BulkActionBar
                selectedCount={selectedIds.size}
                totalCount={filteredSections.length}
                onSelectAll={selectAll}
                onDeselectAll={deselectAll}
                onDeleteSelected={() => setShowBulkDeleteConfirm(true)}
                onDeleteAll={handleDeleteAll}
                isAllSelected={isAllSelected}
                entityName={ta("قسم", "Section")}
            />

            {/* Save Order Button */}
            {orderChanged && (
                <div className="flex justify-end">
                    <Button
                        onClick={handleSaveOrder}
                        disabled={isSavingOrder}
                        className="rounded-xl gap-2 font-bold bg-gradient-to-l from-emerald-500 to-green-600 hover:opacity-90 shadow-lg shadow-emerald-500/20"
                    >
                        {isSavingOrder ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> {ta('جاري الحفظ...', 'Saving')}</>
                        ) : (
                            <><Save className="w-4 h-4" />{ta('حفظ الترتيب ✅', 'Save Order ✅')}</>
                        )}
                    </Button>
                </div>
            )}

            {/* ===== Table ===== */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
                {isLoading ? (
                    <div className="p-16 text-center">
                        <Loader2 className="w-10 h-10 rounded-full animate-spin mx-auto mb-4 text-primary" />
                        <p className="text-gray-400 font-medium">SERS</p>
                    </div>
                ) : filteredSections.length === 0 ? (
                    <div className="p-16 text-center">
                        <Layers className="w-14 h-14 mx-auto mb-4 text-gray-200 dark:text-gray-700" />
                        <p className="font-bold text-gray-500 dark:text-gray-400 mb-1">{ta('لا توجد أقسام', 'No sections')}</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">{ta('ابدأ بإضافة أول قسم للمتجر', 'Start by adding the first section to the store')}</p>
                        <Button onClick={openCreate} variant="outline" className="rounded-xl gap-2 font-bold">
                            <Plus className="w-4 h-4" /> {ta('إضافة قسم', 'Add Section')}
                        </Button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50/80 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                                <tr className="text-start text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    <th className="px-2 py-3.5 w-8">
                                        <GripVertical className="w-4 h-4 text-gray-300 dark:text-gray-600 mx-auto" />
                                    </th>
                                    <th className="px-4 py-3.5 w-10">
                                        <button
                                            onClick={isAllSelected ? deselectAll : selectAll}
                                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            {isAllSelected ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-gray-400" />}
                                        </button>
                                    </th>
                                    <th className="px-4 py-3.5 w-8">#</th>
                                    <th className="px-4 py-3.5">{ta('القسم', 'Section')}</th>
                                    <th className="px-4 py-3.5 hidden sm:table-cell">{ta('المعرف', 'Identifier')}</th>
                                    <th className="px-4 py-3.5 hidden lg:table-cell">{ta('الوصف', 'Description')}</th>
                                    <th className="px-4 py-3.5 hidden md:table-cell text-center">{ta('التصنيفات', 'Categories')}</th>
                                    <th className="px-4 py-3.5 hidden md:table-cell text-center">{ta('القوالب', 'Templates')}</th>
                                    <th className="px-4 py-3.5 text-center">{ta('الحالة', 'Status')}</th>
                                    <th className="px-4 py-3.5 text-center">{ta('إجراءات', 'Actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                                {filteredSections.map((section, i) => {
                                    const isSelected = selectedIds.has(section.id);
                                    const isDragging = draggedId === section.id;
                                    const isDragOver = dragOverId === section.id;
                                    return (
                                        <tr
                                            key={section.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, section.id)}
                                            onDragOver={(e) => handleDragOver(e, section.id)}
                                            onDrop={(e) => handleDrop(e, section.id)}
                                            onDragEnd={handleDragEnd}
                                            className={cn(
                                                "transition-all group cursor-grab active:cursor-grabbing",
                                                isDragging && "opacity-30 scale-[0.98]",
                                                isDragOver && "border-t-2 border-primary/60 bg-primary/5",
                                                !isDragging && !isDragOver && (
                                                    isSelected
                                                        ? "bg-primary/5 dark:bg-primary/10"
                                                        : "hover:bg-gray-50 dark:hover:bg-gray-700/30"
                                                )
                                            )}
                                        >
                                            {/* Drag Handle */}
                                            <td className="px-2 py-3">
                                                <GripVertical className="w-4 h-4 text-gray-300 dark:text-gray-600 mx-auto group-hover:text-gray-500 transition-colors select-none pointer-events-none" />
                                            </td>
                                            {/* Checkbox */}
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => toggleSelect(section.id)}
                                                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                                >
                                                    {isSelected
                                                        ? <CheckSquare className="w-4 h-4 text-primary" />
                                                        : <Square className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                                                    }
                                                </button>
                                            </td>
                                            {/* Number */}
                                            <td className="px-4 py-3 text-xs text-gray-400 font-mono">{i + 1}</td>
                                            {/* Section info */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg shadow-sm", getColorClass(section.color))}>
                                                        {resolveIcon(section.icon)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm text-gray-900 dark:text-white">{section.name_ar}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            {/* Slug */}
                                            <td className="px-4 py-3 hidden sm:table-cell">
                                                <code className="text-[11px] bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg font-mono text-gray-500 dark:text-gray-400">
                                                    {section.slug}
                                                </code>
                                            </td>
                                            {/* Description */}
                                            <td className="px-4 py-3 hidden lg:table-cell">
                                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 max-w-[200px]">
                                                    {section.description_ar || '—'}
                                                </p>
                                            </td>
                                            {/* Categories count */}
                                            <td className="px-4 py-3 hidden md:table-cell text-center">
                                                <Badge variant="secondary" className="text-[10px] font-bold">
                                                    {section.categories_count || 0}
                                                </Badge>
                                            </td>
                                            {/* Templates count */}
                                            <td className="px-4 py-3 hidden md:table-cell text-center">
                                                <Link
                                                    href={`/admin/templates?section_id=${section.id}`}
                                                    className="inline-flex items-center gap-1 group/link"
                                                >
                                                    <Badge variant="secondary" className="text-[10px] font-bold group-hover/link:bg-primary/10 group-hover/link:text-primary transition-colors">
                                                        {section.templates_count || 0}
                                                    </Badge>
                                                </Link>
                                            </td>
                                            {/* Status */}
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => handleToggleActive(section)}
                                                    className={cn(
                                                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors",
                                                        section.is_active
                                                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 hover:bg-emerald-100"
                                                            : "bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-400 hover:bg-red-100"
                                                    )}
                                                >
                                                    {section.is_active ? <><Eye className="w-3 h-3" /> {ta('فعال', 'Active')}</> : <><EyeOff className="w-3 h-3" /> {ta('معطل', 'Inactive')}</>}
                                                </button>
                                            </td>
                                            {/* Actions */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        onClick={() => openEdit(section)}
                                                        className="p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/5 transition-colors"
                                                        title={ta("تعديل", "Edit")}
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <Link
                                                        href={`/admin/templates?section_id=${section.id}`}
                                                        className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                                        title={ta('عرض القوالب', 'View Templates')}
                                                    >
                                                        <FileText className="w-4 h-4" />
                                                    </Link>
                                                    <button
                                                        onClick={() => setDeleteConfirmId(section.id)}
                                                        className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                        title={ta("حذف", "Delete")}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ===== Create/Edit Modal ===== */}
            {showCreateForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-100 dark:border-gray-700 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 p-5 rounded-t-2xl">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                                    {editingSection ? (
                                        <><Edit className="w-5 h-5 text-primary" /> {ta('تعديل القسم', 'Edit Section')}</>
                                    ) : (
                                        <><Plus className="w-5 h-5 text-primary" /> {ta('قسم جديد', 'New Section')}</>
                                    )}
                                </h2>
                                <button
                                    onClick={() => { setShowCreateForm(false); setEditingSection(null); }}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-5">
                            {/* Name */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                    <FileText className="w-3.5 h-3.5" /> {ta('اسم القسم *', 'Section Name *')}
                                </label>
                                <input
                                    value={formData.name_ar}
                                    onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                                    placeholder={ta('مثال: ملفات إنجاز', 'Example: Achievement files')}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                />
                            </div>

                            {/* Slug */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                    <Hash className="w-3.5 h-3.5" /> {ta('المعرف (Slug)', 'Slug (Identifier)')}
                                </label>
                                <input
                                    value={formData.slug}
                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                    placeholder={ta('يُولّد تلقائياً من الاسم', 'Auto-generated from name')}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-mono"
                                    dir="ltr"
                                />
                            </div>

                            {/* Description */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-600 dark:text-gray-400">{ta('الوصف', 'Description')}</label>
                                <textarea
                                    value={formData.description_ar}
                                    onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                                    placeholder={ta('وصف مختصر للقسم...', 'Short section description...')}
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
                                />
                            </div>

                            {/* Icon Picker */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                    <Palette className="w-3.5 h-3.5" /> {ta('الأيقونة', 'Icon')}
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {SECTION_ICONS.map((icon) => (
                                        <button
                                            key={icon.emoji}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, icon: icon.emoji })}
                                            className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all border-2",
                                                formData.icon === icon.emoji
                                                    ? "border-primary bg-primary/10 scale-110 shadow-md"
                                                    : "border-gray-100 dark:border-gray-700 hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-gray-700"
                                            )}
                                            title={icon.label}
                                        >
                                            {icon.emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Color Picker */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                    <Palette className="w-3.5 h-3.5" /> {ta('لون القسم', 'Section Color')}
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {SECTION_COLORS.map((c) => (
                                        <button
                                            key={c.value}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, color: c.value })}
                                            className={cn(
                                                "w-9 h-9 rounded-xl transition-all",
                                                c.class,
                                                formData.color === c.value ? "ring-2 ring-offset-2 ring-primary scale-110" : "opacity-60 hover:opacity-100"
                                            )}
                                            title={c.label}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Status Toggle */}
                            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700">
                                <div className="flex items-center gap-2">
                                    {formData.is_active
                                        ? <ToggleRight className="w-5 h-5 text-emerald-500" />
                                        : <ToggleLeft className="w-5 h-5 text-gray-400" />
                                    }
                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                        {formData.is_active ? ta('القسم مفعل', 'Section enabled') : ta('القسم معطل', 'Section disabled') }
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                                    className={cn(
                                        "w-11 h-6 rounded-full transition-colors relative",
                                        formData.is_active ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"
                                    )}
                                >
                                    <span className={cn(
                                        "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform",
                                        formData.is_active ? "right-0.5" : "right-[22px]"
                                    )} />
                                </button>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 p-5 rounded-b-2xl flex items-center justify-end gap-3">
                            <Button
                                onClick={() => { setShowCreateForm(false); setEditingSection(null); }}
                                variant="ghost"
                                className="rounded-xl font-bold"
                            >
                                {ta('إلغاء', 'Cancel')}
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={isSaving || !formData.name_ar.trim()}
                                className="bg-gradient-to-l from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl gap-2 font-bold shadow-lg shadow-indigo-500/20 min-w-[120px]"
                            >
                                {isSaving ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> {ta('جاري الحفظ...', 'Saving')}</>
                                ) : (
                                    <><Save className="w-4 h-4" /> {editingSection ? ta('تحديث', 'Refresh') : ta('إضافة', 'Add') }</>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== Confirm Dialogs ===== */}
            <ConfirmDialog
                open={!!deleteConfirmId}
                title={ta("حذف القسم", "Delete Section")}
                message="هل أنت متأكد من حذف هذا القسم؟ سيتم حذف القسم نهائياً ولا يمكن التراجع."
                confirmLabel={ta("نعم، احذف", "Yes, Delete")}
                onConfirm={() => deleteConfirmId && handleDelete(deleteConfirmId)}
                onCancel={() => setDeleteConfirmId(null)}
            />
            <ConfirmDialog
                open={showBulkDeleteConfirm}
                title={ta('حذف الأقسام المحددة', 'Delete Selected Sections')}
                message={`سيتم حذف ${selectedIds.size} قسم نهائياً. هل أنت متأكد؟`}
                confirmLabel={ta('نعم، احذف الكل', 'Yes, Delete All')}
                isLoading={isBulkDeleting}
                onConfirm={handleBulkDelete}
                onCancel={() => setShowBulkDeleteConfirm(false)}
            />
            <ConfirmDialog
                open={showDeleteAllConfirm}
                title={ta('⚠️ حذف جميع الأقسام', '⚠️ Delete All Sections')}
                message={`تحذير: سيتم حذف جميع الأقسام (${filteredSections.length} قسم) نهائياً. هذا الإجراء لا يمكن التراجع عنه!`}
                confirmLabel={ta('نعم، احذف الكل', 'Yes, Delete All')}
                isLoading={isBulkDeleting}
                onConfirm={handleBulkDelete}
                onCancel={() => { setShowDeleteAllConfirm(false); deselectAll(); }}
            />
        </div>
    );
}
