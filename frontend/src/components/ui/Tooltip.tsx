'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  delay?: number;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

/**
 * A highly accessible and animated tooltip component using Framer Motion.
 * Adds a professional touch to icon buttons and truncated text.
 */
export function Tooltip({ 
  children, 
  content, 
  delay = 300, 
  position = 'top',
  className 
}: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => setIsVisible(true), delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  // Prevent memory leaks
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const getPositionStyles = () => {
    switch (position) {
      case 'bottom': return 'top-full mt-2 left-1/2 -translate-x-1/2';
      case 'left': return 'right-full me-2 top-1/2 -translate-y-1/2';
      case 'right': return 'left-full ms-2 top-1/2 -translate-y-1/2';
      case 'top': 
      default: return 'bottom-full mb-2 left-1/2 -translate-x-1/2';
    }
  };

  const getInitialAnimation = () => {
    switch (position) {
      case 'bottom': return { opacity: 0, y: -5, x: '-50%' };
      case 'left': return { opacity: 0, x: 5, y: '-50%' };
      case 'right': return { opacity: 0, x: -5, y: '-50%' };
      case 'top': 
      default: return { opacity: 0, y: 5, x: '-50%' };
    }
  };

  const getAnimateAnimation = () => {
    switch (position) {
      case 'left':
      case 'right': return { opacity: 1, x: 0, y: '-50%' };
      case 'top':
      case 'bottom': 
      default: return { opacity: 1, y: 0, x: '-50%' };
    }
  };

  return (
    <div 
      className="relative inline-flex" 
      onMouseEnter={handleMouseEnter} 
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={getInitialAnimation()}
            animate={getAnimateAnimation()}
            exit={getInitialAnimation()}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={cn(
              'absolute z-50 px-2.5 py-1.5 text-xs font-medium text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 rounded-md shadow-lg whitespace-nowrap pointer-events-none',
              getPositionStyles(),
              className
            )}
            role="tooltip"
          >
            {content}
            {/* Arrow */}
            <div 
              className={cn(
                'absolute w-2 h-2 bg-gray-900 dark:bg-gray-100 rotate-45',
                position === 'top' && 'bottom-[-4px] left-1/2 -translate-x-1/2',
                position === 'bottom' && 'top-[-4px] left-1/2 -translate-x-1/2',
                position === 'left' && 'right-[-4px] top-1/2 -translate-y-1/2',
                position === 'right' && 'left-[-4px] top-1/2 -translate-y-1/2'
              )} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
