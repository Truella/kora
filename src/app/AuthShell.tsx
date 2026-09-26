"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

const DEFAULT_POINTS = [
  {
    title: "The organizer never holds the money",
    body: "Contributions move member → recipient directly on schedule.",
  },
  {
    title: "Every payment is visible",
    body: "One shared ledger both members and USSD can check.",
  },
  {
    title: "Members vote on who joins",
    body: "Invite-only circles. No public pools, no strangers.",
  },
];

export default function AuthShell({
  kicker,
  title,
  intro,
  points = DEFAULT_POINTS,
  children,
}: {
  kicker: string;
  title: string;
  intro?: ReactNode;
  points?: { title: string; body: string }[];
  children: ReactNode;
}) {
  return (
    <main className="flex flex-1 flex-col px-4 py-6 lg:flex-row lg:gap-10 lg:py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex w-full max-w-md flex-1 flex-col"
      >
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-text-secondary">
          {kicker}
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-text-primary">
          {title}
        </h1>
        {intro && (
          <p className="mt-1 text-sm leading-6 text-text-secondary">{intro}</p>
        )}
        <div className="mt-5 flex flex-col">{children}</div>
      </motion.div>

      <aside className="hidden flex-1 flex-col justify-between rounded-[20px] bg-hero-bg p-8 text-white lg:flex">
        <div>
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-accent">
            Kora · savings circles
          </p>
          <p className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight">
            The circle&apos;s money, minus the custody risk.
          </p>
          <ul className="mt-8 flex flex-col gap-5">
            {points.map((p, i) => (
              <li key={p.title} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/20 font-mono text-xs font-bold text-[#E8CF8E]">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold">{p.title}</p>
                  <p className="mt-0.5 text-sm leading-6 text-white/80">
                    {p.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="font-mono text-xs text-white/60">
          Nigeria · Kenya · Uganda · Ghana
        </p>
      </aside>
    </main>
  );
}
