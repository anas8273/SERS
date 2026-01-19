'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  Eye,
  Download,
  DollarSign,
  BarChart3,
  PieChart,
  Activity,
} from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export function StatCard({
  title,
  value,
  change,
  changeLabel = 'من الشهر الماضي',
  icon,
  trend = 'neutral',
  className,
}: StatCardProps) {
  const trendColors = {
    up: 'text-green-600 bg-green-100 dark:bg-green-900/20',
    down: 'text-red-600 bg-red-100 dark:bg-red-900/20',
    neutral: 'text-gray-600 bg-gray-100 dark:bg-gray-800',
  };

  return (
    <div
      className={cn(
        'bg-card rounded-xl border p-6 transition-shadow hover:shadow-md',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={cn(
                  'flex items-center text-xs px-2 py-0.5 rounded-full',
                  trendColors[trend]
                )}
              >
                {trend === 'up' && <TrendingUp className="w-3 h-3 ml-1" />}
                {trend === 'down' && <TrendingDown className="w-3 h-3 ml-1" />}
                {change > 0 ? '+' : ''}
                {change}%
              </span>
              <span className="text-xs text-muted-foreground">{changeLabel}</span>
            </div>
          )}
        </div>
        <div className="p-3 bg-primary/10 rounded-lg text-primary">{icon}</div>
      </div>
    </div>
  );
}

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export function ChartCard({
  title,
  subtitle,
  children,
  className,
  action,
}: ChartCardProps) {
  return (
    <div className={cn('bg-card rounded-xl border p-6', className)}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold">{title}</h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

// Simple Bar Chart Component
interface BarChartData {
  label: string;
  value: number;
  color?: string;
}

export function SimpleBarChart({
  data,
  maxValue,
  className,
}: {
  data: BarChartData[];
  maxValue?: number;
  className?: string;
}) {
  const max = maxValue || Math.max(...data.map((d) => d.value));

  return (
    <div className={cn('space-y-3', className)}>
      {data.map((item, index) => (
        <div key={index} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>{item.label}</span>
            <span className="font-medium">{item.value}</span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                item.color || 'bg-primary'
              )}
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// Simple Pie Chart Component
interface PieChartData {
  label: string;
  value: number;
  color: string;
}

export function SimplePieChart({
  data,
  size = 200,
  className,
}: {
  data: PieChartData[];
  size?: number;
  className?: string;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = 0;

  const segments = data.map((item) => {
    const percentage = (item.value / total) * 100;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;

    return {
      ...item,
      percentage,
      startAngle,
      endAngle: currentAngle,
    };
  });

  return (
    <div className={cn('flex items-center gap-6', className)}>
      <div
        className="relative rounded-full"
        style={{
          width: size,
          height: size,
          background: `conic-gradient(${segments
            .map((s) => `${s.color} ${s.startAngle}deg ${s.endAngle}deg`)
            .join(', ')})`,
        }}
      >
        <div
          className="absolute inset-4 bg-background rounded-full flex items-center justify-center"
        >
          <span className="text-2xl font-bold">{total}</span>
        </div>
      </div>
      <div className="space-y-2">
        {segments.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm">{item.label}</span>
            <span className="text-sm text-muted-foreground">
              ({item.percentage.toFixed(1)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Activity Timeline
interface ActivityItem {
  id: string;
  type: 'order' | 'user' | 'template' | 'review' | 'system';
  title: string;
  description: string;
  time: Date;
}

export function ActivityTimeline({
  activities,
  className,
}: {
  activities: ActivityItem[];
  className?: string;
}) {
  const typeIcons = {
    order: <ShoppingCart className="w-4 h-4" />,
    user: <Users className="w-4 h-4" />,
    template: <BarChart3 className="w-4 h-4" />,
    review: <Activity className="w-4 h-4" />,
    system: <Eye className="w-4 h-4" />,
  };

  const typeColors = {
    order: 'bg-green-100 text-green-600 dark:bg-green-900/20',
    user: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20',
    template: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20',
    review: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20',
    system: 'bg-gray-100 text-gray-600 dark:bg-gray-800',
  };

  return (
    <div className={cn('space-y-4', className)}>
      {activities.map((activity, index) => (
        <div key={activity.id} className="flex gap-3">
          <div
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
              typeColors[activity.type]
            )}
          >
            {typeIcons[activity.type]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{activity.title}</p>
            <p className="text-xs text-muted-foreground">{activity.description}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {activity.time.toLocaleString('ar-SA')}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// Quick Stats Grid
export function QuickStatsGrid({
  stats,
}: {
  stats: {
    users: number;
    orders: number;
    revenue: number;
    downloads: number;
    usersChange?: number;
    ordersChange?: number;
    revenueChange?: number;
    downloadsChange?: number;
  };
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="المستخدمون"
        value={stats.users.toLocaleString('ar-SA')}
        change={stats.usersChange}
        trend={stats.usersChange && stats.usersChange > 0 ? 'up' : 'down'}
        icon={<Users className="w-5 h-5" />}
      />
      <StatCard
        title="الطلبات"
        value={stats.orders.toLocaleString('ar-SA')}
        change={stats.ordersChange}
        trend={stats.ordersChange && stats.ordersChange > 0 ? 'up' : 'down'}
        icon={<ShoppingCart className="w-5 h-5" />}
      />
      <StatCard
        title="الإيرادات"
        value={`${stats.revenue.toLocaleString('ar-SA')} ر.س`}
        change={stats.revenueChange}
        trend={stats.revenueChange && stats.revenueChange > 0 ? 'up' : 'down'}
        icon={<DollarSign className="w-5 h-5" />}
      />
      <StatCard
        title="التحميلات"
        value={stats.downloads.toLocaleString('ar-SA')}
        change={stats.downloadsChange}
        trend={stats.downloadsChange && stats.downloadsChange > 0 ? 'up' : 'down'}
        icon={<Download className="w-5 h-5" />}
      />
    </div>
  );
}
