'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    BarChart3, Award, ClipboardList, Trophy, FileQuestion, Bot, FileText, Users,
    GraduationCap, Target, BookOpen, Calendar, Search, ArrowLeft, Star, Sparkles,
    CheckCircle, TrendingUp, Zap, ChevronLeft, Clock, Shield, Layers, PieChart,
    LineChart, FolderOpen, Briefcase, Settings, Play, FileSpreadsheet, FolderArchive,
    CalendarDays, ClipboardCheck, ScrollText, Brain, Lightbulb, LayoutGrid, ArrowRight,
} from 'lucide-react';
import type { ServiceDefinition } from '@/types';

// ===== Icon Mapping: maps string icon names from Firestore to Lucide components =====
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
    'LayoutGrid': LayoutGrid, 'ArrowRight': ArrowRight,
};

function getIcon(iconName: string) {
    return ICON_MAP[iconName] || FileText;
}

// ===== Default categories (fallback) =====
const DEFAULT_CATEGORIES = [
    { id: 'all', name: 'جميع الخدمات', icon: LayoutGrid, color: 'bg-gray-500' },
    { id: 'analysis', name: 'التحليل والتقييم', icon: BarChart3, color: 'bg-blue-500' },
    { id: 'documents', name: 'الوثائق والشهادات', icon: FileText, color: 'bg-amber-500' },
    { id: 'planning', name: 'التخطيط والإدارة', icon: ClipboardList, color: 'bg-green-500' },
    { id: 'records', name: 'السجلات والتوثيق', icon: FolderArchive, color: 'bg-purple-500' },
    { id: 'ai', name: 'الذكاء الاصطناعي', icon: Bot, color: 'bg-indigo-500' },
];

