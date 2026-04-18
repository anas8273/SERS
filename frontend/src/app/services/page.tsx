'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { Badge } from '@/components/ui/badge';
import {
    BarChart3, Award, ClipboardList, Trophy, FileQuestion, Bot, FileText, Users,
    GraduationCap, Target, BookOpen, Calendar, Search, Star, Sparkles,
    CheckCircle, TrendingUp, Zap, Clock, Shield, Layers, PieChart,
    LineChart, FolderOpen, Briefcase, Settings, Play, FileSpreadsheet, FolderArchive,
    CalendarDays, ClipboardCheck, ScrollText, Brain, Lightbulb, LayoutGrid, ArrowRight, Wrench,
    Rocket, ChevronDown, ChevronUp, Eye, ShieldCheck,
} from 'lucide-react';
import type { ServiceDefinition } from '@/types';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { useTranslation } from '@/i18n/useTranslation';
import { getServices } from '@/lib/firestore-service';
import { DEFAULT_SERVICES } from '@/lib/default-services';

// ===== Icon Mapping =====
const ICON_MAP: Record<string, any> = {
    'BarChart3': BarChart3, 'Award': Award, 'ClipboardList': ClipboardList,
    'Trophy': Trophy, 'FileQuestion': FileQuestion, 'Bot': Bot, 'FileText': FileText,
    'Users': Users, 'GraduationCap': GraduationCap, 'Target': Target,
    'BookOpen': BookOpen, 'Calendar': Calendar, 'Star': Star, 'Sparkles': Sparkles,
    'CheckCircle': CheckCircle, 'TrendingUp': TrendingUp, 'Zap': Zap, 'Clock': Clock,
    'Shield': Shield, 'Layers': Layers, 'PieChart': PieChart, 'LineChart': LineChart,
    'FolderOpen': FolderOpen, 'Briefcase': Briefcase, 'Settings': Settings,
    'Play': Play, 'FileSpreadsheet': FileSpreadsheet, 'FolderArchive': FolderArchive,
    'CalendarDays': CalendarDays, 'ClipboardCheck': ClipboardCheck,
    'ScrollText': ScrollText, 'Brain': Brain, 'Lightbulb': Lightbulb,
    'LayoutGrid': LayoutGrid, 'ArrowRight': ArrowRight, 'Wrench': Wrench, 'ShieldCheck': ShieldCheck,
};
function getIcon(iconName: string) { return ICON_MAP[iconName] || FileText; }

// ===== SMART GROUPS: Organize related services into logical sections =====
const SMART_GROUPS = [
    {
        id: 'analysis',
        icon: BarChart3,
        gradient: 'from-blue-500 to-indigo-600',
        color: 'bg-blue-500',
        borderColor: 'border-blue-400',
        slugs: ['analyses', 'tests', 'question-bank', 'results-analysis-tools'],
    },
    {
        id: 'certificates',
        icon: Award,
        gradient: 'from-amber-500 to-orange-500',
        color: 'bg-amber-500',
        borderColor: 'border-amber-400',
        slugs: ['certificates', 'other-certificates'],
    },
    {
        id: 'performance',
        icon: ClipboardCheck,
        gradient: 'from-violet-600 to-purple-700',
        color: 'bg-violet-600',
        borderColor: 'border-violet-400',
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
        color: 'bg-purple-500',
        borderColor: 'border-purple-400',
        slugs: ['achievements', 'knowledge-production', 'follow-up-log', 'portfolio', 'documentation-forms', 'achievement-report-builder'],
    },
    {
        id: 'planning',
        icon: ClipboardList,
        gradient: 'from-green-500 to-emerald-600',
        color: 'bg-green-500',
        borderColor: 'border-green-400',
        slugs: ['plans', 'distributions', 'weekly-plan-builder', 'academic-calendars', 'remedial-enrichment-plans'],
    },
    {
        id: 'tools',
        icon: Wrench,
        gradient: 'from-slate-500 to-gray-600',
        color: 'bg-slate-500',
        borderColor: 'border-slate-400',
        slugs: ['worksheets', 'signs-banners', 'learning-style-surveys', 'edu-tools', 'my-templates'],
    },
];

