"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Menu01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";

export const CREATE_HREF = "/login?next=/groups/new";

const LINKS = [
  ["How it works", "#how-it-works"],
  ["Ledger", "#ledger"],
  ["Trust", "#trust"],
] as const;

export default function Nav({ signedIn }: { signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <nav className="sticky top-0 z-20 px-4 pt-4">
      <div className="relative mx-auto flex w-[94%] items-center justify-between gap-3 rounded-full bg-primary py-2.5 pl-5 pr-2.5 text-white shadow-[0_12px_32px_-12px_rgba(11,38,36,0.5)] md:w-[80%] lg:w-[60%]">
        <Link
          href="/"
          className="flex items-center gap-2"
          aria-label="Kora home"
        >
          <Image
            src="/brand/kora-logo-white.svg"
            alt="Kora logo"
            width={105}
            height={60}
            className="h-10 w-auto"
            priority
          />
        </Link>
        <div className="hidden items-center gap-6 text-sm font-medium text-white/80 md:flex">
          {LINKS.map(([label, href]) => (
            <Link key={href} href={href} className="hover:text-white">
              {label}
            </Link>
          ))}
        </div>
        <div className="hidden items-center gap-2 md:flex">
          {signedIn ? (
            <motion.span whileTap={{ scale: 0.97 }} className="inline-flex">
              <Link
                href="/home"
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-primary hover:bg-white/90"
              >
                Open app
              </Link>
            </motion.span>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full px-4 py-2 text-sm font-semibold text-white hover:text-white/80"
              >
                Sign in
              </Link>
              <motion.span whileTap={{ scale: 0.97 }} className="inline-flex">
                <Link
                  href={CREATE_HREF}
                  className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-primary hover:bg-white/90"
                >
                  Create a circle
                </Link>
              </motion.span>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25 md:hidden"
        >
          <HugeiconsIcon icon={open ? Cancel01Icon : Menu01Icon} size={20} />
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="absolute inset-x-0 top-full z-20 mt-2 rounded-[20px] border-[0.5px] border-border bg-surface p-3 text-text-primary shadow-[0_24px_60px_-24px_rgba(11,38,36,0.35)] md:hidden"
            >
              <div className="flex flex-col">
                {LINKS.map(([label, href]) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={close}
                    className="rounded-[10px] px-3 py-2.5 text-sm font-semibold hover:bg-black/[0.04]"
                  >
                    {label}
                  </Link>
                ))}
                <div className="my-2 border-t border-border" />
                {signedIn ? (
                  <Link
                    href="/home"
                    onClick={close}
                    className="rounded-[10px] bg-primary px-3 py-2.5 text-center text-sm font-semibold text-white hover:bg-primary-hover"
                  >
                    Open app
                  </Link>
                ) : (
                  <>
                    <Link
                      href={CREATE_HREF}
                      onClick={close}
                      className="rounded-[10px] bg-primary px-3 py-2.5 text-center text-sm font-semibold text-white hover:bg-primary-hover"
                    >
                      Create a circle
                    </Link>
                    <Link
                      href="/login"
                      onClick={close}
                      className="rounded-[10px] px-3 py-2.5 text-center text-sm font-semibold hover:bg-black/[0.04]"
                    >
                      Sign in
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