// ===== Default services (fallback when Firestore is empty/unavailable) =====
const DEFAULT_SERVICES: ServiceDefinition[] = [
    {
        id: 'analyses', slug: 'analyses', category: 'analysis',
        name_ar: 'تحليل النتائج', name_en: 'Results Analysis',
        description_ar: 'تحليل نتائج الاختبارات واستخراج التقارير والإحصائيات التفصيلية مع رسوم بيانية تفاعلية',
        description_en: 'Analyze test results and generate detailed reports with interactive charts',
        icon: 'BarChart3', color: 'bg-blue-500', gradient: 'from-blue-500 to-blue-600',
        route: '/analyses', features: [], is_active: true, sort_order: 1,
        requires_auth: false, requires_subscription: false,
        is_new: false, is_popular: true, is_premium: false,
    },
    {
        id: 'certificates', slug: 'certificates', category: 'documents',
        name_ar: 'الشهادات والتقدير', name_en: 'Certificates',
        description_ar: 'إنشاء شهادات الشكر والتقدير والتخرج بتصاميم احترافية متعددة مع إنشاء جماعي',
        description_en: 'Create appreciation and graduation certificates with professional designs',
        icon: 'Award', color: 'bg-amber-500', gradient: 'from-amber-500 to-orange-500',
        route: '/certificates', features: [], is_active: true, sort_order: 2,
        requires_auth: false, requires_subscription: false,
        is_new: false, is_popular: true, is_premium: false,
    },
    {
        id: 'plans', slug: 'plans', category: 'planning',
        name_ar: 'الخطط التعليمية', name_en: 'Educational Plans',
        description_ar: 'إنشاء الخطط العلاجية والإثرائية وتوزيع المنهج مع متابعة التنفيذ',
        description_en: 'Create remedial and enrichment plans with curriculum distribution',
        icon: 'ClipboardList', color: 'bg-green-500', gradient: 'from-green-500 to-emerald-500',
        route: '/plans', features: [], is_active: true, sort_order: 3,
        requires_auth: false, requires_subscription: false,
        is_new: false, is_popular: true, is_premium: false,
    },
    {
        id: 'distributions', slug: 'distributions', category: 'planning',
        name_ar: 'التوزيعات', name_en: 'Distributions',
        description_ar: 'إعداد توزيعات المنهج الأسبوعية والشهرية والفصلية بشكل منظم واحترافي',
        description_en: 'Prepare weekly, monthly and semester curriculum distributions',
        icon: 'CalendarDays', color: 'bg-teal-500', gradient: 'from-teal-500 to-cyan-500',
        route: '/distributions', features: [], is_active: true, sort_order: 4,
        requires_auth: false, requires_subscription: false,
        is_new: true, is_popular: false, is_premium: false,
    },
    {
        id: 'achievements', slug: 'achievements', category: 'records',
        name_ar: 'توثيق الإنجازات', name_en: 'Achievements',
        description_ar: 'توثيق الإنجازات اليومية والأسبوعية والشهرية بشكل منظم واحترافي',
        description_en: 'Document daily, weekly, and monthly achievements',
        icon: 'Trophy', color: 'bg-purple-500', gradient: 'from-purple-500 to-violet-500',
        route: '/achievements', features: [], is_active: true, sort_order: 5,
        requires_auth: false, requires_subscription: false,
        is_new: false, is_popular: false, is_premium: false,
    },
    {
        id: 'portfolio', slug: 'portfolio', category: 'records',
        name_ar: 'ملف الإنجاز', name_en: 'Portfolio',
        description_ar: 'ملف إنجاز رقمي شامل يجمع جميع الشهادات والإنجازات والتدريبات والمشاركات',
        description_en: 'Comprehensive digital portfolio for certificates and achievements',
        icon: 'FolderArchive', color: 'bg-rose-500', gradient: 'from-rose-500 to-pink-500',
        route: '/portfolio', features: [], is_active: true, sort_order: 6,
        requires_auth: false, requires_subscription: false,
        is_new: true, is_popular: true, is_premium: false,
    },
    {
        id: 'performance', slug: 'performance', category: 'analysis',
        name_ar: 'تقييم الأداء', name_en: 'Performance Evaluation',
        description_ar: 'إدارة تقييمات الأداء الوظيفي وشواهد الأداء للمعلمين مع مؤشرات KPIs',
        description_en: 'Manage performance evaluations with KPIs',
        icon: 'Target', color: 'bg-red-500', gradient: 'from-red-500 to-rose-500',
        route: '/work-evidence', features: [], is_active: true, sort_order: 7,
        requires_auth: false, requires_subscription: false,
        is_new: false, is_popular: true, is_premium: false,
    },
    {
        id: 'work-evidence', slug: 'work-evidence', category: 'records',
        name_ar: 'شواهد الأداء الوظيفي', name_en: 'Work Performance Evidence',
        description_ar: 'توثيق شواهد الأداء الوظيفي الـ 11 بند المعتمدة مع رفع المرفقات والأدلة',
        description_en: 'Document the 11 approved work performance evidence items',
        icon: 'ClipboardCheck', color: 'bg-sky-500', gradient: 'from-sky-500 to-blue-500',
        route: '/work-evidence', features: [], is_active: true, sort_order: 8,
        requires_auth: false, requires_subscription: false,
        is_new: true, is_popular: false, is_premium: false,
    },
    {
        id: 'knowledge-production', slug: 'knowledge-production', category: 'records',
        name_ar: 'الإنتاج المعرفي', name_en: 'Knowledge Production',
        description_ar: 'توثيق وإدارة الإنتاج المعرفي للمعلم من أبحاث ومقالات وأوراق عمل ومبادرات',
        description_en: 'Document knowledge production including research and articles',
        icon: 'Lightbulb', color: 'bg-yellow-500', gradient: 'from-yellow-500 to-amber-500',
        route: '/knowledge-production', features: [], is_active: true, sort_order: 9,
        requires_auth: false, requires_subscription: false,
        is_new: true, is_popular: false, is_premium: false,
    },
    {
        id: 'follow-up-log', slug: 'follow-up-log', category: 'records',
        name_ar: 'سجل المتابعة', name_en: 'Follow-up Log',
        description_ar: 'سجل متابعة شامل لتوثيق الزيارات والملاحظات والتوصيات ومتابعة التنفيذ',
        description_en: 'Comprehensive follow-up log for visits and recommendations',
        icon: 'ScrollText', color: 'bg-emerald-500', gradient: 'from-emerald-500 to-green-500',
        route: '/follow-up-log', features: [], is_active: true, sort_order: 10,
        requires_auth: false, requires_subscription: false,
        is_new: true, is_popular: false, is_premium: false,
    },
    {
        id: 'tests', slug: 'tests', category: 'analysis',
        name_ar: 'الاختبارات', name_en: 'Tests & Exams',
        description_ar: 'إنشاء وإدارة الاختبارات وتسجيل درجات الطلاب مع بنك أسئلة شامل',
        description_en: 'Create and manage tests with comprehensive question bank',
        icon: 'FileQuestion', color: 'bg-cyan-500', gradient: 'from-cyan-500 to-teal-500',
        route: '/tests', features: [], is_active: true, sort_order: 11,
        requires_auth: false, requires_subscription: false,
        is_new: false, is_popular: false, is_premium: false,
    },
    {
        id: 'ai-assistant', slug: 'ai-assistant', category: 'ai',
        name_ar: 'المساعد الذكي', name_en: 'AI Assistant',
        description_ar: 'مساعد ذكي يساعدك في إعداد الخطط والتقارير باستخدام الذكاء الاصطناعي المتقدم',
        description_en: 'AI assistant for plans and reports',
        icon: 'Bot', color: 'bg-indigo-500', gradient: 'from-indigo-500 to-purple-600',
        route: '/ai-assistant', features: [], is_active: true, sort_order: 12,
        requires_auth: false, requires_subscription: true,
        is_new: false, is_popular: true, is_premium: true,
    },
    {
        id: 'my-templates', slug: 'my-templates', category: 'documents',
        name_ar: 'قوالبي المحفوظة', name_en: 'My Templates',
        description_ar: 'إدارة القوالب المحفوظة والمشتراة والمفضلة مع إعادة التحرير',
        description_en: 'Manage saved, purchased, and favorite templates',
        icon: 'FolderOpen', color: 'bg-orange-500', gradient: 'from-orange-500 to-amber-500',
        route: '/marketplace', features: [], is_active: true, sort_order: 13,
        requires_auth: true, requires_subscription: false,
        is_new: false, is_popular: true, is_premium: false,
    },
];

