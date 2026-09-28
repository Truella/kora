"use client";

import { motion, useReducedMotion } from "motion/react";
import TypewriterHeading from "./TypewriterHeading";

const STEPS = [
  {
    n: "01",
    title: "Create your circle",
    body: "Set the contribution amount, schedule, and payout order.",
  },
  {
    n: "02",
    title: "Invite your people",
    body: "Share an invite with the people you already trust.",
  },
  {
    n: "03",
    title: "Let the group vote",
    body: "Every new member request goes to the circle for approval.",
  },
  {
    n: "04",
    title: "Contribute on schedule",
    body: "Members know what they owe and when it is due. Reminders keep everyone on track.",
  },
  {
    n: "05",
    title: "Track every payout",
    body: "See contributions, payouts, and the next turn from one shared record.",
  },
];

export default function HowItWorks() {
  const reduceMotion = useReducedMotion();
  return (
    <section id="how-it-works" className="bg-surface">
      <div className="mx-auto w-full max-w-5xl px-4 py-14">
        {/* "How it works" types ~1.45s (350ms start + 12 chars × 90ms);
            the steps wait until it has settled, then cascade as before. */}
        <motion.div
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.35 }}
        >
          <TypewriterHeading text="How it works" className="min-h-[1.15em]" />
        </motion.div>
        <ol className="mt-6 flex flex-col">
          {STEPS.map((s, i) => (
            <motion.li
              key={s.n}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{
                duration: 0.35,
                delay: Math.min(i * 0.12, 0.48) + (reduceMotion ? 0 : 1.5),
              }}
              className="relative flex gap-4"
            >
              <span aria-hidden className="flex flex-col items-center">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary font-mono text-xs font-bold text-white">
                  {s.n}
                </span>
                {i < STEPS.length - 1 && (
                  <motion.svg
                    viewBox="0 0 36 100"
                    preserveAspectRatio="none"
                    aria-hidden
                    initial={{ opacity: reduceMotion ? 1 : 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{
                      duration: 0.2,
                      delay: reduceMotion ? 0 : 1.5,
                    }}
                    className="mt-2 min-h-6 w-9 flex-1"
                  >
                    <motion.path
                      d="M18 2 C 30 30, 6 65, 18 98"
                      fill="none"
                      strokeWidth={2}
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                      className="stroke-primary/25"
                      initial={{ pathLength: reduceMotion ? 1 : 0 }}
                      whileInView={{ pathLength: 1 }}
                      viewport={{ once: true, margin: "-40px" }}
                      transition={{
                        duration: 0.6,
                        delay:
                          Math.min(i * 0.12, 0.48) +
                          0.15 +
                          (reduceMotion ? 0 : 1.5),
                      }}
                    />
                  </motion.svg>
                )}
              </span>
              <div
                className={`flex-1 rounded-[14px] border-[0.5px] border-border bg-surface p-4 ${
                  i < STEPS.length - 1 ? "mb-6" : ""
                }`}
              >
                <p className="font-display text-lg font-semibold text-text-primary">
                  {s.title}
                </p>
                <p className="mt-0.5 text-sm leading-6 text-text-secondary">
                  {s.body}
                </p>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
