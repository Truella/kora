"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import ledgerImg from "../../../public/images/landing/ledger_lg.webp";

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
      {/* Left side shell */}
      <aside className="relative hidden min-h-[580px] w-full flex-col justify-between overflow-hidden bg-bg p-8 pb-0 lg:flex">
        {/* Top section: Logo + Animated Headline */}
        <div className="relative z-10 flex flex-col pt-2">
          <Image
            src="/brand/kora-logo-primary.svg"
            alt="Kora"
            width={152}
            height={87}
            priority
            className="h-9 w-auto"
          />

          <div className="mt-12 max-w-md">
            <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight text-text-primary">
              Savings circles made{" "}
              <span className="inline-block relative min-w-[170px] text-accent">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={CYCLING_WORDS[wordIndex]}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.35, ease: "easeInOut" }}
                    className="absolute left-0 top-0 text-accent font-semibold"
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
        <div className="relative mt-8 h-[400px] w-full overflow-visible">
          <div className="absolute -left-20 bottom-0 top-0 w-[130%] max-w-none">
            <Image
              src={ledgerImg}
              alt="Kora ledger preview"
              priority
              sizes="60vw"
              className="h-full w-full object-contain object-left-bottom drop-shadow-xs"
            />
          </div>
        </div>
      </aside>

      {/* Right side form column */}
      <div className="flex w-full flex-1 flex-col justify-center px-4 py-6 lg:bg-surface lg:px-10 lg:py-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center"
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
      </div>
    </main>
  );
}
