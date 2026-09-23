"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserGroupIcon,
  Activity01Icon,
  Wallet01Icon,
  ShieldCheckIcon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import Reveal from "./Reveal";

const CREATE_HREF = "/login?next=/groups/new";

function Nav() {
  return (
    <nav className="sticky top-0 z-20 border-b border-indigo/5 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/icons/icon.svg"
            alt="Kora logo"
            width={30}
            height={30}
            className="rounded-lg"
          />
          <span className="text-[17px] font-semibold tracking-tight text-indigo">
            Kora
          </span>
        </Link>
        <div className="hidden items-center gap-6 text-sm font-medium text-indigo/60 md:flex">
          <Link href="#how-it-works" className="hover:text-indigo">
            How it works
          </Link>
          <Link href="#ledger" className="hover:text-indigo">
            Ledger
          </Link>
          <Link href="#trust" className="hover:text-indigo">
            Trust
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-full px-4 py-2 text-sm font-semibold text-indigo"
          >
            Sign in
          </Link>
          <motion.span whileTap={{ scale: 0.97 }} className="inline-flex">
            <Link
              href={CREATE_HREF}
              className="rounded-full bg-indigo px-4 py-2 text-sm font-semibold text-paper hover:bg-indigo-hover"
            >
              Create a circle
            </Link>
          </motion.span>
        </div>
      </div>
    </nav>
  );
}

