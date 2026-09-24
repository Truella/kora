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
} from "@hugeicons/core-free-icons";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const TABS = [
  { href: "/home", label: "Home", icon: Home01Icon },
  { href: "/groups", label: "Circles", icon: UserGroupIcon },
  { href: "/activity", label: "Activity", icon: Activity01Icon },
  { href: "/profile", label: "Profile", icon: UserIcon },
];

function isActive(pathname: string, href: string) {
  return href === "/home" ? pathname === "/home" : pathname.startsWith(href);
}

// Session-aware app chrome, mounted only by the (app) route group — the
// landing, auth and error routes are outside it, so no route guard is
// needed here any more. Mobile gets the bottom tab bar; large screens get a
// left rail. The rail follows a flat reference: no row backgrounds and no CTA
// — every glyph sits in its own disc, neutral when idle, petrol when active.
export default function AppNav() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setUser(data.user));
  }, [pathname]);

  if (user === undefined) return null; // session resolving — no flash

  return (
    <>
      <aside
        aria-label="Sections"
        className="order-1 hidden w-[224px] shrink-0 self-start py-5 lg:sticky lg:top-[var(--app-header-h)] lg:flex lg:h-[calc(100dvh-var(--app-header-h))]"
      >
        {/* w-full is load-bearing: the aside is a flex ROW (flex-col was
            dropped with the tagline), so without an explicit width this ul
            sizes to its content and the hover pill collapses to text width
            instead of spanning the rail. */}
        <ul className="flex w-full flex-col gap-0">
          {TABS.map(({ href, label, icon }) => {
            const active = isActive(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-2 rounded-[20px] px-3 py-2 text-[14px] transition-colors hover:bg-black/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${
                    active
                      ? "font-semibold text-text-primary"
                      : "font-medium text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {/* Every glyph sits in the same 40px disc so labels align
                      and each row has room to breathe. Idle discs carry a
                      neutral wash; only the active disc brings in colour. */}
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      active
                        ? "bg-primary text-white"
                        : "bg-black/[0.04] text-text-secondary"
                    }`}
                  >
                    <HugeiconsIcon
                      icon={icon}
                      size={18}
                      strokeWidth={active ? 2.2 : 1.8}
                    />
                  </span>
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </aside>

      <nav
        aria-label="Primary"
        className="sticky bottom-0 z-10 order-2 border-t border-border bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
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
                    active ? "text-text-primary" : "text-text-secondary"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-active-pill"
                      className="absolute -top-px h-0.5 w-10 rounded-full bg-primary"
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
