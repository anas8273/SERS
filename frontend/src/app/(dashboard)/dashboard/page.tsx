'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import { onUserRecordsChange } from '@/lib/firestore-service';
import type { Order, UserRecord } from '@/types';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/useTranslation';
import {
  Package,
  Heart,
  Wallet,
  ShoppingBag,
  Settings,
  Clock,
  Sparkles,
  FileText,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Zap,
  BarChart3,
  Award,
  Bot,
  TrendingUp,
  CheckCircle,
  FolderOpen,
  Download,
  Edit3,
  Library,
  Layers,
  Rocket,
  Eye,
  Flame,
  Sun,
  Moon,
  Sunrise,
  CloudMoon,
  Star,
} from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { StatCardSkeleton } from '@/components/ui/skeletons';
import { LottieAnimation } from '@/components/ui/LottieAnimation';
import { Tilt3DCard } from '@/components/ui/Tilt3DCard';
import { useAdaptiveUI } from '@/components/providers/AdaptiveUIProvider';

// ─── Types ────────────────────────────────────────────────────────────────────
interface DashboardStats {
  orders_count: number;
  wishlist_count: number;
  reviews_count: number;
  total_spent: number;
  analyses_count: number;
  certificates_count: number;
  plans_count: number;
  achievements_count: number;
  records_total: number;
  records_draft: number;
  records_final: number;
}

const ZERO_STATS: DashboardStats = {
  orders_count: 0, wishlist_count: 0, reviews_count: 0, total_spent: 0,
  analyses_count: 0, certificates_count: 0, plans_count: 0, achievements_count: 0,
  records_total: 0, records_draft: 0, records_final: 0,
};

// ─── Quick actions (4 feature cards at top) — no duplicates with Bento cards ──
const QUICK_ACTIONS = [
  { id: 'editor',    icon: Edit3,    color: 'from-blue-500 to-blue-600',     href: '/my-templates',   badge: null },
  { id: 'bulk',      icon: Layers,   color: 'from-violet-500 to-purple-600', href: '/batch-generate', badge: null },
  { id: 'analytics', icon: BarChart3,color: 'from-emerald-500 to-teal-600', href: '/analyses',       badge: null },
  // سجل المتابعة — not duplicated anywhere else on the page
  { id: 'followup',  icon: CheckCircle, color: 'from-amber-500 to-orange-500', href: '/follow-up-log', badge: null },
];

// ─── Educational tools sidebar — unique tools not covered by Quick Actions ────
const DASHBOARD_TOOLS = [
  { id: 'my-library',   tKey: 'dash.tool.library',      icon: Library,     color: 'bg-rose-500',   href: '/my-library' },
  { id: 'marketplace',  tKey: 'dash.tool.templates',    icon: ShoppingBag, color: 'bg-orange-500', href: '/marketplace' },
  { id: 'achievements', tKey: 'dash.tool.achievements', icon: Award,       color: 'bg-purple-500', href: '/achievements' },
  { id: 'plans',        tKey: 'dash.tool.plans',        icon: FileText,    color: 'bg-sky-500',    href: '/plans' },
  { id: 'services',     tKey: 'dash.tool.services',     icon: Layers,      color: 'bg-teal-500',   href: '/services' },
];

// ─── Greeting helpers (consolidated from SmartGreeting + UserQuickStats) ──────
// NOTE: moved inside component so it uses context-aware ta(), see DashboardPage below

