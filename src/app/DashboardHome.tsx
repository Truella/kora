"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserGroupIcon,
  Wallet01Icon,
  ShieldCheckIcon,
} from "@hugeicons/core-free-icons";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export default function DashboardHome() {
  return (
    <main className="flex flex-1 flex-col gap-4 px-4 py-6">
      <motion.section
        {...fadeUp}
        transition={{ duration: 0.35 }}
        className="rounded-[20px] bg-hero-bg p-6 text-white"
      >
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-accent">Welcome to Kora</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
          Save together, without handing anyone the pot.
        </h1>
        <p className="mt-2 text-sm leading-6 text-white/80">
          Invite-only circles. Members vote who joins. Money moves
          member&nbsp;→&nbsp;recipient directly — the organizer never holds it.
        </p>
        <motion.div whileTap={{ scale: 0.97 }}>
          <Link
            href="/groups"
            className="mt-4 inline-flex items-center gap-2 rounded-[10px] bg-primary px-5 py-[13px] text-sm font-semibold text-white hover:bg-primary-hover"
          >
            <HugeiconsIcon icon={UserGroupIcon} size={18} strokeWidth={2} />
            View your circles
          </Link>
        </motion.div>
      </motion.section>

      <motion.section
        {...fadeUp}
        transition={{ duration: 0.35, delay: 0.08 }}
        className="grid grid-cols-2 gap-3"
      >
        <div className="rounded-[14px] border-[0.5px] border-border bg-surface p-4">
          <HugeiconsIcon
            icon={Wallet01Icon}
            size={22}
            className="text-primary"
          />
          <p className="mt-2 font-display text-[15px] font-semibold text-text-primary">Direct payouts</p>
          <p className="mt-1 text-xs leading-5 text-text-secondary">
            Split payments route contributions straight to the recipient.
          </p>
        </div>
        <div className="rounded-[14px] border-[0.5px] border-border bg-surface p-4">
          <HugeiconsIcon
            icon={ShieldCheckIcon}
            size={22}
            className="text-primary"
          />
          <p className="mt-2 font-display text-[15px] font-semibold text-text-primary">Trust score</p>
          <p className="mt-1 text-xs leading-5 text-text-secondary">
            On-time payments build a visible record in every circle.
          </p>
        </div>
      </motion.section>
    </main>
  );
}
