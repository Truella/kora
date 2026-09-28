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
    </section>
  );
}
