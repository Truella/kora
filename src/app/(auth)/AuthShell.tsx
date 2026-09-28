"use client";

import Image from "next/image";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import mockImg from "../../../public/images/landing/mock.webp";

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
  return (
    <main className="flex flex-1 flex-col px-4 py-6 lg:grid lg:min-h-[calc(100dvh-var(--app-header-h))] lg:grid-cols-2 lg:gap-0 lg:bg-surface lg:p-0">
      <aside className="relative hidden min-h-[480px] flex-col overflow-hidden lg:flex">
        <div className="relative z-10 p-8 pb-0">
          <Image
            src="/brand/kora-logo-primary.svg"
            alt="Kora"
            width={152}
            height={87}
            priority
            className="h-9 w-auto"
          />
        </div>
        <div className="relative flex-1">
          <Image
            src={mockImg}
            alt="Kora savings circle app preview"
            fill
            priority
            sizes="50vw"
            className="absolute inset-0 h-full w-full object-contain object-center"
          />
        </div>
      </aside>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex w-full max-w-md flex-1 flex-col justify-center lg:mx-auto lg:w-full lg:px-10 lg:py-10"
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
    </main>
  );
}
