'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export function PageProgress() {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const previousPath = useRef(pathname);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // If the path changed, show the progress bar
    if (previousPath.current !== pathname) {
      setIsLoading(true);
      setProgress(0);

      // Animate progress: fast start, then slow down
      let currentProgress = 0;
      const tick = () => {
        currentProgress += Math.random() * 15 + 5;
        if (currentProgress > 90) currentProgress = 90;
        setProgress(currentProgress);

        if (currentProgress < 90) {
          timerRef.current = setTimeout(tick, 200 + Math.random() * 300);
        }
      };
      tick();

      // Complete and hide after a short delay
      const completeTimer = setTimeout(() => {
        setProgress(100);
        setTimeout(() => {
          setIsLoading(false);
          setProgress(0);
        }, 300);
      }, 800);

      previousPath.current = pathname;

      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        clearTimeout(completeTimer);
      };
    }

    previousPath.current = pathname;
  }, [pathname]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className="fixed top-0 left-0 right-0 z-[9999] h-[3px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 rounded-full shadow-lg shadow-purple-500/50"
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
