'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, Check, CheckCheck, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'order' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  link?: string;
  data?: Record<string, any>;
}

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  onNotificationClick?: (notification: Notification) => void;
}

export function NotificationCenter({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onClearAll,
  onNotificationClick,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    onNotificationClick?.(notification);
    setIsOpen(false);
  };

  const getTypeIcon = (type: Notification['type']) => {
    const icons = {
      info: '💡',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      order: '🛒',
      system: '🔔',
    };
    return icons[type];
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-[500px] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold">الإشعارات</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMarkAllAsRead}
              className="text-xs"
            >
              <CheckCheck className="h-4 w-4 ml-1" />
              قراءة الكل
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>لا توجد إشعارات</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'p-3 hover:bg-muted/50 cursor-pointer transition-colors relative group',
                    !notification.read && 'bg-primary/5'
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-3">
                    <span className="text-xl">{getTypeIcon(notification.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm', !notification.read && 'font-semibold')}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(notification.createdAt, {
                          addSuffix: true,
                          locale: ar,
                        })}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                    )}
                  </div>
                  
                  {/* Delete button on hover */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(notification.id);
                    }}
                    className="absolute top-2 left-2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-opacity"
                  >
                    <X className="h-3 w-3 text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              className="w-full text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 ml-1" />
              مسح جميع الإشعارات
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Hook for managing notifications
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substring(2, 9),
      read: false,
      createdAt: new Date(),
    };
    setNotifications((prev) => [newNotification, ...prev]);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    unreadCount: notifications.filter((n) => !n.read).length,
  };
}
