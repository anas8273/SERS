'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { ta } from '@/i18n/auto-translations';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import {
    Plus, Trash2, Edit, Eye, EyeOff, GripVertical,
    Search, ArrowRight, Loader2, Database, Sparkles,
    ClipboardList, ClipboardCheck, GraduationCap, BarChart3,
    CalendarDays, Award, Users, TrendingUp, PieChart, BookOpen,
    Layers, Brain, Bot, FileText, Settings, Star, FolderArchive,
    Trophy, FileSpreadsheet, Lightbulb, ScrollText, Shield,
    FolderOpen, Target, FileQuestion, Zap, RefreshCw, ExternalLink,
} from 'lucide-react';
import type { StaticTool } from '@/types';
import {
    getAllStaticTools, createStaticTool, saveStaticTool,
    deleteStaticTool, reorderStaticTools, seedStaticToolsIfEmpty,
} from '@/lib/firestore-static-tools';
import { DEFAULT_STATIC_TOOLS } from '@/lib/static-tools-seed';

// ── Icon Map ──────────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, any> = {
    ClipboardList, ClipboardCheck, GraduationCap, BarChart3, CalendarDays,
    Award, Users, Sparkles, TrendingUp, PieChart, FileText, BookOpen,
    Layers, Settings, Brain, Target, FolderArchive, Trophy, Bot,
    FileQuestion, Shield, Database, Star, FolderOpen, FileSpreadsheet,
    Lightbulb, ScrollText, Zap,
};
const AVAILABLE_ICONS = Object.keys(ICON_MAP);

const GRADIENTS = [
    'from-blue-500 to-blue-600', 'from-blue-600 to-blue-700',
    'from-amber-500 to-orange-500', 'from-amber-600 to-orange-600',
    'from-green-500 to-emerald-500', 'from-emerald-600 to-green-700',
    'from-teal-500 to-cyan-500', 'from-teal-600 to-cyan-700',
    'from-purple-500 to-violet-500', 'from-purple-600 to-violet-700',
    'from-rose-500 to-pink-500', 'from-pink-600 to-rose-700',
    'from-red-500 to-rose-500', 'from-sky-500 to-blue-500',
    'from-sky-600 to-blue-700', 'from-yellow-500 to-amber-600',
    'from-cyan-600 to-teal-700', 'from-lime-600 to-green-700',
    'from-slate-600 to-gray-700', 'from-indigo-600 to-blue-700',
    'from-orange-500 to-red-600', 'from-fuchsia-600 to-pink-600',
    'from-violet-600 to-purple-700', 'from-green-600 to-emerald-700',
    'from-blue-700 to-indigo-800',
];

// ── Default Form for new tool ─────────────────────────────────────────────────
const EMPTY_TOOL: Omit<StaticTool, 'id'> = {
    title_ar: '',
    title_en: '',
    description_ar: '',
    icon: 'FileText',
    gradient: 'from-blue-500 to-blue-600',
    href: '/',
    sort_order: 1,
    is_active: true,
    forms: [],
};

