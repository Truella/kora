"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Home01Icon,
  UserGroupIcon,
  Activity01Icon,
  UserIcon,
  Add01Icon,
} from "@hugeicons/core-free-icons";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const TABS = [
  { href: "/", label: "Home", icon: Home01Icon },
  { href: "/groups", label: "Circles", icon: UserGroupIcon },
  { href: "/activity", label: "Activity", icon: Activity01Icon },
  { href: "/profile", label: "Profile", icon: UserIcon },
];

// Chrome-free routes: auth/landing/offline bring their own layout.
const BARE_PREFIXES = [
  "/login",
  "/verify",
  "/onboarding",
  "/add-phone",
  "/offline",
  "/auth/",
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

// Session-aware app chrome. Mobile gets the bottom tab bar (the current
// design, kept); large screens get a left sidebar. Hidden on auth routes
// and on the guest landing page (which ships its own external nav).
export default function AppNav() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setUser(data.user));
  }, [pathname]);

  if (BARE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return null;
  }
  if (user === undefined) return null; // session resolving — no flash
  if (!user && pathname === "/") return null; // guest landing

  return (
    <>
      <aside className="order-1 hidden w-64 shrink-0 flex-col gap-1 self-start py-6 lg:sticky lg:top-0 lg:flex lg:h-dvh">
        <p className="px-3 pb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo/50">
          Menu
        </p>
        {TABS.map(({ href, label, icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                active
                  ? "bg-indigo text-paper"
                  : "text-indigo/60 hover:bg-indigo/5 hover:text-indigo"
              }`}
            >
              <HugeiconsIcon icon={icon} size={20} />
              {label}
            </Link>
          );
        })}
        <motion.span whileTap={{ scale: 0.97 }} className="mt-3 inline-flex">
          <Link
            href="/groups/new"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-indigo px-4 py-2.5 text-sm font-semibold text-paper hover:bg-indigo-hover"
          >
            <HugeiconsIcon icon={Add01Icon} size={18} />
            Create a circle
          </Link>
        </motion.span>
        <p className="mt-auto px-3 pt-6 text-xs leading-5 text-indigo/50">
          The organizer sets the schedule — never holds the money.
        </p>
      </aside>

      <nav
        aria-label="Primary"
        className="sticky bottom-0 z-10 order-2 border-t border-indigo/10 bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        <ul className="mx-auto grid max-w-md grid-cols-4">
          {TABS.map(({ href, label, icon }) => {
            const active = isActive(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                    active ? "text-indigo" : "text-indigo/60"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-active-pill"
                      className="absolute -top-px h-0.5 w-10 rounded-full bg-gold"
                      transition={{ type: "spring", stiffness: 500, damping: 40 }}
                    />
                  )}
                  <HugeiconsIcon
                    icon={icon}
                    size={22}
                    strokeWidth={active ? 2 : 1.8}
                  />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