export default function ServicesPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [services, setServices] = useState<ServiceDefinition[]>(DEFAULT_SERVICES);
    const [isLoading, setIsLoading] = useState(true);
    const [dataSource, setDataSource] = useState<'firestore' | 'fallback'>('fallback');

    // Load services from Firestore with fallback
    useEffect(() => {
        const loadServices = async () => {
            try {
                const { getServices } = await import('@/lib/firestore-service');
                const firestoreServices = await getServices();
                if (firestoreServices && firestoreServices.length > 0) {
                    setServices(firestoreServices);
                    setDataSource('firestore');
                } else {
                    setDataSource('fallback');
                }
            } catch (error) {
                console.log('Using fallback services data');
                setDataSource('fallback');
            } finally {
                setIsLoading(false);
            }
        };
        loadServices();
    }, []);

    const filteredServices = services.filter(service => {
        if (!service.is_active) return false;
        const matchesSearch = service.name_ar.toLowerCase().includes(searchQuery.toLowerCase()) ||
            service.description_ar.toLowerCase().includes(searchQuery.toLowerCase()) ||
            service.name_en.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeCategory === 'all' || service.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    const popularServices = services.filter(s => s.is_popular && s.is_active);
    const newServices = services.filter(s => s.is_new && s.is_active);

    const handleServiceClick = (service: ServiceDefinition) => {
        if (service.route) {
            router.push(service.route);
        } else {
            router.push(`/services/${service.slug}`);
        }
    };

    // Derive unique categories from services data
    const derivedCategories = [
        { id: 'all', name: 'جميع الخدمات', icon: LayoutGrid, color: 'bg-gray-500' },
        ...Array.from(new Set(services.map(s => s.category))).map(cat => {
            const defaultCat = DEFAULT_CATEGORIES.find(c => c.id === cat);
            return defaultCat || { id: cat, name: cat, icon: FileText, color: 'bg-gray-500' };
        }),
    ];

    const GENERAL_STATS = [
        { label: 'خدمة متاحة', value: services.filter(s => s.is_active).length, icon: Zap, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
        { label: 'خدمة شائعة', value: popularServices.length, icon: Star, color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' },
        { label: 'خدمة جديدة', value: newServices.length, icon: Sparkles, color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' },
        { label: 'تصنيف', value: derivedCategories.length - 1, icon: Layers, color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
            <Navbar />
            <main>
                {/* Hero Section */}
                <div className="bg-gradient-to-br from-primary via-primary/90 to-blue-700 text-white">
                    <div className="container mx-auto px-4 py-16">
                        <div className="text-center max-w-3xl mx-auto">
                            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium mb-6">
                                <Briefcase className="w-4 h-4" />
                                منصة الخدمات التعليمية المتكاملة
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                                الخدمات التعليمية
                            </h1>
                            <p className="text-lg text-white/80 mb-8 leading-relaxed">
                                مجموعة متكاملة من {services.filter(s => s.is_active).length} خدمة وأداة تعليمية تساعدك في إنجاز مهامك التعليمية بكفاءة واحترافية عالية
                            </p>

                            {/* Search */}
                            <div className="max-w-xl mx-auto">
                                <div className="relative">
                                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <Input
                                        placeholder="ابحث عن خدمة... (مثال: تحليل، شهادات، خطط)"
                                        className="pr-12 py-6 text-lg rounded-2xl border-0 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-xl"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Data source indicator (dev only) */}
                            {dataSource === 'firestore' && (
                                <div className="mt-4">
                                    <Badge className="bg-green-500/20 text-green-200 text-xs">
                                        <CheckCircle className="w-3 h-3 ml-1" />
                                        البيانات من Firestore
                                    </Badge>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-4 py-8">
                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 -mt-12 mb-10">
                        {GENERAL_STATS.map((stat, index) => (
                            <Card key={index} className="border-0 shadow-lg bg-white dark:bg-gray-800">
                                <CardContent className="p-5 flex items-center gap-4">
                                    <div className={`h-12 w-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                                        <stat.icon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Categories Tabs */}
                    <div className="mb-10">
                        <div className="flex flex-wrap justify-center gap-3">
                            {derivedCategories.map((category) => (
                                <button
                                    key={category.id}
                                    onClick={() => setActiveCategory(category.id)}
                                    className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all duration-300 ${
                                        activeCategory === category.id
                                            ? `${category.color} text-white shadow-lg scale-105`
                                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                                    }`}
                                >
                                    <category.icon className="h-5 w-5" />
                                    {category.name}
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                                        activeCategory === category.id
                                            ? 'bg-white/20'
                                            : 'bg-gray-100 dark:bg-gray-700'
                                    }`}>
                                        {category.id === 'all'
                                            ? services.filter(s => s.is_active).length
                                            : services.filter(s => s.category === category.id && s.is_active).length}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Loading State */}
                    {isLoading && (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                    )}

                    {/* New Services Banner */}
                    {!isLoading && activeCategory === 'all' && searchQuery === '' && newServices.length > 0 && (
                        <div className="mb-10">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="h-10 w-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                                    <Sparkles className="h-5 w-5 text-green-600 dark:text-green-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">خدمات جديدة</h2>
                                <Badge className="bg-green-500 text-white">{newServices.length} جديد</Badge>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {newServices.map((service) => {
                                    const IconComp = getIcon(service.icon);
                                    const gradient = service.gradient || 'from-gray-500 to-gray-600';
                                    return (
                                        <Card
                                            key={service.id}
                                            className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-white dark:bg-gray-800 overflow-hidden"
                                            onClick={() => handleServiceClick(service)}
                                        >
                                            <div className={`h-1.5 bg-gradient-to-r ${gradient}`} />
                                            <CardContent className="p-5 flex items-center gap-4">
                                                <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                                                    <IconComp className="h-7 w-7" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="font-bold text-gray-900 dark:text-white">{service.name_ar}</p>
                                                        <Badge className="bg-green-500 text-white text-[10px] px-1.5 py-0">جديد</Badge>
                                                    </div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{service.description_ar}</p>
                                                </div>
                                                <ArrowLeft className="h-5 w-5 text-gray-400 group-hover:text-primary transition-colors" />
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Services Grid */}
                    {!isLoading && filteredServices.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Search className="h-10 w-10 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">لا توجد نتائج</h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6">
                                جرب البحث بكلمات مختلفة أو اختر تصنيفاً آخر
                            </p>
                            <Button onClick={() => { setSearchQuery(''); setActiveCategory('all'); }} variant="outline" className="rounded-xl">
                                عرض جميع الخدمات
                            </Button>
                        </div>
                    ) : !isLoading && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
                            {filteredServices.map((service) => {
                                const IconComp = getIcon(service.icon);
                                const gradient = service.gradient || 'from-gray-500 to-gray-600';
                                const featureNames = service.features?.map(f =>
                                    typeof f === 'string' ? f : f.title_ar
                                ) || [];

                                return (
                                    <Card
                                        key={service.id}
                                        className="group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border-0 bg-white dark:bg-gray-800"
                                        onClick={() => handleServiceClick(service)}
                                    >
                                        {/* Card Header with Gradient */}
                                        <div className={`h-2 bg-gradient-to-r ${gradient}`} />

                                        <CardHeader className="pb-4">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                                    <IconComp className="h-7 w-7" />
                                                </div>
                                                <div className="flex flex-col gap-1 items-end">
                                                    {service.is_new && (
                                                        <Badge className="bg-green-500 text-white text-xs">جديد</Badge>
                                                    )}
                                                    {service.is_premium && (
                                                        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs">
                                                            <Sparkles className="w-3 h-3 ml-1" />
                                                            مميز
                                                        </Badge>
                                                    )}
                                                    {service.is_popular && !service.is_new && (
                                                        <Badge variant="outline" className="border-yellow-500 text-yellow-600 dark:text-yellow-400 text-xs">
                                                            <Star className="h-3 w-3 ml-1 fill-yellow-500" />
                                                            شائع
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                            <CardTitle className="text-xl group-hover:text-primary transition-colors">
                                                {service.name_ar}
                                            </CardTitle>
                                            <CardDescription className="line-clamp-2 text-gray-500 dark:text-gray-400">
                                                {service.description_ar}
                                            </CardDescription>
                                        </CardHeader>

                                        <CardContent className="pt-0">
                                            {/* Features */}
                                            {featureNames.length > 0 && (
                                                <ul className="space-y-2 mb-5">
                                                    {featureNames.slice(0, 3).map((feature, index) => (
                                                        <li key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                                                            {feature}
                                                        </li>
                                                    ))}
                                                    {featureNames.length > 3 && (
                                                        <li className="text-sm text-primary font-medium">
                                                            +{featureNames.length - 3} ميزات أخرى
                                                        </li>
                                                    )}
                                                </ul>
                                            )}

                                            {/* Stats from service data */}
                                            {service.stats && service.stats.length > 0 && (
                                                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-5 pb-5 border-b border-gray-100 dark:border-gray-700">
                                                    {service.stats.slice(0, 2).map((stat, i) => (
                                                        <span key={i} className="flex items-center gap-1">
                                                            {(() => { const SI = getIcon(stat.icon); return <SI className="w-3 h-3" />; })()}
                                                            {stat.value} {stat.label_ar}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* CTA Button */}
                                            <Button className={`w-full bg-gradient-to-r ${gradient} hover:opacity-90 text-white shadow-md`}>
                                                <Play className="h-4 w-4 ml-2" />
                                                استخدام الخدمة
                                            </Button>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}

                    {/* Popular Services Section */}
                    {!isLoading && activeCategory === 'all' && searchQuery === '' && popularServices.length > 0 && (
                        <div className="mb-12">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                                    <div className="h-10 w-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center">
                                        <Star className="h-5 w-5 text-yellow-600 fill-yellow-500" />
                                    </div>
                                    الخدمات الأكثر استخداماً
                                </h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {popularServices.slice(0, 4).map((service) => {
                                    const IconComp = getIcon(service.icon);
                                    const gradient = service.gradient || 'from-gray-500 to-gray-600';
                                    return (
                                        <Card
                                            key={service.id}
                                            className="hover:shadow-lg transition-all duration-300 cursor-pointer border-0 bg-white dark:bg-gray-800"
                                            onClick={() => handleServiceClick(service)}
                                        >
                                            <CardContent className="p-5 flex items-center gap-4">
                                                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-md`}>
                                                    <IconComp className="h-6 w-6" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-gray-900 dark:text-white truncate">{service.name_ar}</p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                                        {service.name_en}
                                                    </p>
                                                </div>
                                                <ArrowLeft className="h-5 w-5 text-gray-400" />
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* AI Features Section */}
                    {!isLoading && activeCategory === 'all' && searchQuery === '' && (
                        <Card className="bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 text-white overflow-hidden border-0 shadow-2xl mb-12">
                            <CardContent className="p-8 md:p-12">
                                <div className="flex flex-col md:flex-row items-center gap-8">
                                    <div className="flex-1">
                                        <Badge className="bg-white/20 text-white mb-4 backdrop-blur-sm">
                                            <Sparkles className="w-3 h-3 ml-1" />
                                            مدعوم بالذكاء الاصطناعي
                                        </Badge>
                                        <h2 className="text-3xl font-bold mb-4">المساعد الذكي</h2>
                                        <p className="text-white/80 mb-6 text-lg leading-relaxed">
                                            استفد من قوة الذكاء الاصطناعي في إعداد الخطط والتقارير والشهادات.
                                            المساعد الذكي يفهم احتياجاتك ويقدم لك اقتراحات مخصصة لتوفير وقتك وجهدك.
                                        </p>
                                        <div className="flex flex-wrap gap-3 mb-8">
                                            {['إعداد الخطط', 'كتابة التقارير', 'اقتراحات ذكية', 'تحليل البيانات'].map((feature) => (
                                                <Badge key={feature} className="bg-white/20 text-white backdrop-blur-sm">
                                                    <CheckCircle className="w-3 h-3 ml-1" />
                                                    {feature}
                                                </Badge>
                                            ))}
                                        </div>
                                        <Button
                                            size="lg"
                                            className="bg-white text-indigo-600 hover:bg-white/90 shadow-xl"
                                            onClick={() => router.push('/services/ai-assistant')}
                                        >
                                            <Bot className="h-5 w-5 ml-2" />
                                            جرب المساعد الذكي
                                        </Button>
                                    </div>
                                    <div className="hidden md:flex">
                                        <div className="relative">
                                            <div className="h-48 w-48 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
                                                <Bot className="h-24 w-24 text-white/80" />
                                            </div>
                                            <div className="absolute -top-4 -right-4 h-16 w-16 rounded-full bg-white/20 flex items-center justify-center animate-pulse backdrop-blur-sm">
                                                <Sparkles className="h-8 w-8" />
                                            </div>
                                            <div className="absolute -bottom-2 -left-2 h-12 w-12 rounded-full bg-white/20 flex items-center justify-center animate-bounce backdrop-blur-sm">
                                                <Zap className="h-6 w-6" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Quick Links */}
                    <div className="text-center pb-8">
                        <p className="text-gray-500 dark:text-gray-400 mb-4">روابط سريعة</p>
                        <div className="flex flex-wrap justify-center gap-3">
                            <Link href="/marketplace" className="text-primary hover:underline text-sm font-medium flex items-center gap-1">
                                <FolderOpen className="w-4 h-4" />
                                سوق القوالب
                            </Link>
                            <span className="text-gray-300 dark:text-gray-600">|</span>
                            <Link href="/dashboard" className="text-primary hover:underline text-sm font-medium flex items-center gap-1">
                                <PieChart className="w-4 h-4" />
                                لوحة التحكم
                            </Link>
                            <span className="text-gray-300 dark:text-gray-600">|</span>
                            <Link href="/settings" className="text-primary hover:underline text-sm font-medium flex items-center gap-1">
                                <Settings className="w-4 h-4" />
                                الإعدادات
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
