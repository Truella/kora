"use client";

import { motion, useReducedMotion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Wallet01Icon,
  ShieldCheckIcon,
} from "@hugeicons/core-free-icons";
import TypewriterHeading from "./TypewriterHeading";

export default function WhatIsKora() {
  const reduceMotion = useReducedMotion();
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-surface via-surface to-bg">
      {/* Faint wash so the section lifts off the page without a card */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 right-[-6rem] h-72 w-72 rounded-full bg-primary/[0.07] blur-3xl"
      />
      <div className="relative mx-auto w-full max-w-5xl px-4 py-16 sm:py-20">
        {/* Strict chain: heading types ~1.5s (350ms start + 13 chars ×
            90ms); each step below waits for the previous one to settle. */}
        <motion.div
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.35 }}
        >
          <TypewriterHeading text="What is Kora?" className="min-h-[1.15em]" />
        </motion.div>
        <motion.p
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.35, delay: reduceMotion ? 0 : 1.6 }}
          className="mt-4 max-w-2xl font-display text-xl leading-8 text-text-primary sm:text-2xl sm:leading-9"
        >
          Kora is a digital savings circle for people who know and trust
          each other.
        </motion.p>

        <div className="mt-8 max-w-2xl lg:max-w-none lg:grid lg:grid-cols-2 lg:gap-10">
          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.35, delay: reduceMotion ? 0 : 2.0 }}
          >
            <div className="flex gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-primary/[0.08]">
                <HugeiconsIcon
                  icon={Wallet01Icon}
                  size={20}
                  className="text-primary"
                />
              </span>
              <p className="text-sm leading-7 text-text-secondary">
                <span className="font-display font-semibold text-text-primary">
                  Running a savings circle means keeping track of
                  contributions.{" "}
                </span>
                Managing the payout order, and making sure
                everyone&apos;s money reaches the right person at the right
                time. When all of that depends on one person, a missed
                payment, unclear record, or misplaced contribution can affect
                the whole group.
              </p>
            </div>
          </motion.div>

          <motion.div
            aria-hidden
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.3, delay: reduceMotion ? 0 : 2.4 }}
            className="my-6 h-px bg-gradient-to-r from-transparent via-border to-transparent lg:hidden"
          />

          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.35, delay: reduceMotion ? 0 : 2.75 }}
          >
            <div className="flex gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-accent/[0.14]">
                <HugeiconsIcon
                  icon={ShieldCheckIcon}
                  size={20}
                  className="text-accent"
                />
              </span>
              <p className="text-sm leading-7 text-text-secondary">
                <span className="font-display font-semibold text-text-primary">
                  Kora gives the circle a shared system to run on.{" "}
                </span>
                Members vote on who joins, contributions and payouts follow
                an agreed schedule, and every transaction is recorded in a
                ledger everyone can see. The organizer sets up and manages
                the circle without having to hold everyone&apos;s money.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
