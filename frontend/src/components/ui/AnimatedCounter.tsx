'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  formatNumber?: boolean;
  decimals?: number;
}

export function AnimatedCounter({
  value,
  duration = 1500,
  className,
  prefix = '',
  suffix = '',
  formatNumber = true,
  decimals = 0,
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);
  const elementRef = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  // Accept duration as seconds (< 10) or milliseconds (>= 10)
  const durationMs = duration < 10 ? duration * 1000 : duration;

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          startRef.current = null;

          const step = (timestamp: number) => {
            if (!startRef.current) startRef.current = timestamp;
            const progress = Math.min((timestamp - startRef.current) / durationMs, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = eased * value;
            const factor = Math.pow(10, decimals);
            setDisplayValue(decimals > 0 ? Math.round(current * factor) / factor : Math.round(current));

            if (progress < 1) {
              rafRef.current = requestAnimationFrame(step);
            }
          };

          rafRef.current = requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafRef.current);
    };
  }, [value, durationMs, decimals]);

  const formatted = decimals > 0
    ? displayValue.toFixed(decimals)
    : formatNumber
      ? displayValue.toLocaleString('en-US')
      : displayValue.toString();

  return (
    <span ref={elementRef} className={cn('tabular-nums', className)}>
      {prefix}{formatted}{suffix}
    </span>
  );
}