// A pocket-size mock of the shared record — the product shot is the UI.
function LedgerMock() {
  const rows = [
    { who: "Adaeze", what: "Cycle 1 share", state: "Paid", tone: "jade" },
    { who: "Chidi", what: "Cycle 1 share", state: "Paid late", tone: "clay" },
    { who: "Funke", what: "Cycle 2 share", state: "Due Fri", tone: "gold" },
  ] as const;
  const tone: Record<string, string> = {
    jade: "bg-indigo/15 text-indigo",
    clay: "bg-gold/15 text-indigo",
    gold: "bg-gold/15 text-indigo",
  };
  return (
    <div className="rounded-2xl border border-indigo/10 bg-paper p-4 shadow-[0_16px_40px_-24px_rgba(33,22,79,0.35)]">
      <div className="flex items-center justify-between">
        <p className="font-display text-lg font-semibold text-indigo">
          Market Circle ledger
        </p>
        <span className="rounded-full bg-indigo/10 px-3 py-1 font-mono text-xs text-indigo">
          ₦10,000 pot
        </span>
      </div>
      <ul className="mt-3 flex flex-col gap-2">
        {rows.map((r) => (
          <li
            key={`${r.who}-${r.what}`}
            className="flex items-center justify-between gap-3 rounded-xl bg-paper/60 px-3 py-2.5"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-indigo">{r.who}</p>
              <p className="font-mono text-xs text-indigo/60">{r.what}</p>
            </div>
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${tone[r.tone]}`}
            >
              {r.state}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 font-mono text-xs text-indigo/60">
        Trust 100 · Trust 50 · everyone sees this
      </p>
    </div>
  );
}

const VALUE = [
  {
    icon: UserGroupIcon,
    title: "Everyone has a say.",
    body: "Invite someone and let the group decide. New members go to a vote — membership stays with people already saving together.",
  },
  {
    icon: Activity01Icon,
    title: "Everyone sees the same record.",
    body: "Every contribution and payout lands in a shared ledger. No screenshots, notebooks, or someone's memory.",
  },
  {
    icon: Wallet01Icon,
    title: "Your money follows the schedule.",
    body: "Set the contribution and payout order once. Members know what they owe, when it is due, whose turn comes next.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Keep the circle moving.",
    body: "Automatic reminders keep members on schedule and reduce the delays that push everyone's payout back.",
  },
];

const STEPS = [
  { n: "01", title: "Create your circle", body: "Set the contribution amount, schedule, and payout order." },
  { n: "02", title: "Invite your people", body: "Share an invite with the people you already trust." },
  { n: "03", title: "Let the group vote", body: "Every new member request goes to the circle for approval." },
  { n: "04", title: "Contribute on schedule", body: "Members know what they owe and when it is due. Reminders keep everyone on track." },
  { n: "05", title: "Track every payout", body: "See contributions, payouts, and the next turn from one shared record." },
];

export default function Landing() {
  return (
    <div className="flex flex-1 flex-col bg-paper">
      <Nav />

      {/* Hero */}
      <header className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 pb-14 pt-10 lg:flex-row lg:items-center lg:pt-16">
        <Reveal className="flex-1">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            Digital ajo · esusu · chama
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-indigo lg:text-6xl">
            Save together. Keep everyone in the loop.
          </h1>
          <p className="mt-4 max-w-md text-base leading-7 text-indigo/60">
            A digital savings circle for people who already trust each other.
            Set your contribution schedule, keep every payment visible, and let
            the group decide who joins.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <motion.span whileTap={{ scale: 0.97 }} className="inline-flex">
              <Link
                href={CREATE_HREF}
                className="inline-flex items-center gap-2 rounded-full bg-indigo px-6 py-3 text-sm font-semibold text-paper hover:bg-indigo-hover"
              >
                Create a circle
                <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
              </Link>
            </motion.span>
            <Link
              href="#how-it-works"
              className="rounded-full border border-indigo/20 px-6 py-3 text-sm font-semibold text-indigo"
            >
              See how it works
            </Link>
          </div>
        </Reveal>
        <Reveal delay={0.1} className="flex-1">
          <LedgerMock />
        </Reveal>
      </header>

      {/* Problem */}
      <section className="bg-paper/60">
        <div className="mx-auto w-full max-w-5xl px-4 py-14">
          <Reveal>
            <h2 className="max-w-xl font-display text-3xl font-semibold tracking-tight text-indigo">
              Ajo works because people trust each other.
            </h2>
            <p className="mt-2 font-display text-xl text-indigo/60">
              The hard part is keeping that trust intact when money starts moving.
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-indigo/60">
              Who has paid? Who is next? Did everyone get their turn? Who keeps
              the records? When one person has to track everything, small
              mistakes can quickly become bigger problems. We give the whole
              circle one shared place to keep track.
            </p>
            <p className="mt-4 max-w-2xl font-display text-lg font-semibold text-indigo">
              Every payment. Every payout. Every member. One record everyone
              can see.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Value */}
      <section className="mx-auto w-full max-w-5xl px-4 py-14">
        <Reveal>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-indigo">
            Built around the circle, not the collector.
          </h2>
        </Reveal>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {VALUE.map((v, i) => (
            <Reveal key={v.title} delay={Math.min(i * 0.06, 0.2)}>
              <div className="h-full rounded-2xl border border-indigo/10 bg-paper p-5">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo/10">
                  <HugeiconsIcon
                    icon={v.icon}
                    size={22}
                    className="text-indigo"
                  />
                </span>
                <p className="mt-3 font-display text-xl font-semibold text-indigo">
                  {v.title}
                </p>
                <p className="mt-1 text-sm leading-6 text-indigo/60">{v.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Trust */}
      <section id="trust" className="bg-indigo">
        <div className="mx-auto w-full max-w-5xl px-4 py-14">
          <Reveal>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-paper">
              The circle stays yours.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-paper/70">
              You already know who you trust enough to save with. Keep it that
              way. Create an invite-only circle, bring in the people you know,
              and let existing members vote on every new request. Then keep the
              money moving and the record open to everyone in the group.
            </p>
            <ul className="mt-6 flex flex-col gap-2">
              {[
                "Invite-only — no public pools, strangers",
                "Every join request goes to a member vote",
                "The organizer sets the schedule, never holds money",
              ].map((t) => (
                <li key={t} className="flex items-center gap-3 text-sm text-paper">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold/20 font-mono text-xs font-bold text-gold-deep">
                    ✓
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* Ledger + voting */}
      <section id="ledger" className="mx-auto w-full max-w-5xl px-4 py-14">
        <div className="grid gap-8 lg:grid-cols-2">
          <Reveal>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-indigo">
              No more asking, “Did you pay?”
            </h2>
            <p className="mt-1 font-display text-xl text-indigo/60">
              Open the ledger and see it.
            </p>
            <p className="mt-3 text-sm leading-7 text-indigo/60">
              Contributions are recorded as they happen, payouts have a clear
              history, and every member can check the same record.
            </p>
            <p className="mt-3 text-sm font-semibold text-indigo">
              One circle. One record. No confusion.
            </p>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-indigo">
              Who joins the circle? Everyone gets a say.
            </h2>
            <p className="mt-3 text-sm leading-7 text-indigo/60">
              When someone requests to join, the decision goes to the people
              already in the group. Members review the request and vote before
              access is granted.
            </p>
            <p className="mt-3 text-sm font-semibold text-indigo">
              Because the people saving together should decide who saves with
              them.
            </p>
          </Reveal>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-paper/60">
        <div className="mx-auto w-full max-w-5xl px-4 py-14">
          <Reveal>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-indigo">
              From invitation to payout
            </h2>
          </Reveal>
          <ol className="mt-6 flex flex-col gap-3">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={Math.min(i * 0.05, 0.2)}>
                <li className="flex gap-4 rounded-2xl border border-indigo/10 bg-paper p-4">
                  <span className="font-mono text-sm font-bold text-gold">
                    {s.n}
                  </span>
                  <div>
                    <p className="font-display text-lg font-semibold text-indigo">
                      {s.title}
                    </p>
                    <p className="mt-0.5 text-sm leading-6 text-indigo/60">
                      {s.body}
                    </p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* Names */}
      <section className="mx-auto w-full max-w-5xl px-4 py-14 text-center">
        <Reveal>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-indigo">
            However you call it, the idea is the same.
          </h2>
          <p className="mt-3 font-display text-2xl font-semibold text-gold">
            Ajo. Esusu. Adashi. Susu. Chama.
          </p>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-indigo/60">
            People contribute together, take turns, and help each other reach
            bigger financial goals. We&apos;re giving that familiar system a
            shared digital record and a simpler way to manage the circle.
          </p>
        </Reveal>
      </section>

      {/* Final CTA + footer */}
      <section className="mx-auto w-full max-w-5xl px-4 pb-14">
        <Reveal>
          <div className="rounded-3xl bg-indigo px-6 py-12 text-center">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-paper">
              Ready to start your circle?
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-paper/70">
              Bring your people together, set the schedule, and start saving.
            </p>
            <motion.span
              whileTap={{ scale: 0.97 }}
              className="mt-6 inline-flex"
            >
              <Link
                href={CREATE_HREF}
                className="inline-flex items-center gap-2 rounded-full bg-indigo px-6 py-3 text-sm font-semibold text-paper hover:bg-indigo-hover"
              >
                Create a circle
                <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
              </Link>
            </motion.span>
          </div>
        </Reveal>
        <footer className="flex flex-col items-center justify-between gap-2 px-2 pt-8 text-xs text-indigo/50 sm:flex-row">
          <p className="font-semibold text-indigo">Kora</p>
          <p>Invite-only savings circles · Nigeria · Kenya · Uganda · Ghana</p>
        </footer>
      </section>
    </div>
  );
}
