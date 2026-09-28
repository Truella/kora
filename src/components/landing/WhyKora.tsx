"use client";

import { motion, useReducedMotion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserGroupIcon,
  Activity01Icon,
  Wallet01Icon,
  ShieldCheckIcon,
} from "@hugeicons/core-free-icons";
import TypewriterHeading from "./TypewriterHeading";

const VALUE = [
  {
    icon: UserGroupIcon,
    title: "Everyone gets a say.",
    body: "Invite someone, then let the circle decide. New members join only after the group approves them.",
  },
  {
    icon: Activity01Icon,
    title: "Everyone sees the same record.",
    body: "Contributions, payouts, and the circle's activity live in one shared record.",
  },
  {
    icon: Wallet01Icon,
    title: "The payout order is clear from day one.",
    body: "Set contributions and payout order once. Everyone knows what they owe, when it is due, and who receives next.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Everyone stays on schedule.",
    body: "Automatic reminders keep contributions moving so one missed payment doesn't hold up the circle.",
  },
];

export default function WhyKora() {
  const reduceMotion = useReducedMotion();
  return (
    <section id="why-kora" className="mx-auto w-full max-w-5xl px-4 py-14">
      <motion.div
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.35 }}
      >
        <TypewriterHeading text="Why Kora?" className="min-h-[1.15em]" />
      </motion.div>
      <motion.p
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        // "Why Kora?" types for ~0.85s (250ms start + 9 chars × 65ms) —
        // the sub waits until that has settled.
        transition={{ duration: 0.35, delay: reduceMotion ? 0 : 0.9 }}
        className="mt-4 max-w-2xl font-display text-xl leading-8 text-text-primary sm:text-2xl sm:leading-9"
      >
        Saving together, without the usual uncertainty.
      </motion.p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {VALUE.map((v, i) => (
          <motion.div
            key={v.title}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            // Strict chain: sub settles ~1.25s; cards start at 1.3s and
            // step 0.35s apart so each fade settles as the next begins —
            // one by one, never overlapping.
            transition={{
              duration: 0.35,
              delay: reduceMotion ? 0 : 1.3 + i * 0.35,
            }}
          >
            <div className="h-full rounded-[14px] border-[0.5px] border-border bg-surface p-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-primary/10">
                <HugeiconsIcon
                  icon={v.icon}
                  size={22}
                  className="text-primary"
                />
              </span>
              <p className="mt-3 font-display text-xl font-semibold text-text-primary">
                {v.title}
              </p>
              <p className="mt-1 text-sm leading-6 text-text-secondary">
                {v.body}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
