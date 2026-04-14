'use client';

import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';

// Dynamic import avoids SSR issues with lottie-react
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

// ─── Inline Lottie JSON Data ─────────────────────────────────────────────
// Minimal, hand-written Lottie-compatible animations (no external files needed)

/** Pulsing dots loader — 3 dots with staggered scale */
const loadingData = {
  v: '5.7.4', fr: 30, ip: 0, op: 60, w: 200, h: 80,
  layers: [
    { ddd: 0, ind: 0, ty: 4, nm: 'dot1', sr: 1, ks: {
      o: { a: 0, k: 100 }, r: { a: 0, k: 0 }, p: { a: 0, k: [50, 40, 0] },
      s: { a: 1, k: [
        { i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] }, t: 0, s: [100, 100, 100] },
        { i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] }, t: 15, s: [140, 140, 100] },
        { t: 30, s: [100, 100, 100] },
      ] },
    }, shapes: [{ ty: 'el', d: 1, s: { a: 0, k: [16, 16] }, p: { a: 0, k: [0, 0] } }, { ty: 'fl', c: { a: 0, k: [0.545, 0.361, 0.965, 1] }, o: { a: 0, k: 100 } }] },
    { ddd: 0, ind: 1, ty: 4, nm: 'dot2', sr: 1, ks: {
      o: { a: 0, k: 100 }, r: { a: 0, k: 0 }, p: { a: 0, k: [100, 40, 0] },
      s: { a: 1, k: [
        { i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] }, t: 10, s: [100, 100, 100] },
        { i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] }, t: 25, s: [140, 140, 100] },
        { t: 40, s: [100, 100, 100] },
      ] },
    }, shapes: [{ ty: 'el', d: 1, s: { a: 0, k: [16, 16] }, p: { a: 0, k: [0, 0] } }, { ty: 'fl', c: { a: 0, k: [0.545, 0.361, 0.965, 1] }, o: { a: 0, k: 80 } }] },
    { ddd: 0, ind: 2, ty: 4, nm: 'dot3', sr: 1, ks: {
      o: { a: 0, k: 100 }, r: { a: 0, k: 0 }, p: { a: 0, k: [150, 40, 0] },
      s: { a: 1, k: [
        { i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] }, t: 20, s: [100, 100, 100] },
        { i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] }, t: 35, s: [140, 140, 100] },
        { t: 50, s: [100, 100, 100] },
      ] },
    }, shapes: [{ ty: 'el', d: 1, s: { a: 0, k: [16, 16] }, p: { a: 0, k: [0, 0] } }, { ty: 'fl', c: { a: 0, k: [0.545, 0.361, 0.965, 1] }, o: { a: 0, k: 60 } }] },
  ],
};

/** Checkmark success animation — circle draw + check */
const successData = {
  v: '5.7.4', fr: 30, ip: 0, op: 40, w: 120, h: 120,
  layers: [
    { ddd: 0, ind: 0, ty: 4, nm: 'check', sr: 1, ks: {
      o: { a: 1, k: [{ t: 10, s: [0] }, { t: 15, s: [100] }] },
      r: { a: 0, k: 0 }, p: { a: 0, k: [60, 60, 0] }, s: { a: 1, k: [
        { i: { x: [0.2], y: [1] }, o: { x: [0.8], y: [0] }, t: 10, s: [0, 0, 100] },
        { t: 25, s: [100, 100, 100] },
      ] },
    }, shapes: [
      { ty: 'el', d: 1, s: { a: 0, k: [80, 80] }, p: { a: 0, k: [0, 0] } },
      { ty: 'fl', c: { a: 0, k: [0.286, 0.8, 0.439, 1] }, o: { a: 0, k: 100 } },
    ] },
  ],
};

/** Empty state — floating document icon */
const emptyData = {
  v: '5.7.4', fr: 30, ip: 0, op: 90, w: 200, h: 200,
  layers: [
    { ddd: 0, ind: 0, ty: 4, nm: 'doc', sr: 1, ks: {
      o: { a: 0, k: 100 }, r: { a: 0, k: 0 },
      p: { a: 1, k: [
        { i: { x: 0.4, y: 1 }, o: { x: 0.6, y: 0 }, t: 0, s: [100, 95, 0] },
        { i: { x: 0.4, y: 1 }, o: { x: 0.6, y: 0 }, t: 45, s: [100, 105, 0] },
        { t: 90, s: [100, 95, 0] },
      ] },
      s: { a: 0, k: [100, 100, 100] },
    }, shapes: [
      { ty: 'rc', d: 1, s: { a: 0, k: [70, 90] }, r: { a: 0, k: 10 }, p: { a: 0, k: [0, 0] } },
      { ty: 'fl', c: { a: 0, k: [0.85, 0.85, 0.9, 1] }, o: { a: 0, k: 100 } },
      { ty: 'st', c: { a: 0, k: [0.7, 0.7, 0.78, 1] }, o: { a: 0, k: 100 }, w: { a: 0, k: 2 } },
    ] },
  ],
};

type AnimationType = 'loading' | 'success' | 'empty';

const animationMap: Record<AnimationType, any> = {
  loading: loadingData,
  success: successData,
  empty: emptyData,
};

interface LottieAnimationProps {
  type: AnimationType;
  className?: string;
  loop?: boolean;
  /** Width/height in pixels */
  size?: number;
}

/**
 * Reusable Lottie animation component with built-in animation data.
 * No external JSON files needed — animations are embedded inline.
 */
export function LottieAnimation({
  type,
  className,
  loop = true,
  size = 120,
}: LottieAnimationProps) {
  const data = animationMap[type];
  if (!data) return null;

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <Lottie
        animationData={data}
        loop={type === 'success' ? false : loop}
        style={{ width: size, height: size }}
        aria-hidden="true"
      />
    </div>
  );
}
