"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

// Shared entrance for the Motion pass (Day 5A): a short fade-up on first
// paint. Lists stagger via `delay` (callers cap it so long lists settle
// fast). Live-updating surfaces (LedgerFeed) deliberately don't use this —
// re-animating on every realtime refetch would jitter the tabular figures.
// Reduced-motion users get opacity-only (no y-shift).
function useEntrance(delay: number) {
  const reduce = useReducedMotion();
  return {
    initial: reduce ? { opacity: 0 } : { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, delay },
  };
}

export default function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div {...useEntrance(delay)} className={className}>
      {children}
    </motion.div>
  );
}

export function RevealLi({
  children,
  delay = 0,
  className,
  id,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  // Anchor targets (the /home attention queue deep-links to these), so the
  // card can be scrolled to by id without the wrapper having to know about it.
  id?: string;
}) {
  return (
    <motion.li {...useEntrance(delay)} className={className} id={id}>
      {children}
    </motion.li>
  );
}
