'use client';

import Image from 'next/image';
import { safeImageSrc } from '@/lib/utils';

interface SafeImageProps {
  src: string | null | undefined;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  className?: string;
  fallback?: React.ReactNode;
}

/**
 * Safe wrapper around next/image that handles:
 * - null / undefined / empty string src
 * - Relative /storage/... paths (uses unoptimized + native img)
 * - Full http(s):// URLs (uses Next.js Image with optimization)
 * 
 * Prevents "Failed to construct 'URL': Invalid URL" crashes.
 */
export function SafeImage({
  src,
  alt,
  fill,
  width,
  height,
  sizes,
  className,
  fallback,
}: SafeImageProps) {
  const resolved = safeImageSrc(src);

  if (!resolved) {
    return fallback ? <>{fallback}</> : null;
  }

  // For full URLs — use Next.js Image (optimized)
  if (resolved.startsWith('http')) {
    return (
      <Image
        src={resolved}
        alt={alt}
        fill={fill}
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        sizes={sizes}
        className={className}
        unoptimized
      />
    );
  }

  // For relative paths (/storage/...) — use native img
  // Next.js Image requires absolute URLs or configured remotePatterns
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolved}
      alt={alt}
      className={fill ? `absolute inset-0 w-full h-full ${className || 'object-cover'}` : className}
      onError={(e) => {
        // Hide broken image gracefully
        (e.target as HTMLImageElement).style.display = 'none';
      }}
    />
  );
}
