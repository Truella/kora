"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "motion/react";

// Shared typewriter headline — one size, one animation everywhere it's used.
// Typing starts when the heading scrolls into view so below-fold instances
// don't finish before the user ever sees them.
export default function TypewriterHeading({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLHeadingElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  // Render-phase read only — no state updates here. The full text is the
  // initial state under reduced motion so no effect needs to catch up.
  const [typedCount, setTypedCount] = useState(() =>
    reduceMotion ? text.length : 0,
  );

  useEffect(() => {
    if (reduceMotion || !inView) return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    // One-shot timeout chain (not an interval): each tick schedules the
    // next, the updater itself stays pure, and nothing fires after unmount.
    const typeNext = (n: number) => {
      timer = setTimeout(
        () => {
          if (!alive) return;
          setTypedCount(n);
          if (n < text.length) typeNext(n + 1);
        },
        n === 1 ? 250 : 65,
      );
    };
    typeNext(1);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [reduceMotion, inView, text]);

  const typingDone = typedCount >= text.length;
  return (
    <h2
      ref={ref}
      aria-label={text}
      className={`font-display text-5xl font-semibold tracking-tight text-primary sm:text-6xl ${className}`}
    >
      <span aria-hidden>{text.slice(0, typedCount)}</span>
      <span
        aria-hidden
        className={`ml-1 inline-block h-[0.9em] w-[3px] translate-y-[0.1em] bg-primary ${
          typingDone ? "animate-pulse" : ""
        }`}
      />
    </h2>
  );
}
