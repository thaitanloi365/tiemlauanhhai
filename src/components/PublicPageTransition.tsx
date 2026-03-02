'use client';

import type { ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { usePathname } from 'next/navigation';

type PublicPageTransitionProps = {
  children: ReactNode;
};

const pageTransition = {
  duration: 0.22,
  ease: [0.22, 1, 0.36, 1] as const,
};

export function PublicPageTransition({ children }: PublicPageTransitionProps) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();
  const isAdminPath = pathname?.startsWith('/admin') ?? false;

  if (isAdminPath || shouldReduceMotion) {
    return <>{children}</>;
  }

  return (
    <AnimatePresence initial={false} mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={pageTransition}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
