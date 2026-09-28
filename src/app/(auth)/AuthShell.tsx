"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import ledgerImg from "../../../public/images/landing/ledger_lg.webp";
import homeImg from "../../../public/images/landing/home_lg.webp";

const CYCLING_WORDS = ["transparent", "effortless", "trusted"];

export default function AuthShell({
  kicker,
  title,
  intro,
  children,
}: {
  kicker: string;
  title: string;
  intro?: ReactNode;
  children: ReactNode;
}) {
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % CYCLING_WORDS.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="flex w-full flex-1 flex-col lg:grid lg:min-h-0 lg:grid-cols-2">
      {/* Mobile-only hero: ledger art across the top third (desktop uses
          the aside panel below instead). The form sheet overlaps its bottom. */}
      <div className="relative h-[36svh] min-h-[300px] w-full overflow-hidden bg-bg lg:hidden">
        <div className="absolute -left-10 top-0 h-full w-[125%] max-w-none [transform:perspective(600px)_rotateX(40deg)]">
          <Image
            src={homeImg}
            alt="Kora home preview"
            priority
            sizes="100vw"
            className="h-full w-full object-contain object-bottom"
          />
        </div>
      </div>

      {/* Left side shell (desktop only) */}
      <aside className="relative hidden min-h-[580px] w-full flex-col justify-between overflow-hidden bg-bg p-8 pb-0 lg:flex">
        {/* Top section: Logo + Animated Headline */}
        <div className="relative z-10 flex flex-col pt-2">
          <Link href="/" aria-label="Kora home" className="self-start">
            <Image
              src="/brand/kora-logo-primary.svg"
              alt="Kora"
              width={152}
              height={87}
              priority
              className="h-9 w-auto"
            />
          </Link>

          <div className="mt-24 max-w-lg">
            <h2 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight text-text-primary">
              Savings circles made{" "}
              <span className="inline-block relative min-w-[300px] text-primary">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={CYCLING_WORDS[wordIndex]}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.35, ease: "easeInOut" }}
                    className="absolute left-0 top-0 text-primary font-semibold"
                  >
                    {CYCLING_WORDS[wordIndex]}.
                  </motion.span>
                </AnimatePresence>
                {/* Spacer to hold width during animation */}
                <span className="invisible font-semibold">transparent.</span>
              </span>
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-text-secondary">
              Track contributions, payouts, and trust scores in real time with your circle.
            </p>
          </div>
        </div>

        {/* Bottom section: Ledger image shifted left so it cuts off on the left edge */}
        <div className="relative mt-8 h-100 w-full overflow-visible">
          <div className="absolute -left-20 bottom-0 top-0 w-[130%] max-w-none">
            <Image
              src={ledgerImg}
              alt="Kora ledger preview"
              priority
              sizes="60vw"
              className="h-full w-full object-contain object-bottom-left drop-shadow-xs"
            />
          </div>
        </div>
      </aside>

      {/* Form sheet: white card overlapping the mobile hero; plain right
          column on desktop */}
      <div className="relative z-10 -mt-16 flex w-full flex-1 flex-col justify-center rounded-t-[28px] bg-surface px-4 py-6 lg:z-auto lg:mt-0 lg:rounded-none lg:px-10 lg:py-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mx-auto flex w-full max-w-md flex-1 flex-col justify-start lg:justify-center"
        >
          {/* Mobile-only logo: the split panel is desktop-only, so the logo
              lives in the form flow on phones — centered, just above the copy. */}
          <Link href="/" aria-label="Kora home" className="mb-6 self-center lg:hidden">
            <Image
              src="/brand/kora-logo-primary.svg"
              alt="Kora"
              width={152}
              height={87}
              priority
              className="h-11 w-auto"
            />
          </Link>
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
      </div>
    </main>
  );
}
