'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    BarChart3,
    Award,
    ClipboardList,
    Trophy,
    FileQuestion,
    Bot,
    FileText,
    Users,
    GraduationCap,
    Target,
    BookOpen,
    Calendar,
    Search,
    ArrowLeft,
    Star,
    Sparkles,
    CheckCircle,
    TrendingUp,
    Zap,
    ChevronLeft,
    Clock,
    Shield,
    Layers,
    PieChart,
    LineChart,
    FolderOpen,
    Briefcase,
    Settings,
    Play,
    FileSpreadsheet,
    FolderArchive,
    CalendarDays,
    ClipboardCheck,
    ScrollText,
    Brain,
    Lightbulb,
    LayoutGrid,
    ArrowRight,
} from 'lucide-react';

// تصنيفات الخدمات
const SERVICE_CATEGORIES = [
    { id: 'all', name: 'جميع الخدمات', icon: LayoutGrid, color: 'bg-gray-500' },
    { id: 'analysis', name: 'التحليل والتقييم', icon: BarChart3, color: 'bg-blue-500' },
    { id: 'documents', name: 'الوثائق والشهادات', icon: FileText, color: 'bg-amber-500' },
    { id: 'planning', name: 'التخطيط والإدارة', icon: ClipboardList, color: 'bg-green-500' },
    { id: 'records', name: 'السجلات والتوثيق', icon: FolderArchive, color: 'bg-purple-500' },
    { id: 'ai', name: 'الذكاء الاصطناعي', icon: Bot, color: 'bg-indigo-500' },
];

