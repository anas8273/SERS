'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import { ta } from '@/i18n/auto-translations';
import { useTranslation } from '@/i18n/useTranslation';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PageBreadcrumb } from '@/components/ui/breadcrumb';
import { Badge } from '@/components/ui/badge';
import {
  Package, ArrowRight, Download, Loader2,
  CheckCircle, Clock, XCircle, RefreshCw,
} from 'lucide-react';
import type { Order } from '@/types';

const STATUS_CONFIG: Record<string, { label: string; labelEn: string; className: string; icon: React.ReactNode }> = {
  pending:    { label: ta('قيد الانتظار', 'Pending'), labelEn: 'Pending',    className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: <Clock className="w-4 h-4" /> },
  processing: { label: ta('قيد المعالجة', 'Processing'), labelEn: 'Processing', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',     icon: <RefreshCw className="w-4 h-4 animate-spin" /> },
  completed:  { label: ta('مكتمل', 'Completed'),        labelEn: 'Completed',  className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',   icon: <CheckCircle className="w-4 h-4" /> },
  failed:     { label: ta('فشل', 'Failed'),          labelEn: 'Failed',     className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',           icon: <XCircle className="w-4 h-4" /> },
  cancelled:  { label: ta('ملغي', 'Cancelled'),         labelEn: 'Cancelled',  className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',          icon: <XCircle className="w-4 h-4" /> },
  refunded:   { label: ta('مسترد', 'Refunded'),        labelEn: 'Refunded',   className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: <RefreshCw className="w-4 h-4" /> },
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { t, locale, dir } = useTranslation();
  const { isAuthenticated, isLoading: authLoading, token } = useAuthStore();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingItems, setDownloadingItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login');
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated || !id) return;
    const fetchOrder = async () => {
      try {
        const res = await api.getOrder(id as string);
        setOrder(res.data || res);
      } catch {
        router.push('/orders');
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrder();
  }, [isAuthenticated, id, router]);

  const handleDownload = async (orderItemId: string) => {
    if (downloadingItems.has(orderItemId)) return;
    setDownloadingItems(prev => new Set([...prev, orderItemId]));
    try {
      const response = await fetch(`/api/downloads/${orderItemId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error((await response.json().catch(() => ({}))).message || 'فشل التحميل');
      const cd = response.headers.get('Content-Disposition') || '';
      const match = cd.match(/filename="?([^"]+)"?/);
      const fileName = match ? match[1] : 'download';
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = fileName;
      document.body.appendChild(a); a.click();
      window.URL.revokeObjectURL(url); a.remove();
      const { default: toast } = await import('react-hot-toast');
      toast.success(t('orders.downloadSuccess'));
    } catch (err: any) {
      const { default: toast } = await import('react-hot-toast');
      toast.error(err.message || t('common.error'));
    } finally {
      setDownloadingItems(prev => { const n = new Set(prev); n.delete(orderItemId); return n; });
    }
  };

  if (authLoading || isLoading) {
    return (
      <div dir={dir} className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) return null;

  const statusConf = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const dateStr = new Date(order.created_at).toLocaleDateString(
    locale === 'ar' ? 'ar-SA' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
  );

  return (
    <div className="pt-8 pb-16">
      <div className="max-w-3xl mx-auto px-4">
        <PageBreadcrumb pageName={t('orders.orderDetail')} />

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Package className="w-6 h-6 text-primary" />
              {t('orders.orderDetail')}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 font-mono text-sm">{order.order_number}</p>
          </div>
          <Link href="/orders">
            <Button variant="outline" className="gap-2 rounded-xl">
              <ArrowRight className="w-4 h-4" />
              {t('orders.backToOrders')}
            </Button>
          </Link>
        </div>

        {/* Status + Date */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${statusConf.className}`}>
                {statusConf.icon}
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('orders.status')}</p>
                <Badge className={`${statusConf.className} border-0 font-bold`}>
                  {locale === 'ar' ? statusConf.label : statusConf.labelEn}
                </Badge>
              </div>
            </div>
            <div className="text-start sm:text-end">
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('orders.date')}</p>
              <p className="font-bold text-gray-900 dark:text-white">{dateStr}</p>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6 overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-gray-700">
            <h2 className="font-black text-gray-900 dark:text-white">
              {t('orders.items')} ({order.items?.length || 0})
            </h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {order.items?.map((item) => (
              <div key={item.id} className="p-5 flex items-center gap-4">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
                  <Package className="w-7 h-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 dark:text-white truncate">
                    {item.template_name || item.template?.name_ar}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{formatPrice(item.price)}</p>
                </div>
                {order.status === 'completed' && (
                  <Button
                    onClick={() => handleDownload(item.id)}
                    disabled={downloadingItems.has(item.id)}
                    className="gap-2 rounded-xl shrink-0"
                    size="sm"
                  >
                    {downloadingItems.has(item.id)
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Download className="w-4 h-4" />
                    }
                    {t('common.download')}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="font-black text-gray-900 dark:text-white mb-4">{t('orders.summary')}</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>{t('cart.subtotal')}</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                <span>{t('cart.discount')}</span>
                <span>-{formatPrice(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-lg pt-3 border-t border-gray-100 dark:border-gray-700">
              <span className="text-gray-900 dark:text-white">{t('cart.total')}</span>
              <span className="text-primary">{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
