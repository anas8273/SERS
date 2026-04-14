'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { ta } from '@/i18n/auto-translations';
import { useTranslation } from '@/i18n/useTranslation';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  ShoppingCart,
  FileText,
  MessageSquare,
  Star,
  AlertCircle,
  Info,
} from 'lucide-react';

interface Notification {
  id: number;
  type: 'order' | 'template' | 'request' | 'review' | 'system' | 'info';
  title: string;
  message: string;
  data: any;
  is_read: boolean;
  created_at: string;
}

const typeConfig = {
  order: { icon: ShoppingCart, color: 'text-green-500', bg: 'bg-green-50' },
  template: { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50' },
  request: { icon: MessageSquare, color: 'text-purple-500', bg: 'bg-purple-50' },
  review: { icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-50' },
  system: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' },
  info: { icon: Info, color: 'text-gray-500', bg: 'bg-gray-50' },
};

export default function NotificationsPage() {
  const { t, locale, dir } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await api.get('/notifications') as any;
      const data = response?.data?.data || response?.data || [];
      const list = Array.isArray(data) ? data : [];
      setNotifications(list);
      setUnreadCount(list.filter((n: Notification) => !n.is_read).length);
    } catch {
      // Silently handle — show empty notifications
      setNotifications([]);
      setUnreadCount(0);
    } finally { setLoading(false); }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { toast.error(t('toast.notification.error' as any)); }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success(t('toast.notification.allRead' as any));
    } catch { toast.error(t('toast.notification.error' as any)); }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success(t('toast.notification.deleted' as any));
    } catch { toast.error(t('toast.notification.error' as any)); }
  };
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (locale === 'ar') {
      if (diffMins < 1) return 'الآن';
      if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
      if (diffHours < 24) return `منذ ${diffHours} ساعة`;
      if (diffDays < 7) return `منذ ${diffDays} يوم`;
    } else {
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
    }
    return date.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US');
  };

  return (
    <div dir={dir} className="container mx-auto px-3 sm:px-6 py-6 sm:py-8 max-w-3xl">
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
            <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">{t('empty.noNotifications.title' as any)}</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {locale === 'ar' ? `لديك ` : 'You have '}
                <span className="font-bold text-primary">{unreadCount}</span>
                {locale === 'ar' ? ta(' إشعار غير مقروء', 'unread notification') : ' unread notifications'}
              </p>
            )}
          </div>
        </div>

        {unreadCount > 0 && (
          <Button variant="outline" onClick={handleMarkAllAsRead} className="rounded-xl gap-2 text-xs font-bold shrink-0 self-start sm:self-auto">
            <CheckCheck className="w-4 h-4" />
            <span className="hidden xs:inline">{locale === 'ar' ? ta('تحديد الكل كمقروء', 'Mark All as Read') : 'Mark all as read'}</span>
            <span className="xs:hidden">{locale === 'ar' ? ta('قراءة الكل', 'Read All') : 'Read all'}</span>
          </Button>
        )}
      </motion.div>


      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-1/2" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={<BellOff className="w-12 h-12 text-gray-300 dark:text-gray-600" />}
          title={t('empty.noNotifications.title' as any)}
          description={t('empty.noNotifications.desc' as any)}
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((notification, index) => {
            const config = typeConfig[notification.type] || typeConfig.info;
            const Icon = config.icon;

            return (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
              >
              <Card
                className={`transition-all ${
                  !notification.is_read
                    ? 'border-primary/50 bg-primary/5'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${config.bg}`}
                    >
                      <Icon className={`w-6 h-6 ${config.color}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold">{notification.title}</h3>
                          <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                            {notification.message}
                          </p>
                        </div>
                        {!notification.is_read && (
                          <Badge className="bg-primary shrink-0">{locale === 'ar' ? ta('جديد', 'New') : 'New'}</Badge>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-gray-500">
                          {formatDate(notification.created_at)}
                        </span>

                        <div className="flex items-center gap-1">
                          {!notification.is_read && (
                            <Button variant="ghost" size="sm" onClick={() => handleMarkAsRead(notification.id)}>
                              <Check className="w-4 h-4 ms-1" />
                              {locale === 'ar' ? ta('قراءة', 'Reading') : 'Read'}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleDelete(notification.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