// جميع الخدمات التعليمية (13 خدمة)
const SERVICES = [
    {
        id: 'analyses',
        slug: 'analyses',
        category: 'analysis',
        title: 'تحليل النتائج',
        titleEn: 'Results Analysis',
        description: 'تحليل نتائج الاختبارات واستخراج التقارير والإحصائيات التفصيلية مع رسوم بيانية تفاعلية',
        icon: BarChart3,
        color: 'bg-blue-500',
        gradient: 'from-blue-500 to-blue-600',
        features: ['تحليل درجات الطلاب', 'استخراج الإحصائيات', 'تحديد نقاط القوة والضعف', 'تقارير مفصلة', 'رسوم بيانية تفاعلية', 'توصيات ذكية'],
        stats: { users: '2,500+', usage: '10,000+' },
        isNew: false,
        isPopular: true,
        isPremium: false,
    },
    {
        id: 'certificates',
        slug: 'certificates',
        category: 'documents',
        title: 'الشهادات والتقدير',
        titleEn: 'Certificates',
        description: 'إنشاء شهادات الشكر والتقدير والتخرج بتصاميم احترافية متعددة مع إنشاء جماعي',
        icon: Award,
        color: 'bg-amber-500',
        gradient: 'from-amber-500 to-orange-500',
        features: ['شهادات تقدير', 'شهادات شكر', 'شهادات تخرج', 'إنشاء متعدد', 'قوالب احترافية', 'تخصيص كامل'],
        stats: { users: '5,000+', usage: '50,000+' },
        isNew: false,
        isPopular: true,
        isPremium: false,
    },
    {
        id: 'plans',
        slug: 'plans',
        category: 'planning',
        title: 'الخطط التعليمية',
        titleEn: 'Educational Plans',
        description: 'إنشاء الخطط العلاجية والإثرائية وتوزيع المنهج مع متابعة التنفيذ',
        icon: ClipboardList,
        color: 'bg-green-500',
        gradient: 'from-green-500 to-emerald-500',
        features: ['خطط علاجية', 'خطط إثرائية', 'توزيع المنهج', 'خطط أسبوعية', 'متابعة التنفيذ'],
        stats: { users: '3,000+', usage: '15,000+' },
        isNew: false,
        isPopular: true,
        isPremium: false,
    },
    {
        id: 'distributions',
        slug: 'distributions',
        category: 'planning',
        title: 'التوزيعات',
        titleEn: 'Distributions',
        description: 'إعداد توزيعات المنهج الأسبوعية والشهرية والفصلية بشكل منظم واحترافي',
        icon: CalendarDays,
        color: 'bg-teal-500',
        gradient: 'from-teal-500 to-cyan-500',
        features: ['توزيع أسبوعي', 'توزيع شهري', 'توزيع فصلي', 'جدول الحصص', 'تصدير PDF', 'قوالب جاهزة'],
        stats: { users: '2,800+', usage: '12,000+' },
        isNew: true,
        isPopular: false,
        isPremium: false,
    },
    {
        id: 'achievements',
        slug: 'achievements',
        category: 'records',
        title: 'توثيق الإنجازات',
        titleEn: 'Achievements',
        description: 'توثيق الإنجازات اليومية والأسبوعية والشهرية بشكل منظم واحترافي',
        icon: Trophy,
        color: 'bg-purple-500',
        gradient: 'from-purple-500 to-violet-500',
        features: ['إنجازات يومية', 'إنجازات أسبوعية', 'إنجازات شهرية', 'تقارير الإنجاز', 'ملف إنجاز رقمي'],
        stats: { users: '4,000+', usage: '100,000+' },
        isNew: false,
        isPopular: false,
        isPremium: false,
    },
    {
        id: 'portfolio',
        slug: 'portfolio',
        category: 'records',
        title: 'ملف الإنجاز',
        titleEn: 'Portfolio',
        description: 'ملف إنجاز رقمي شامل يجمع جميع الشهادات والإنجازات والتدريبات والمشاركات',
        icon: FolderArchive,
        color: 'bg-rose-500',
        gradient: 'from-rose-500 to-pink-500',
        features: ['ملف إنجاز متكامل', 'تصنيف تلقائي', 'رفع المرفقات', 'جدول زمني', 'تصدير احترافي', 'مشاركة رقمية'],
        stats: { users: '3,500+', usage: '25,000+' },
        isNew: true,
        isPopular: true,
        isPremium: false,
    },
    {
        id: 'performance',
        slug: 'performance',
        category: 'analysis',
        title: 'تقييم الأداء',
        titleEn: 'Performance Evaluation',
        description: 'إدارة تقييمات الأداء الوظيفي وشواهد الأداء للمعلمين مع مؤشرات KPIs',
        icon: Target,
        color: 'bg-red-500',
        gradient: 'from-red-500 to-rose-500',
        features: ['تقييم ذاتي', 'تقييم المشرف', 'شواهد الأداء', 'تقارير الأداء', 'مؤشرات KPIs'],
        stats: { users: '2,000+', usage: '8,000+' },
        isNew: false,
        isPopular: true,
        isPremium: false,
    },
    {
        id: 'work-evidence',
        slug: 'work-evidence',
        category: 'records',
        title: 'شواهد الأداء الوظيفي',
        titleEn: 'Work Performance Evidence',
        description: 'توثيق شواهد الأداء الوظيفي الـ 11 بند المعتمدة مع رفع المرفقات والأدلة',
        icon: ClipboardCheck,
        color: 'bg-sky-500',
        gradient: 'from-sky-500 to-blue-500',
        features: ['11 بند معتمد', 'رفع الشواهد', 'تصنيف تلقائي', 'تقرير شامل', 'ربط بالأداء', 'تحميل PDF'],
        stats: { users: '1,800+', usage: '6,000+' },
        isNew: true,
        isPopular: false,
        isPremium: false,
    },
    {
        id: 'knowledge-production',
        slug: 'knowledge-production',
        category: 'records',
        title: 'الإنتاج المعرفي',
        titleEn: 'Knowledge Production',
        description: 'توثيق وإدارة الإنتاج المعرفي للمعلم من أبحاث ومقالات وأوراق عمل ومبادرات',
        icon: Lightbulb,
        color: 'bg-yellow-500',
        gradient: 'from-yellow-500 to-amber-500',
        features: ['أبحاث ومقالات', 'أوراق عمل', 'مبادرات تعليمية', 'مشاريع طلابية', 'تصنيف وأرشفة', 'تصدير احترافي'],
        stats: { users: '1,200+', usage: '4,000+' },
        isNew: true,
        isPopular: false,
        isPremium: false,
    },
    {
        id: 'follow-up-log',
        slug: 'follow-up-log',
        category: 'records',
        title: 'سجل المتابعة',
        titleEn: 'Follow-up Log',
        description: 'سجل متابعة شامل لتوثيق الزيارات والملاحظات والتوصيات ومتابعة التنفيذ',
        icon: ScrollText,
        color: 'bg-emerald-500',
        gradient: 'from-emerald-500 to-green-500',
        features: ['سجل الزيارات', 'الملاحظات', 'التوصيات', 'متابعة التنفيذ', 'تقارير دورية', 'إشعارات تذكير'],
        stats: { users: '1,500+', usage: '7,000+' },
        isNew: true,
        isPopular: false,
        isPremium: false,
    },
    {
        id: 'tests',
        slug: 'tests',
        category: 'analysis',
        title: 'الاختبارات',
        titleEn: 'Tests & Exams',
        description: 'إنشاء وإدارة الاختبارات وتسجيل درجات الطلاب مع بنك أسئلة شامل',
        icon: FileQuestion,
        color: 'bg-cyan-500',
        gradient: 'from-cyan-500 to-teal-500',
        features: ['إنشاء اختبارات', 'تسجيل الدرجات', 'تحليل النتائج', 'تقارير الطلاب', 'بنك الأسئلة'],
        stats: { users: '1,500+', usage: '5,000+' },
        isNew: false,
        isPopular: false,
        isPremium: false,
    },
    {
        id: 'ai-assistant',
        slug: 'ai-assistant',
        category: 'ai',
        title: 'المساعد الذكي',
        titleEn: 'AI Assistant',
        description: 'مساعد ذكي يساعدك في إعداد الخطط والتقارير باستخدام الذكاء الاصطناعي المتقدم',
        icon: Bot,
        color: 'bg-indigo-500',
        gradient: 'from-indigo-500 to-purple-600',
        features: ['إعداد الخطط', 'كتابة التقارير', 'اقتراحات ذكية', 'محادثة تفاعلية', 'تحليل البيانات'],
        stats: { users: '1,000+', usage: '20,000+' },
        isNew: false,
        isPopular: true,
        isPremium: true,
    },
    {
        id: 'my-templates',
        slug: 'my-templates',
        category: 'documents',
        title: 'قوالبي المحفوظة',
        titleEn: 'My Templates',
        description: 'إدارة القوالب المحفوظة والمشتراة والمفضلة مع إعادة التحرير',
        icon: FolderOpen,
        color: 'bg-orange-500',
        gradient: 'from-orange-500 to-amber-500',
        features: ['القوالب المشتراة', 'القوالب المفضلة', 'القوالب المحفوظة', 'سجل الاستخدام', 'إعادة التحرير'],
        stats: { users: '8,000+', usage: '200,000+' },
        isNew: false,
        isPopular: true,
        isPremium: false,
    },
];

