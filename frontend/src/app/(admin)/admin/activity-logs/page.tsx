'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface ActivityLog {
    id: string;
    user_name: string;
    action: string;
    description: string;
    created_at: string;
    icon: string;
    color: string;
}

const mockActivityLogs: ActivityLog[] = [
    {
        id: '1',
        user_name: 'أحمد المشرف',
        action: 'إضافة منتج',
        description: 'تم إضافة منتج جديد "دورة React المتقدمة"',
        created_at: '2026-01-12T10:30:00',
        icon: '📦',
        color: 'green',
    },
    {
        id: '2',
        user_name: 'محمد الإداري',
        action: 'تحديث طلب',
        description: 'تم تحديث حالة الطلب #ORD-001234 إلى "مكتمل"',
        created_at: '2026-01-12T09:45:00',
        icon: '🛒',
        color: 'blue',
    },
    {
        id: '3',
        user_name: 'سارة المديرة',
        action: 'حذف مستخدم',
        description: 'تم حذف حساب المستخدم "user@test.com"',
        created_at: '2026-01-12T08:20:00',
        icon: '👤',
        color: 'red',
    },
    {
        id: '4',
        user_name: 'أحمد المشرف',
        action: 'تعديل كوبون',
        description: 'تم تعديل كوبون الخصم "SAVE20" - زيادة النسبة إلى 25%',
        created_at: '2026-01-11T16:00:00',
        icon: '🎟️',
        color: 'purple',
    },
    {
        id: '5',
        user_name: 'النظام',
        action: 'نسخ احتياطي',
        description: 'تم إنشاء نسخة احتياطية تلقائية للنظام',
        created_at: '2026-01-11T03:00:00',
        icon: '💾',
        color: 'gray',
    },
];

function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    return `منذ ${diffDays} يوم`;
}

function getColorClasses(color: string) {
    const colors: Record<string, string> = {
        green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800',
        blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
        red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',
        purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
        gray: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600',
    };
    return colors[color] || colors.gray;
}

export default function AdminActivityLogsPage() {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simulate API fetch
        setTimeout(() => {
            setLogs(mockActivityLogs);
            setIsLoading(false);
        }, 500);
    }, []);

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    سجل النشاطات 📋
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    متابعة جميع العمليات والتغييرات في النظام
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="stat-card">
                    <div className="flex items-center gap-3">
                        <div className="stat-icon stat-icon-blue">📊</div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{logs.length}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">إجمالي الأنشطة</p>
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="flex items-center gap-3">
                        <div className="stat-icon stat-icon-green">✅</div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {logs.filter(l => l.action.includes('إضافة')).length}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">عمليات إضافة</p>
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="flex items-center gap-3">
                        <div className="stat-icon stat-icon-orange">✏️</div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {logs.filter(l => l.action.includes('تعديل') || l.action.includes('تحديث')).length}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">عمليات تعديل</p>
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="flex items-center gap-3">
                        <div className="stat-icon stat-icon-purple">🗑️</div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {logs.filter(l => l.action.includes('حذف')).length}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">عمليات حذف</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Activity Timeline */}
            <div className="admin-card">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                    آخر النشاطات
                </h2>

                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex gap-4 animate-pulse">
                                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute right-6 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

                        <div className="space-y-6">
                            {logs.map((log, index) => (
                                <div key={log.id} className="relative flex gap-4 animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                                    {/* Icon */}
                                    <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center text-xl border-2 ${getColorClasses(log.color)}`}>
                                        {log.icon}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 pt-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <h3 className="font-medium text-gray-900 dark:text-white">
                                                {log.action}
                                            </h3>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                {formatTimeAgo(log.created_at)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                                            {log.description}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            بواسطة: {log.user_name}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
