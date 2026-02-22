'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    ArrowRight, BarChart3, Award, BookOpen, Trophy, Star, GraduationCap,
    FileText, Sparkles, CheckCircle2, Clock, Users, Zap, Play, Download,
    Share2, Heart, MessageSquare, Target, FileQuestion, Bot, FolderOpen,
    ChevronLeft, Shield, TrendingUp, HelpCircle, Layers, ArrowLeft,
    ExternalLink, ClipboardList, CalendarDays, ClipboardCheck, ScrollText,
    Lightbulb, FolderArchive, Brain, Settings, PieChart,
} from 'lucide-react';
import type { ServiceDefinition } from '@/types';

// ===== Icon Mapping =====
const ICON_MAP: Record<string, any> = {
    'BarChart3': BarChart3, 'Award': Award, 'ClipboardList': ClipboardList,
    'Trophy': Trophy, 'FileQuestion': FileQuestion, 'Bot': Bot, 'FileText': FileText,
    'Users': Users, 'GraduationCap': GraduationCap, 'Target': Target,
    'BookOpen': BookOpen, 'Star': Star, 'Sparkles': Sparkles,
    'CheckCircle2': CheckCircle2, 'TrendingUp': TrendingUp, 'Zap': Zap,
    'Clock': Clock, 'Shield': Shield, 'Layers': Layers, 'FolderOpen': FolderOpen,
    'FolderArchive': FolderArchive, 'CalendarDays': CalendarDays,
    'ClipboardCheck': ClipboardCheck, 'ScrollText': ScrollText,
    'Brain': Brain, 'Lightbulb': Lightbulb, 'Download': Download,
    'Share2': Share2, 'Heart': Heart, 'Play': Play, 'HelpCircle': HelpCircle,
    'ExternalLink': ExternalLink,
};

function getIcon(iconName: string) {
    return ICON_MAP[iconName] || FileText;
}

