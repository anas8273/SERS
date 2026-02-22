'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import { getUserRecords } from '@/lib/firestore-service';
import type { Order, UserRecord } from '@/types';
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
  FolderOpen,
  Download,
  Edit3,
  Library,
  Layers,
  Rocket,
  Eye,
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
  analyses_count: number;
  certificates_count: number;
  plans_count: number;
  achievements_count: number;
  // Firestore stats
  records_total: number;
  records_draft: number;
  records_final: number;
}

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 0,
  }).format(amount);
}

// ===== Quick Action Cards =====
const QUICK_ACTIONS = [
  {
    id: 'editor',
    title: 'محرر القوالب',
    description: 'أنشئ مستنداً جديداً من قالب تفاعلي',
    icon: Edit3,
    color: 'from-blue-500 to-blue-600',
    href: '/services',
    badge: null,
  },
  {
    id: 'bulk',
    title: 'التوليد الجماعي',
    description: 'ولّد عشرات الشهادات من ملف Excel',
    icon: Layers,
    color: 'from-violet-500 to-purple-600',
    href: '/batch-generate',
    badge: 'قوي',
  },
  {
    id: 'analytics',
    title: 'تحليل البيانات',
    description: 'حلّل نتائج الطلاب برسوم بيانية',
    icon: BarChart3,
    color: 'from-emerald-500 to-teal-600',
    href: '/analyses',
    badge: null,
  },
  {
    id: 'ai',
    title: 'المساعد الذكي',
    description: 'اسأل AI لمساعدتك في أي مهمة',
    icon: Bot,
    color: 'from-pink-500 to-rose-600',
    href: '/ai-assistant',
    badge: 'AI',
  },
];

