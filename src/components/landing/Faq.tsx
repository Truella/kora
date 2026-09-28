"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

const FAQS = [
  {
    q: "Who can join a circle?",
    a: "Only people you invite — and even then, every join request goes to a member vote. There are no public pools and no strangers: the people already saving together decide who saves with them.",
  },
  {
    q: "Who holds the money?",
    a: "No single collector. The organizer sets up the circle and manages the schedule, but never holds everyone's money. Every contribution and payout is recorded in one shared ledger that all members can see.",
  },
  {
    q: "How do payouts work?",
    a: "The contribution amount, schedule, and payout order are set when the circle is created, so everyone knows what they owe, when it is due, and who receives next. You can follow every turn from the shared record.",
  },
  {
    q: "What happens if someone misses a payment?",
    a: "Automatic reminders nudge members to stay on schedule, and because the record is shared, everyone can see exactly where the circle stands — no chasing people for updates.",
  },
  {
    q: "Which countries are supported?",
    a: "Kora currently supports savings circles in Nigeria, Kenya, Uganda, and Ghana.",
  },
  {
    q: "How do I start?",
    a: "Create a circle, set the contribution amount and payout order, then invite the people you trust. Once members approve new requests, everyone contributes on schedule and takes their turn.",
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
