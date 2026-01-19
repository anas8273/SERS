'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
} from 'lucide-react';

// Service categories
const SERVICE_CATEGORIES = [
    { id: 'all', name: 'جميع الخدمات', icon: Zap },
    { id: 'analysis', name: 'التحليل والتقييم', icon: BarChart3 },
    { id: 'documents', name: 'الوثائق والشهادات', icon: FileText },
    { id: 'planning', name: 'التخطيط', icon: ClipboardList },
    { id: 'ai', name: 'الذكاء الاصطناعي', icon: Bot },
];

// All services
const SERVICES = [
    {
        id: 'analyses',
        category: 'analysis',
        title: 'تحليل النتائج',
        description: 'تحليل نتائج الاختبارات واستخراج التقارير والإحصائيات',
        icon: BarChart3,
        color: 'bg-blue-500',
        features: ['تحليل درجات الطلاب', 'استخراج الإحصائيات', 'تحديد نقاط القوة والضعف', 'تقارير مفصلة'],
        isNew: false,
        isPopular: true,
    },
    {
        id: 'certificates',
        category: 'documents',
        title: 'الشهادات',
        description: 'إنشاء شهادات الشكر والتقدير والتخرج بتصاميم احترافية',
        icon: Award,
        color: 'bg-yellow-500',
        features: ['شهادات تقدير', 'شهادات شكر', 'شهادات تخرج', 'إنشاء متعدد'],
        isNew: false,
        isPopular: true,
    },
    {
        id: 'plans',
        category: 'planning',
        title: 'الخطط التعليمية',
        description: 'إنشاء الخطط العلاجية والإثرائية وتوزيع المنهج',
        icon: ClipboardList,
        color: 'bg-green-500',
        features: ['خطط علاجية', 'خطط إثرائية', 'توزيع المنهج', 'خطط أسبوعية'],
        isNew: false,
        isPopular: true,
    },
    {
        id: 'achievements',
        category: 'documents',
        title: 'توثيق الإنجازات',
        description: 'توثيق الإنجازات اليومية والأسبوعية والشهرية',
        icon: Trophy,
        color: 'bg-purple-500',
        features: ['إنجازات يومية', 'إنجازات أسبوعية', 'إنجازات شهرية', 'تقارير الإنجاز'],
        isNew: false,
        isPopular: false,
    },
    {
        id: 'performance',
        category: 'analysis',
        title: 'تقييم الأداء',
        description: 'إدارة تقييمات الأداء الوظيفي وشواهد الأداء',
        icon: Target,
        color: 'bg-red-500',
        features: ['تقييم ذاتي', 'تقييم المشرف', 'شواهد الأداء', 'تقارير الأداء'],
        isNew: false,
        isPopular: true,
    },
    {
        id: 'tests',
        category: 'analysis',
        title: 'الاختبارات',
        description: 'إنشاء وإدارة الاختبارات وتسجيل درجات الطلاب',
        icon: FileQuestion,
        color: 'bg-cyan-500',
        features: ['إنشاء اختبارات', 'تسجيل الدرجات', 'تحليل النتائج', 'تقارير الطلاب'],
        isNew: false,
        isPopular: false,
    },
    {
        id: 'ai-assistant',
        category: 'ai',
        title: 'المساعد الذكي',
        description: 'مساعد ذكي يساعدك في إعداد الخطط والتقارير',
        icon: Bot,
        color: 'bg-indigo-500',
        features: ['إعداد الخطط', 'كتابة التقارير', 'اقتراحات ذكية', 'محادثة تفاعلية'],
        isNew: true,
        isPopular: true,
    },
    {
        id: 'templates',
        category: 'documents',
        title: 'القوالب الجاهزة',
        description: 'مكتبة قوالب جاهزة للتقارير والنماذج التعليمية',
        icon: FileText,
        color: 'bg-orange-500',
        features: ['قوالب تقارير', 'نماذج تعليمية', 'تصاميم احترافية', 'تخصيص سهل'],
        isNew: false,
        isPopular: true,
    },
];