// =============================================================================
export default function AdminStaticToolsPage() {
    const router = useRouter();

    const [tools, setTools]             = useState<StaticTool[]>([]);
    const [loading, setLoading]         = useState(true);
    const [seeding, setSeeding]         = useState(false);
    const [saving, setSaving]           = useState(false);
    const [search, setSearch]           = useState('');
    const [dragging, setDragging]       = useState(false);

    // Form modal
    const [showForm, setShowForm]       = useState(false);
    const [editingTool, setEditingTool] = useState<StaticTool | null>(null);
    const [formData, setFormData]       = useState<Omit<StaticTool,'id'>>(EMPTY_TOOL);

    // Confirm delete
    const [deleteId, setDeleteId]       = useState<string | null>(null);
    const [deleting, setDeleting]       = useState(false);

    // ── Load ──────────────────────────────────────────────────────────────────
    const loadTools = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getAllStaticTools();
            setTools(data);
        } catch {
            toast.error(ta('خطأ في تحميل الأدوات', 'Error loading tools'));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadTools(); }, [loadTools]);

    // ── Seed ──────────────────────────────────────────────────────────────────
    const handleSeed = async () => {
        setSeeding(true);
        try {
            const result = await seedStaticToolsIfEmpty(DEFAULT_STATIC_TOOLS);
            if (result.seeded) {
                toast.success(ta(`تم تهيئة ${result.count} أداة بنجاح ✅`, `${result.count} tools seeded ✅`));
                await loadTools();
            } else {
                toast.success(ta(`يوجد ${result.count} أداة بالفعل — لم يتم التهيئة`, `${result.count} tools already exist`));
            }
        } catch {
            toast.error(ta('خطأ في التهيئة', 'Seeding error'));
        } finally {
            setSeeding(false);
        }
    };

    // ── Toggle active ─────────────────────────────────────────────────────────
    const toggleActive = async (tool: StaticTool) => {
        try {
            await saveStaticTool(tool.id, { is_active: !tool.is_active });
            setTools(prev => prev.map(t => t.id === tool.id ? { ...t, is_active: !t.is_active } : t));
            toast.success(tool.is_active ? ta('تم الإخفاء', 'Hidden') : ta('تم الإظهار', 'Shown'));
        } catch {
            toast.error(ta('حدث خطأ', 'Error'));
        }
    };

    // ── Drag reorder ──────────────────────────────────────────────────────────
    const handleReorder = async (newOrder: StaticTool[]) => {
        setTools(newOrder);
        try {
            await reorderStaticTools(newOrder.map(t => t.id));
        } catch {
            toast.error(ta('خطأ في إعادة الترتيب', 'Reorder error'));
        }
    };

    // ── Modal helpers ─────────────────────────────────────────────────────────
    const openAdd = () => {
        setEditingTool(null);
        setFormData({ ...EMPTY_TOOL, sort_order: tools.length + 1 });
        setShowForm(true);
    };

    const openEdit = (tool: StaticTool) => {
        setEditingTool(tool);
        setFormData({
            title_ar: tool.title_ar,
            title_en: tool.title_en || '',
            description_ar: tool.description_ar || '',
            icon: tool.icon,
            gradient: tool.gradient,
            href: tool.href,
            sort_order: tool.sort_order,
            is_active: tool.is_active,
            forms: tool.forms || [],
        });
        setShowForm(true);
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingTool(null);
        setFormData(EMPTY_TOOL);
    };

    // ── Submit tool (add/edit) ────────────────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title_ar.trim()) {
            toast.error(ta('اسم الأداة مطلوب', 'Tool name is required'));
            return;
        }
        setSaving(true);
        try {
            if (editingTool) {
                await saveStaticTool(editingTool.id, formData);
                toast.success(ta('تم تحديث الأداة ✅', 'Tool updated ✅'));
            } else {
                await createStaticTool({ ...formData, forms: [] });
                toast.success(ta('تم إضافة الأداة ✅', 'Tool added ✅'));
            }
            resetForm();
            await loadTools();
        } catch {
            toast.error(ta('حدث خطأ في الحفظ', 'Save error'));
        } finally {
            setSaving(false);
        }
    };

    // ── Delete ────────────────────────────────────────────────────────────────
    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        try {
            await deleteStaticTool(deleteId);
            toast.success(ta('تم الحذف بنجاح', 'Deleted successfully'));
            setDeleteId(null);
            setTools(prev => prev.filter(t => t.id !== deleteId));
        } catch {
            toast.error(ta('خطأ في الحذف', 'Delete error'));
        } finally {
            setDeleting(false);
        }
    };

    // ── Filtered ──────────────────────────────────────────────────────────────
    const filtered = tools.filter(t =>
        !search || t.title_ar.includes(search) || (t.description_ar || '').includes(search)
    );

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6">

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link href="/admin/educational-services"
                        className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <ArrowRight className="w-5 h-5 text-gray-400" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white">
                            {ta('إدارة الأدوات التعليمية', 'Manage Educational Tools')}
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            {ta(`${tools.length} أداة — اسحب لإعادة الترتيب`, `${tools.length} tools — drag to reorder`)}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleSeed} disabled={seeding} variant="outline"
                        className="gap-2 border-dashed text-gray-600 dark:text-gray-400">
                        {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                        {ta('تهيئة البيانات', 'Seed Data')}
                    </Button>
                    <Button onClick={loadTools} disabled={loading} variant="outline" size="icon" title={ta('تحديث', 'Refresh')}>
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button onClick={openAdd} className="gap-2 bg-primary hover:bg-primary/90 text-white">
                        <Plus className="w-4 h-4" />
                        {ta('إضافة أداة', 'Add Tool')}
                    </Button>
                </div>
            </div>

            {/* ── Search ── */}
            <div className="relative max-w-sm">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder={ta('بحث عن أداة...', 'Search tools...')}
                    className="pr-10"
                />
            </div>

            {/* ── Tools List ── */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20">
                    <div className="w-20 h-20 mx-auto bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-4">
                        <Sparkles className="w-10 h-10 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                        {ta('لا توجد أدوات', 'No tools found')}
                    </h3>
                    <p className="text-gray-500 text-sm mb-6">
                        {ta('أضف أداة جديدة أو استورد البيانات الافتراضية', 'Add a new tool or seed default data')}
                    </p>
                    <div className="flex items-center justify-center gap-3">
                        <Button onClick={handleSeed} disabled={seeding} variant="outline" className="gap-2">
                            <Database className="w-4 h-4" />
                            {ta('تهيئة البيانات الافتراضية', 'Seed Default Data')}
                        </Button>
                        <Button onClick={openAdd} className="gap-2 bg-primary text-white">
                            <Plus className="w-4 h-4" />
                            {ta('إضافة أداة', 'Add Tool')}
                        </Button>
                    </div>
                </div>
            ) : (
                <Reorder.Group
                    axis="y"
                    values={filtered}
                    onReorder={handleReorder}
                    className="space-y-3"
                >
                    {filtered.map((tool) => {
                        const IconComp = ICON_MAP[tool.icon] || FileText;
                        return (
                            <Reorder.Item
                                key={tool.id}
                                value={tool}
                                onDragStart={() => setDragging(true)}
                                onDragEnd={() => setDragging(false)}
                            >
                                <motion.div
                                    layout
                                    className={`group bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-4 hover:shadow-md transition-all ${
                                        dragging ? 'shadow-xl ring-2 ring-primary/20' : ''
                                    } ${!tool.is_active ? 'opacity-50' : ''}`}
                                >
                                    {/* Drag Handle */}
                                    <div className="cursor-grab active:cursor-grabbing text-gray-300 dark:text-gray-600 hover:text-gray-400 flex-shrink-0">
                                        <GripVertical className="w-5 h-5" />
                                    </div>

                                    {/* Sort order badge */}
                                    <span className="text-xs font-mono text-gray-400 w-6 text-center flex-shrink-0">
                                        {tool.sort_order}
                                    </span>

                                    {/* Icon */}
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center text-white shadow-lg flex-shrink-0`}>
                                        <IconComp className="w-6 h-6" />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="font-black text-gray-900 dark:text-white truncate">
                                                {tool.title_ar}
                                            </h3>
                                            {!tool.is_active && (
                                                <Badge variant="outline" className="border-red-300 text-red-600 text-[10px]">
                                                    {ta('مخفي', 'Hidden')}
                                                </Badge>
                                            )}
                                            <Badge variant="outline" className="text-[10px] border-blue-200 text-blue-600 dark:border-blue-700 dark:text-blue-400">
                                                {tool.forms?.length || 0} {ta('نماذج', 'forms')}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                                            {tool.description_ar}
                                        </p>
                                        <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400">
                                            <span dir="ltr">{tool.href}</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                        {/* View public page */}
                                        <a href={tool.href} target="_blank" rel="noopener noreferrer"
                                            className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"
                                            title={ta('عرض الصفحة العامة', 'View public page')}>
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                        {/* Toggle visibility */}
                                        <button onClick={() => toggleActive(tool)}
                                            className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"
                                            title={tool.is_active ? ta('إخفاء', 'Hide') : ta('إظهار', 'Show')}>
                                            {tool.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                        </button>
                                        {/* Edit (basic info) */}
                                        <button onClick={() => openEdit(tool)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl"
                                            title={ta('تعديل البطاقة', 'Edit card')}>
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        {/* Manage forms → detail page */}
                                        <button onClick={() => router.push(`/admin/educational-services/static-tools/${tool.id}`)}
                                            className="p-2 text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-xl"
                                            title={ta('إدارة النماذج والحقول', 'Manage forms & fields')}>
                                            <Settings className="w-4 h-4" />
                                        </button>
                                        {/* Delete */}
                                        <button onClick={() => setDeleteId(tool.id)}
                                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"
                                            title={ta('حذف', 'Delete')}>
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            </Reorder.Item>
                        );
                    })}
                </Reorder.Group>
            )}

            {/* ── Add/Edit Modal ── */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
                        onClick={e => { if (e.target === e.currentTarget) resetForm(); }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl border dark:border-gray-700 max-h-[90vh] overflow-y-auto"
                        >
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-5">
                                {editingTool
                                    ? ta('✏️ تعديل بيانات الأداة', '✏️ Edit Tool')
                                    : ta('➕ إضافة أداة جديدة', '➕ Add New Tool')}
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Title AR */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                                        {ta('اسم الأداة (عربي)', 'Tool Name (Arabic)')} <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        value={formData.title_ar}
                                        onChange={e => setFormData({ ...formData, title_ar: e.target.value })}
                                        placeholder={ta('مثال: نماذج التوثيق', 'e.g. Documentation Forms')}
                                        required
                                        className="dark:bg-gray-700 dark:border-gray-600"
                                    />
                                </div>

                                {/* Title EN */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                                        {ta('اسم الأداة (إنجليزي)', 'Tool Name (English)')}
                                    </label>
                                    <Input
                                        value={formData.title_en || ''}
                                        onChange={e => setFormData({ ...formData, title_en: e.target.value })}
                                        placeholder="e.g. Documentation Forms"
                                        dir="ltr"
                                        className="dark:bg-gray-700 dark:border-gray-600"
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                                        {ta('الوصف', 'Description')}
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={formData.description_ar || ''}
                                        onChange={e => setFormData({ ...formData, description_ar: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-xl text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                                    />
                                </div>

                                {/* Route + Order */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                                            {ta('مسار الصفحة (href)', 'Page Route (href)')} <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            value={formData.href}
                                            onChange={e => setFormData({ ...formData, href: e.target.value })}
                                            placeholder="/documentation-forms"
                                            dir="ltr"
                                            required
                                            className="dark:bg-gray-700 dark:border-gray-600"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                                            {ta('الترتيب', 'Order')}
                                        </label>
                                        <Input
                                            type="number" min="1"
                                            value={formData.sort_order}
                                            onChange={e => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 1 })}
                                            className="dark:bg-gray-700 dark:border-gray-600"
                                        />
                                    </div>
                                </div>

                                {/* Icon */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                        {ta('الأيقونة', 'Icon')}
                                    </label>
                                    <div className="grid grid-cols-8 gap-2 max-h-32 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-900/50 rounded-xl border dark:border-gray-700">
                                        {AVAILABLE_ICONS.map(iconName => {
                                            const IC = ICON_MAP[iconName];
                                            return (
                                                <button key={iconName} type="button"
                                                    onClick={() => setFormData({ ...formData, icon: iconName })}
                                                    title={iconName}
                                                    className={`p-2 rounded-lg flex items-center justify-center transition-all ${
                                                        formData.icon === iconName
                                                            ? 'bg-primary text-white shadow-lg ring-2 ring-primary ring-offset-2'
                                                            : 'bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                                                    }`}>
                                                    <IC className="w-4 h-4" />
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Gradient */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                        {ta('اللون (التدرج)', 'Color Gradient')}
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {GRADIENTS.map(g => (
                                            <button key={g} type="button"
                                                onClick={() => setFormData({ ...formData, gradient: g })}
                                                className={`h-8 w-12 rounded-lg bg-gradient-to-br ${g} transition-all ${
                                                    formData.gradient === g ? 'ring-2 ring-primary ring-offset-2 scale-110' : 'hover:scale-105'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Preview */}
                                <div className="rounded-xl overflow-hidden border dark:border-gray-700">
                                    <div className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-900/50 px-3 py-1.5 border-b dark:border-gray-700">
                                        {ta('معاينة البطاقة', 'Card Preview')}
                                    </div>
                                    <div className="p-4 flex items-center gap-3 bg-white dark:bg-gray-800">
                                        {(() => {
                                            const IC = ICON_MAP[formData.icon] || FileText;
                                            return (
                                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${formData.gradient} flex items-center justify-center text-white shadow-lg`}>
                                                    <IC className="w-6 h-6" />
                                                </div>
                                            );
                                        })()}
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white text-sm">{formData.title_ar || ta('اسم الأداة', 'Tool Name')}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{formData.description_ar || ta('وصف الأداة', 'Tool description')}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Active toggle */}
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <div
                                        onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                                        className={`relative w-11 h-6 rounded-full transition-colors ${formData.is_active ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
                                    >
                                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${formData.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {formData.is_active ? ta('الأداة نشطة (مرئية في الصفحات)', 'Active (visible on public pages)') : ta('الأداة مخفية', 'Hidden')}
                                    </span>
                                </label>

                                {/* Buttons */}
                                <div className="flex gap-3 pt-2">
                                    <Button type="submit" disabled={saving} className="flex-1 bg-primary hover:bg-primary/90 text-white gap-2">
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                        {editingTool ? ta('حفظ التعديلات', 'Save Changes') : ta('إضافة الأداة', 'Add Tool')}
                                    </Button>
                                    <Button type="button" onClick={resetForm} variant="outline" className="flex-1">
                                        {ta('إلغاء', 'Cancel')}
                                    </Button>
                                </div>

                                {/* Note: manage forms via detail page */}
                                {editingTool && (
                                    <p className="text-xs text-center text-gray-400 pt-1">
                                        {ta('لإدارة النماذج والحقول بالتفصيل', 'To manage forms and fields in detail')}
                                        {' '}
                                        <button type="button"
                                            onClick={() => { resetForm(); router.push(`/admin/educational-services/static-tools/${editingTool.id}`); }}
                                            className="text-primary font-bold hover:underline">
                                            {ta('انقر هنا →', 'click here →')}
                                        </button>
                                    </p>
                                )}
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Confirm Delete ── */}
            <ConfirmDialog
                open={!!deleteId}
                title={ta('حذف الأداة', 'Delete Tool')}
                message={ta('سيتم حذف الأداة ونماذجها وحقولها نهائياً. هذا الإجراء لا يمكن التراجع عنه.', 'The tool, its forms, and fields will be permanently deleted. This cannot be undone.')}
                confirmLabel={ta('نعم، احذف', 'Yes, Delete')}
                isLoading={deleting}
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
            />
        </div>
    );
}
