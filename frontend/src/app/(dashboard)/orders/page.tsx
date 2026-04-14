'use client';

import { logger } from '@/lib/logger';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SafeImage } from '@/components/ui/safe-image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/authStore';
import type { LibraryItem } from '@/stores/authStore';
import { api } from '@/lib/api';
import type { Order } from '@/types';
import { PageBreadcrumb } from '@/components/ui/breadcrumb';
import { cn, formatPrice } from '@/lib/utils';
import { NoOrdersEmpty } from '@/components/ui/empty-state';
import { useTranslation } from '@/i18n/useTranslation';
import { ta } from '@/i18n/auto-translations';
import toast from 'react-hot-toast';
import {
  Package,
  ShoppingBag,
  Download,
  Eye,
  FileText,
  Clock,
  CheckCircle,
  ExternalLink,
  Search,
  Grid3X3,
  List,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Wallet,
  Star,
  Layers,
  Library,
  Receipt,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════
type ActiveTab = 'library' | 'orders';
type ViewMode = 'grid' | 'list';
type SortBy = 'date_desc' | 'date_asc' | 'name_asc';

const ITEMS_PER_PAGE = 12;

// ═══════════════════════════════════════════════════════════════════════
// Order Status Badge
// ═══════════════════════════════════════════════════════════════════════
function OrderStatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; className: string; icon: string }> = {
    pending:    { label: ta('قيد الانتظار', 'Pending'),     className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300', icon: '⏳' },
    processing: { label: ta('قيد المعالجة', 'Processing'),   className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',     icon: '🔄' },
    completed:  { label: ta('مكتمل', 'Completed'),           className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',   icon: '✅' },
    failed:     { label: ta('فشل', 'Failed'),                className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',           icon: '❌' },
    refunded:   { label: ta('مسترجع', 'Refunded'),           className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300', icon: '↩️' },
    cancelled:  { label: ta('ملغي', 'Cancelled'),            className: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300',       icon: '🚫' },
  };
  const config = statusConfig[status] || statusConfig.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.className}`}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Mini Stat Card
// ═══════════════════════════════════════════════════════════════════════
function MiniStatCard({ label, value, icon, color, bgColor }: {
  label: string; value: number | string; icon: React.ReactNode; color: string; bgColor: string;
}) {
  return (
    <Card className="rounded-2xl border-gray-100 dark:border-gray-800">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", bgColor, color)}>
          {icon}
        </div>
        <div>
          <p className="text-xl font-black text-gray-900 dark:text-white">{value}</p>
          <p className="text-xs text-muted-foreground font-medium">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Main Page
// ═══════════════════════════════════════════════════════════════════════
export default function PurchasesPage() {
  const router = useRouter();
  const { t, dir, locale } = useTranslation();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();

  // ── State ──
  const [activeTab, setActiveTab] = useState<ActiveTab>('library');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('date_desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Library (purchased files)
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(true);

  // Orders (financial history)
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);

  // Downloads
  const [downloadingItems, setDownloadingItems] = useState<Set<string>>(new Set());

  // ── Auth redirect ──
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?returnUrl=/orders');
    }
  }, [authLoading, isAuthenticated, router]);

  // ── Fetch library items ──
  useEffect(() => {
    const fetchLibrary = async () => {
      if (!isAuthenticated) return;
      setIsLoadingLibrary(true);
      try {
        const res = await api.getLibrary({ per_page: 100 });
        setLibraryItems(res?.data || []);
      } catch (err) {
        logger.error('Failed to fetch library:', err);
      } finally {
        setIsLoadingLibrary(false);
      }
    };
    if (!authLoading && isAuthenticated) fetchLibrary();
  }, [isAuthenticated, authLoading]);

  // ── Fetch orders ──
  useEffect(() => {
    const fetchOrders = async () => {
      if (!isAuthenticated) return;
      setIsLoadingOrders(true);
      try {
        const response = await api.getOrders();
        const data = response?.data || [];
        setOrders(Array.isArray(data) ? data : []);
      } catch (error) {
        logger.error('Failed to fetch orders:', error);
        setOrders([]);
      } finally {
        setIsLoadingOrders(false);
      }
    };
    if (!authLoading && isAuthenticated) fetchOrders();
  }, [isAuthenticated, authLoading]);

  // ── Filter & sort library items ──
  const filteredLibrary = useMemo(() => {
    let result = [...libraryItems];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(item =>
        item.title.toLowerCase().includes(q) ||
        item.category_name?.toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date_desc': return new Date(b.purchased_at).getTime() - new Date(a.purchased_at).getTime();
        case 'date_asc': return new Date(a.purchased_at).getTime() - new Date(b.purchased_at).getTime();
        case 'name_asc': return a.title.localeCompare(b.title, locale);
        default: return 0;
      }
    });
    return result;
  }, [libraryItems, searchQuery, sortBy, locale]);

  // ── Pagination ──
  const totalPages = Math.ceil(filteredLibrary.length / ITEMS_PER_PAGE);
  const paginatedLibrary = filteredLibrary.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  useEffect(() => { setCurrentPage(1); }, [searchQuery, sortBy, activeTab]);

  // ── Stats ──
  const totalSpent = libraryItems.reduce((sum, item) => sum + (parseFloat(String(item.price_paid)) || 0), 0);
  const completedCount = libraryItems.filter(i => i.order_status === 'completed').length;

  // ── Download handler ──
  // [FIX-DL] The download endpoint expects an OrderItem ID (from order_items table),
  // NOT the UserLibrary ID. The Library API now returns order_item_id for this purpose.
  const handleDownload = async (orderItemId: string) => {
    if (!orderItemId) {
      toast.error(ta('معرّف التحميل غير متوفر، يرجى تحديث الصفحة', 'Download ID not available, please refresh'));
      return;
    }
    if (downloadingItems.has(orderItemId)) return;
    setDownloadingItems(prev => new Set([...prev, orderItemId]));
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/downloads/${orderItemId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || ta('فشل التحميل', 'Download failed'));
      }
      const contentDisposition = response.headers.get('Content-Disposition') || '';
      let fileName = 'download';
      const utf8Match = contentDisposition.match(/filename\*=UTF-8''(.+?)(?:;|$)/i);
      if (utf8Match) {
        fileName = decodeURIComponent(utf8Match[1].trim());
      } else {
        const asciiMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (asciiMatch) fileName = asciiMatch[1];
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast.success(ta('تم التحميل بنجاح', 'Downloaded successfully'));
    } catch (error: any) {
      logger.error('Download failed:', error);
      toast.error(error.message || ta('فشل التحميل', 'Download failed'));
    } finally {
      setDownloadingItems(prev => {
        const next = new Set(prev);
        next.delete(orderItemId);
        return next;
      });
    }
  };

  // ── Date formatter ──
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });

  const formatDateFull = (date: string): string =>
    new Date(date).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });

  // ── Loading screen ──
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <p className="text-sm text-gray-400 font-medium animate-pulse">SERS</p>
        </div>
      </div>
    );
  }

  return (
    <div dir={dir} className="pt-8 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <PageBreadcrumb pageName={ta('مشترياتي', 'My Purchases')} />

        {/* ═══ Header ═══ */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
              <ShoppingBag className="w-8 h-8 text-primary" />
              {ta('مشترياتي', 'My Purchases')}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">
              {ta('ملفاتك المشتراة وسجل طلباتك', 'Your purchased files and order history')}
            </p>
          </div>
          <Link href="/marketplace">
            <Button className="rounded-full px-6 font-black gap-2 shadow-xl shadow-primary/20">
              <ShoppingBag className="w-5 h-5" />
              {ta('تصفح المتجر', 'Browse Store')}
            </Button>
          </Link>
        </div>

        {/* ═══ Stats ═══ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MiniStatCard
            label={ta('إجمالي المشتريات', 'Total Purchases')}
            value={libraryItems.length}
            icon={<Package className="w-5 h-5" />}
            color="text-blue-600"
            bgColor="bg-blue-50 dark:bg-blue-900/20"
          />
          <MiniStatCard
            label={ta('الملفات المتاحة', 'Available Files')}
            value={completedCount}
            icon={<CheckCircle className="w-5 h-5" />}
            color="text-emerald-600"
            bgColor="bg-emerald-50 dark:bg-emerald-900/20"
          />
          <MiniStatCard
            label={ta('الطلبات', 'Orders')}
            value={orders.length}
            icon={<Receipt className="w-5 h-5" />}
            color="text-violet-600"
            bgColor="bg-violet-50 dark:bg-violet-900/20"
          />
          <MiniStatCard
            label={ta('إجمالي الإنفاق', 'Total Spent')}
            value={formatPrice(totalSpent)}
            icon={<Wallet className="w-5 h-5" />}
            color="text-primary"
            bgColor="bg-primary/5"
          />
        </div>

        {/* ═══ Tabs ═══ */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setActiveTab('library')}
            className={cn(
              "flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all duration-200",
              activeTab === 'library'
                ? "bg-primary text-white shadow-lg shadow-primary/25"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            )}
          >
            <Library className="w-4 h-4" />
            {ta('الملفات المشتراة', 'Purchased Files')}
            {libraryItems.length > 0 && (
              <span className={cn(
                "text-[10px] font-black px-2 py-0.5 rounded-full",
                activeTab === 'library' ? "bg-white/20 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-500"
              )}>
                {libraryItems.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={cn(
              "flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all duration-200",
              activeTab === 'orders'
                ? "bg-primary text-white shadow-lg shadow-primary/25"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            )}
          >
            <Receipt className="w-4 h-4" />
            {ta('سجل الطلبات', 'Order History')}
            {orders.length > 0 && (
              <span className={cn(
                "text-[10px] font-black px-2 py-0.5 rounded-full",
                activeTab === 'orders' ? "bg-white/20 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-500"
              )}>
                {orders.length}
              </span>
            )}
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════════
            TAB 1: Library (Purchased Files)
        ═══════════════════════════════════════════════════════ */}
        {activeTab === 'library' && (
          <>
            {/* Toolbar */}
            <Card className="rounded-2xl border-gray-100 dark:border-gray-800 mb-6">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder={ta('ابحث في ملفاتك المشتراة...', 'Search your purchased files...')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pe-10 rounded-xl border-gray-200 dark:border-gray-700"
                    />
                  </div>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortBy)}
                    className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-bold text-gray-700 dark:text-gray-300"
                  >
                    <option value="date_desc">{ta('الأحدث أولاً', 'Newest First')}</option>
                    <option value="date_asc">{ta('الأقدم أولاً', 'Oldest First')}</option>
                    <option value="name_asc">{ta('حسب الاسم', 'By Name')}</option>
                  </select>
                  <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={cn(
                        "p-2 rounded-lg transition-all",
                        viewMode === 'grid' ? "bg-white dark:bg-gray-700 text-primary shadow-sm" : "text-gray-400"
                      )}
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={cn(
                        "p-2 rounded-lg transition-all",
                        viewMode === 'list' ? "bg-white dark:bg-gray-700 text-primary shadow-sm" : "text-gray-400"
                      )}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Content */}
            {isLoadingLibrary ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="rounded-2xl overflow-hidden animate-pulse">
                    <div className="h-48 bg-gray-200 dark:bg-gray-700" />
                    <CardContent className="p-4 space-y-3">
                      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredLibrary.length === 0 ? (
              <Card className="rounded-[2rem] border-gray-100 dark:border-gray-800">
                <CardContent className="p-16 text-center">
                  <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                    <Library className="w-10 h-10" />
                  </div>
                  {libraryItems.length === 0 ? (
                    <>
                      <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">
                        {ta('لا توجد مشتريات بعد', 'No purchases yet')}
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                        {ta('تصفح المتجر واشترِ قوالب جاهزة لتظهر هنا', 'Browse the store and purchase templates to see them here')}
                      </p>
                      <Link href="/marketplace">
                        <Button className="rounded-full px-8 font-black gap-2">
                          <ShoppingBag className="w-5 h-5" />
                          {ta('تصفح المتجر', 'Browse Store')}
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <>
                      <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">
                        {ta('لا توجد نتائج', 'No results found')}
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-6">
                        {ta('جرب البحث بكلمات مختلفة', 'Try different search keywords')}
                      </p>
                      <Button variant="outline" onClick={() => setSearchQuery('')} className="rounded-full px-6 font-bold">
                        <RefreshCw className="w-4 h-4 ms-2" />
                        {ta('إعادة تعيين', 'Reset')}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            ) : viewMode === 'grid' ? (
              /* ===== Grid View ===== */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedLibrary.map((item) => (
                  <Card key={item.id} className="rounded-2xl overflow-hidden hover:shadow-lg transition-shadow border-gray-100 dark:border-gray-800 group">
                    <div className="relative h-48 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                      <SafeImage
                        src={item.thumbnail}
                        alt={item.title}
                        fill
                        className="object-cover"
                        fallback={
                          <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
                            <FileText className="w-16 h-16" />
                          </div>
                        }
                      />
                      <Badge className="absolute top-3 start-3 text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 backdrop-blur-sm">
                        <CheckCircle className="w-3 h-3 me-1" />
                        {ta('مشترى', 'Purchased')}
                      </Badge>
                      {item.category_name && (
                        <Badge variant="outline" className="absolute top-3 end-3 text-[10px] bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                          {item.category_name}
                        </Badge>
                      )}
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg line-clamp-1">{item.title}</CardTitle>
                      {item.variant_name && (
                        <p className="text-xs text-muted-foreground">{item.variant_name}</p>
                      )}
                    </CardHeader>
                    <CardFooter className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          {formatDate(item.purchased_at)}
                        </div>
                        <p className="text-sm font-bold text-primary">{formatPrice(parseFloat(String(item.price_paid)) || 0)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.type === 'interactive' ? (
                          <Link href={`/editor/${item.template_id}`}>
                            <Button size="sm" className="rounded-xl font-bold gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-lg shadow-blue-500/20">
                              <ExternalLink className="w-3.5 h-3.5" />
                              {ta('استخدام', 'Use')}
                            </Button>
                          </Link>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleDownload(item.order_item_id || item.id)}
                            disabled={downloadingItems.has(item.order_item_id || item.id)}
                            className="rounded-xl font-bold gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-0 shadow-lg shadow-emerald-500/20"
                          >
                            <Download className="w-3.5 h-3.5" />
                            {downloadingItems.has(item.order_item_id || item.id) ? ta('جاري...', 'Loading...') : ta('تحميل', 'Download')}
                          </Button>
                        )}
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              /* ===== List View ===== */
              <Card className="rounded-2xl border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="divide-y divide-gray-50 dark:divide-gray-800">
                  {paginatedLibrary.map((item) => (
                    <div key={item.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex items-center gap-4">
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
                        <SafeImage
                          src={item.thumbnail}
                          alt={item.title}
                          fill
                          className="object-cover"
                          fallback={
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <FileText className="w-6 h-6" />
                            </div>
                          }
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 dark:text-white truncate">{item.title}</p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(item.purchased_at)}
                          </span>
                          {item.category_name && <span>{item.category_name}</span>}
                        </div>
                      </div>
                      <p className="font-bold text-primary shrink-0">{formatPrice(parseFloat(String(item.price_paid)) || 0)}</p>
                      <div className="flex items-center gap-1 shrink-0">
                        {item.type === 'interactive' ? (
                          <Link href={`/editor/${item.template_id}`}>
                            <Button size="sm" className="rounded-xl font-bold gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-lg shadow-blue-500/20">
                              <ExternalLink className="w-3.5 h-3.5" />
                              {ta('استخدام', 'Use')}
                            </Button>
                          </Link>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleDownload(item.order_item_id || item.id)}
                            disabled={downloadingItems.has(item.order_item_id || item.id)}
                            className="rounded-xl font-bold gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-0 shadow-lg shadow-emerald-500/20"
                          >
                            <Download className="w-3.5 h-3.5" />
                            {downloadingItems.has(item.order_item_id || item.id) ? '...' : ta('تحميل', 'Download')}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline" size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-xl"
                >
                  {dir === 'rtl' ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                  .map((page, idx, arr) => (
                    <span key={page}>
                      {idx > 0 && arr[idx - 1] !== page - 1 && (
                        <span className="px-2 text-gray-400">...</span>
                      )}
                      <Button
                        variant={currentPage === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="rounded-xl w-10"
                      >
                        {page}
                      </Button>
                    </span>
                  ))}
                <Button
                  variant="outline" size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-xl"
                >
                  {dir === 'rtl' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </Button>
              </div>
            )}

            {!isLoadingLibrary && filteredLibrary.length > 0 && (
              <p className="text-center text-sm text-muted-foreground mt-4">
                {ta('عرض', 'Showing')} {paginatedLibrary.length} {ta('من', 'of')} {filteredLibrary.length} {ta('ملف', 'files')}
              </p>
            )}
          </>
        )}

        {/* ═══════════════════════════════════════════════════════
            TAB 2: Order History
        ═══════════════════════════════════════════════════════ */}
        {activeTab === 'orders' && (
          <div className="max-w-4xl mx-auto">
            {isLoadingOrders ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 animate-pulse">
                    <div className="flex justify-between mb-4">
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                    </div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="py-8">
                <NoOrdersEmpty />
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {/* Order Header */}
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <p className="font-mono font-bold text-primary dark:text-primary/80">
                          {order.order_number}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {formatDateFull(order.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <OrderStatusBadge status={order.status} />
                        <span className="text-xl font-bold text-gray-900 dark:text-white">
                          {formatPrice(order.total)}
                        </span>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="p-6">
                      <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-4">
                        {ta('القوالب', 'Templates')} ({order.items?.length || 0})
                      </h4>
                      <div className="space-y-3">
                        {order.items?.map((item) => (
                          <div key={item.id} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 text-primary rounded-lg flex items-center justify-center text-xl">
                                📚
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {item.template_name || item.template?.name_ar}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {formatPrice(item.price)}
                                </p>
                              </div>
                            </div>
                            {order.status === 'completed' && (
                              <Button
                                onClick={() => handleDownload(item.id)}
                                disabled={downloadingItems.has(item.id)}
                                className="bg-green-600 hover:bg-green-700 text-white text-sm shadow-md hover:shadow-lg rounded-xl font-bold"
                                size="sm"
                              >
                                <Download className="w-4 h-4 me-1.5" />
                                {downloadingItems.has(item.id)
                                  ? ta('جاري التحميل...', 'Downloading...')
                                  : ta('تحميل الملف', 'Download')
                                }
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Order Summary */}
                    <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600 dark:text-gray-400">{ta('المجموع الفرعي', 'Subtotal')}</span>
                        <span className="text-gray-900 dark:text-white">{formatPrice(order.subtotal)}</span>
                      </div>
                      {order.discount > 0 && (
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-green-600 dark:text-green-400">{ta('الخصم', 'Discount')}</span>
                          <span className="text-green-600 dark:text-green-400">-{formatPrice(order.discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200 dark:border-gray-700 mt-2">
                        <span className="text-gray-900 dark:text-white">{ta('الإجمالي', 'Total')}</span>
                        <span className="text-primary dark:text-primary/80">{formatPrice(order.total)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
