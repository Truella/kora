"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

const FAQS = [
  {
    q: "Who can join a circle?",
    a: "Only people you invite can request to join, and every request goes to a member vote. The people in the circle decide who joins.",
  },
  {
    q: "Who holds the money?",
    a: "No single member holds the group's money. The organizer sets up the circle and manages the schedule, but doesn't collect or keep everyone's contributions. Contributions and payouts are recorded in a shared ledger that every member can see.",
  },
  {
    q: "How do payouts work?",
    a: "The contribution amount, schedule, and payout order are set when the circle is created. Members contribute according to that schedule, and each member receives the group's payout when their turn comes. The full history is recorded in the shared ledger.",
  },
  {
    q: "What happens if someone misses a payment?",
    a: "Automatic reminders help members stay on schedule. If someone misses a contribution, the shared record makes it visible to everyone in the circle.",
  },
  {
    q: "Can I create a circle with people who haven't saved together before?",
    a: "Yes. Your members don't need to have an existing savings history together. What matters is that the group is built around people who know or trust each other. You create the circle, invite them, and members vote on who joins.",
  },
  {
    q: "Which countries are supported?",
    a: "Kora currently supports savings circles in Nigeria, Kenya, Uganda, and Ghana.",
  },
];

export default function Faq() {
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="mx-auto w-full max-w-5xl px-4 py-14">
      <motion.div
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.35 }}
      >
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-text-secondary">
          FAQ
        </p>
        <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-text-primary">
          Questions, answered.
        </h2>
      </motion.div>
      <div className="mt-6 flex flex-col gap-2">
        {FAQS.map((f, i) => {
          const isOpen = open === i;
          return (
            <motion.div
              key={f.q}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{
                duration: 0.3,
                delay: reduceMotion ? 0 : 0.15 + i * 0.06,
              }}
              className="rounded-[14px] border-[0.5px] border-border bg-surface"
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                aria-controls={`faq-panel-${i}`}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <span className="font-display text-base font-semibold text-text-primary">
                  {f.q}
                </span>
                <span
                  aria-hidden
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-lg leading-none text-primary transition-transform duration-200 ${
                    isOpen ? "rotate-45" : ""
                  }`}
                >
                  +
                </span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    id={`faq-panel-${i}`}
                    role="region"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: reduceMotion ? 0 : 0.25 }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-5 text-sm leading-7 text-text-secondary">
                      {f.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
