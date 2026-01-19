'use client';

import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  color?: 'primary' | 'white' | 'gray';
}

export function LoadingSpinner({
  size = 'md',
  className,
  color = 'primary',
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
    xl: 'w-16 h-16 border-4',
  };

  const colorClasses = {
    primary: 'border-primary border-t-transparent',
    white: 'border-white border-t-transparent',
    gray: 'border-gray-300 border-t-gray-600',
  };

  return (
    <div
      className={cn(
        'rounded-full animate-spin',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
    />
  );
}

interface LoadingOverlayProps {
  show: boolean;
  message?: string;
  fullScreen?: boolean;
}

export function LoadingOverlay({
  show,
  message = 'جاري التحميل...',
  fullScreen = false,
}: LoadingOverlayProps) {
  if (!show) return null;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-50',
        fullScreen ? 'fixed inset-0' : 'absolute inset-0'
      )}
    >
      <LoadingSpinner size="lg" />
      {message && (
        <p className="mt-4 text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  );
}

interface LoadingDotsProps {
  className?: string;
}

export function LoadingDots({ className }: LoadingDotsProps) {
  return (
    <div className={cn('flex space-x-1', className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 bg-primary rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  );
}

interface LoadingBarProps {
  progress?: number;
  indeterminate?: boolean;
  className?: string;
}

export function LoadingBar({
  progress = 0,
  indeterminate = false,
  className,
}: LoadingBarProps) {
  return (
    <div
      className={cn(
        'h-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden',
        className
      )}
    >
      <div
        className={cn(
          'h-full bg-primary transition-all duration-300',
          indeterminate && 'animate-loading-bar'
        )}
        style={!indeterminate ? { width: `${progress}%` } : undefined}
      />
    </div>
  );
}

interface LoadingSkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export function LoadingSkeleton({
  className,
  variant = 'rectangular',
  width,
  height,
  lines = 1,
}: LoadingSkeletonProps) {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700 animate-pulse';

  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(baseClasses, variantClasses.text)}
            style={{
              width: i === lines - 1 ? '60%' : '100%',
              height,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(baseClasses, variantClasses[variant], className)}
      style={{ width, height }}
    />
  );
}

// Card skeleton for template cards
export function TemplateCardSkeleton() {
  return (
    <div className="border rounded-lg overflow-hidden">
      <LoadingSkeleton className="aspect-video" />
      <div className="p-4 space-y-3">
        <LoadingSkeleton variant="text" />
        <LoadingSkeleton variant="text" width="60%" />
        <div className="flex justify-between items-center pt-2">
          <LoadingSkeleton width={80} height={24} />
          <LoadingSkeleton width={100} height={36} />
        </div>
      </div>
    </div>
  );
}

// Table skeleton
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3">
      <div className="flex gap-4 pb-2 border-b">
        {Array.from({ length: cols }).map((_, i) => (
          <LoadingSkeleton key={i} className="flex-1 h-6" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <LoadingSkeleton key={colIndex} className="flex-1 h-10" />
          ))}
        </div>
      ))}
    </div>
  );
}

// Page loading component
export function PageLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <LoadingSpinner size="xl" />
      <p className="mt-4 text-muted-foreground">جاري تحميل الصفحة...</p>
    </div>
  );
}
