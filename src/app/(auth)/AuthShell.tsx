"use client";

import Image from "next/image";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import authImg from "../../../public/images/auth/auth.png";

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
    <main className="flex w-full flex-1 flex-col lg:grid lg:min-h-0 lg:grid-cols-2">
      <aside className="relative hidden min-h-[560px] w-full flex-col overflow-hidden lg:flex">
        <div className="relative z-10 mx-auto w-full max-w-xl p-8 pb-0">
          <Image
            src="/brand/kora-logo-primary.svg"
            alt="Kora"
            width={152}
            height={87}
            priority
            className="h-9 w-auto"
          />
        </div>
        <div className="relative mx-auto flex w-full max-w-xl flex-1 p-6">
          <Image
            src={authImg}
            alt="Kora savings circle app preview"
            fill
            priority
            sizes="70vw"
            className="h-full w-full object-cover object-center scale-105"
          />
        </div>
      </aside>

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