// الإحصائيات العامة
const GENERAL_STATS = [
    { label: 'خدمة متاحة', value: SERVICES.length, icon: Zap, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
    { label: 'خدمة شائعة', value: SERVICES.filter(s => s.isPopular).length, icon: Star, color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' },
    { label: 'خدمة جديدة', value: SERVICES.filter(s => s.isNew).length, icon: Sparkles, color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' },
    { label: 'تصنيف', value: SERVICE_CATEGORIES.length - 1, icon: Layers, color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' },
];

export default function ServicesPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const filteredServices = SERVICES.filter(service => {
        const matchesSearch = service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            service.titleEn.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeCategory === 'all' || service.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    const popularServices = SERVICES.filter(s => s.isPopular);
    const newServices = SERVICES.filter(s => s.isNew);

    const handleServiceClick = (service: typeof SERVICES[0]) => {
        router.push(`/services/${service.slug}`);
    };

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
                                مجموعة متكاملة من {SERVICES.length} خدمة وأداة تعليمية تساعدك في إنجاز مهامك التعليمية بكفاءة واحترافية عالية
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
                            {SERVICE_CATEGORIES.map((category) => (
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
                                            ? SERVICES.length 
                                            : SERVICES.filter(s => s.category === category.id).length}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* New Services Banner */}
                    {activeCategory === 'all' && searchQuery === '' && newServices.length > 0 && (
                        <div className="mb-10">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="h-10 w-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                                    <Sparkles className="h-5 w-5 text-green-600 dark:text-green-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">خدمات جديدة</h2>
                                <Badge className="bg-green-500 text-white">{newServices.length} جديد</Badge>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {newServices.map((service) => (
                                    <Card
                                        key={service.id}
                                        className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-white dark:bg-gray-800 overflow-hidden"
                                        onClick={() => handleServiceClick(service)}
                                    >
                                        <div className={`h-1.5 bg-gradient-to-r ${service.gradient}`} />
                                        <CardContent className="p-5 flex items-center gap-4">
                                            <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${service.gradient} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                                                <service.icon className="h-7 w-7" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="font-bold text-gray-900 dark:text-white">{service.title}</p>
                                                    <Badge className="bg-green-500 text-white text-[10px] px-1.5 py-0">جديد</Badge>
                                                </div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{service.description}</p>
                                            </div>
                                            <ArrowLeft className="h-5 w-5 text-gray-400 group-hover:text-primary transition-colors" />
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Services Grid */}
                    {filteredServices.length === 0 ? (
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
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
                            {filteredServices.map((service) => (
                                <Card
                                    key={service.id}
                                    className="group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border-0 bg-white dark:bg-gray-800"
                                    onClick={() => handleServiceClick(service)}
                                >
                                    {/* Card Header with Gradient */}
                                    <div className={`h-2 bg-gradient-to-r ${service.gradient}`} />
                                    
                                    <CardHeader className="pb-4">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${service.gradient} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                                <service.icon className="h-7 w-7" />
                                            </div>
                                            <div className="flex flex-col gap-1 items-end">
                                                {service.isNew && (
                                                    <Badge className="bg-green-500 text-white text-xs">جديد</Badge>
                                                )}
                                                {service.isPremium && (
                                                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs">
                                                        <Sparkles className="w-3 h-3 ml-1" />
                                                        مميز
                                                    </Badge>
                                                )}
                                                {service.isPopular && !service.isNew && (
                                                    <Badge variant="outline" className="border-yellow-500 text-yellow-600 dark:text-yellow-400 text-xs">
                                                        <Star className="h-3 w-3 ml-1 fill-yellow-500" />
                                                        شائع
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        <CardTitle className="text-xl group-hover:text-primary transition-colors">
                                            {service.title}
                                        </CardTitle>
                                        <CardDescription className="line-clamp-2 text-gray-500 dark:text-gray-400">
                                            {service.description}
                                        </CardDescription>
                                    </CardHeader>
                                    
                                    <CardContent className="pt-0">
                                        {/* Features */}
                                        <ul className="space-y-2 mb-5">
                                            {service.features.slice(0, 3).map((feature, index) => (
                                                <li key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                                                    {feature}
                                                </li>
                                            ))}
                                            {service.features.length > 3 && (
                                                <li className="text-sm text-primary font-medium">
                                                    +{service.features.length - 3} ميزات أخرى
                                                </li>
                                            )}
                                        </ul>

                                        {/* Stats */}
                                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-5 pb-5 border-b border-gray-100 dark:border-gray-700">
                                            <span className="flex items-center gap-1">
                                                <Users className="w-3 h-3" />
                                                {service.stats.users} مستخدم
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <TrendingUp className="w-3 h-3" />
                                                {service.stats.usage} استخدام
                                            </span>
                                        </div>

                                        {/* CTA Button */}
                                        <Button className={`w-full bg-gradient-to-r ${service.gradient} hover:opacity-90 text-white shadow-md`}>
                                            <Play className="h-4 w-4 ml-2" />
                                            استخدام الخدمة
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Popular Services Section */}
                    {activeCategory === 'all' && searchQuery === '' && (
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
                                {popularServices.slice(0, 4).map((service) => (
                                    <Card
                                        key={service.id}
                                        className="hover:shadow-lg transition-all duration-300 cursor-pointer border-0 bg-white dark:bg-gray-800"
                                        onClick={() => handleServiceClick(service)}
                                    >
                                        <CardContent className="p-5 flex items-center gap-4">
                                            <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${service.gradient} flex items-center justify-center text-white shadow-md`}>
                                                <service.icon className="h-6 w-6" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-gray-900 dark:text-white truncate">{service.title}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                                    {service.stats.users} مستخدم
                                                </p>
                                            </div>
                                            <ArrowLeft className="h-5 w-5 text-gray-400" />
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* AI Features Section */}
                    {activeCategory === 'all' && searchQuery === '' && (
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
