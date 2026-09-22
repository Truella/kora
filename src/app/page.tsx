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

export default function Home() {
  return (
    <main className="flex flex-1 flex-col gap-4 px-4 py-6">
      <motion.section
        {...fadeUp}
        transition={{ duration: 0.35 }}
        className="rounded-2xl bg-[#0B3D2E] p-5 text-white"
      >
        <p className="text-sm text-white/60">Welcome to Kora</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Save together, without handing anyone the pot.
        </h1>
        <p className="mt-2 text-sm leading-6 text-white/70">
          Invite-only circles. Members vote who joins. Money moves
          member&nbsp;→&nbsp;recipient directly — the organizer never holds it.
        </p>
        <motion.div whileTap={{ scale: 0.97 }}>
          <Link
            href="/groups"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#E8B84B] px-5 py-2.5 text-sm font-semibold text-[#0B3D2E]"
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
        <div className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-950">
          <HugeiconsIcon
            icon={Wallet01Icon}
            size={22}
            className="text-[#0B3D2E] dark:text-[#E8B84B]"
          />
          <p className="mt-2 text-sm font-semibold">Direct payouts</p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            Split payments route contributions straight to the recipient.
          </p>
        </div>
        <div className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-950">
          <HugeiconsIcon
            icon={ShieldCheckIcon}
            size={22}
            className="text-[#0B3D2E] dark:text-[#E8B84B]"
          />
          <p className="mt-2 text-sm font-semibold">Trust score</p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            On-time payments build a visible record in every circle.
          </p>
        </div>
      </motion.section>
    </main>
  );
}
