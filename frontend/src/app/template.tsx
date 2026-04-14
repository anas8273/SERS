'use client';

import { motion } from 'framer-motion';

/**
 * Root template — applies a subtle fade on every page navigation.
 * Dashboard & Admin layouts have their own PageTransition (fade+slide),
 * so this is kept intentionally minimal (opacity only) to avoid double animation.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
