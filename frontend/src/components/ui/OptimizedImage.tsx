'use client';

import { useState } from 'react';
import Image, { ImageProps } from 'next/image';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad'> {
  fallbackSrc?: string;
  withSkeleton?: boolean;
}

/**
 * An optimized image component that provides a smooth fade-in reveal 
 * and optional skeleton loader, eliminating CLS and jarring image pops.
 */
export function OptimizedImage({ 
  className, 
  alt, 
  src, 
  fallbackSrc = '/placeholder.svg', 
  withSkeleton = true,
  ...props 
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <div className={cn('relative overflow-hidden w-full h-full', className)}>
      {/* Loading Skeleton */}
      {withSkeleton && isLoading && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 animate-pulse flex items-center justify-center">
          <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
        </div>
      )}

      {/* Actual Image */}
      <Image
        src={error ? fallbackSrc : src}
        alt={alt}
        className={cn(
          'duration-700 ease-in-out',
          isLoading ? 'scale-105 blur-md opacity-0' : 'scale-100 blur-0 opacity-100'
        )}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setError(true);
        }}
        {...props}
      />
    </div>
  );
}