// Translation keys for smart groups
const GROUP_NAMES: Record<string, { ar: string; en: string }> = {
    analysis: { ar: 'التحليل والاختبارات', en: 'Analysis & Tests' },
    certificates: { ar: 'الشهادات المتنوعة', en: 'Various Certificates' },
    performance: { ar: 'شواهد الأداء الوظيفي', en: 'Job Performance Evidence' },
    records: { ar: 'السجلات والملفات المدرسية', en: 'School Records & Files' },

    planning: { ar: 'التخطيط والتوزيعات', en: 'Planning & Distributions' },
    tools: { ar: 'أدوات ومصادر تعليمية', en: 'Educational Tools & Resources' },
};

const GROUP_DESCS: Record<string, { ar: string; en: string }> = {
    analysis: { ar: 'تحليل نتائج الاختبارات وبنك الأسئلة', en: 'Test results analysis and question bank' },
    certificates: { ar: 'إنشاء وطباعة جميع أنواع الشهادات الاحترافية — شكر وتقدير، تخرج، دورات', en: 'Create and print all certificate types — appreciation, graduation, courses' },
    performance: { ar: 'البنود الـ 11 المعتمدة والمبادرات المدرسية والبيئة التعليمية والتفاعل المهني', en: 'All 11 items, school initiatives, educational environment & professional interaction' },
    records: { ar: 'التوثيق والإنجازات والإنتاج المعرفي والسجلات', en: 'Documentation, achievements, knowledge production, and records' },
    planning: { ar: 'خطط تعليمية وتوزيعات وخطط علاجية وإثرائية', en: 'Educational plans, distributions, remedial & enrichment plans' },
    tools: { ar: 'أدوات تعليمية متنوعة وقوالب وموارد جاهزة', en: 'Various educational tools, templates, and ready resources' },
};

// Default gradient fallback for services that might come from Firestore without one
const FALLBACK_GRADIENTS: Record<string, string> = {
    'achievement-report-builder': 'from-indigo-500 to-purple-600',
    'job-duties-forms': 'from-amber-600 to-orange-700',
    'edu-tools': 'from-teal-500 to-cyan-600',
};