// ===== Quick Tool Links (non-service specific) =====
const DASHBOARD_TOOLS = [
  { id: 'analyses', title: 'تحليل النتائج', icon: BarChart3, color: 'bg-blue-500', href: '/analyses' },
  { id: 'achievements', title: 'الإنجازات', icon: Trophy, color: 'bg-purple-500', href: '/achievements' },
  { id: 'templates', title: 'سوق القوالب', icon: FolderOpen, color: 'bg-orange-500', href: '/marketplace' },
  { id: 'services', title: 'الخدمات التعليمية', icon: Layers, color: 'bg-teal-500', href: '/services' },
  { id: 'my-library', title: 'مكتبتي', icon: Library, color: 'bg-rose-500', href: '/my-library' },
  { id: 'my-templates', title: 'قوالبي', icon: FileText, color: 'bg-sky-500', href: '/my-templates' },
];

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({
    orders_count: 0, wishlist_count: 0, reviews_count: 0, total_spent: 0,
    analyses_count: 0, certificates_count: 0, plans_count: 0, achievements_count: 0,
    records_total: 0, records_draft: 0, records_final: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [recentRecords, setRecentRecords] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!isAuthenticated || !user) return;

      try {
        // Fetch orders from Laravel API
        let orders: Order[] = [];
        let wishlistCount = 0;
        try {
          const ordersRes = await api.getOrders();
          orders = ordersRes.data || [];
        } catch { /* API may not be available */ }

        try {
          const wishlistRes = await api.getWishlistIds();
          wishlistCount = wishlistRes.data?.length || 0;
        } catch { /* Wishlist may not exist */ }

        // Fetch user records from Firestore
        let userRecords: UserRecord[] = [];
        try {
          userRecords = await getUserRecords(user.id);
        } catch { /* Firestore may not be configured */ }

        // Fetch educational stats from Laravel
        let analysesCount = 0, certificatesCount = 0, plansCount = 0, achievementsCount = 0;
        try {
          const [aRes, cRes, pRes, achRes] = await Promise.all([
            api.getAnalyses().catch(() => ({ data: [] })),
            api.getCertificates().catch(() => ({ data: [] })),
            api.getPlans().catch(() => ({ data: [] })),
            api.getAchievements().catch(() => ({ data: [] })),
          ]);
          analysesCount = aRes.data?.length || 0;
          certificatesCount = cRes.data?.length || 0;
          plansCount = pRes.data?.length || 0;
          achievementsCount = achRes.data?.length || 0;
        } catch { /* Educational services may not be available */ }

        const completedOrders = orders.filter((o: Order) => o.status === 'completed');
        const totalSpent = completedOrders.reduce((sum: number, o: Order) => sum + o.total, 0);
        const draftRecords = userRecords.filter(r => r.status === 'draft');
        const finalRecords = userRecords.filter(r => r.status === 'completed' || (r.status as string) === 'final');

        setRecentOrders(orders.slice(0, 5));
        setRecentRecords(userRecords.slice(0, 5));

        setStats({
          orders_count: orders.length,
          wishlist_count: wishlistCount,
          reviews_count: 0,
          total_spent: totalSpent,
          analyses_count: analysesCount,
          certificates_count: certificatesCount + finalRecords.length,
          plans_count: plansCount,
          achievements_count: achievementsCount,
          records_total: userRecords.length,
          records_draft: draftRecords.length,
          records_final: finalRecords.length,
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
  }, [isAuthenticated, authLoading, user]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <p className="text-sm text-gray-400 font-medium animate-pulse">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'صباح الخير';
    return 'مساء الخير';
  };

  const completionPercent = stats.records_total > 0
    ? Math.round((stats.records_final / stats.records_total) * 100)
    : 0;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950" dir="rtl">
      <Navbar />

      <main className="flex-1 pt-8 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* ===== Welcome Section ===== */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                {getGreeting()}، {user?.name?.split(' ')[0] || 'المستخدم'} <span className="inline-block animate-pulse">👋</span>
              </h1>
              <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">
                إليك ملخص نشاطك في منصة سيرز
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/my-library">
                <Button variant="outline" className="rounded-full px-6 font-bold gap-2">
                  <FolderOpen className="w-4 h-4" />
                  مكتبتي
                </Button>
              </Link>
              <Link href="/services">
                <Button className="rounded-full px-6 font-black gap-2 shadow-xl shadow-primary/20">
                  <Rocket className="w-5 h-5" />
                  ابدأ الآن
                </Button>
              </Link>
            </div>
          </div>

          {/* ===== Quick Action Cards ===== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {QUICK_ACTIONS.map((action) => (
              <Link key={action.id} href={action.href}>
                <Card className="group relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer h-full">
                  <div className={cn("absolute inset-0 bg-gradient-to-br opacity-90 group-hover:opacity-100 transition-opacity", action.color)} />
                  <CardContent className="relative z-10 p-6 text-white">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <action.icon className="w-6 h-6" />
                      </div>
                      {action.badge && (
                        <Badge className="bg-white/20 text-white border-0 text-[10px] font-bold">
                          {action.badge}
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-black text-lg mb-1">{action.title}</h3>
                    <p className="text-white/80 text-sm leading-relaxed">{action.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* ===== Stats Cards ===== */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <StatCard
              label="مستندات مُولّدة"
              value={stats.records_final}
              icon={<Award className="w-5 h-5" />}
              color="text-emerald-600"
              bgColor="bg-emerald-50 dark:bg-emerald-900/20"
            />
            <StatCard
              label="مسودات محفوظة"
              value={stats.records_draft}
              icon={<Edit3 className="w-5 h-5" />}
              color="text-amber-600"
              bgColor="bg-amber-50 dark:bg-amber-900/20"
            />
            <StatCard
              label="التحليلات"
              value={stats.analyses_count}
              icon={<BarChart3 className="w-5 h-5" />}
              color="text-blue-600"
              bgColor="bg-blue-50 dark:bg-blue-900/20"
            />
            <StatCard
              label="الطلبات"
              value={stats.orders_count}
              icon={<Package className="w-5 h-5" />}
              color="text-purple-600"
              bgColor="bg-purple-50 dark:bg-purple-900/20"
            />
            <StatCard
              label="إجمالي الإنفاق"
              value={formatPrice(stats.total_spent)}
              icon={<Wallet className="w-5 h-5" />}
              color="text-primary"
              bgColor="bg-primary/5"
            />
          </div>

          {/* ===== Progress Bar ===== */}
          {stats.records_total > 0 && (
            <Card className="rounded-2xl border-gray-100 dark:border-gray-800 mb-8">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <span className="font-bold text-gray-900 dark:text-white">نسبة الإنجاز</span>
                  </div>
                  <span className="text-sm font-bold text-primary">{completionPercent}%</span>
                </div>
                <Progress value={completionPercent} className="h-3" />
                <p className="text-sm text-muted-foreground mt-2">
                  {stats.records_final} مستند مكتمل من أصل {stats.records_total} مستند
                </p>
              </CardContent>
            </Card>
          )}

          {/* ===== AI Assistant Banner ===== */}
          <Card className="rounded-[2rem] border-none bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 overflow-hidden relative group mb-8">
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
                  دع الذكاء الاصطناعي يساعدك في ملء النماذج وتحليل البيانات وإعداد التقارير. اسأل أي سؤال واحصل على إجابات فورية.
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
            {/* ===== Main Content ===== */}
            <div className="lg:col-span-2 space-y-6">

              {/* Recent Records from Firestore */}
              <Card className="rounded-[2rem] border-gray-100 dark:border-gray-800 overflow-hidden">
                <CardHeader className="border-b border-gray-50 dark:border-gray-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center text-emerald-600">
                        <FolderOpen className="w-5 h-5" />
                      </div>
                      <CardTitle className="text-lg">آخر المستندات</CardTitle>
                    </div>
                    <Link href="/my-library">
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
                          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-3/4" />
                            <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : recentRecords.length === 0 ? (
                    <div className="p-12 text-center">
                      <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                        <Library className="w-8 h-8" />
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 font-medium mb-2">لا توجد مستندات حتى الآن</p>
                      <p className="text-sm text-muted-foreground mb-4">ابدأ بإنشاء مستندك الأول من محرر القوالب</p>
                      <Link href="/services">
                        <Button variant="outline" className="rounded-full px-6 font-bold">
                          <PlusCircle className="w-4 h-4 ml-2" />
                          إنشاء مستند جديد
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50 dark:divide-gray-800">
                      {recentRecords.map((record) => (
                        <Link key={record.id} href={`/editor/record/${record.id}`}>
                          <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex items-center gap-4">
                            <div className={cn(
                              "w-12 h-12 rounded-xl flex items-center justify-center",
                              record.status === 'completed'
                                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600'
                                : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600'
                            )}>
                              {record.status === 'completed' ? <CheckCircle className="w-6 h-6" /> : <Edit3 className="w-6 h-6" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-gray-900 dark:text-white truncate">
                                {(record as any).template_name || `مستند #${record.id.slice(0, 8)}`}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {record.updated_at
                                  ? new Date(record.updated_at).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' })
                                  : new Date(record.created_at).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' })
                                }
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={record.status === 'completed' ? 'default' : 'secondary'} className="text-[10px]">
                                {record.status === 'completed' ? 'مكتمل' : 'مسودة'}
                              </Badge>
                              <Eye className="w-4 h-4 text-gray-400" />
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

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
                          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-3/4" />
                            <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
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
                        <Button variant="outline" className="rounded-full px-6 font-bold">تصفح المتجر</Button>
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
                              <p className="font-bold text-gray-900 dark:text-white truncate">طلب #{order.id.toString().slice(0, 8)}</p>
                              <p className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleDateString('ar-SA')}</p>
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

            {/* ===== Sidebar ===== */}
            <div className="space-y-6">

              {/* Educational Services Grid */}
              <Card className="rounded-[2rem] border-gray-100 dark:border-gray-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      الخدمات التعليمية
                    </CardTitle>
                    <Link href="/services">
                      <Button variant="ghost" size="sm" className="text-primary font-bold hover:bg-primary/5 rounded-full text-xs">
                        الكل <ChevronLeft className="mr-1 w-3 h-3" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2">
                  {DASHBOARD_TOOLS.map((tool) => (
                    <Link key={tool.id} href={tool.href}>
                      <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-center group">
                        <div className={`w-9 h-9 ${tool.color} rounded-lg flex items-center justify-center text-white mx-auto mb-1.5 group-hover:scale-110 transition-transform`}>
                          <tool.icon className="h-4 w-4" />
                        </div>
                        <p className="text-xs font-bold text-gray-700 dark:text-gray-300 line-clamp-1">{tool.title}</p>
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>

              {/* Quick Links */}
              <Card className="rounded-[2rem] border-gray-100 dark:border-gray-800">
                <CardHeader>
                  <CardTitle className="text-lg">روابط سريعة</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'المتجر', href: '/marketplace', icon: <ShoppingBag className="w-5 h-5" />, color: 'bg-blue-500' },
                    { label: 'مكتبتي', href: '/my-library', icon: <FolderOpen className="w-5 h-5" />, color: 'bg-emerald-500' },
                    { label: 'المفضلة', href: '/wishlist', icon: <Heart className="w-5 h-5" />, color: 'bg-red-500' },
                    { label: 'الإعدادات', href: '/settings', icon: <Settings className="w-5 h-5" />, color: 'bg-gray-500' },
                  ].map((link) => (
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
                        استخدم ميزة التوليد الجماعي لإنشاء عشرات الشهادات دفعة واحدة من ملف Excel. وفّر ساعات من العمل اليدوي!
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

// ===== Stat Card Component =====
function StatCard({
  label, value, icon, color, bgColor
}: {
  label: string; value: number | string; icon: React.ReactNode; color: string; bgColor: string;
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
