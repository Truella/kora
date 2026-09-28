"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import Reveal from "@/components/Reveal";

export default function CtaSection({ createHref }: { createHref: string }) {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 pb-14">
      <Reveal>
          <div className="relative overflow-hidden rounded-[20px] bg-[radial-gradient(circle_at_88%_8%,rgba(191,154,78,0.26),transparent_34%),linear-gradient(135deg,#0B2624_0%,#14524F_125%)] px-6 py-12 text-center shadow-[0_18px_42px_rgba(11,38,36,0.16)]">
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
    </section>
  );
}