export default function ServicesPage() {
    const router = useRouter();
    const { t, dir, localizedField, locale } = useTranslation();
    const isRTL = locale === 'ar';
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(SMART_GROUPS.map(g => g.id)));
    const [services, setServices] = useState<ServiceDefinition[]>(DEFAULT_SERVICES as any);

    // ── Whitelist: only slugs that belong to a group are valid ──
    const VALID_SLUGS = useMemo(() => {
        const set = new Set<string>();
        SMART_GROUPS.forEach(g => g.slugs.forEach(s => set.add(s)));
        set.add('ai-assistant');
        return set;
    }, []);

    // Background refresh from Firestore — MERGE into defaults, never replace
    useEffect(() => {
        let cancelled = false;
        const loadServices = async () => {
            try {
                const fsServices = await getServices();
                if (cancelled || !fsServices || fsServices.length === 0) return;

                // Merge: for each DEFAULT service, override with Firestore data if it exists
                const fsMap = new Map<string, ServiceDefinition>();
                fsServices.forEach((s: ServiceDefinition) => {
                    const slug = s.slug?.replace(/[^\x00-\x7F]/g, '').trim() || s.id;
                    if (VALID_SLUGS.has(slug)) {
                        fsMap.set(slug, { ...s, slug });
                    }
                });

                const merged = DEFAULT_SERVICES.map((def: any) => {
                    const fsVersion = fsMap.get(def.slug);
                    // DEFAULT controls structure; Firestore overrides display + admin can hide
                    return fsVersion
                        ? { ...def, ...fsVersion, slug: def.slug, id: def.id, route: def.route,
                            is_active: fsVersion.is_active === false ? false : def.is_active }
                        : def;
                });

                if (!cancelled) setServices(merged as any);
            } catch { /* Keep defaults */ }
        };
        loadServices();
        return () => { cancelled = true; };
    }, [VALID_SLUGS]);

    const activeServices = useMemo(() => services.filter(s => s.is_active), [services]);

    // AI assistant (shown separately)
    const aiAssistant = useMemo(() => activeServices.find(s => s.slug === 'ai-assistant'), [activeServices]);

    // Build grouped data
    const groupedData = useMemo(() => {
        const nonAiServices = activeServices.filter(s => s.slug !== 'ai-assistant');

        return SMART_GROUPS.map(group => {
            const groupServices = group.slugs
                .map(slug => nonAiServices.find(s => s.slug === slug || s.id === slug))
                .filter(Boolean) as ServiceDefinition[];

            // Also pick up any service that matches group slugs from Firestore
            nonAiServices.forEach(s => {
                if (group.slugs.includes(s.slug) || group.slugs.includes(s.id)) {
                    if (!groupServices.find(gs => gs.slug === s.slug)) {
                        groupServices.push(s);
                    }
                }
            });

            // Apply search filter
            const filtered = searchQuery
                ? groupServices.filter(s => {
                    const name = localizedField(s, 'name');
                    const desc = localizedField(s, 'description');
                    return name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        desc.toLowerCase().includes(searchQuery.toLowerCase());
                })
                : groupServices;

            return { ...group, services: filtered, totalCount: groupServices.length };
        }).filter(g => g.services.length > 0);
    }, [activeServices, searchQuery, localizedField]);

    // Ungrouped services (safety net)
    const ungroupedServices = useMemo(() => {
        const allGroupedSlugs = SMART_GROUPS.flatMap(g => g.slugs);
        return activeServices.filter(s =>
            s.slug !== 'ai-assistant' &&
            !allGroupedSlugs.includes(s.slug) &&
            !allGroupedSlugs.includes(s.id)
        ).filter(s => {
            if (!searchQuery) return true;
            const name = localizedField(s, 'name');
            const desc = localizedField(s, 'description');
            return name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                desc.toLowerCase().includes(searchQuery.toLowerCase());
        });
    }, [activeServices, searchQuery, localizedField]);

    const toggleGroup = (groupId: string) => {
        setExpandedGroups(prev => {
            const next = new Set(prev);
            if (next.has(groupId)) next.delete(groupId);
            else next.add(groupId);
            return next;
        });
    };

    const handleServiceClick = (service: ServiceDefinition) => {
        router.push(service.route || `/${service.slug}`);
    };

    const totalVisible = groupedData.reduce((sum, g) => sum + g.services.length, 0) + ungroupedServices.length;

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-colors" dir={dir}>
            <Navbar />
            <main>

                {/* ═══════════════════ HERO ═══════════════════ */}
                <section className="relative overflow-hidden bg-gradient-to-bl from-slate-900 via-purple-950 to-slate-900 text-white">
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-10 right-[15%] w-72 h-72 bg-violet-500/20 rounded-full blur-[120px]" />
                        <div className="absolute bottom-10 left-[10%] w-64 h-64 bg-purple-500/15 rounded-full blur-[100px]" />
                    </div>
                    <div className="relative container mx-auto px-4 sm:px-6 pt-28 sm:pt-32 pb-16 sm:pb-20">
                        <div className="text-center max-w-3xl mx-auto">
                            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full text-sm font-bold mb-5">
                                <Briefcase className="w-4 h-4 text-amber-400" />
                                {t('services.heroBadge' as any)}
                            </div>
                            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 leading-tight">
                                {t('services.heroTitle' as any)}
                            </h1>
                            <p className="text-base sm:text-lg text-white/70 mb-7 max-w-2xl mx-auto">
                                {(t('services.heroSubtitle' as any) || '').replace('{count}', String(activeServices.length))}
                            </p>
                            <div className="max-w-lg mx-auto">
                                <div className="relative">
                                    <Search className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 h-5 w-5 text-white/40`} />
                                    <Input
                                        placeholder={isRTL ? 'ابحث عن خدمة...' : 'Search services...'}
                                        className={`${isRTL ? 'pr-12' : 'pl-12'} py-5 sm:py-6 rounded-2xl border-0 bg-white/10 backdrop-blur-md border border-white/10 text-white placeholder:text-white/40 shadow-xl focus:bg-white/15 transition-colors text-base`}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>


                <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">

                    {/* Quick stats */}
                    <div className="flex items-center justify-between mb-6">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {searchQuery ? `${totalVisible} ${isRTL ? 'نتيجة' : 'results'}` : `${activeServices.length - 1} ${isRTL ? 'خدمة تعليمية في' : 'services in'} ${groupedData.length} ${isRTL ? 'أقسام' : 'sections'}`}
                        </p>
                        {searchQuery && (
                            <Button variant="ghost" size="sm" onClick={() => setSearchQuery('')} className="text-primary text-sm">
                                {isRTL ? 'مسح البحث' : 'Clear search'}
                            </Button>
                        )}
                    </div>


                    {/* ═══════════════════ GROUPED SECTIONS ═══════════════════ */}
                    <div className="space-y-4 sm:space-y-5">
                        {groupedData.map((group) => {
                            const GroupIcon = group.icon;
                            const isExpanded = expandedGroups.has(group.id);
                            const groupName = GROUP_NAMES[group.id]?.[locale as 'ar' | 'en'] || group.id;
                            const groupDesc = GROUP_DESCS[group.id]?.[locale as 'ar' | 'en'] || '';

                            return (
                                <ScrollReveal key={group.id} delay={0.05}>
                                    <div className={`rounded-2xl border ${group.borderColor} dark:border-opacity-30 bg-white dark:bg-gray-800/50 overflow-hidden shadow-sm hover:shadow-md transition-shadow`}>
                                        {/* Group Header */}
                                        <button
                                            onClick={() => toggleGroup(group.id)}
                                            className="w-full flex items-center gap-3 sm:gap-4 p-4 sm:p-5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                        >
                                            <div className={`h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br ${group.gradient} flex items-center justify-center text-white shadow-lg flex-shrink-0`}>
                                                <GroupIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                                            </div>
                                            <div className="flex-1 text-start min-w-0">
                                                <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                                                    {groupName}
                                                </h2>
                                                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                                                    {groupDesc}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full bg-gradient-to-r ${group.gradient} text-white`}>
                                                    {group.services.length}
                                                </span>
                                                {isExpanded ? (
                                                    <ChevronUp className="h-5 w-5 text-gray-400" />
                                                ) : (
                                                    <ChevronDown className="h-5 w-5 text-gray-400" />
                                                )}
                                            </div>
                                        </button>

                                        {/* Group Services */}
                                        {isExpanded && (
                                            <div className="border-t border-gray-100 dark:border-gray-700 p-3 sm:p-4">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
                                                    {group.services.map((service) => {
                                                        const IconComp = getIcon(service.icon);
                                                        const gradient = service.gradient || FALLBACK_GRADIENTS[service.slug] || FALLBACK_GRADIENTS[service.id] || group.gradient;

                                                        return (
                                                            <div
                                                                key={service.id}
                                                                onClick={() => handleServiceClick(service)}
                                                                className="group flex items-center gap-3 p-3 sm:p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-white dark:hover:bg-gray-700 border border-transparent hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-md cursor-pointer transition-all duration-200"
                                                            >
                                                                <div className={`h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-md flex-shrink-0 group-hover:scale-105 transition-transform`}>
                                                                    <IconComp className="h-5 w-5" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-1.5 mb-0.5">
                                                                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-primary transition-colors">
                                                                            {localizedField(service, 'name')}
                                                                        </h3>
                                                                        {service.is_new && (
                                                                            <Badge className="bg-emerald-500 text-white text-[9px] px-1.5 py-0 h-4 leading-none">
                                                                                {isRTL ? 'جديد' : 'New'}
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                                                                        {localizedField(service, 'description')}
                                                                    </p>
                                                                </div>
                                                                <ArrowRight className={`h-4 w-4 text-gray-300 dark:text-gray-600 group-hover:text-primary flex-shrink-0 transition-colors ${isRTL ? 'rotate-180' : ''}`} />
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </ScrollReveal>
                            );
                        })}


                        {/* Ungrouped services (safety net for Firestore additions) */}
                        {ungroupedServices.length > 0 && (
                            <ScrollReveal delay={0.05}>
                                <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 overflow-hidden shadow-sm">
                                    <button
                                        onClick={() => toggleGroup('__ungrouped')}
                                        className="w-full flex items-center gap-3 sm:gap-4 p-4 sm:p-5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center text-white shadow-lg flex-shrink-0">
                                            <LayoutGrid className="h-5 w-5 sm:h-6 sm:w-6" />
                                        </div>
                                        <div className="flex-1 text-start">
                                            <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                                                {isRTL ? 'خدمات أخرى' : 'Other Services'}
                                            </h2>
                                        </div>
                                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-gray-500 text-white">
                                            {ungroupedServices.length}
                                        </span>
                                        {expandedGroups.has('__ungrouped') ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                                    </button>
                                    {expandedGroups.has('__ungrouped') && (
                                        <div className="border-t border-gray-100 dark:border-gray-700 p-3 sm:p-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
                                                {ungroupedServices.map((service) => {
                                                    const IconComp = getIcon(service.icon);
                                                    const gradient = service.gradient || 'from-gray-500 to-gray-600';
                                                    return (
                                                        <div
                                                            key={service.id}
                                                            onClick={() => handleServiceClick(service)}
                                                            className="group flex items-center gap-3 p-3 sm:p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-white dark:hover:bg-gray-700 border border-transparent hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-md cursor-pointer transition-all duration-200"
                                                        >
                                                            <div className={`h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-md flex-shrink-0`}>
                                                                <IconComp className="h-5 w-5" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{localizedField(service, 'name')}</h3>
                                                                <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{localizedField(service, 'description')}</p>
                                                            </div>
                                                            <ArrowRight className={`h-4 w-4 text-gray-300 flex-shrink-0 ${isRTL ? 'rotate-180' : ''}`} />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </ScrollReveal>
                        )}
                    </div>


                    {/* ═══════════════════ AI ASSISTANT SECTION (One time only) ═══════════════════ */}
                    {(
                        <ScrollReveal delay={0.1}>
                            <div className="relative mt-8 sm:mt-10 rounded-2xl sm:rounded-3xl overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700" />
                                <div className="absolute inset-0 opacity-20">
                                    <div className="absolute top-0 right-0 w-60 sm:w-80 h-60 sm:h-80 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl" />
                                    <div className="absolute bottom-0 left-0 w-48 sm:w-64 h-48 sm:h-64 bg-purple-300/20 rounded-full translate-y-1/3 -translate-x-1/4 blur-3xl" />
                                </div>
                                <div className="relative p-6 sm:p-8 md:p-10 flex flex-col md:flex-row items-center gap-6">
                                    <div className="flex-1 text-center md:text-start">
                                        <Badge className="bg-white/20 text-white mb-3 backdrop-blur-sm border-white/10 text-xs">
                                            <Sparkles className="w-3 h-3 ms-1" />
                                            {t('services.aiBadge' as any)}
                                        </Badge>
                                        <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">{t('services.aiTitle' as any)}</h2>
                                        <p className="text-white/80 mb-5 text-sm sm:text-base leading-relaxed max-w-lg mx-auto md:mx-0">
                                            {t('services.ctaDesc' as any)}
                                        </p>
                                        <div className="flex flex-wrap gap-2 mb-5 justify-center md:justify-start">
                                            {[t('services.aiFeature1' as any), t('services.aiFeature2' as any), t('services.aiFeature3' as any)].filter(Boolean).map((f) => (
                                                <span key={f} className="inline-flex items-center gap-1 bg-white/15 text-white text-xs px-2.5 py-1 rounded-full border border-white/10">
                                                    <CheckCircle className="w-3 h-3" /> {f}
                                                </span>
                                            ))}
                                        </div>
                                        <Button
                                            size="lg"
                                            className="bg-white text-indigo-600 hover:bg-white/90 shadow-xl font-bold rounded-xl"
                                            onClick={() => router.push('/services/ai-assistant')}
                                        >
                                            <Rocket className="h-4 w-4 sm:h-5 sm:w-5 me-2" />
                                            {t('services.ctaButton' as any)}
                                        </Button>
                                    </div>
                                    <div className="hidden md:flex shrink-0">
                                        <div className="relative">
                                            <div className="h-32 w-32 lg:h-40 lg:w-40 rounded-3xl bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/20 shadow-2xl">
                                                <Bot className="h-16 w-16 lg:h-20 lg:w-20 text-white/80" />
                                            </div>
                                            <div className="absolute -top-3 -right-3 h-10 w-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center animate-pulse border border-white/10">
                                                <Sparkles className="h-5 w-5 text-white" />
                                            </div>
                                            <div className="absolute -bottom-2 -left-2 h-8 w-8 rounded-xl bg-emerald-400/30 backdrop-blur-sm flex items-center justify-center border border-white/10">
                                                <Brain className="h-4 w-4 text-white" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </ScrollReveal>
                    )}


                    {/* ═══════════════════ QUICK LINKS ═══════════════════ */}
                    <div className="text-center py-6 sm:py-8 mt-4 border-t border-gray-200 dark:border-gray-800">
                        <p className="text-gray-500 dark:text-gray-400 mb-3 text-sm">{t('services.quickLinks' as any)}</p>
                        <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                            <Link href="/marketplace" className="text-primary hover:underline text-xs sm:text-sm font-medium flex items-center gap-1">
                                <FolderOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                {t('services.storeLink' as any)}
                            </Link>
                            <span className="text-gray-300 dark:text-gray-600">|</span>
                            <Link href="/dashboard" className="text-primary hover:underline text-xs sm:text-sm font-medium flex items-center gap-1">
                                <PieChart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                {t('services.dashboardLink' as any)}
                            </Link>
                            <span className="text-gray-300 dark:text-gray-600">|</span>
                            <Link href="/settings" className="text-primary hover:underline text-xs sm:text-sm font-medium flex items-center gap-1">
                                <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                {t('services.settingsLink' as any)}
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
