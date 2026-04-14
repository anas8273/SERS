'use client';
import { ta } from '@/i18n/auto-translations';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useTranslation } from '@/i18n/useTranslation';

interface ActivityLog {
    id: string;
    user_name: string;
    action: string;
    description: string;
    created_at: string;
    icon: string;
    color: string;
}

function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `منذ ${diffMins} ${ta('دقيقة', 'min')}`;
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
  const { dir } = useTranslation();
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                setHasError(false);
                const res = await api.get('/admin/activity-logs') as any;
                // api.get() already unwraps .data, so the response IS the data object
                const data = res?.data ?? res ?? [];
                if (Array.isArray(data)) {
                    setLogs(data.map((log: any) => ({
                        id: log.id || String(Math.random()),
                        user_name: log.user?.name || log.user_name || ta('النظام', 'System'),
                        action: log.action || log.event || ta('نشاط', 'Activity'),
                        description: log.description || log.message || '',
                        created_at: log.created_at || new Date().toISOString(),
                        icon: log.icon || getActionIcon(log.action || log.event || ''),
                        color: log.color || getActionColor(log.action || log.event || ''),
                    })));
                } else {
                    setLogs([]);
                }
            } catch {
                // [AUDIT FIX] Show empty state instead of mock data — mock data is misleading in production
                setLogs([]);
                setHasError(true);
            } finally {
                setIsLoading(false);
            }
        };
        fetchLogs();
    }, []);

    function getActionIcon(action: string): string {
        if (action.includes(ta(ta('إضافة', 'Add'), 'Add')) || action.includes('create')) return '📦';
        if (action.includes(ta('تحديث', 'Refresh')) || action.includes('update')) return '🛒';
        if (action.includes(ta('حذف', 'Delete')) || action.includes('delete')) return '👤';
        if (action.includes(ta('تعديل', 'Edit')) || action.includes('edit')) return '🎟️';
        return '💾';
    }

    function getActionColor(action: string): string {
  const { dir } = useTranslation();
        if (action.includes(ta(ta('إضافة', 'Add'), 'Add')) || action.includes('create')) return 'green';
        if (action.includes(ta('تحديث', 'Refresh')) || action.includes('update')) return 'blue';
        if (action.includes(ta('حذف', 'Delete')) || action.includes('delete')) return 'red';
        if (action.includes(ta('تعديل', 'Edit')) || action.includes('edit')) return 'purple';
        return 'gray';
    }

    return (
        <div dir={dir} className="space-y-8 animate-fade-in">
            {/* ===== Premium Header ===== */}
            <div className="relative overflow-hidden bg-gradient-to-l from-teal-500/5 via-cyan-500/5 to-sky-500/5 dark:from-teal-500/10 dark:via-cyan-500/10 dark:to-sky-500/10 rounded-2xl p-6 border border-gray-100 dark:border-gray-700/50">
                <div className="absolute top-0 left-0 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl -translate-x-10 -translate-y-10" />
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl translate-x-8 translate-y-8" />
                <div className="relative">
                    <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-3">
                        <span className="p-2.5 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl text-white shadow-lg shadow-teal-500/20">
                            📋
                        </span>
                        {ta('سجل النشاطات', 'Activity Logs')}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
                        متابعة جميع العمليات والتغييرات في النظام ({logs.length} نشاط)
                    </p>
                </div>
            </div>

            {/* ===== Stats Grid ===== */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 flex items-center gap-4 hover:shadow-lg hover:shadow-teal-500/5 transition-all hover:-translate-y-0.5">
                    <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-teal-500/20 group-hover:scale-110 transition-transform">
                        📊
                    </div>
                    <div>
                        <p className="text-2xl font-black text-gray-900 dark:text-white">{logs.length}</p>
                        <p className="text-xs text-gray-500 font-medium">{ta('إجمالي الأنشطة', 'Total Activities')}</p>
                    </div>
                </div>
                <div className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 flex items-center gap-4 hover:shadow-lg hover:shadow-green-500/5 transition-all hover:-translate-y-0.5">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-green-500/20 group-hover:scale-110 transition-transform">
                        ✅
                    </div>
                    <div>
                        <p className="text-2xl font-black text-gray-900 dark:text-white">
                            {logs.filter(l => l.action.includes(ta(ta('إضافة', 'Add'), 'Add'))).length}
                        </p>
                        <p className="text-xs text-gray-500 font-medium">{ta('عمليات إضافة', 'Add operations')}</p>
                    </div>
                </div>
                <div className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 flex items-center gap-4 hover:shadow-lg hover:shadow-amber-500/5 transition-all hover:-translate-y-0.5">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform">
                        ✏️
                    </div>
                    <div>
                        <p className="text-2xl font-black text-gray-900 dark:text-white">
                            {logs.filter(l => l.action.includes(ta('تعديل', 'Edit')) || l.action.includes(ta('تحديث', 'Refresh'))).length}
                        </p>
                        <p className="text-xs text-gray-500 font-medium">{ta('عمليات تعديل', 'Edit operations')}</p>
                    </div>
                </div>
                <div className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 flex items-center gap-4 hover:shadow-lg hover:shadow-red-500/5 transition-all hover:-translate-y-0.5">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-500/20 group-hover:scale-110 transition-transform">
                        🗑️
                    </div>
                    <div>
                        <p className="text-2xl font-black text-gray-900 dark:text-white">
                            {logs.filter(l => l.action.includes(ta('حذف', 'Delete'))).length}
                        </p>
                        <p className="text-xs text-gray-500 font-medium">{ta('عمليات حذف', 'Delete operations')}</p>
                    </div>
                </div>
            </div>

            {/* Activity Timeline */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
                <h2 className="text-base font-black text-gray-900 dark:text-white mb-6">
                    {ta('آخر النشاطات', 'Recent Activities')}
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
                ) : logs.length === 0 ? (
                    /* [AUDIT FIX] Empty state — no mock data fallback */
                    <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-3xl">
                            📋
                        </div>
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            {hasError ? ta('تعذر تحميل سجل النشاطات', 'Failed to load activity logs') : ta('لا توجد نشاطات بعد', 'No activities yet')}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                            {hasError
                                ? ta('حدث خطأ أثناء الاتصال بالخادم. يرجى المحاولة لاحقاً.', 'An error occurred while connecting to the server. Please try again later.')
                                : ta('ستظهر هنا جميع العمليات والتغييرات التي تتم في النظام تلقائياً.', 'All system operations and changes will appear here automatically.')
                            }
                        </p>
                        {hasError && (
                            <button
                                onClick={() => { setIsLoading(true); setHasError(false); window.location.reload(); }}
                                className="mt-4 px-4 py-2 text-sm font-medium text-white bg-teal-500 hover:bg-teal-600 rounded-lg transition-colors"
                            >
                                {ta('إعادة المحاولة', 'Retry')}
                            </button>
                        )}
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
