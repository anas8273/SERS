'use client';

import { useState, useEffect, useRef } from 'react';
import Image, { ImageProps } from 'next/image';
import { cn } from '@/lib/utils';

interface LazyImageProps extends Omit<ImageProps, 'onLoad'> {
  fallback?: string;
  blurEffect?: boolean;
}

export function LazyImage({
  src,
  alt,
  className,
  fallback = '/images/placeholder.png',
  blurEffect = true,
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px',
        threshold: 0.1,
      }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef} className={cn('relative overflow-hidden', className)}>
      {isInView && (
        <Image
          src={error ? fallback : src}
          alt={alt}
          className={cn(
            'transition-all duration-500',
            blurEffect && !isLoaded && 'blur-sm scale-105',
            isLoaded && 'blur-0 scale-100'
          )}
          onLoad={() => setIsLoaded(true)}
          onError={() => setError(true)}
          {...props}
        />
      )}
      {!isInView && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 animate-pulse" />
      )}
    </div>
  );
}

// Skeleton placeholder for images
export function ImageSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'bg-gray-200 dark:bg-gray-800 animate-pulse rounded',
        className
      )}
    />
  );
}
