'use client';

import { logger } from '@/lib/logger';
import Link from 'next/link';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '@/lib/api';
import { ta } from '@/i18n/auto-translations';
import { useTranslation } from '@/i18n/useTranslation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { EmptyState } from '@/components/ui/empty-state';
import toast from 'react-hot-toast';
import type { ServiceDefinition, ServiceFeature } from '@/types';
import {
    getServiceCategories,
    getAllServices,
    createService,
    saveService,
    deleteService,
} from '@/lib/firestore-service';

import { DEFAULT_SERVICES } from '@/lib/default-services';

import {
    BookOpen, ClipboardList, Users, FileText, Star, Target,
    TrendingUp, Layers, BarChart3, ArrowRight, Activity,
    CheckCircle2, Zap, Shield, Database, GraduationCap,
    ExternalLink, Wrench, Award, CalendarDays, Brain,
    ClipboardCheck, Lightbulb, ScrollText, FileQuestion,
    Bot, FolderOpen, FileSpreadsheet, PieChart, Settings,
    Sparkles, FolderArchive, Trophy, Plus, Trash2, Edit, Eye, EyeOff,
    Search, X, Save, LayoutGrid, List, RefreshCw, ChevronDown, ChevronUp,
    ShieldCheck, Briefcase,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ===== Icon lookup =====
const ICON_MAP: Record<string, any> = {
    ClipboardList, ClipboardCheck, GraduationCap, BarChart3, CalendarDays,
    Award, Users, Sparkles, TrendingUp, PieChart, FileText, BookOpen,
    Layers, Settings, Brain, Target, FolderArchive, Trophy, Bot,
    FileQuestion, Shield, Database, Star, FolderOpen, FileSpreadsheet, ShieldCheck, Briefcase,
    Lightbulb, ScrollText, Wrench,
};

// ===== Available Icons =====
const AVAILABLE_ICONS = Object.keys(ICON_MAP);

// ===== Gradients =====
const GRADIENTS = [
    'from-blue-500 to-blue-600', 'from-amber-500 to-orange-500',
    'from-green-500 to-emerald-500', 'from-teal-500 to-cyan-500',
    'from-purple-500 to-violet-500', 'from-rose-500 to-pink-500',
    'from-red-500 to-rose-500', 'from-sky-500 to-blue-500',
    'from-yellow-500 to-amber-500', 'from-emerald-500 to-green-500',
    'from-cyan-500 to-teal-500', 'from-indigo-500 to-purple-600',
];

// ── Admin groups: Organize ALL services by domain ──
const ADMIN_GROUPS = [
    {
        id: 'analysis',
        icon: BarChart3,
        gradient: 'from-blue-500 to-indigo-600',
        slugs: ['analyses', 'tests', 'question-bank', 'results-analysis-tools'],
    },
    {
        id: 'certificates',
        icon: Award,
        gradient: 'from-amber-500 to-orange-500',
        slugs: ['certificates', 'other-certificates'],
    },
    {
        id: 'performance',
        icon: ClipboardCheck,
        gradient: 'from-violet-600 to-purple-700',
        slugs: [
            'perf-job-duties', 'perf-professional-community', 'perf-parents-interaction',
            'perf-strategies', 'perf-improve-results', 'perf-learning-plan',
            'perf-technical', 'perf-school-environment', 'perf-classroom-management',
            'perf-results-analysis', 'perf-assessment-methods',
        ],
    },
    {
        id: 'records',
        icon: FolderArchive,
        gradient: 'from-purple-500 to-violet-600',
        slugs: ['achievements', 'knowledge-production', 'follow-up-log', 'portfolio', 'documentation-forms', 'achievement-report-builder'],
    },
    {
        id: 'planning',
        icon: ClipboardList,
        gradient: 'from-green-500 to-emerald-600',
        slugs: ['plans', 'distributions', 'weekly-plan-builder', 'academic-calendars', 'remedial-enrichment-plans'],
    },
    {
        id: 'tools',
        icon: Wrench,
        gradient: 'from-slate-500 to-gray-600',
        slugs: ['worksheets', 'signs-banners', 'learning-style-surveys', 'edu-tools', 'my-templates'],
    },
    {
        id: 'smart',
        icon: Bot,
        gradient: 'from-violet-500 to-indigo-600',
        slugs: ['ai-assistant'],
    },
];

const GROUP_NAMES: Record<string, { ar: string; en: string }> = {
    analysis: { ar: 'التحليل والاختبارات', en: 'Analysis & Tests' },
    certificates: { ar: 'الشهادات المتنوعة', en: 'Various Certificates' },
    performance: { ar: 'شواهد الأداء الوظيفي', en: 'Job Performance Evidence' },
    records: { ar: 'السجلات والملفات المدرسية', en: 'School Records & Files' },
    planning: { ar: 'التخطيط والتوزيعات', en: 'Planning & Distributions' },
    tools: { ar: 'أدوات ومصادر تعليمية', en: 'Educational Tools & Resources' },
    smart: { ar: 'الأدوات الذكية', en: 'Smart Tools' },
};

interface FormData {
    slug: string; name_ar: string; description_ar: string; icon: string;
    color: string; gradient: string; category: string; route: string;
    is_active: boolean; is_new: boolean; is_popular: boolean; is_premium: boolean;
    requires_auth: boolean; requires_subscription: boolean; sort_order: number;
}

const INITIAL_FORM: FormData = {
    slug: '', name_ar: '', description_ar: '', icon: 'FileText',
    color: 'bg-blue-500', gradient: 'from-blue-500 to-blue-600', category: 'analysis',
    route: '', is_active: true, is_new: false, is_popular: false, is_premium: false,
    requires_auth: false, requires_subscription: false, sort_order: 1,
};

const FALLBACK_CATEGORIES = [
    { id: 'all', name: 'جميع الخدمات', color: 'bg-blue-500' },
    { id: 'analysis', name: 'التحليل', color: 'bg-blue-500' },
    { id: 'documents', name: 'المستندات', color: 'bg-emerald-500' },
    { id: 'planning', name: 'التخطيط', color: 'bg-purple-500' },
    { id: 'records', name: 'السجلات', color: 'bg-rose-500' },
    { id: 'ai', name: 'الذكاء الاصطناعي', color: 'bg-indigo-500' },
    { id: 'tools', name: 'أدوات PDF', color: 'bg-blue-700' },
];

export default function AdminEducationalServicesPage() {
    const { dir, t, locale } = useTranslation();
    const isAr = locale === 'ar';

    const [stats, setStats] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(true);

    // ── CRUD State ──
    const [services, setServices] = useState<ServiceDefinition[]>([]);
    const [servicesLoading, setServicesLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingService, setEditingService] = useState<ServiceDefinition | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
    const [editFeatures, setEditFeatures] = useState<ServiceFeature[]>([]);
    const [featureInput, setFeatureInput] = useState({ title_ar: '', description_ar: '' });
    const [dynamicCategories, setDynamicCategories] = useState(FALLBACK_CATEGORIES);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    // ── Sections expand/collapse ──
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['services']));

    // ── Computed: All services (no interactive/static split) ──
    const allServices = useMemo(() =>
        services.filter(s => s.is_active !== undefined).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)),
    [services]);
    const MANAGED_SERVICES = useMemo(() =>
        allServices.filter(s => s.admin_href).map(s => s.slug),
    [allServices]);

    // ── Load stats — runs AFTER services load so MANAGED_SERVICES is populated ──
    useEffect(() => {
        if (MANAGED_SERVICES.length === 0) return; // [AUDIT-FIX] Don't run until services loaded
        const fetchStats = async () => {
            try {
                const results = await Promise.allSettled(
                    MANAGED_SERVICES.map(type => api.get(`/admin/educational-services/${type}`, { _silentError: true } as any))
                );
                const newStats: Record<string, number> = {};
                results.forEach((result, i) => {
                    if (result.status === 'fulfilled') {
                        const res = result.value as any;
                        newStats[MANAGED_SERVICES[i]] = res?.data?.length ?? res?.total ?? 0;
                    } else {
                        newStats[MANAGED_SERVICES[i]] = 0;
                    }
                });
                setStats(newStats);
            } catch (err) { logger.error(err); }
            finally { setIsLoading(false); }
        };
        fetchStats();
    }, [MANAGED_SERVICES.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Load & Sync Firestore services ──
    // On admin load: sync DEFAULT_SERVICES → Firestore (upsert new, delete orphans)
    const loadServices = useCallback(async () => {
        setServicesLoading(true);
        try {
            const firestoreData = await getAllServices();
            const fsMap = new Map(firestoreData.map(s => [s.slug, s]));
            const localSlugs = new Set(DEFAULT_SERVICES.map(s => s.slug));

            // 1. Upsert: ensure every DEFAULT service exists in Firestore with correct data
            const upsertPromises = DEFAULT_SERVICES.map(async (ds) => {
                const existing = fsMap.get(ds.slug);
                if (!existing) {
                    // New service — create in Firestore
                    await saveService(ds.slug, {
                        ...ds, id: ds.slug,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    } as any);
                } else {
                    // Existing — update name/description/icon/gradient/route if changed in code
                    const needsUpdate =
                        existing.name_ar !== ds.name_ar ||
                        existing.name_en !== ds.name_en ||
                        existing.description_ar !== ds.description_ar ||
                        existing.route !== ds.route;
                    if (needsUpdate) {
                        await saveService(ds.slug, {
                            name_ar: ds.name_ar,
                            name_en: ds.name_en,
                            description_ar: ds.description_ar,
                            description_en: ds.description_en,
                            icon: ds.icon,
                            gradient: ds.gradient,
                            route: ds.route,
                            category: ds.category,
                            admin_href: ds.admin_href,
                            updated_at: new Date().toISOString(),
                        } as any);
                    }
                }
            });
            await Promise.allSettled(upsertPromises);

            // 2. Delete orphans: Firestore docs that no longer exist in DEFAULT_SERVICES
            const deletePromises = firestoreData
                .filter(fs => !localSlugs.has(fs.slug))
                .map(fs => deleteService(fs.id || fs.slug));
            await Promise.allSettled(deletePromises);

            // 3. Reload fresh data from Firestore
            const freshData = await getAllServices();
            const merged = DEFAULT_SERVICES.map(ds => {
                const fsDoc = freshData.find(f => f.slug === ds.slug);
                return fsDoc
                    ? { ...ds, ...fsDoc, id: ds.slug } as ServiceDefinition
                    : { ...ds, id: ds.slug } as ServiceDefinition;
            });

            setServices(merged.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
        } catch (error) {
            logger.error('Error loading services:', error);
            setServices(DEFAULT_SERVICES.map(s => ({ ...s, id: s.slug } as ServiceDefinition)));
        } finally {
            setServicesLoading(false);
        }
    }, []);

    useEffect(() => { loadServices(); }, [loadServices]);

    useEffect(() => {
        getServiceCategories().then(cats => {
            if (cats?.length > 0) {
                setDynamicCategories(cats.map(c => ({ id: c.id, name: c.name_ar, color: c.color || 'bg-blue-500' })));
            }
        }).catch(() => {});
    }, []);

    // ── CRUD ──
    const resetForm = () => { setFormData(INITIAL_FORM); setEditingService(null); setEditFeatures([]); setShowForm(false); };

    const handleEdit = (service: ServiceDefinition) => {
        setFormData({
            slug: service.slug, name_ar: service.name_ar, description_ar: service.description_ar,
            icon: service.icon, color: service.color, gradient: service.gradient || 'from-blue-500 to-blue-600',
            category: service.category, route: service.route, is_active: service.is_active,
            is_new: service.is_new || false, is_popular: service.is_popular || false,
            is_premium: service.is_premium || false, requires_auth: service.requires_auth,
            requires_subscription: service.requires_subscription, sort_order: service.sort_order,
        });
        setEditFeatures(service.features || []);
        setEditingService(service);
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // ── Smart Validation ──
        if (!formData.name_ar?.trim()) {
            toast.error(ta('⚠️ اسم الخدمة مطلوب — أدخل اسماً واضحاً يصف الخدمة', '⚠️ Service name is required'));
            return;
        }
        if (formData.name_ar.trim().length < 3) {
            toast.error(ta('⚠️ اسم الخدمة قصير جداً — يجب أن يكون 3 أحرف على الأقل', '⚠️ Name too short'));
            return;
        }
        if (!formData.slug?.trim()) {
            toast.error(ta('⚠️ المعرف (slug) مطلوب', '⚠️ Slug is required'));
            return;
        }
        if (!formData.description_ar?.trim()) {
            toast.error(ta('⚠️ يرجى إضافة وصف للخدمة — يساعد المستخدمين في فهم الخدمة', '⚠️ Please add a description'));
            return;
        }
        if (!editingService) {
            const existing = services.find(s => s.slug === formData.slug);
            if (existing) {
                toast.error(ta('⚠️ يوجد خدمة بنفس المعرف بالفعل — اختر معرفاً مختلفاً', '⚠️ A service with this slug already exists'));
                return;
            }
        }
        setIsSaving(true);
        try {
            const serviceData: Partial<ServiceDefinition> = { ...formData, features: editFeatures };
            if (editingService) {
                await saveService(editingService.id, serviceData);
                toast.success(ta('تم تحديث الخدمة بنجاح ✅', 'Service updated ✅'));
            } else {
                await createService(serviceData as Omit<ServiceDefinition, 'id'>);
                toast.success(ta('تم إضافة الخدمة بنجاح ✅', 'Service added ✅'));
            }
            // Smart post-save feedback
            if (formData.is_active) {
                toast(ta('🟢 الخدمة مرئية الآن — ستظهر للمستخدمين في صفحة الخدمات', '🟢 Service visible — appears on services page'), { duration: 4000, icon: '📋' });
            } else {
                toast(ta('⚠️ الخدمة محفوظة لكنها معطلة — لن تظهر للمستخدمين حتى تفعّلها', '⚠️ Service saved but disabled'), { duration: 4000, icon: '⏸️' });
            }
            resetForm();
            await loadServices();
        } catch (error: any) {
            toast.error(error.message || ta('حدث خطأ في الحفظ', 'Error saving'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (serviceId: string) => {
        try {
            await deleteService(serviceId);
            toast.success(ta('تم حذف الخدمة ✅', 'Service deleted ✅'));
            await loadServices();
        } catch { toast.error(ta('خطأ في حذف الخدمة', 'Error deleting service')); }
        finally { setDeleteConfirmId(null); }
    };

    const toggleVisibility = async (service: ServiceDefinition) => {
        try {
            await saveService(service.id, { is_active: !service.is_active });
            toast.success(service.is_active ? ta('تم إخفاء الخدمة', 'Service hidden') : ta('تم تفعيل الخدمة ✅', 'Service activated ✅'));
            await loadServices();
        } catch { toast.error(ta('خطأ في تحديث الحالة', 'Error updating status')); }
    };

    const addFeature = () => {
        if (!featureInput.title_ar) return;
        setEditFeatures([...editFeatures, { ...featureInput, title_en: featureInput.title_ar, description_en: featureInput.description_ar || '', icon: 'CheckCircle' }]);
        setFeatureInput({ title_ar: '', description_ar: '' });
    };

    const toggleSection = (id: string) => {
        setExpandedSections(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const totalRecords = Object.values(stats).reduce((a, b) => a + b, 0);

    // Build grouped services (ALL services, not just interactive)
    const groupedServices = useMemo(() => {
        return ADMIN_GROUPS.map(group => ({
            ...group,
            services: allServices.filter(s => group.slugs.includes(s.slug)),
        })).filter(g => g.services.length > 0);
    }, [allServices]);

    // Ungrouped services
    const allGroupedSlugs = ADMIN_GROUPS.flatMap(g => g.slugs);
    const ungroupedServices = allServices.filter(s => !allGroupedSlugs.includes(s.slug));

    // ═══════════════════════════════════════════════════════════
    return (
        <div className="space-y-6" dir={dir}>
            {/* ═══ Header ═══ */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden bg-gradient-to-l from-violet-500/5 via-purple-500/5 to-indigo-500/5 dark:from-violet-500/10 dark:via-purple-500/10 dark:to-indigo-500/10 rounded-2xl p-6 border border-gray-100 dark:border-gray-700/50">
                <div className="absolute top-0 left-0 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl -translate-x-10 -translate-y-10 pointer-events-none" />
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                            <span className="p-2.5 bg-gradient-to-br from-violet-600 to-purple-700 rounded-xl text-white shadow-lg shadow-violet-500/20">
                                <BookOpen className="w-5 h-5" />
                            </span>
                            {ta('إدارة الخدمات التعليمية', 'Educational Services Management')}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
                            {ta('إدارة شاملة للخدمات التفاعلية والأدوات التعليمية', 'Comprehensive management of interactive services and educational tools')}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={loadServices} className="gap-2 rounded-xl">
                            <RefreshCw className="w-4 h-4" /> {ta('تحديث', 'Refresh')}
                        </Button>
                    </div>
                </div>
            </motion.div>

            {/* ═══ Quick Stats ═══ */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: ta('إجمالي الخدمات', 'Total Services'), value: allServices.length, icon: Zap, color: 'from-violet-500 to-purple-600' },
                    { label: ta('الخدمات المفعّلة', 'Active'), value: allServices.filter(s => s.is_active).length, icon: CheckCircle2, color: 'from-emerald-500 to-green-600' },
                    { label: ta('إجمالي السجلات', 'Total Records'), value: totalRecords, icon: Activity, color: 'from-blue-500 to-indigo-600' },
                    { label: ta('التصنيفات', 'Categories'), value: groupedServices.length, icon: LayoutGrid, color: 'from-amber-500 to-orange-600' },
                ].map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                            className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-md flex-shrink-0`}>
                                <Icon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                                <p className={`text-xl font-black text-gray-900 dark:text-white ${isLoading ? 'opacity-40' : ''}`}>
                                    {isLoading ? <span className="inline-block w-8 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" /> : stat.value}
                                </p>
                            </div>
                        </motion.div>
                    );
                })}
            </div>


            {/* ═══════════════════ الخدمات التعليمية (موحدة) ═══════════════════ */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                <button
                    onClick={() => toggleSection('services')}
                    className="w-full flex items-center gap-3 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-md">
                        <Zap className="w-5 h-5" />
                    </div>
                    <div className="flex-1 text-start">
                        <h2 className="text-base font-black text-gray-900 dark:text-white">
                            {ta('الخدمات التعليمية', 'Educational Services')}
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {ta('جميع الخدمات التعليمية — كل خدمة مع محرر ونماذج ومعاينة حية', 'All educational services — each with editor, forms, and live preview')}
                        </p>
                    </div>
                    <Badge className="bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 font-bold">
                        {allServices.length}
                    </Badge>
                    {expandedSections.has('services') ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </button>

                <AnimatePresence>
                {expandedSections.has('services') && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="border-t border-gray-100 dark:border-gray-700 p-5 space-y-5">
                            {/* Grouped services */}
                            {groupedServices.map(group => {
                                const GroupIcon = group.icon;
                                const groupName = GROUP_NAMES[group.id]?.[locale as 'ar' | 'en'] || group.id;
                                return (
                                    <div key={group.id}>
                                        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2 uppercase tracking-wide">
                                            <GroupIcon className="w-3.5 h-3.5" />
                                            {groupName}
                                            <Badge variant="outline" className="text-[9px] h-4 px-1.5">{group.services.length}</Badge>
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {group.services.map(svc => {
                                                const Icon = ICON_MAP[svc.icon] || FileText;
                                                const count = stats[svc.slug];
                                                const gradient = svc.gradient || 'from-gray-500 to-gray-600';
                                                return (
                                                    <div key={svc.id} className={`group relative bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all ${!svc.is_active ? 'opacity-60' : ''}`}>
                                                        <div className="block p-4">
                                                            <div className="flex items-center gap-3 mb-3">
                                                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform`}>
                                                                    <Icon className="w-5 h-5" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                                                                        {isAr ? svc.name_ar : (svc.name_en || svc.name_ar)}
                                                                    </h4>
                                                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                                                                        {isAr ? svc.description_ar : (svc.description_en || svc.description_ar)}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    {count !== undefined && (
                                                                        <span className="text-xs font-bold px-2 py-1 rounded-lg bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400">
                                                                            {count} {ta('سجل', 'records')}
                                                                        </span>
                                                                    )}
                                                                    {!svc.is_active && (
                                                                        <Badge variant="outline" className="border-red-300 text-red-600 text-[10px]">{ta('مخفي', 'Hidden')}</Badge>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {/* Quick Actions */}
                                                        <div className="absolute top-2 end-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => toggleVisibility(svc)} className="p-1.5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg text-gray-500 hover:text-violet-600 shadow-sm" title={ta('إظهار/إخفاء', 'Show/Hide')}>
                                                                {svc.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                                            </button>
                                                            <button onClick={() => handleEdit(svc)} className="p-1.5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg text-gray-500 hover:text-blue-600 shadow-sm" title={ta('تعديل', 'Edit')}>
                                                                <Edit className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                        {/* Bottom toolbar */}
                                                        <div className="flex border-t border-gray-100 dark:border-gray-600 divide-x divide-gray-100 dark:divide-gray-600 rtl:divide-x-reverse">
                                                            <Link href={`/admin/educational-services/static-tools/${svc.slug}`}
                                                                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-bold text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors">
                                                                <Edit className="w-3 h-3" />
                                                                {ta('محرر النماذج', 'Form Editor')}
                                                            </Link>
                                                            <Link href={`/admin/educational-services/data/${svc.slug}`}
                                                                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                                                                <Database className="w-3 h-3" />
                                                                {ta('البيانات', 'Data')}
                                                                {stats[svc.slug] !== undefined && stats[svc.slug] > 0 && (
                                                                    <span className="text-[9px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1 py-0.5 rounded-full font-bold">{stats[svc.slug]}</span>
                                                                )}
                                                            </Link>
                                                            <a href={svc.route} target="_blank" rel="noopener noreferrer"
                                                                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-bold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
                                                                <ExternalLink className="w-3 h-3" />
                                                                {ta('معاينة', 'Preview')}
                                                            </a>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Ungrouped services */}
                            {ungroupedServices.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-bold text-gray-500 mb-3 flex items-center gap-2 uppercase tracking-wide">
                                        <LayoutGrid className="w-3.5 h-3.5" />
                                        {ta('خدمات أخرى', 'Other Services')}
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {ungroupedServices.map(svc => {
                                            const Icon = ICON_MAP[svc.icon] || FileText;
                                            const count = stats[svc.slug];
                                            return (
                                                <div key={svc.id} className="group flex items-center gap-3 p-3.5 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 hover:shadow-md transition-all">
                                                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${svc.gradient || 'from-gray-500 to-gray-600'} flex items-center justify-center text-white shadow-sm`}>
                                                        <Icon className="w-4 h-4" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">{isAr ? svc.name_ar : (svc.name_en || svc.name_ar)}</h4>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Link href={`/admin/educational-services/data/${svc.slug}`} className="p-1 rounded text-blue-500 hover:text-blue-700" title={ta('البيانات', 'Data')}><Database className="w-3 h-3" /></Link>
                                                        <span className="text-xs font-bold text-violet-600 dark:text-violet-400">{count ?? '—'}</span>
                                                        <Link href={`/admin/educational-services/static-tools/${svc.slug}`} className="p-1 rounded text-violet-500 hover:text-violet-700" title={ta('محرر النماذج', 'Form Editor')}><LayoutGrid className="w-3 h-3" /></Link>
                                                        <button onClick={() => handleEdit(svc)} className="p-1 rounded text-gray-400 hover:text-blue-600"><Edit className="w-3 h-3" /></button>
                                                        <button onClick={() => toggleVisibility(svc)} className="p-1 rounded text-gray-400 hover:text-violet-600">{svc.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}</button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
                </AnimatePresence>
            </div>


            {/* ═══════════════════ القسم 3: إدارة تعريفات الخدمات (متقدم) ═══════════════════ */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                <button
                    onClick={() => toggleSection('manage')}
                    className="w-full flex items-center gap-3 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-500 to-slate-600 flex items-center justify-center text-white shadow-md">
                        <Settings className="w-5 h-5" />
                    </div>
                    <div className="flex-1 text-start">
                        <h2 className="text-base font-black text-gray-900 dark:text-white">
                            {ta('إدارة تعريفات الخدمات', 'Service Definitions Management')}
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {ta('إضافة / تعديل / حذف تعريفات الخدمات — الأسماء والأيقونات والألوان والترتيب', 'Add / Edit / Delete service definitions — names, icons, colors, order')}
                        </p>
                    </div>
                    <Badge className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 font-bold">
                        {services.length}
                    </Badge>
                    {expandedSections.has('manage') ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </button>

                <AnimatePresence>
                {expandedSections.has('manage') && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="border-t border-gray-100 dark:border-gray-700 p-5 space-y-4">
                            <div className="flex items-center gap-3">
                                <Button onClick={() => setShowForm(true)} size="sm"
                                    className="bg-gradient-to-l from-primary to-purple-600 text-white shadow-lg shadow-primary/20 rounded-xl gap-1.5">
                                    <Plus className="w-4 h-4" /> {ta('خدمة جديدة', 'New Service')}
                                </Button>
                            </div>

                            {servicesLoading ? (
                                <div className="flex justify-center py-8">
                                    <div className="animate-pulse w-10 h-10 rounded-2xl bg-primary/20" />
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {services.map(service => {
                                        const Icon = ICON_MAP[service.icon] || FileText;
                                        return (
                                            <div key={service.id} className="group flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 hover:shadow-md transition-all">
                                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0 bg-gradient-to-br ${service.gradient || 'from-gray-500 to-gray-600'} shadow-sm`}>
                                                    <Icon className="w-4 h-4" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">{service.name_ar}</h4>
                                                        <span className="text-[10px] text-gray-400 font-mono" dir="ltr">/{service.slug}</span>
                                                        {!service.is_active && <Badge variant="outline" className="border-red-300 text-red-600 text-[9px] h-4 px-1">{ta('مخفي', 'Hidden')}</Badge>}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Link href={`/admin/educational-services/static-tools/${service.slug}`}
                                                        className="p-1.5 text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg" title={ta('محرر النماذج', 'Form Editor')}>
                                                        <LayoutGrid className="w-3.5 h-3.5" />
                                                    </Link>
                                                    <button onClick={() => toggleVisibility(service)} className="p-1.5 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg">
                                                        {service.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                                    </button>
                                                    <button onClick={() => handleEdit(service)} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg">
                                                        <Edit className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button onClick={() => setDeleteConfirmId(service.id)} className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
                </AnimatePresence>
            </div>

            {/* ═══ Form Modal ═══ */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-2xl shadow-xl border dark:border-gray-700 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                            {editingService ? ta('✏️ تعديل الخدمة', '✏️ Edit Service') : ta('➕ إضافة خدمة جديدة', '➕ Add New Service')}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">{ta('اسم الخدمة', 'Service Name')}<span className="text-red-500">*</span></label>
                                <Input value={formData.name_ar} onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })} required className="dark:bg-gray-700 dark:border-gray-600" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">{ta('المعرف (Slug)', 'Slug')}<span className="text-red-500">*</span></label>
                                    <Input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} required dir="ltr" className="dark:bg-gray-700 dark:border-gray-600" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">{ta('المسار', 'Route')}<span className="text-red-500">*</span></label>
                                    <Input value={formData.route} onChange={(e) => setFormData({ ...formData, route: e.target.value })} required dir="ltr" className="dark:bg-gray-700 dark:border-gray-600" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">{ta('وصف الخدمة', 'Description')}</label>
                                <textarea rows={3} className="w-full px-3 py-2 border rounded-xl text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                    value={formData.description_ar} onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{ta('التصنيف', 'Category')}</label>
                                    <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                        {dynamicCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{ta('الأيقونة', 'Icon')}</label>
                                    <select value={formData.icon} onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                        {AVAILABLE_ICONS.map(icon => <option key={icon} value={icon}>{icon}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{ta('الترتيب', 'Order')}</label>
                                    <Input type="number" min="1" value={formData.sort_order} onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 1 })} className="dark:bg-gray-700 dark:border-gray-600" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{ta('التدرج اللوني', 'Color Gradient')}</label>
                                <div className="flex flex-wrap gap-2">
                                    {GRADIENTS.map(g => (
                                        <button key={g} type="button" onClick={() => setFormData({ ...formData, gradient: g })}
                                            className={`h-8 w-16 rounded-lg bg-gradient-to-r ${g} ${formData.gradient === g ? 'ring-2 ring-primary ring-offset-2' : ''}`} />
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { key: 'is_active' as const, label: ta('نشطة', 'Active') },
                                    { key: 'is_new' as const, label: ta('جديدة', 'New') },
                                    { key: 'is_popular' as const, label: ta('شائعة', 'Popular') },
                                    { key: 'is_premium' as const, label: ta('مميزة', 'Premium') },
                                    { key: 'requires_auth' as const, label: ta('تسجيل دخول', 'Login Required') },
                                    { key: 'requires_subscription' as const, label: ta('اشتراك', 'Subscription') },
                                ].map(flag => (
                                    <label key={flag.key} className="flex items-center gap-2">
                                        <input type="checkbox" checked={formData[flag.key]} onChange={(e) => setFormData({ ...formData, [flag.key]: e.target.checked })} className="w-4 h-4" />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">{flag.label}</span>
                                    </label>
                                ))}
                            </div>
                            {/* Features */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{ta('الميزات', 'Features')} ({editFeatures.length})</label>
                                {editFeatures.map((f, i) => (
                                    <div key={i} className="flex items-center gap-2 mb-1">
                                        <span className="text-sm text-gray-600 dark:text-gray-400 flex-1">{f.title_ar}</span>
                                        <button type="button" onClick={() => setEditFeatures(editFeatures.filter((_, j) => j !== i))} className="text-red-500 text-xs hover:text-red-700">✕</button>
                                    </div>
                                ))}
                                <div className="flex gap-2 mt-2">
                                    <Input placeholder={ta('عنوان الميزة', 'Feature title')} value={featureInput.title_ar}
                                        onChange={(e) => setFeatureInput({ ...featureInput, title_ar: e.target.value })} className="flex-1 text-sm dark:bg-gray-700 dark:border-gray-600" />
                                    <Button type="button" onClick={addFeature} variant="outline" size="sm">+</Button>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-white" disabled={isSaving}>
                                    {isSaving ? ta('جاري الحفظ...', 'Saving...') : editingService ? ta('تحديث', 'Update') : ta('إضافة', 'Add')}
                                </Button>
                                <Button type="button" onClick={resetForm} variant="outline" className="flex-1">{ta('إلغاء', 'Cancel')}</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ═══ Confirm Dialog ═══ */}
            <ConfirmDialog open={!!deleteConfirmId} title={ta('حذف الخدمة', 'Delete Service')}
                message={ta('هل أنت متأكد من حذف هذه الخدمة؟ لا يمكن التراجع.', 'Are you sure you want to delete this service? This cannot be undone.')}
                confirmLabel={ta('نعم، احذف', 'Yes, Delete')}
                onConfirm={() => deleteConfirmId && handleDelete(deleteConfirmId)}
                onCancel={() => setDeleteConfirmId(null)} />
        </div>
    );
}