// ─── Skeleton row (reusable, was copy-pasted 3 times) ────────────────────────
function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="p-6 space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="animate-pulse flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-3/4" />
            <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color, bgColor }: {
  label: string; value: number | string; icon: React.ReactNode; color: string; bgColor: string;
}) {
  return (
    <Card className="rounded-2xl border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', bgColor, color)}>{icon}</div>
          <div>
            <p className="text-2xl font-black text-gray-900 dark:text-white">{value}</p>
            <p className="text-sm text-muted-foreground font-medium">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function DashboardPage() {
  const { t, ta, locale, dir } = useTranslation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { behavior, trackToolUsage } = useAdaptiveUI();

  // Greeting helper — inside component to use context-aware ta()
  const timeGreeting = () => {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return ta('صباح الخير', 'Good Morning');
    if (h < 17) return ta('مساء الخير', 'Good Afternoon');
    return ta('مساء النور', 'Good Evening');
  };

  const [stats, setStats]               = useState<DashboardStats>(ZERO_STATS);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [recentRecords, setRecentRecords] = useState<UserRecord[]>([]);
  const [isLoadingOrders,  setIsLoadingOrders]  = useState(true);
  const [isLoadingRecords, setIsLoadingRecords] = useState(true);
  const [isLoadingStats,   setIsLoadingStats]   = useState(true);

  // ── Firestore real-time listener ─────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    setIsLoadingRecords(true);
    const unsub = onUserRecordsChange(user.id, (records) => {
      const draft = records.filter(r => r.status === 'draft').length;
      const final = records.filter(r => r.status === 'completed' || (r.status as string) === 'final').length;
      setRecentRecords(records.slice(0, 5));
      setStats(prev => ({ ...prev, records_total: records.length, records_draft: draft, records_final: final }));
      setIsLoadingRecords(false);
    });
    return () => unsub();
  }, [isAuthenticated, user]);

  // ── Single dashboard API call (replaces 7+ parallel requests) ─────────────
  useEffect(() => {
    if (!isAuthenticated || !user || authLoading) return;
    setIsLoadingOrders(true);
    setIsLoadingStats(true);
   api.getDashboardSummary().then(res => {
      if (res?.success && res.data) {
        const data = res.data as {
          stats: {
            orders_count: number;
            wishlist_count: number;
            reviews_count: number;
            total_spent: number;
            unread_notifications: number;
            analyses_count: number;
            certificates_count: number;
            plans_count: number;
            achievements_count: number;
          };
          recent_orders: Order[];
        };
        const { stats: s, recent_orders } = data;
        setStats(prev => ({
          ...prev,
          orders_count:     s.orders_count     ?? 0,
          wishlist_count:   s.wishlist_count   ?? 0,
          reviews_count:    s.reviews_count    ?? 0,
          total_spent:      s.total_spent      ?? 0,
          analyses_count:   s.analyses_count   ?? 0,
          certificates_count: s.certificates_count ?? 0,
          plans_count:      s.plans_count      ?? 0,
          achievements_count: s.achievements_count ?? 0,
        }));
        setRecentOrders(recent_orders || []);
      }
    }).catch(() => {/* silent – show zeros */}).finally(() => {
      setIsLoadingOrders(false);
      setIsLoadingStats(false);
    });
  }, [isAuthenticated, authLoading, user]);

  // ── Auth loading screen ───────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <LottieAnimation type="loading" size={80} />
          <p className="text-sm text-gray-400 font-medium">{t('dash.loading' as any)}</p>
        </div>
      </div>
    );
  }

  // ── Derived values ────────────────────────────────────────────────────────
  const completionPercent = stats.records_total > 0
    ? Math.round((stats.records_final / stats.records_total) * 100)
    : 0;

  const firstName = user?.name?.split(' ')[0] || '';

  // ── Adaptive tool sort ────────────────────────────────────────────────────
  const sortedTools = [...DASHBOARD_TOOLS].sort((a, b) => {
    const ai = behavior.frequentTools.indexOf(a.id);
    const bi = behavior.frequentTools.indexOf(b.id);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  // ── Stat rows fed into StatCard ───────────────────────────────────────────
  const statRows = [
    { label: t('dash.stat.generated' as any), value: stats.records_final,         icon: <Award className="w-5 h-5" />,    color: 'text-emerald-600', bgColor: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: t('dash.stat.drafts' as any),    value: stats.records_draft,          icon: <Edit3 className="w-5 h-5" />,    color: 'text-amber-600',   bgColor: 'bg-amber-50 dark:bg-amber-900/20' },
    { label: t('dash.stat.analyses' as any),  value: stats.analyses_count,         icon: <BarChart3 className="w-5 h-5" />,color: 'text-blue-600',    bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: t('dash.stat.orders' as any),    value: stats.orders_count,           icon: <Package className="w-5 h-5" />, color: 'text-purple-600',  bgColor: 'bg-purple-50 dark:bg-purple-900/20' },
    { label: t('dash.stat.totalSpent' as any),value: formatPrice(stats.total_spent),icon: <Wallet className="w-5 h-5" />, color: 'text-primary',     bgColor: 'bg-primary/5' },
  ];

  return (
    <div dir={dir} className="pt-8 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        {/* ═══ Header: single greeting + CTA buttons ══════════════════════ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{timeGreeting()}،</p>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white">
              {firstName} 👋
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
              {t('dash.summary' as any)}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/orders">
              <Button variant="outline" className="rounded-full px-6 font-bold gap-2">
                <Package className="w-4 h-4" />
                {t('dash.myPurchases' as any)}
              </Button>
            </Link>
            <Link href="/services">
              <Button className="rounded-full px-6 font-black gap-2 shadow-xl shadow-primary/20">
                <Rocket className="w-5 h-5" />
                {t('dash.startNow' as any)}
              </Button>
            </Link>
          </div>
        </div>

        {/* ═══ Quick-stats bar (orders / wishlist / exports / wallet) ══════ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: t('dash.stat.orders'     as any), value: stats.orders_count,            icon: <Package className="w-4 h-4" />, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/20', href: '/orders' },
            { label: t('dash.favorites'       as any), value: stats.wishlist_count,           icon: <Heart className="w-4 h-4" />,   color: 'text-rose-600',   bg: 'bg-rose-50 dark:bg-rose-900/20',     href: '/wishlist' },
            { label: t('dash.stat.generated'  as any), value: stats.records_final,            icon: <Award className="w-4 h-4" />,   color: 'text-emerald-600',bg: 'bg-emerald-50 dark:bg-emerald-900/20',href: '/my-templates' },
            { label: t('dash.stat.totalSpent' as any), value: formatPrice(stats.total_spent), icon: <Wallet className="w-4 h-4" />,  color: 'text-primary',    bg: 'bg-primary/10',                       href: '/settings?tab=wallet' },
          ].map((item, i) => (
            <Link key={i} href={item.href}>
              <div className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', item.bg, item.color, 'group-hover:scale-110 transition-transform')}>
                  {item.icon}
                </div>
                <div className="min-w-0">
                  {isLoadingStats
                    ? <div className="h-5 w-14 bg-gray-100 dark:bg-gray-800 rounded animate-pulse mb-1" />
                    : <p className={cn('text-xl font-black', item.color)}>{item.value}</p>
                  }
                  <p className="text-xs text-muted-foreground truncate">{item.label}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* ═══ Quick Action Cards (4 feature cards with 3D tilt) ═══════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {QUICK_ACTIONS.map((action, index) => (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.08, ease: 'easeOut' }}
            >
              <Tilt3DCard maxTilt={10} glare>
                <Link href={action.href} onClick={() => trackToolUsage(action.id)}>
                  <Card className="group relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer depth-shadow">
                    <div className={cn('absolute inset-0 bg-gradient-to-br opacity-90 group-hover:opacity-100 transition-opacity', action.color)} />
                    <CardContent className="relative z-10 p-6 text-white">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                          <action.icon className="w-6 h-6" />
                        </div>
                        {action.badge && (
                          <Badge className="bg-white/20 text-white border-0 text-[10px] font-bold">{action.badge}</Badge>
                        )}
                      </div>
                      <h3 className="font-black text-lg mb-1">{t(`dash.action.${action.id}` as any)}</h3>
                      <p className="text-white/80 text-sm leading-relaxed">{t(`dash.action.${action.id}Desc` as any)}</p>
                    </CardContent>
                  </Card>
                </Link>
              </Tilt3DCard>
            </motion.div>
          ))}
        </div>

        {/* ═══ Stats cards (5 metrics) ════════════════════════════════════ */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {statRows.map((stat, i) =>
            isLoadingStats ? (
              <StatCardSkeleton key={i} />
            ) : (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35, delay: 0.3 + i * 0.07 }}>
                <StatCard label={stat.label} value={stat.value} icon={stat.icon} color={stat.color} bgColor={stat.bgColor} />
              </motion.div>
            )
          )}
        </div>

        {/* ═══ Bento grid: Progress + AI card ════════════════════════════ */}
        <div className="bento-grid">

          {/* Progress — only if user has records */}
          {stats.records_total > 0 && (
            <motion.div className="bento-md" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.35 }}>
              <Card className="bento-card h-full border-gray-100 dark:border-gray-800 depth-shadow">
                <CardContent className="p-6 flex flex-col justify-center h-full">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      <span className="font-bold text-gray-900 dark:text-white">{t('dash.progress' as any)}</span>
                    </div>
                    <span className="text-2xl font-black text-primary">{completionPercent}%</span>
                  </div>
                  <Progress value={completionPercent} className="h-3" />
                  <p className="text-sm text-muted-foreground mt-2">
                    {t('dash.progressDesc' as any)
                      .replace('{final}', String(stats.records_final))
                      .replace('{total}', String(stats.records_total))
                    }
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* AI Assistant feature card */}
          <motion.div
            className={stats.records_total > 0 ? 'bento-md' : 'bento-full'}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Tilt3DCard maxTilt={5} glare scale={1.01}>
              <Card className="bento-card h-full border-none bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 overflow-hidden relative group depth-shadow">
                <div className="absolute top-0 left-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500 animate-float-3d">
                  <Bot className="w-40 h-40 text-white" />
                </div>
                <CardContent className="p-8 flex flex-col justify-center gap-4 relative z-10 h-full">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <div className="space-y-2 text-white">
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-black">{t('dash.aiAssistant' as any)}</h2>
                      <Badge className="bg-white/20 text-white border-0 text-[10px]">{t('dash.aiPowered' as any)}</Badge>
                    </div>
                    <p className="text-white/75 font-medium text-sm leading-relaxed">{t('dash.aiDesc' as any)}</p>
                  </div>
                  <Link href="/ai-assistant" onClick={() => trackToolUsage('ai-assistant')}>
                    <Button variant="secondary" size="sm" className="rounded-full px-6 font-black shadow-xl">
                      <Bot className="w-4 h-4 ms-2" />
                      {t('dash.startChat' as any)}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </Tilt3DCard>
          </motion.div>
        </div>

        {/* ═══ Main 2-col grid: Recent docs + Orders | Sidebar ═══════════ */}
        <div className="grid lg:grid-cols-3 gap-8">

          {/* LEFT: Recent records + orders */}
          <div className="lg:col-span-2 space-y-6">

            {/* Recent Records */}
            <Card className="rounded-[2rem] border-gray-100 dark:border-gray-800 overflow-hidden">
              <CardHeader className="border-b border-gray-50 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center text-emerald-600">
                      <FolderOpen className="w-5 h-5" />
                    </div>
                    <CardTitle className="text-lg">{t('dash.recentDocs' as any)}</CardTitle>
                  </div>
                  <Link href="/my-templates">
                    <Button variant="ghost" size="sm" className="text-primary font-bold hover:bg-primary/5 rounded-full">
                      {t('dash.viewAll' as any)}
                      {dir === 'rtl' ? <ChevronLeft className="me-1 w-4 h-4" /> : <ChevronRight className="ms-1 w-4 h-4" />}
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isLoadingRecords ? (
                  <ListSkeleton />
                ) : recentRecords.length === 0 ? (
                  <div className="p-12 text-center">
                    <LottieAnimation type="empty" size={100} className="mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium mb-2">{t('dash.noDocs' as any)}</p>
                    <p className="text-sm text-muted-foreground mb-4">{t('dash.noDocsDesc' as any)}</p>
                    <Link href="/services">
                      <Button variant="outline" className="rounded-full px-6 font-bold">
                        <PlusCircle className="w-4 h-4 ms-2" />
                        {t('dash.createDoc' as any)}
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50 dark:divide-gray-800">
                    {recentRecords.map((record) => (
                      <Link key={record.id} href={`/editor/record/${record.id}`}>
                        <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex items-center gap-4">
                          <div className={cn(
                            'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
                            record.status === 'completed'
                              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600'
                              : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600'
                          )}>
                            {record.status === 'completed' ? <CheckCircle className="w-6 h-6" /> : <Edit3 className="w-6 h-6" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 dark:text-white truncate">
                              {(record as any).template_name || `${t('dash.order' as any)} #${record.id.slice(0, 8)}`}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(record.updated_at || record.created_at).toLocaleDateString(
                                locale === 'ar' ? 'ar-SA' : 'en-US',
                                { year: 'numeric', month: 'short', day: 'numeric' }
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant={record.status === 'completed' ? 'default' : 'secondary'} className="text-[10px]">
                              {record.status === 'completed' ? t('dash.completed' as any) : t('dash.draft' as any)}
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
                    <CardTitle className="text-lg">{t('dash.recentOrders' as any)}</CardTitle>
                  </div>
                  <Link href="/orders">
                    <Button variant="ghost" size="sm" className="text-primary font-bold hover:bg-primary/5 rounded-full">
                      {t('dash.viewAll' as any)}
                      {dir === 'rtl' ? <ChevronLeft className="me-1 w-4 h-4" /> : <ChevronRight className="ms-1 w-4 h-4" />}
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isLoadingOrders ? (
                  <ListSkeleton />
                ) : recentOrders.length === 0 ? (
                  <div className="p-12 text-center">
                    <LottieAnimation type="empty" size={100} className="mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium mb-4">{t('dash.noOrders' as any)}</p>
                    <Link href="/marketplace">
                      <Button variant="outline" className="rounded-full px-6 font-bold">
                        {t('dash.browseStore' as any)}
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50 dark:divide-gray-800">
                    {recentOrders.map((order) => (
                      <Link key={order.id} href={`/orders/${order.id}`}>
                        <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex items-center gap-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
                            <Package className="w-6 h-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 dark:text-white truncate">
                              {t('dash.order' as any)} #{order.id.toString().slice(0, 8)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(order.created_at).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US')}
                            </p>
                          </div>
                          <div className="text-end shrink-0">
                            <p className="font-bold text-primary">{formatPrice(order.total)}</p>
                            <Badge variant={order.status === 'completed' ? 'default' : 'secondary'} className="text-[10px]">
                              {order.status === 'completed'
                                ? t('dash.completed' as any)
                                : order.status === 'pending'
                                  ? t('dash.pending' as any)
                                  : order.status}
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

          {/* RIGHT: Sidebar */}
          <div className="space-y-6">

            {/* Educational tools grid */}
            <Card className="rounded-[2rem] border-gray-100 dark:border-gray-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    {t('dash.eduServices' as any)}
                  </CardTitle>
                  <Link href="/services">
                    <Button variant="ghost" size="sm" className="text-primary font-bold hover:bg-primary/5 rounded-full text-xs">
                      {t('dash.all' as any)}
                      {dir === 'rtl' ? <ChevronLeft className="me-1 w-3 h-3" /> : <ChevronRight className="ms-1 w-3 h-3" />}
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                {sortedTools.map((tool) => (
                  <Link key={tool.id} href={tool.href} onClick={() => trackToolUsage(tool.id)}>
                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-center group card-3d-hover">
                      <div className={`w-9 h-9 ${tool.color} rounded-lg flex items-center justify-center text-white mx-auto mb-1.5 group-hover:scale-110 transition-transform`}>
                        <tool.icon className="h-4 w-4" />
                      </div>
                      <p className="text-xs font-bold text-gray-700 dark:text-gray-300 line-clamp-1">{t(tool.tKey as any)}</p>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>

            {/* Quick navigation */}
            <Card className="rounded-[2rem] border-gray-100 dark:border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg">{t('dash.quickNav' as any)}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { label: t('dash.favorites' as any), href: '/wishlist', icon: <Heart className="w-4 h-4" />,   color: 'text-red-500'  },
                  { label: t('dash.orders'    as any), href: '/orders',   icon: <Package className="w-4 h-4" />, color: 'text-blue-500' },
                  { label: t('dash.settings'  as any), href: '/settings', icon: <Settings className="w-4 h-4" />,color: 'text-gray-500' },
                ].map((link) => (
                  <Link key={link.href} href={link.href}>
                    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
                      <span className={link.color}>{link.icon}</span>
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-300 group-hover:text-primary transition-colors">{link.label}</span>
                      {dir === 'rtl'
                        ? <ChevronLeft className="w-4 h-4 text-gray-300 ms-auto" />
                        : <ChevronRight className="w-4 h-4 text-gray-300 ms-auto" />
                      }
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>

            {/* Tip card */}
            <Card className="rounded-[2rem] bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-100 dark:border-amber-800">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-amber-900 dark:text-amber-100 mb-1">{t('dash.tipTitle' as any)}</h4>
                    <p className="text-sm text-amber-700 dark:text-amber-200">{t('dash.tipText' as any)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}