// ===== Fallback service data (for when Firestore is unavailable) =====
const FALLBACK_SERVICES: Record<string, ServiceDefinition> = {
    'analyses': {
        id: 'analyses', slug: 'analyses', name_ar: 'تحليل النتائج', name_en: 'Results Analysis',
        description_ar: 'أدوات متقدمة لتحليل نتائج الاختبارات وقياس أداء الطلاب',
        description_en: 'Advanced tools for analyzing test results',
        long_description_ar: 'نظام تحليل النتائج الذكي يوفر لك أدوات متقدمة لتحليل نتائج الاختبارات والواجبات، مع رسوم بيانية تفاعلية وتوصيات مخصصة لتحسين أداء كل طالب. يستخدم الذكاء الاصطناعي لاكتشاف نقاط القوة والضعف وتقديم خطط علاجية مقترحة.',
        icon: 'BarChart3', color: 'text-blue-600', gradient: 'from-blue-500 to-blue-600',
        category: 'analysis', route: '/analyses',
        features: [
            { title_ar: 'تحليل تفصيلي', title_en: 'Detailed Analysis', description_ar: 'تحليل شامل لنتائج الاختبارات مع تفاصيل دقيقة', description_en: '', icon: 'BarChart3' },
            { title_ar: 'رسوم بيانية', title_en: 'Charts', description_ar: 'رسوم بيانية تفاعلية لعرض البيانات بصرياً', description_en: '', icon: 'TrendingUp' },
            { title_ar: 'مقارنة الأداء', title_en: 'Compare', description_ar: 'مقارنة أداء الطلاب مع بعضهم البعض', description_en: '', icon: 'Users' },
            { title_ar: 'تتبع التقدم', title_en: 'Track', description_ar: 'متابعة تطور الطلاب عبر الزمن', description_en: '', icon: 'Target' },
            { title_ar: 'تقارير PDF', title_en: 'PDF Reports', description_ar: 'تصدير تقارير احترافية بصيغة PDF', description_en: '', icon: 'FileText' },
            { title_ar: 'توصيات ذكية', title_en: 'AI Recommendations', description_ar: 'اقتراحات مبنية على الذكاء الاصطناعي', description_en: '', icon: 'Sparkles' },
        ],
        benefits_ar: ['توفير الوقت في تحليل النتائج بنسبة 80%', 'اتخاذ قرارات تعليمية مبنية على البيانات', 'تحسين أداء الطلاب بشكل مستمر ومدروس', 'تقارير احترافية جاهزة للطباعة والمشاركة'],
        how_it_works: [
            { step: 1, title_ar: 'إدخال البيانات', title_en: 'Input Data', description_ar: 'أدخل درجات الطلاب يدوياً أو استوردها من ملف Excel', description_en: '' },
            { step: 2, title_ar: 'التحليل التلقائي', title_en: 'Auto Analysis', description_ar: 'يقوم النظام بتحليل البيانات وإنشاء الرسوم البيانية', description_en: '' },
            { step: 3, title_ar: 'التوصيات الذكية', title_en: 'AI Recommendations', description_ar: 'يقدم الذكاء الاصطناعي توصيات مخصصة لكل طالب', description_en: '' },
            { step: 4, title_ar: 'التصدير والمشاركة', title_en: 'Export', description_ar: 'صدّر التقارير بصيغة PDF أو شاركها مباشرة', description_en: '' },
        ],
        stats: [
            { label_ar: 'تحليل مكتمل', label_en: 'Completed', value: '10,000+', icon: 'BarChart3' },
            { label_ar: 'معلم يستخدم الخدمة', label_en: 'Teachers', value: '2,500+', icon: 'Users' },
            { label_ar: 'دقة التوصيات', label_en: 'Accuracy', value: '95%', icon: 'Target' },
            { label_ar: 'توفير الوقت', label_en: 'Time Saved', value: '80%', icon: 'Clock' },
        ],
        pricing: [
            { type_ar: 'مجاني', type_en: 'Free', price: '0', features_ar: ['5 تحليلات شهرياً', 'رسوم بيانية أساسية', 'تصدير PDF'], features_en: [] },
            { type_ar: 'احترافي', type_en: 'Pro', price: '49', features_ar: ['تحليلات غير محدودة', 'توصيات AI', 'تصدير Excel', 'دعم فني'], features_en: [], recommended: true },
            { type_ar: 'مؤسسي', type_en: 'Enterprise', price: '199', features_ar: ['كل ميزات الاحترافي', 'حسابات متعددة', 'تقارير مخصصة', 'دعم أولوية'], features_en: [] },
        ],
        faqs: [
            { question_ar: 'هل يمكنني استيراد البيانات من Excel؟', question_en: '', answer_ar: 'نعم، يدعم النظام استيراد البيانات من ملفات Excel و CSV بسهولة.', answer_en: '' },
            { question_ar: 'هل التوصيات دقيقة؟', question_en: '', answer_ar: 'نعم، تعتمد التوصيات على خوارزميات ذكاء اصطناعي متقدمة بدقة تصل إلى 95%.', answer_en: '' },
        ],
        related_services: ['plans', 'tests', 'performance'],
        is_active: true, sort_order: 1, requires_auth: false, requires_subscription: false,
        is_popular: true,
    },
    'certificates': {
        id: 'certificates', slug: 'certificates', name_ar: 'الشهادات والتقدير', name_en: 'Certificates',
        description_ar: 'إنشاء وتخصيص شهادات الشكر والتقدير بسهولة',
        description_en: 'Create and customize certificates easily',
        long_description_ar: 'نظام إنشاء الشهادات يوفر لك مكتبة ضخمة من القوالب الاحترافية لإنشاء شهادات الشكر والتقدير والتخرج. يمكنك تخصيص كل شهادة بالألوان والخطوط والشعارات، مع إمكانية الإنشاء الجماعي لعشرات الشهادات بضغطة زر.',
        icon: 'Award', color: 'text-amber-600', gradient: 'from-amber-500 to-orange-500',
        category: 'documents', route: '/certificates',
        features: [
            { title_ar: 'قوالب احترافية', title_en: 'Templates', description_ar: 'أكثر من 100 قالب شهادة جاهز للاستخدام', description_en: '', icon: 'Layers' },
            { title_ar: 'تخصيص كامل', title_en: 'Customize', description_ar: 'تعديل الألوان والخطوط والشعارات بسهولة', description_en: '', icon: 'Sparkles' },
            { title_ar: 'إنشاء جماعي', title_en: 'Batch', description_ar: 'إنشاء عشرات الشهادات دفعة واحدة', description_en: '', icon: 'Users' },
            { title_ar: 'جودة عالية', title_en: 'HD', description_ar: 'تصدير بجودة طباعة احترافية', description_en: '', icon: 'Download' },
        ],
        benefits_ar: ['توفير الوقت في تصميم الشهادات', 'شهادات احترافية بدون خبرة تصميم', 'إنشاء مئات الشهادات بسرعة فائقة'],
        how_it_works: [
            { step: 1, title_ar: 'اختيار القالب', title_en: '', description_ar: 'اختر من بين عشرات القوالب الاحترافية المتاحة', description_en: '' },
            { step: 2, title_ar: 'التخصيص', title_en: '', description_ar: 'أضف النصوص والشعارات وخصص الألوان حسب رغبتك', description_en: '' },
            { step: 3, title_ar: 'الإنشاء الجماعي', title_en: '', description_ar: 'أدخل أسماء المستلمين أو استوردها من Excel', description_en: '' },
            { step: 4, title_ar: 'التصدير', title_en: '', description_ar: 'صدّر الشهادات بجودة عالية للطباعة أو المشاركة', description_en: '' },
        ],
        stats: [
            { label_ar: 'شهادة تم إنشاؤها', label_en: '', value: '50,000+', icon: 'Award' },
            { label_ar: 'قالب متاح', label_en: '', value: '100+', icon: 'Layers' },
            { label_ar: 'معلم يستخدم الخدمة', label_en: '', value: '5,000+', icon: 'Users' },
            { label_ar: 'تقييم المستخدمين', label_en: '', value: '4.9/5', icon: 'Star' },
        ],
        related_services: ['achievements', 'performance'],
        is_active: true, sort_order: 2, requires_auth: false, requires_subscription: false,
        is_popular: true,
    },
    'plans': {
        id: 'plans', slug: 'plans', name_ar: 'الخطط التعليمية', name_en: 'Educational Plans',
        description_ar: 'إعداد الخطط العلاجية والإثرائية وتوزيع المناهج',
        description_en: 'Create remedial and enrichment plans',
        long_description_ar: 'نظام الخطط التعليمية يساعدك في إعداد خطط علاجية وإثرائية مخصصة لكل طالب، بالإضافة إلى توزيع المناهج الدراسية. يستخدم الذكاء الاصطناعي لاقتراح أنشطة وتمارين مناسبة بناءً على مستوى الطالب.',
        icon: 'BookOpen', color: 'text-green-600', gradient: 'from-green-500 to-emerald-500',
        category: 'planning', route: '/plans',
        features: [
            { title_ar: 'خطط علاجية', title_en: '', description_ar: 'خطط مخصصة لمعالجة نقاط الضعف', description_en: '', icon: 'Target' },
            { title_ar: 'خطط إثرائية', title_en: '', description_ar: 'خطط لتطوير مهارات المتفوقين', description_en: '', icon: 'TrendingUp' },
            { title_ar: 'توزيع المناهج', title_en: '', description_ar: 'توزيع المنهج على الأسابيع الدراسية', description_en: '', icon: 'BookOpen' },
            { title_ar: 'اقتراحات ذكية', title_en: '', description_ar: 'أنشطة مقترحة بالذكاء الاصطناعي', description_en: '', icon: 'Sparkles' },
        ],
        benefits_ar: ['خطط مخصصة لكل طالب حسب مستواه', 'توفير وقت إعداد الخطط بنسبة 70%', 'متابعة التقدم بسهولة ووضوح'],
        how_it_works: [
            { step: 1, title_ar: 'تحديد الطالب', title_en: '', description_ar: 'اختر الطالب أو مجموعة الطلاب المستهدفين', description_en: '' },
            { step: 2, title_ar: 'تحليل المستوى', title_en: '', description_ar: 'يحلل النظام مستوى الطالب من النتائج السابقة', description_en: '' },
            { step: 3, title_ar: 'إنشاء الخطة', title_en: '', description_ar: 'يقترح الذكاء الاصطناعي خطة مخصصة', description_en: '' },
            { step: 4, title_ar: 'المتابعة', title_en: '', description_ar: 'تابع تنفيذ الخطة وسجل التقدم', description_en: '' },
        ],
        stats: [
            { label_ar: 'خطة تم إنشاؤها', label_en: '', value: '15,000+', icon: 'BookOpen' },
            { label_ar: 'نسبة التحسن', label_en: '', value: '85%', icon: 'TrendingUp' },
            { label_ar: 'معلم يستخدم الخدمة', label_en: '', value: '3,000+', icon: 'Users' },
            { label_ar: 'رضا المستخدمين', label_en: '', value: '96%', icon: 'Star' },
        ],
        related_services: ['analyses', 'tests'],
        is_active: true, sort_order: 3, requires_auth: false, requires_subscription: false,
        is_popular: true,
    },
};

