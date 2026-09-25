"use client";

import { motion, useReducedMotion } from "motion/react";

// The ratio is already legible from the amount pair beside it, so no duplicate
// percentage is printed. The explicit progressbar role keeps the same value
// available to assistive technology.
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
      aria-valuetext={`${percent}%, ${label}`}
      className="h-2 w-full overflow-hidden rounded-full bg-black/[0.07]"
    >
      <motion.div
        className={`h-full rounded-full ${percent === 100 ? "bg-success" : "bg-primary"}`}
        initial={false}
        animate={{ width: `${percent}%` }}
        transition={
          reduce ? { duration: 0 } : { duration: 0.35, ease: "easeOut" }
        }
      />
    </div>
  );
}
