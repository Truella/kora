"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserGroupIcon,
  Activity01Icon,
  Wallet01Icon,
  ShieldCheckIcon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import Reveal from "@/components/Reveal";

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
    title: "The order is clear from day one.",
    body: "Set contributions and payout order once. Everyone knows what they owe, when it is due, and who receives next.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Everyone stays on schedule.",
    body: "Automatic reminders keep contributions moving so one missed payment doesn't hold up the circle.",
  },
];

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

export default function Story({ createHref }: { createHref: string }) {
  const reduceMotion = useReducedMotion();
  return (
    <>
      <section className="bg-surface">
        <div className="mx-auto w-full max-w-5xl px-4 py-14">
          <Reveal>
            <h2 className="max-w-xl font-display text-3xl font-semibold tracking-tight text-primary">
              What is Kora?
            </h2>
            <p className="mt-2 font-display text-xl text-text-secondary">
              Kora is a digital savings circle for people who know and trust
              each other.
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-text-secondary">
              Running a savings circle means keeping track of contributions,
              managing the payout order, and making sure everyone&apos;s money
              reaches the right person at the right time. When all of that
              depends on one person, a missed payment, unclear record, or
              misplaced contribution can affect the whole group.
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-text-secondary">
              Kora gives the circle a shared system to run on. Members vote on
              who joins, contributions and payouts follow an agreed schedule,
              and every transaction is recorded in a ledger everyone can see.
              The organizer sets up and manages the circle without having to
              hold everyone&apos;s money.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 py-14">
        <Reveal>
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-text-secondary">
            Why Kora
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-text-primary">
            Saving together, without the usual uncertainty.
          </h2>
        </Reveal>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {VALUE.map((v, i) => (
            <Reveal key={v.title} delay={Math.min(i * 0.06, 0.2)}>
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
            </Reveal>
          ))}
        </div>
      </section>

      <section id="trust" className="bg-hero-bg">
        <div className="mx-auto w-full max-w-5xl px-4 py-14">
          <Reveal>
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-accent">
              Invite-only · member-voted
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-white">
              The circle stays yours.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/80">
              You already know who you trust enough to save with. Keep it that
              way. Create an invite-only circle, bring in the people you know,
              and let existing members vote on every new request. Then keep the
              money moving and the record open to everyone in the group.
            </p>
            <ul className="mt-6 flex flex-col gap-2">
              {[
                "Invite-only. No public pools, no strangers",
                "Every join request goes to a member vote",
                "The organizer sets the schedule, never holds money",
              ].map((t) => (
                <li
                  key={t}
                  className="flex items-center gap-3 text-sm text-white"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/20 font-mono text-xs font-bold text-[#E8CF8E]">
                    ✓
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <section id="ledger" className="mx-auto w-full max-w-5xl px-4 py-14">
        <div className="grid gap-8 lg:grid-cols-2">
          <Reveal>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-text-primary">
              No more asking, “Did you pay?”
            </h2>
            <p className="mt-1 font-display text-xl text-text-secondary">
              Open the ledger and see it.
            </p>
            <p className="mt-3 text-sm leading-7 text-text-secondary">
              Contributions are recorded as they happen, payouts have a clear
              history, and every member can check the same record.
            </p>
            <p className="mt-3 font-display text-sm font-semibold text-text-primary">
              One circle. One record. No confusion.
            </p>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-text-primary">
              Who joins the circle? Everyone gets a say.
            </h2>
            <p className="mt-3 text-sm leading-7 text-text-secondary">
              When someone requests to join, the decision goes to the people
              already in the group. Members review the request and vote before
              access is granted.
            </p>
            <p className="mt-3 font-display text-sm font-semibold text-text-primary">
              Because the people saving together should decide who saves with
              them.
            </p>
          </Reveal>
        </div>
      </section>

      <section id="how-it-works" className="bg-surface">
        <div className="mx-auto w-full max-w-5xl px-4 py-14">
          <Reveal>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-text-primary">
              From invitation to payout
            </h2>
          </Reveal>
          <ol className="mt-6 flex flex-col">
            {STEPS.map((s, i) => (
              <motion.li
                key={s.n}
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{
                  duration: 0.35,
                  delay: Math.min(i * 0.12, 0.48),
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
                      transition={{ duration: 0.2 }}
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
                          delay: Math.min(i * 0.12, 0.48) + 0.15,
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

      <section className="mx-auto w-full max-w-5xl px-4 py-14 text-center">
        <Reveal>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-text-primary">
            However you call it, the idea is the same.
          </h2>
          <p className="mt-3 font-display text-2xl font-semibold text-text-primary">
            Ajo. Esusu. Adashi. Susu. Chama.
          </p>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-text-secondary">
            People contribute together, take turns, and help each other reach
            bigger financial goals. We&apos;re giving that familiar system a
            shared digital record and a simpler way to manage the circle.
          </p>
        </Reveal>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 pb-14">
        <Reveal>
          <div className="rounded-[20px] bg-hero-bg px-6 py-12 text-center">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-accent">
              Start today
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-white">
              Ready to start your circle?
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/80">
              Bring your people together, set the schedule, and start saving.
            </p>
            <motion.span
              whileTap={{ scale: 0.97 }}
              className="mt-6 inline-flex"
            >
              <Link
                href={createHref}
                className="inline-flex items-center gap-2 rounded-[10px] bg-primary px-6 py-[13px] text-sm font-semibold text-white hover:bg-primary-hover"
              >
                Create a circle
                <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
              </Link>
            </motion.span>
          </div>
        </Reveal>
        <footer className="flex flex-col items-center justify-between gap-2 px-2 pt-8 font-mono text-xs text-text-secondary sm:flex-row">
          <p className="font-display font-semibold text-text-primary">Kora</p>
          <p>Invite-only savings circles · Nigeria · Kenya · Uganda · Ghana</p>
        </footer>
      </section>
    </>
  );
}