export default function ServicesPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');

    const filteredServices = SERVICES.filter(service => {
        const matchesSearch = service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            service.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeCategory === 'all' || service.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    const popularServices = SERVICES.filter(s => s.isPopular);

    return (
        <div className="container mx-auto py-6 px-4">
            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">الخدمات التعليمية</h1>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                    مجموعة متكاملة من الخدمات والأدوات التي تساعدك في إنجاز مهامك التعليمية بكفاءة واحترافية
                </p>
            </div>

            {/* Search */}
            <div className="max-w-md mx-auto mb-8">
                <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="ابحث عن خدمة..."
                        className="pr-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Zap className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{SERVICES.length}</p>
                            <p className="text-sm text-muted-foreground">خدمة متاحة</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{popularServices.length}</p>
                            <p className="text-sm text-muted-foreground">خدمة شائعة</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                            <Sparkles className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{SERVICES.filter(s => s.isNew).length}</p>
                            <p className="text-sm text-muted-foreground">خدمة جديدة</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                            <Bot className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{SERVICES.filter(s => s.category === 'ai').length}</p>
                            <p className="text-sm text-muted-foreground">خدمة ذكية</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Categories Tabs */}
            <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mb-8">
                <TabsList className="flex flex-wrap justify-center gap-2 h-auto p-2">
                    {SERVICE_CATEGORIES.map((category) => (
                        <TabsTrigger
                            key={category.id}
                            value={category.id}
                            className="flex items-center gap-2"
                        >
                            <category.icon className="h-4 w-4" />
                            {category.name}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>

            {/* Services Grid */}
            {filteredServices.length === 0 ? (
                <div className="text-center py-12">
                    <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">لا توجد نتائج</h3>
                    <p className="text-muted-foreground">
                        جرب البحث بكلمات مختلفة أو اختر تصنيفاً آخر
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredServices.map((service) => (
                        <Card
                            key={service.id}
                            className="group hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
                            onClick={() => router.push(`/${service.id}`)}
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className={`h-12 w-12 rounded-xl ${service.color} flex items-center justify-center text-white shadow-lg`}>
                                        <service.icon className="h-6 w-6" />
                                    </div>
                                    <div className="flex gap-1">
                                        {service.isNew && (
                                            <Badge className="bg-green-500">جديد</Badge>
                                        )}
                                        {service.isPopular && (
                                            <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                                                <Star className="h-3 w-3 ml-1 fill-yellow-500" />
                                                شائع
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                <CardTitle className="text-lg mt-3">{service.title}</CardTitle>
                                <CardDescription className="line-clamp-2">
                                    {service.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 mb-4">
                                    {service.features.slice(0, 3).map((feature, index) => (
                                        <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                                            {feature}
                                        </li>
                                    ))}
                                    {service.features.length > 3 && (
                                        <li className="text-sm text-muted-foreground">
                                            +{service.features.length - 3} ميزات أخرى
                                        </li>
                                    )}
                                </ul>
                                <Button className="w-full group-hover:bg-primary/90">
                                    استخدام الخدمة
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Popular Services Section */}
            {activeCategory === 'all' && searchQuery === '' && (
                <div className="mt-12">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                        الخدمات الأكثر استخداماً
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {popularServices.map((service) => (
                            <Card
                                key={service.id}
                                className="hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => router.push(`/${service.id}`)}
                            >
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className={`h-10 w-10 rounded-lg ${service.color} flex items-center justify-center text-white`}>
                                        <service.icon className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{service.title}</p>
                                        <p className="text-sm text-muted-foreground truncate">
                                            {service.description}
                                        </p>
                                    </div>
                                    <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* AI Features Section */}
            {activeCategory === 'all' && searchQuery === '' && (
                <div className="mt-12">
                    <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white overflow-hidden">
                        <CardContent className="p-8">
                            <div className="flex flex-col md:flex-row items-center gap-8">
                                <div className="flex-1">
                                    <Badge className="bg-white/20 text-white mb-4">مدعوم بالذكاء الاصطناعي</Badge>
                                    <h2 className="text-2xl font-bold mb-4">المساعد الذكي</h2>
                                    <p className="text-white/80 mb-6">
                                        استفد من قوة الذكاء الاصطناعي في إعداد الخطط والتقارير والشهادات. المساعد الذكي يفهم احتياجاتك ويقدم لك اقتراحات مخصصة.
                                    </p>
                                    <div className="flex flex-wrap gap-3 mb-6">
                                        <Badge className="bg-white/20 text-white">إعداد الخطط</Badge>
                                        <Badge className="bg-white/20 text-white">كتابة التقارير</Badge>
                                        <Badge className="bg-white/20 text-white">اقتراحات ذكية</Badge>
                                        <Badge className="bg-white/20 text-white">تحليل البيانات</Badge>
                                    </div>
                                    <Button
                                        variant="secondary"
                                        size="lg"
                                        onClick={() => router.push('/ai-assistant')}
                                    >
                                        <Bot className="h-5 w-5 ml-2" />
                                        جرب المساعد الذكي
                                    </Button>
                                </div>
                                <div className="hidden md:flex items-center justify-center">
                                    <div className="relative">
                                        <div className="h-40 w-40 rounded-full bg-white/10 flex items-center justify-center">
                                            <Bot className="h-20 w-20 text-white/80" />
                                        </div>
                                        <div className="absolute -top-4 -right-4 h-12 w-12 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
                                            <Sparkles className="h-6 w-6" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
