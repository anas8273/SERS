'use client';

import { useRef, ReactNode } from 'react';
import { motion, useInView } from 'framer-motion';

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  /** Animation direction — default 'up' */
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  /** Delay in seconds */
  delay?: number;
  /** Duration in seconds */
  duration?: number;
  /** How much of the element must be visible to trigger (0-1) */
  threshold?: number;
  /** Whether to re-animate when scrolling back */
  once?: boolean;
}

const directionMap = {
  up:    { y: 24, x: 0 },
  down:  { y: -24, x: 0 },
  left:  { y: 0, x: 24 },
  right: { y: 0, x: -24 },
  none:  { y: 0, x: 0 },
};

export function ScrollReveal({
  children,
  className = '',
  direction = 'up',
  delay = 0,
  duration = 0.5,
  // ⚠️ FIX: Use 0.05 (5%) threshold — not 0.15
  // On mobile, large sections (py-20) never reach 15% visibility
  // so they stay opacity:0 causing blank white areas below the hero.
  threshold = 0.05,
  once = true,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, {
    once,
    amount: threshold,
    // 'margin' triggers animation slightly before element enters viewport
    // This prevents the blank-flash on mobile scroll
    margin: '0px 0px -40px 0px',
  });

  const offset = directionMap[direction];

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: offset.y, x: offset.x }}
      animate={isInView
        ? { opacity: 1, y: 0, x: 0 }
        : { opacity: 0, y: offset.y, x: offset.x }
      }
      transition={{
        duration,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
