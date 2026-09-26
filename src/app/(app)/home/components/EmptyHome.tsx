import Link from "next/link";
import { motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  ShieldCheckIcon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons";
import type { HomeSnapshot } from "@/lib/home";

const GREETING = {
  morning: "Good morning",
  afternoon: "Good afternoon",
  evening: "Good evening",
} as const;

// Zero circles. The command centre has nothing to command, so this carries the
// onboarding copy the old placeholder home was built around — that copy was
// doing real work and should not be lost just because the page it lived on got
// replaced. A brand-surface card, not the hero: there is no money to show yet.
export default function EmptyHome({ snapshot }: { snapshot: HomeSnapshot }) {
  const { greeting, firstName } = snapshot;

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-text-primary">
          {GREETING[greeting]}
          {firstName ? `, ${firstName}` : ""}
        </h1>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-[14px] border-[0.5px] border-border bg-surface p-6"
        >
          <h2 className="font-display text-2xl font-semibold tracking-tight text-text-primary">
            Save together, without handing anyone the pot.
          </h2>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            Invite-only circles. Members vote who joins. Money moves
            member&nbsp;→&nbsp;recipient directly. The organizer never holds it.
          </p>
          <motion.div whileTap={{ scale: 0.97 }} className="mt-4 inline-flex">
            <Link
              href="/groups/new"
              className="inline-flex items-center gap-2 rounded-[10px] bg-primary px-5 py-[13px] text-sm font-semibold text-white hover:bg-primary-hover"
            >
              <HugeiconsIcon icon={Add01Icon} size={18} />
              Create your first circle
            </Link>
          </motion.div>
        </motion.div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-[14px] border-[0.5px] border-border bg-surface p-4">
          <HugeiconsIcon
            icon={Wallet01Icon}
            size={22}
            className="text-primary"
          />
          <p className="mt-2 font-display text-[15px] font-semibold text-text-primary">
            Direct payouts
          </p>
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
          <p className="mt-2 font-display text-[15px] font-semibold text-text-primary">
            Trust score
          </p>
          <p className="mt-1 text-xs leading-5 text-text-secondary">
            On-time payments build a visible record in every circle.
          </p>
        </div>
      </section>
    </div>
  );
}
