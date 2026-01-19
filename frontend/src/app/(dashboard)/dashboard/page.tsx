'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import type { Order } from '@/types';
import { Button } from '@/components/ui/button';
import { 
    Package, 
    Heart, 
    Star, 
    Wallet, 
    ShoppingBag, 
    Settings, 
    ArrowLeft, 
    Clock, 
    Sparkles, 
    LayoutDashboard,
    FileText,
    ChevronLeft,
    PlusCircle,
    Zap,
    BarChart3,
    Award,
    ClipboardList,
    Trophy,
    FileQuestion,
    Bot,
    Target,
    Users,
    Calendar,
    TrendingUp,
    CheckCircle,
    ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface DashboardStats {
    orders_count: number;
    wishlist_count: number;
    reviews_count: number;
    total_spent: number;
    analyses_count?: number;
    certificates_count?: number;
    plans_count?: number;
    achievements_count?: number;
}

function formatPrice(amount: number): string {
    return new Intl.NumberFormat('ar-SA', {
        style: 'currency',
        currency: 'SAR',
        minimumFractionDigits: 0,
    }).format(amount);
}

// Educational services
const EDUCATIONAL_SERVICES = [
    {
        id: 'analyses',
        title: 'تحليل النتائج',
        description: 'تحليل نتائج الاختبارات',
        icon: BarChart3,
        color: 'bg-blue-500',
        href: '/analyses',
    },
    {
        id: 'certificates',
        title: 'الشهادات',
        description: 'شهادات الشكر والتقدير',
        icon: Award,
        color: 'bg-yellow-500',
        href: '/certificates',
    },
    {
        id: 'plans',
        title: 'الخطط التعليمية',
        description: 'الخطط العلاجية والإثرائية',
        icon: ClipboardList,
        color: 'bg-green-500',
        href: '/plans',
    },
    {
        id: 'achievements',
        title: 'توثيق الإنجازات',
        description: 'الإنجازات اليومية والأسبوعية',
        icon: Trophy,
        color: 'bg-purple-500',
        href: '/achievements',
    },
    {
        id: 'performance',
        title: 'تقييم الأداء',
        description: 'شواهد الأداء الوظيفي',
        icon: Target,
        color: 'bg-red-500',
        href: '/performance',
    },
    {
        id: 'tests',
        title: 'الاختبارات',
        description: 'إدارة الاختبارات والدرجات',
        icon: FileQuestion,
        color: 'bg-cyan-500',
        href: '/tests',
    },
    {
        id: 'ai-assistant',
        title: 'المساعد الذكي',
        description: 'مساعدك الشخصي بالذكاء الاصطناعي',
        icon: Bot,
        color: 'bg-indigo-500',
        href: '/ai-assistant',
        isNew: true,
    },
    {
        id: 'templates',
        title: 'القوالب الجاهزة',
        description: 'مكتبة القوالب والنماذج',
        icon: FileText,
        color: 'bg-orange-500',
        href: '/marketplace',
    },
];

export default function DashboardPage() {
    const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
    const [stats, setStats] = useState<DashboardStats>({
        orders_count: 0,
        wishlist_count: 0,
        reviews_count: 0,
        total_spent: 0,
        analyses_count: 0,
        certificates_count: 0,
        plans_count: 0,
        achievements_count: 0,
    });
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!isAuthenticated) return;

            try {
                // Fetch orders
                const ordersRes = await api.getOrders();
                const orders = ordersRes.data || [];
                setRecentOrders(orders.slice(0, 5));

                // Calculate stats
                const completedOrders = orders.filter((o: Order) => o.status === 'completed');
                const totalSpent = completedOrders.reduce((sum: number, o: Order) => sum + o.total, 0);

                // Fetch wishlist count
                let wishlistCount = 0;
                try {
                    const wishlistRes = await api.getWishlistIds();
                    wishlistCount = wishlistRes.data?.length || 0;
                } catch (e) {
                    // Wishlist might not exist
                }

                // Fetch educational stats
                let analysesCount = 0;
                let certificatesCount = 0;
                let plansCount = 0;
                let achievementsCount = 0;

                try {
                    const [analysesRes, certificatesRes, plansRes, achievementsRes] = await Promise.all([
                        api.getAnalyses().catch(() => ({ data: [] })),
                        api.getCertificates().catch(() => ({ data: [] })),
                        api.getPlans().catch(() => ({ data: [] })),
                        api.getAchievements().catch(() => ({ data: [] })),
                    ]);
                    analysesCount = analysesRes.data?.length || 0;
                    certificatesCount = certificatesRes.data?.length || 0;
                    plansCount = plansRes.data?.length || 0;
                    achievementsCount = achievementsRes.data?.length || 0;
                } catch (e) {
                    // Educational services might not be available
                }

                setStats({
                    orders_count: orders.length,
                    wishlist_count: wishlistCount,
                    reviews_count: 0,
                    total_spent: totalSpent,
                    analyses_count: analysesCount,
                    certificates_count: certificatesCount,
                    plans_count: plansCount,
                    achievements_count: achievementsCount,
                });
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (!authLoading) {
            fetchDashboardData();
        }
    }, [isAuthenticated, authLoading]);

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    const quickLinks = [
        { label: 'المتجر', href: '/marketplace', icon: <ShoppingBag className="w-6 h-6" />, color: 'bg-blue-500' },
        { label: 'طلباتي', href: '/orders', icon: <Package className="w-6 h-6" />, color: 'bg-purple-500' },
        { label: 'المفضلة', href: '/wishlist', icon: <Heart className="w-6 h-6" />, color: 'bg-red-500' },
        { label: 'الإعدادات', href: '/settings', icon: <Settings className="w-6 h-6" />, color: 'bg-gray-500' },
    ];

    // Get greeting based on time
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'صباح الخير';
        if (hour < 17) return 'مساء الخير';
        return 'مساء الخير';
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950" dir="rtl">
            <Navbar />

            <main className="flex-1 pt-8 pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Welcome Section */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                        <div className="space-y-2">
                            <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                                {getGreeting()}، {user?.name?.split(' ')[0] || 'المعلم'} <span className="animate-pulse inline-block">👋</span>
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">
                                إليك ملخص نشاطك التعليمي في منصة سيرز
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link href="/services">
                                <Button variant="outline" className="rounded-full px-6 font-bold gap-2">
                                    <Zap className="w-4 h-4" />
                                    جميع الخدمات
                                </Button>
                            </Link>
                            <Link href="/ai-assistant">
                                <Button className="rounded-full px-6 font-black gap-2 shadow-xl shadow-primary/20">
                                    <Bot className="w-5 h-5" />
                                    المساعد الذكي
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Educational Services Grid */}
                    <div className="mb-10">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-primary" />
                                الخدمات التعليمية
                            </h2>
                            <Link href="/services">
                                <Button variant="ghost" size="sm" className="text-primary font-bold hover:bg-primary/5 rounded-full">
                                    عرض الكل <ChevronLeft className="mr-1 w-4 h-4" />
                                </Button>
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                            {EDUCATIONAL_SERVICES.map((service) => (
                                <Link key={service.id} href={service.href}>
                                    <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer h-full border-2 border-transparent hover:border-primary/20">
                                        <CardContent className="p-5">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className={`h-12 w-12 rounded-xl ${service.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                                                    <service.icon className="h-6 w-6" />
                                                </div>
                                                {service.isNew && (
                                                    <Badge className="bg-green-500 text-[10px]">جديد</Badge>
                                                )}
                                            </div>
                                            <h3 className="font-bold text-gray-900 dark:text-white mb-1">{service.title}</h3>
                                            <p className="text-sm text-muted-foreground line-clamp-1">{service.description}</p>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                        <StatCard 
                            label="التحليلات" 
                            value={stats.analyses_count || 0} 
                            icon={<BarChart3 className="w-5 h-5" />} 
                            color="text-blue-600" 
                            bgColor="bg-blue-50 dark:bg-blue-900/20" 
                        />
                        <StatCard 
                            label="الشهادات" 
                            value={stats.certificates_count || 0} 
                            icon={<Award className="w-5 h-5" />} 
                            color="text-yellow-600" 
                            bgColor="bg-yellow-50 dark:bg-yellow-900/20" 
                        />
                        <StatCard 
                            label="الخطط" 
                            value={stats.plans_count || 0} 
                            icon={<ClipboardList className="w-5 h-5" />} 
                            color="text-green-600" 
                            bgColor="bg-green-50 dark:bg-green-900/20" 
                        />
                        <StatCard 
                            label="الإنجازات" 
                            value={stats.achievements_count || 0} 
                            icon={<Trophy className="w-5 h-5" />} 
                            color="text-purple-600" 
                            bgColor="bg-purple-50 dark:bg-purple-900/20" 
                        />
                    </div>

                    {/* AI Assistant Banner */}
                    <Card className="rounded-[2rem] border-none bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 overflow-hidden relative group mb-10">
                        <div className="absolute top-0 left-0 p-8 opacity-20 group-hover:scale-110 transition-transform duration-500">
                            <Bot className="w-40 h-40 text-white" />
                        </div>
                        <CardContent className="p-8 flex flex-col md:flex-row items-center gap-8 relative z-10">
                            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white shrink-0">
                                <Sparkles className="w-10 h-10" />
                            </div>
                            <div className="flex-1 space-y-2 text-center md:text-right text-white">
                                <div className="flex items-center justify-center md:justify-start gap-3">
                                    <h3 className="text-2xl font-black">المساعد الذكي</h3>
                                    <Badge className="bg-white/20 text-white border-0">مدعوم بـ AI</Badge>
                                </div>
                                <p className="text-white/80 font-medium text-lg leading-relaxed max-w-2xl">
                                    دع الذكاء الاصطناعي يساعدك في إعداد الخطط والتقارير والشهادات. اسأل أي سؤال واحصل على إجابات فورية.
                                </p>
                            </div>
                            <Link href="/ai-assistant">
                                <Button variant="secondary" size="lg" className="rounded-full px-8 font-black shadow-xl shrink-0">
                                    <Bot className="w-5 h-5 ml-2" />
                                    ابدأ المحادثة
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Recent Activity */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Recent Orders */}
                            <Card className="rounded-[2rem] border-gray-100 dark:border-gray-800 overflow-hidden">
                                <CardHeader className="border-b border-gray-50 dark:border-gray-800">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600">
                                                <Package className="w-5 h-5" />
                                            </div>
                                            <CardTitle className="text-lg">آخر الطلبات</CardTitle>
                                        </div>
                                        <Link href="/orders">
                                            <Button variant="ghost" size="sm" className="text-primary font-bold hover:bg-primary/5 rounded-full">
                                                عرض الكل <ChevronLeft className="mr-1 w-4 h-4" />
                                            </Button>
                                        </Link>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {isLoading ? (
                                        <div className="p-6 space-y-4">
                                            {[1, 2, 3].map((i) => (
                                                <div key={i} className="animate-pulse flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl"></div>
                                                    <div className="flex-1 space-y-2">
                                                        <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-3/4"></div>
                                                        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2"></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : recentOrders.length === 0 ? (
                                        <div className="p-12 text-center">
                                            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                                                <ShoppingBag className="w-8 h-8" />
                                            </div>
                                            <p className="text-gray-500 dark:text-gray-400 font-medium mb-4">لا توجد طلبات حتى الآن</p>
                                            <Link href="/marketplace">
                                                <Button variant="outline" className="rounded-full px-6 font-bold">
                                                    تصفح المتجر
                                                </Button>
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-50 dark:divide-gray-800">
                                            {recentOrders.map((order) => (
                                                <Link key={order.id} href={`/orders/${order.id}`}>
                                                    <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                                            <Package className="w-6 h-6" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-bold text-gray-900 dark:text-white truncate">
                                                                طلب #{order.id.slice(0, 8)}
                                                            </p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {new Date(order.created_at).toLocaleDateString('ar-SA')}
                                                            </p>
                                                        </div>
                                                        <div className="text-left">
                                                            <p className="font-bold text-primary">{formatPrice(order.total)}</p>
                                                            <Badge variant={order.status === 'completed' ? 'default' : 'secondary'} className="text-[10px]">
                                                                {order.status === 'completed' ? 'مكتمل' : order.status === 'pending' ? 'قيد الانتظار' : order.status}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Quick Links */}
                            <Card className="rounded-[2rem] border-gray-100 dark:border-gray-800">
                                <CardHeader>
                                    <CardTitle className="text-lg">روابط سريعة</CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-2 gap-3">
                                    {quickLinks.map((link) => (
                                        <Link key={link.href} href={link.href}>
                                            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-center group">
                                                <div className={`w-10 h-10 ${link.color} rounded-xl flex items-center justify-center text-white mx-auto mb-2 group-hover:scale-110 transition-transform`}>
                                                    {link.icon}
                                                </div>
                                                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{link.label}</p>
                                            </div>
                                        </Link>
                                    ))}
                                </CardContent>
                            </Card>

                            {/* Activity Summary */}
                            <Card className="rounded-[2rem] border-gray-100 dark:border-gray-800">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-green-500" />
                                        ملخص النشاط
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">إجمالي الطلبات</span>
                                        <span className="font-bold">{stats.orders_count}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">في المفضلة</span>
                                        <span className="font-bold">{stats.wishlist_count}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">إجمالي الإنفاق</span>
                                        <span className="font-bold text-primary">{formatPrice(stats.total_spent)}</span>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Tips Card */}
                            <Card className="rounded-[2rem] bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-100 dark:border-amber-800">
                                <CardContent className="p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white shrink-0">
                                            <Sparkles className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-amber-900 dark:text-amber-100 mb-1">نصيحة اليوم</h4>
                                            <p className="text-sm text-amber-700 dark:text-amber-200">
                                                استخدم المساعد الذكي لإنشاء خطط علاجية مخصصة لطلابك بناءً على نتائج تحليل الاختبارات.
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

// Stat Card Component
function StatCard({ 
    label, 
    value, 
    icon, 
    color, 
    bgColor 
}: { 
    label: string; 
    value: number | string; 
    icon: React.ReactNode; 
    color: string; 
    bgColor: string; 
}) {
    return (
        <Card className="rounded-2xl border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow">
            <CardContent className="p-5">
                <div className="flex items-center gap-4">
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", bgColor, color)}>
                        {icon}
                    </div>
                    <div>
                        <p className="text-2xl font-black text-gray-900 dark:text-white">{value}</p>
                        <p className="text-sm text-muted-foreground font-medium">{label}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
