"use client";

import { motion, useReducedMotion } from "motion/react";

// The ratio is already legible from the ₦45,000 / ₦60,000 pair beside it, so
// no "75%" numeral is printed — but the value still has to reach assistive
// tech, hence the explicit progressbar role rather than a decorative div.
export default function ProgressBar({
  percent,
  label,
}: {
  percent: number;
  label: string;
}) {
  const reduce = useReducedMotion();
  return (
    <div
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className="h-1.5 w-full overflow-hidden rounded-full bg-border"
    >
      <motion.div
        className="h-full rounded-full bg-primary"
        initial={{ width: 0 }}
        animate={{ width: `${percent}%` }}
        transition={
          reduce ? { duration: 0 } : { duration: 0.5, ease: "easeOut" }
        }
      />
    </div>
  );
}
