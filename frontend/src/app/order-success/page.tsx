'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import {
  CheckCircle, Package, Download, ArrowRight, Sparkles,
  Home, ShoppingBag, Star, PartyPopper, FileText,
  Loader2, ExternalLink,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ta } from '@/i18n/auto-translations';
import { useTranslation } from '@/i18n/useTranslation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';

interface OrderItem {
  id: string;
  template_name?: string;
  price: number;
  template?: {
    id: string;
    name_ar: string;
    slug?: string;
    type?: string;
  };
}

interface OrderData {
  id: string;
  order_number?: string;
  status: string;
  total: number;
  items: OrderItem[];
}

function OrderSuccessContent() {
  const { t, dir } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const orderId = searchParams.get('id');
  const [confettiDone, setConfettiDone] = useState(false);
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [downloadingItems, setDownloadingItems] = useState<Set<string>>(new Set());
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (!orderId || !isAuthenticated) {
      router.replace('/marketplace');
      return;
    }

    // Fetch order details with items
    api.getOrder(orderId)
      .then((res: any) => {
        if (res?.success && res?.data?.id) {
          setOrderData(res.data);
          setVerified(true);
        } else {
          router.replace('/dashboard');
        }
      })
      .catch(() => router.replace('/dashboard'));

    const confettiTimer = setTimeout(() => setConfettiDone(true), 3000);
    const redirectTimer = setTimeout(() => router.push('/orders'), 60000); // 60s auto-redirect
    return () => {
      clearTimeout(confettiTimer);
      clearTimeout(redirectTimer);
    };
  }, [orderId, isAuthenticated, router]);

  // Download handler
  const handleDownload = async (itemId: string) => {
    if (downloadingItems.has(itemId)) return;
    setDownloadingItems(prev => new Set([...prev, itemId]));

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/downloads/${itemId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'فشل التحميل');
      }

      // Extract filename
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

      toast.success(dir === 'rtl' ? ta('تم بدء التحميل ✅', 'Download started ✅') : 'Download started ✅');
    } catch (error: any) {
      toast.error(error.message || (dir === 'rtl' ? ta('فشل التحميل', 'Download failed') : 'Download failed'));
    } finally {
      setDownloadingItems(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  // Show nothing while verifying
  if (!verified) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse w-8 h-8 rounded-xl bg-primary/20" />
      </div>
    );
  }

  const isCompleted = orderData?.status === 'completed';

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950 transition-colors duration-300" dir={dir}>
      <Navbar />

      <main className="flex-1 pt-24 pb-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          {/* Confetti particles */}
          {!confettiDone && (
            <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
              {Array.from({ length: 30 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-3 h-3 rounded-full"
                  style={{
                    background: ['#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899'][i % 6],
                    left: `${Math.random() * 100}%`,
                    top: '-5%',
                  }}
                  animate={{
                    y: ['0vh', `${80 + Math.random() * 20}vh`],
                    x: [0, (Math.random() - 0.5) * 200],
                    rotate: [0, Math.random() * 720],
                    opacity: [1, 0],
                  }}
                  transition={{
                    duration: 2 + Math.random() * 1.5,
                    delay: Math.random() * 0.8,
                    ease: 'easeOut',
                  }}
                />
              ))}
            </div>
          )}

          {/* Success Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden"
          >
            {/* Top Gradient */}
            <div className="h-2 bg-gradient-to-l from-emerald-500 via-green-500 to-teal-500" />

            {/* Content */}
            <div className="p-8 sm:p-12 text-center">
              {/* Success Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring', damping: 15, stiffness: 200 }}
                className="w-24 h-24 mx-auto bg-gradient-to-br from-emerald-500 to-green-600 rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-emerald-500/30"
              >
                <CheckCircle className="w-12 h-12 text-white" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="inline-flex items-center gap-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-4 py-2 rounded-full text-sm font-bold mb-4">
                  <PartyPopper className="w-4 h-4" />
                  {t('orderSuccess.badge' as any)}
                </div>

                <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-3">
                  {t('orderSuccess.title' as any)}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mb-6 text-lg">
                  {t('orderSuccess.desc' as any)}
                </p>
              </motion.div>

              {/* Order ID */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-5 mb-8 inline-block"
              >
                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 mb-1">{t('orderSuccess.orderId' as any)}</p>
                <p className="text-2xl font-black text-primary tracking-wider font-mono">{orderId}</p>
              </motion.div>

              {/* ═══════════ Purchased Items — Direct Download ═══════════ */}
              {isCompleted && orderData?.items && orderData.items.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="mb-8"
                >
                  <div className="bg-gradient-to-l from-emerald-50 to-green-50 dark:from-emerald-900/10 dark:to-green-900/10 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-5 text-start">
                    <h3 className="font-black text-gray-900 dark:text-white text-sm flex items-center gap-2 mb-4">
                      <Download className="w-4 h-4 text-emerald-600" />
                      {dir === 'rtl' ? ta('القوالب جاهزة للتحميل', 'Templates ready for download') : 'Templates Ready for Download'}
                    </h3>
                    <div className="space-y-2.5">
                      {orderData.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-3 bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700 shadow-sm"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 text-primary rounded-lg flex items-center justify-center flex-shrink-0">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-sm text-gray-900 dark:text-white truncate">
                                {item.template_name || item.template?.name_ar || 'قالب'}
                              </p>
                              <p className="text-[11px] text-gray-400">
                                {formatPrice(item.price)}
                              </p>
                            </div>
                          </div>
                          <Button
                            onClick={() => handleDownload(item.id)}
                            disabled={downloadingItems.has(item.id)}
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-1.5 px-4 font-bold shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 transition-all hover:-translate-y-0.5 disabled:opacity-60 flex-shrink-0"
                          >
                            {downloadingItems.has(item.id) ? (
                              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {dir === 'rtl' ? ta('جاري...', 'Processing...') : 'Loading...'}</>
                            ) : (
                              <><Download className="w-3.5 h-3.5" /> {dir === 'rtl' ? ta('تحميل', 'Download') : 'Download'}</>
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>

                    {/* Info notice */}
                    <div className="mt-4 flex items-start gap-2 bg-blue-50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-400 rounded-xl p-3 border border-blue-100 dark:border-blue-800/30">
                      <Package className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <p className="text-xs font-medium leading-relaxed">
                        {dir === 'rtl'
                          ? ta('يمكنك إعادة تحميل القوالب في أي وقت من صفحة "طلباتي" في لوحة التحكم.', 'You can re-download templates anytime from "My Orders" in the dashboard.') : 'You can re-download your templates anytime from the "My Orders" page in your dashboard.'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Features */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="grid grid-cols-3 gap-4 mb-8"
              >
                {[
                  { icon: Download, label: t('orderSuccess.instantDownload' as any), desc: t('orderSuccess.availableNow' as any) },
                  { icon: Package, label: t('orderSuccess.quality' as any), desc: t('orderSuccess.hundredPercent' as any) },
                  { icon: Star, label: t('orderSuccess.support' as any), desc: t('orderSuccess.aroundClock' as any) },
                ].map((item, i) => (
                  <div key={i} className="text-center p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                    <item.icon className="w-5 h-5 mx-auto text-primary mb-1.5" />
                    <p className="text-xs font-black text-gray-900 dark:text-white">{item.label}</p>
                    <p className="text-[10px] text-gray-400">{item.desc}</p>
                  </div>
                ))}
              </motion.div>

              {/* Actions */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 }}
                className="flex flex-col sm:flex-row gap-3"
              >
                <Link href="/orders" className="flex-1">
                  <Button className="w-full bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-6 rounded-2xl shadow-xl shadow-emerald-500/20 gap-2 text-base" dir={dir}>
                    <ShoppingBag className="w-5 h-5" />
                    {dir === 'rtl' ? ta('انتقل لمشترياتي', 'Go to My Purchases') : 'Go to My Purchases'}
                  </Button>
                </Link>
                <Link href="/dashboard" className="flex-1">
                  <Button variant="outline" className="w-full font-bold py-6 rounded-2xl gap-2 text-base" dir={dir}>
                    <Sparkles className="w-5 h-5" />
                    {t('orderSuccess.goDashboard' as any)}
                  </Button>
                </Link>
              </motion.div>

              {/* Continue Shopping */}
              <Link
                href="/marketplace"
                className={`inline-flex items-center gap-1.5 text-sm text-primary hover:underline mt-6 font-medium ${dir === 'ltr' ? 'flex-row-reverse' : ''}`}
              >
                <ArrowRight className={`w-4 h-4 ${dir === 'ltr' ? 'rotate-180' : ''}`} />
                {t('orderSuccess.continue' as any)}
              </Link>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse w-8 h-8 rounded-xl bg-primary/20" />
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  );
}
