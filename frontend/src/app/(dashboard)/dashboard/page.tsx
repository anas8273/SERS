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
    Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DashboardStats {
    orders_count: number;
    wishlist_count: number;
    reviews_count: number;
    total_spent: number;
}

function formatPrice(amount: number): string {
    return new Intl.NumberFormat('ar-SA', {
        style: 'currency',
        currency: 'SAR',
        minimumFractionDigits: 0,
    }).format(amount);
}

export default function DashboardPage() {
    const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
    const [stats, setStats] = useState<DashboardStats>({
        orders_count: 0,
        wishlist_count: 0,
        reviews_count: 0,
        total_spent: 0,
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

                setStats({
                    orders_count: orders.length,
                    wishlist_count: wishlistCount,
                    reviews_count: 0,
                    total_spent: totalSpent,
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

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950" dir="rtl">
            <Navbar />

            <main className="flex-1 pt-12 pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Welcome Section */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                        <div className="space-y-2">
                            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                                مرحباً، {user?.name?.split(' ')[0] || 'المعلم'} <span className="animate-pulse inline-block">👋</span>
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">
                                إليك ملخص نشاطك التعليمي في منصة سيرز 2026
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link href="/marketplace">
                                <Button className="rounded-full px-8 font-black gap-2 shadow-xl shadow-primary/20">
                                    <PlusCircle className="w-5 h-5" />
                                    سجل جديد
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                        <StatCard 
                            label="إجمالي الطلبات" 
                            value={stats.orders_count} 
                            icon={<Package className="w-6 h-6" />} 
                            color="text-blue-600" 
                            bgColor="bg-blue-50 dark:bg-blue-900/20" 
                        />
                        <StatCard 
                            label="في المفضلة" 
                            value={stats.wishlist_count} 
                            icon={<Heart className="w-6 h-6" />} 
                            color="text-red-600" 
                            bgColor="bg-red-50 dark:bg-red-900/20" 
                        />
                        <StatCard 
                            label="تقييماتي" 
                            value={stats.reviews_count} 
                            icon={<Star className="w-6 h-6" />} 
                            color="text-amber-600" 
                            bgColor="bg-amber-50 dark:bg-amber-900/20" 
                        />
                        <StatCard 
                            label="إجمالي الإنفاق" 
                            value={formatPrice(stats.total_spent)} 
                            icon={<Wallet className="w-6 h-6" />} 
                            color="text-emerald-600" 
                            bgColor="bg-emerald-50 dark:bg-emerald-900/20" 
                        />
                    </div>

                    {/* Portfolio Builder Banner */}
                    <Card className="rounded-[2.5rem] border-none bg-gradient-to-r from-primary/10 via-primary/5 to-transparent overflow-hidden relative group mb-12">
                        <div className="absolute top-0 left-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                            <Sparkles className="w-32 h-32 text-primary" />
                        </div>
                        <CardContent className="p-10 flex flex-col md:flex-row items-center gap-10 relative z-10">
                            <div className="w-24 h-24 bg-white dark:bg-gray-900 rounded-[2rem] shadow-2xl flex items-center justify-center text-primary shrink-0">
                                <Zap className="w-12 h-12" />
                            </div>
                            <div className="flex-1 space-y-3 text-center md:text-right">
                                <div className="flex items-center justify-center md:justify-start gap-3">
                                    <h3 className="text-2xl font-black text-gray-900 dark:text-white">منشئ الملف الشخصي الآلي</h3>
                                    <span className="px-3 py-1 bg-primary text-white text-[10px] font-black rounded-full uppercase tracking-widest">ميزة مبتكرة</span>
                                </div>
                                <p className="text-gray-600 dark:text-gray-400 font-medium text-lg leading-relaxed max-w-3xl">
                                    حول سجلاتك التعليمية إلى ملف إنجاز (Portfolio) احترافي بضغطة زر واحدة. يستخدم الذكاء الاصطناعي لتنظيم وتنسيق أعمالك بشكل مبهر.
                                </p>
                            </div>
                            <Button className="rounded-full px-10 py-6 h-auto font-black text-lg shadow-xl shadow-primary/20 shrink-0">
                                ابدأ الآن
                            </Button>
                        </CardContent>
                    </Card>

                    <div className="grid lg:grid-cols-3 gap-10">
                        {/* Recent Orders */}
                        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                            <div className="px-8 py-6 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600">
                                        <Package className="w-5 h-5" />
                                    </div>
                                    <h2 className="text-xl font-black text-gray-900 dark:text-white">آخر الطلبات</h2>
                                </div>
                                <Link href="/orders">
                                    <Button variant="ghost" size="sm" className="text-primary font-bold hover:bg-primary/5 rounded-full">
                                        عرض الكل <ChevronLeft className="mr-1 w-4 h-4" />
                                    </Button>
                                </Link>
                            </div>

                            {isLoading ? (
                                <div className="p-8 space-y-6">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="animate-pulse flex items-center gap-4">
                                            <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-2xl"></div>
                                            <div className="flex-1 space-y-2">
                                                <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-3/4"></div>
                                                <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : recentOrders.length === 0 ? (
                                <div className="p-20 text-center">
                                    <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                                        <ShoppingBag className="w-10 h-10" />
                                    </div>
                                    <p className="text-gray-500 dark:text-gray-400 font-bold text-lg mb-6">لا توجد طلبات حتى الآن</p>
                                    <Link href="/marketplace">
                                        <Button variant="outline" className="rounded-full px-8 font-bold">
                                            تصفح المتجر
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-50 dark:divide-gray-800">
                                    {recentOrders.map((order) => (
                                        <Link
                                            key={order.id}
                                            href={`/orders/${order.id}`}
                                            className="p-6 flex items-center gap-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all group"
                                        >
                                            <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <Package className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h4 className="font-black text-gray-900 dark:text-white truncate">طلب #{order.id.slice(-6)}</h4>
                                                    <span className="text-sm font-black text-primary">{formatPrice(order.total)}</span>
                                                </div>
                                                <div className="flex items-center gap-4 text-xs font-bold text-gray-500 dark:text-gray-400">
                                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(order.created_at).toLocaleDateString('ar-SA')}</span>
                                                    <OrderStatusBadge status={order.status} />
                                                </div>
                                            </div>
                                            <ChevronLeft className="w-5 h-5 text-gray-300 group-hover:text-primary transition-colors" />
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Quick Links Sidebar */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-black text-gray-900 dark:text-white px-2">روابط سريعة</h3>
                            <div className="grid grid-cols-1 gap-4">
                                {quickLinks.map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className="group bg-white dark:bg-gray-900 p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-5 hover:shadow-xl hover:-translate-y-1 transition-all"
                                    >
                                        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110", link.color)}>
                                            {link.icon}
                                        </div>
                                        <span className="text-lg font-black text-gray-900 dark:text-white group-hover:text-primary transition-colors">{link.label}</span>
                                        <ArrowLeft className="w-5 h-5 mr-auto text-gray-300 group-hover:text-primary transition-colors" />
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

function StatCard({ label, value, icon, color, bgColor }: any) {
    return (
        <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 transition-all hover:shadow-xl hover:-translate-y-1 group">
            <div className="flex items-center justify-between mb-6">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500", bgColor, color)}>
                    {icon}
                </div>
            </div>
            <div className="space-y-1">
                <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{label}</h3>
                <div className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{value}</div>
            </div>
        </div>
    );
}

function OrderStatusBadge({ status }: { status: string }) {
    const statusConfig: Record<string, { label: string; className: string }> = {
        pending: { label: 'قيد الانتظار', className: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' },
        processing: { label: 'قيد المعالجة', className: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' },
        completed: { label: 'مكتمل', className: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' },
        failed: { label: 'فشل', className: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' },
        refunded: { label: 'مسترد', className: 'bg-gray-50 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400' },
        cancelled: { label: 'ملغي', className: 'bg-gray-50 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400' },
    };
    const config = statusConfig[status] || statusConfig.pending;

    return (
        <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider", config.className)}>
            {config.label}
        </span>
    );
}
