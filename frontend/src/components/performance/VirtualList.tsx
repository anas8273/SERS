'use client';

import { useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number) => ReactNode;
  overscan?: number;
  className?: string;
  containerHeight?: number | string;
  onEndReached?: () => void;
  endReachedThreshold?: number;
}

export function VirtualList<T>({
  items,
  itemHeight,
  renderItem,
  overscan = 5,
  className,
  containerHeight = 400,
  onEndReached,
  endReachedThreshold = 100,
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeightState, setContainerHeightState] = useState(
    typeof containerHeight === 'number' ? containerHeight : 400
  );

  useEffect(() => {
    if (typeof containerHeight === 'number') {
      setContainerHeightState(containerHeight);
    } else if (containerRef.current) {
      setContainerHeightState(containerRef.current.clientHeight);
    }
  }, [containerHeight]);

  const totalHeight = items.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeightState) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);
  const offsetY = startIndex * itemHeight;

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      setScrollTop(scrollTop);

      // Check if end reached
      if (
        onEndReached &&
        scrollHeight - scrollTop - clientHeight < endReachedThreshold
      ) {
        onEndReached();
      }
    },
    [onEndReached, endReachedThreshold]
  );

  return (
    <div
      ref={containerRef}
      className={cn('overflow-auto', className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            top: offsetY,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={startIndex + index}
              style={{ height: itemHeight }}
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Simple infinite scroll component
interface InfiniteScrollProps {
  children: ReactNode;
  onLoadMore: () => void;
  hasMore: boolean;
  loading?: boolean;
  loader?: ReactNode;
  threshold?: number;
  className?: string;
}

export function InfiniteScroll({
  children,
  onLoadMore,
  hasMore,
  loading = false,
  loader,
  threshold = 100,
  className,
}: InfiniteScrollProps) {
  const observerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!observerRef.current || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onLoadMore();
        }
      },
      {
        rootMargin: `${threshold}px`,
      }
    );

    observer.observe(observerRef.current);

    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore, threshold]);

  return (
    <div className={className}>
      {children}
      <div ref={observerRef} className="h-1" />
      {loading && (loader || <DefaultLoader />)}
    </div>
  );
}

function DefaultLoader() {
  return (
    <div className="flex justify-center py-4">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