export default function ServiceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params?.slug as string;

    const [service, setService] = useState<ServiceDefinition | null>(null);
    const [relatedServices, setRelatedServices] = useState<ServiceDefinition[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    useEffect(() => {
        if (!slug) return;
        loadService();
    }, [slug]);

    const loadService = async () => {
        setIsLoading(true);
        try {
            // Try Firestore first
            const { getServiceBySlug, getServices } = await import('@/lib/firestore-service');
            let svc = await getServiceBySlug(slug);

            if (!svc) {
                // Fallback to hardcoded data
                svc = FALLBACK_SERVICES[slug] || null;
            }

            setService(svc);

            // Load related services
            if (svc?.related_services && svc.related_services.length > 0) {
                const allServices = await getServices();
                if (allServices.length > 0) {
                    setRelatedServices(allServices.filter(s => svc!.related_services?.includes(s.slug)));
                } else {
                    // Use fallback related
                    setRelatedServices(
                        svc.related_services
                            .map(rs => FALLBACK_SERVICES[rs])
                            .filter(Boolean) as ServiceDefinition[]
                    );
                }
            }
        } catch (error) {
            // Full fallback
            const svc = FALLBACK_SERVICES[slug] || null;
            setService(svc);
            if (svc?.related_services) {
                setRelatedServices(
                    svc.related_services
                        .map(rs => FALLBACK_SERVICES[rs])
                        .filter(Boolean) as ServiceDefinition[]
                );
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
                <Navbar />
                <div className="flex justify-center items-center py-32">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
                <Footer />
            </div>
        );
    }

    if (!service) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
                <Navbar />
                <div className="container mx-auto px-4 py-16 text-center">
                    <div className="text-6xl mb-4">🔍</div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">الخدمة غير موجودة</h1>
                    <p className="text-gray-500 dark:text-gray-400 mb-8">
                        لم نتمكن من العثور على الخدمة المطلوبة. تأكد من الرابط أو عد إلى صفحة الخدمات.
                    </p>
                    <Button onClick={() => router.push('/services')}>
                        <ArrowRight className="h-4 w-4 ml-2" />
                        العودة للخدمات
                    </Button>
                </div>
                <Footer />
            </div>
        );
    }

    const IconComp = getIcon(service.icon);
    const gradient = service.gradient || 'from-blue-500 to-blue-600';

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
            <Navbar />
            <main>
                {/* Hero Section */}
                <div className={`bg-gradient-to-br ${gradient} text-white`}>
                    <div className="container mx-auto px-4 py-16">
                        {/* Breadcrumb */}
                        <div className="flex items-center gap-2 text-white/70 text-sm mb-8">
                            <Link href="/" className="hover:text-white">الرئيسية</Link>
                            <ChevronLeft className="h-4 w-4" />
                            <Link href="/services" className="hover:text-white">الخدمات</Link>
                            <ChevronLeft className="h-4 w-4" />
                            <span className="text-white">{service.name_ar}</span>
                        </div>

                        <div className="flex flex-col md:flex-row items-start gap-8">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-4">
                                    {service.is_new && <Badge className="bg-green-500 text-white">جديد</Badge>}
                                    {service.is_premium && <Badge className="bg-amber-500 text-white">مميز</Badge>}
                                    {service.is_popular && <Badge className="bg-white/20 text-white">شائع</Badge>}
                                </div>
                                <h1 className="text-4xl md:text-5xl font-bold mb-4">{service.name_ar}</h1>
                                <p className="text-xl text-white/80 mb-8 leading-relaxed max-w-2xl">
                                    {service.long_description_ar || service.description_ar}
                                </p>
                                <div className="flex flex-wrap gap-4">
                                    <Button
                                        size="lg"
                                        className="bg-white text-gray-900 hover:bg-white/90 shadow-xl"
                                        onClick={() => router.push(`/editor/${service.id}`)}
                                    >
                                        <Play className="h-5 w-5 ml-2" />
                                        ابدأ الاستخدام
                                    </Button>
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        className="border-white/30 text-white hover:bg-white/10"
                                    >
                                        <Heart className="h-5 w-5 ml-2" />
                                        أضف للمفضلة
                                    </Button>
                                </div>
                            </div>
                            <div className="hidden md:flex">
                                <div className="h-40 w-40 rounded-3xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
                                    <IconComp className="h-20 w-20 text-white/80" />
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        {service.stats && service.stats.length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
                                {service.stats.map((stat, index) => {
                                    const StatIcon = getIcon(stat.icon);
                                    return (
                                        <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                                            <StatIcon className="h-6 w-6 mx-auto mb-2 text-white/70" />
                                            <p className="text-2xl font-bold">{stat.value}</p>
                                            <p className="text-sm text-white/70">{stat.label_ar}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div className="container mx-auto px-4 py-12">
                    <Tabs defaultValue="features" className="space-y-8">
                        <TabsList className="bg-white dark:bg-gray-800 p-1 rounded-xl shadow-sm border dark:border-gray-700">
                            <TabsTrigger value="features" className="rounded-lg">الميزات</TabsTrigger>
                            <TabsTrigger value="how-it-works" className="rounded-lg">كيف يعمل</TabsTrigger>
                            {service.pricing && service.pricing.length > 0 && (
                                <TabsTrigger value="pricing" className="rounded-lg">الأسعار</TabsTrigger>
                            )}
                            {service.faqs && service.faqs.length > 0 && (
                                <TabsTrigger value="faq" className="rounded-lg">الأسئلة الشائعة</TabsTrigger>
                            )}
                        </TabsList>

                        {/* Features Tab */}
                        <TabsContent value="features" className="space-y-8">
                            {/* Features Grid */}
                            {service.features && service.features.length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {service.features.map((feature, index) => {
                                        const FIcon = getIcon(feature.icon);
                                        return (
                                            <Card key={index} className="border-0 shadow-md bg-white dark:bg-gray-800 hover:shadow-lg transition-shadow">
                                                <CardContent className="p-6">
                                                    <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white mb-4`}>
                                                        <FIcon className="h-6 w-6" />
                                                    </div>
                                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                                        {feature.title_ar}
                                                    </h3>
                                                    <p className="text-gray-500 dark:text-gray-400">
                                                        {feature.description_ar}
                                                    </p>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Benefits */}
                            {service.benefits_ar && service.benefits_ar.length > 0 && (
                                <Card className="border-0 shadow-md bg-white dark:bg-gray-800">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                                            لماذا تختار هذه الخدمة؟
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {service.benefits_ar.map((benefit, index) => (
                                                <div key={index} className="flex items-start gap-3">
                                                    <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-white flex-shrink-0 mt-0.5`}>
                                                        <CheckCircle2 className="h-4 w-4" />
                                                    </div>
                                                    <p className="text-gray-700 dark:text-gray-300">{benefit}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>

                        {/* How It Works Tab */}
                        <TabsContent value="how-it-works">
                            {service.how_it_works && service.how_it_works.length > 0 ? (
                                <div className="max-w-3xl mx-auto">
                                    {service.how_it_works.map((step, index) => (
                                        <div key={index} className="flex gap-6 mb-8 last:mb-0">
                                            <div className="flex flex-col items-center">
                                                <div className={`h-12 w-12 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-lg`}>
                                                    {step.step}
                                                </div>
                                                {index < (service.how_it_works?.length || 0) - 1 && (
                                                    <div className="w-0.5 flex-1 bg-gray-200 dark:bg-gray-700 mt-2" />
                                                )}
                                            </div>
                                            <div className="flex-1 pb-8">
                                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                                    {step.title_ar}
                                                </h3>
                                                <p className="text-gray-500 dark:text-gray-400">
                                                    {step.description_ar}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-500">
                                    <p>سيتم إضافة خطوات العمل قريباً</p>
                                </div>
                            )}
                        </TabsContent>

                        {/* Pricing Tab */}
                        {service.pricing && service.pricing.length > 0 && (
                            <TabsContent value="pricing">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                                    {service.pricing.map((plan, index) => (
                                        <Card
                                            key={index}
                                            className={`border-0 shadow-md ${plan.recommended ? `ring-2 ring-offset-2 bg-gradient-to-br ${gradient} text-white` : 'bg-white dark:bg-gray-800'}`}
                                        >
                                            <CardHeader className="text-center">
                                                {plan.recommended && (
                                                    <Badge className="bg-white/20 text-white mx-auto mb-2">الأكثر شعبية</Badge>
                                                )}
                                                <CardTitle className={plan.recommended ? 'text-white' : ''}>{plan.type_ar}</CardTitle>
                                                <div className="mt-4">
                                                    <span className={`text-4xl font-bold ${plan.recommended ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                                        {plan.price === '0' ? 'مجاني' : `${plan.price} ر.س`}
                                                    </span>
                                                    {plan.price !== '0' && (
                                                        <span className={`text-sm ${plan.recommended ? 'text-white/70' : 'text-gray-500'}`}>/شهرياً</span>
                                                    )}
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <ul className="space-y-3">
                                                    {plan.features_ar.map((feature, fi) => (
                                                        <li key={fi} className={`flex items-center gap-2 text-sm ${plan.recommended ? 'text-white/90' : 'text-gray-600 dark:text-gray-400'}`}>
                                                            <CheckCircle2 className={`h-4 w-4 flex-shrink-0 ${plan.recommended ? 'text-white' : 'text-green-500'}`} />
                                                            {feature}
                                                        </li>
                                                    ))}
                                                </ul>
                                                <Button
                                                    className={`w-full mt-6 ${plan.recommended ? 'bg-white text-gray-900 hover:bg-white/90' : `bg-gradient-to-r ${gradient} text-white`}`}
                                                >
                                                    {plan.price === '0' ? 'ابدأ مجاناً' : 'اشترك الآن'}
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </TabsContent>
                        )}

                        {/* FAQ Tab */}
                        {service.faqs && service.faqs.length > 0 && (
                            <TabsContent value="faq">
                                <div className="max-w-3xl mx-auto space-y-4">
                                    {service.faqs.map((faq, index) => (
                                        <Card key={index} className="border-0 shadow-sm bg-white dark:bg-gray-800 overflow-hidden">
                                            <button
                                                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                                                className="w-full p-5 flex items-center justify-between text-right"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <HelpCircle className="h-5 w-5 text-primary flex-shrink-0" />
                                                    <span className="font-medium text-gray-900 dark:text-white">
                                                        {faq.question_ar}
                                                    </span>
                                                </div>
                                                <ChevronLeft className={`h-5 w-5 text-gray-400 transition-transform ${openFaq === index ? 'rotate-90' : ''}`} />
                                            </button>
                                            {openFaq === index && (
                                                <div className="px-5 pb-5 pr-13">
                                                    <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                                                        {faq.answer_ar}
                                                    </p>
                                                </div>
                                            )}
                                        </Card>
                                    ))}
                                </div>
                            </TabsContent>
                        )}
                    </Tabs>

                    {/* Related Services */}
                    {relatedServices.length > 0 && (
                        <div className="mt-16">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                                <Layers className="h-6 w-6 text-primary" />
                                خدمات ذات صلة
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {relatedServices.map((rs) => {
                                    const RSIcon = getIcon(rs.icon);
                                    const rsGradient = rs.gradient || 'from-gray-500 to-gray-600';
                                    return (
                                        <Card
                                            key={rs.id}
                                            className="group hover:shadow-lg transition-all cursor-pointer border-0 bg-white dark:bg-gray-800"
                                            onClick={() => router.push(`/services/${rs.slug}`)}
                                        >
                                            <CardContent className="p-5 flex items-center gap-4">
                                                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${rsGradient} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform`}>
                                                    <RSIcon className="h-6 w-6" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-gray-900 dark:text-white">{rs.name_ar}</p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{rs.description_ar}</p>
                                                </div>
                                                <ArrowLeft className="h-5 w-5 text-gray-400 group-hover:text-primary" />
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* CTA Section */}
                    <Card className={`mt-16 bg-gradient-to-br ${gradient} text-white border-0 shadow-2xl overflow-hidden`}>
                        <CardContent className="p-8 md:p-12 text-center">
                            <h2 className="text-3xl font-bold mb-4">جاهز للبدء؟</h2>
                            <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
                                ابدأ باستخدام {service.name_ar} الآن واستفد من جميع الميزات المتقدمة لتحسين عملك التعليمي
                            </p>
                            <div className="flex flex-wrap gap-4 justify-center">
                                <Button
                                    size="lg"
                                    className="bg-white text-gray-900 hover:bg-white/90 shadow-xl"
                                    onClick={() => router.push(`/editor/${service.id}`)}
                                >
                                    <Play className="h-5 w-5 ml-2" />
                                    ابدأ الآن مجاناً
                                </Button>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="border-white/30 text-white hover:bg-white/10"
                                    onClick={() => router.push('/services')}
                                >
                                    <ArrowRight className="h-5 w-5 ml-2" />
                                    تصفح الخدمات الأخرى
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
            <Footer />
        </div>
    );
}
