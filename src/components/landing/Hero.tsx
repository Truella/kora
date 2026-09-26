"use client";

import Link from "next/link";
import { motion } from "motion/react";
import Reveal from "@/app/Reveal";

export default function Hero({ createHref }: { createHref: string }) {
  return (
    <header className="mx-auto flex w-full max-w-5xl flex-col items-center px-4 pb-14 pt-10 text-center lg:pt-16">
      <Reveal className="flex flex-col items-center">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-text-secondary">
          Digital ajo · esusu · chama
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-text-primary lg:text-6xl">
          <span className="block">Save together.</span>
          <span className="block">Keep everyone in the loop.</span>
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-text-secondary">
          A digital savings circle for people who already trust each other. Set
          your contribution schedule, keep every payment visible, and let the
          group decide who joins.
        </p>
        <div className="mt-6 flex w-full flex-col items-center gap-3 lg:w-auto lg:flex-row lg:justify-center">
          <Link
            href="#how-it-works"
            className="w-full rounded-full border border-primary bg-transparent px-8 py-[13px] text-center text-sm font-semibold text-primary transition-colors delay-300 hover:bg-primary hover:text-white lg:w-auto"
          >
            See how it works
          </Link>
          <motion.span
            whileTap={{ scale: 0.97 }}
            className="inline-flex w-full lg:w-auto"
          >
            <Link
              href={createHref}
              className="w-full rounded-full bg-primary px-8 py-[13px] text-center text-sm font-semibold text-white transition-colors delay-300 hover:bg-primary-hover lg:w-auto"
            >
              Create a circle
            </Link>
          </motion.span>
        </div>
      </Reveal>
    </header>
  );
}
