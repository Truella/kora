"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Home01Icon,
  UserGroupIcon,
  Activity01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";

const TABS = [
  { href: "/home", label: "Home", icon: Home01Icon },
  { href: "/groups", label: "Circles", icon: UserGroupIcon },
  { href: "/activity", label: "Activity", icon: Activity01Icon },
  { href: "/profile", label: "Profile", icon: UserIcon },
];

// Hover spring, matched to animate-ui's radix sidebar default
// (components/animate-ui/components/radix/sidebar.tsx).
const HIGHLIGHT_SPRING = { type: "spring", stiffness: 350, damping: 35 } as const;

function isActive(pathname: string, href: string) {
  return href === "/home" ? pathname === "/home" : pathname.startsWith(href);
}

// App chrome, mounted only by the (app) route group. No client-side session
// check: proxy.ts already rejects unauthenticated requests to every route in
// this group, so a getUser() round-trip here only delayed the rail by a
// network hop — it rendered after the page, then shoved the content sideways.
// The rail now paints on the first frame, server-rendered.
export default function AppNav() {
  const pathname = usePathname();
  const [highlight, setHighlight] = useState<{ top: number; height: number } | null>(
    null,
  );
  const reduceMotion = useReducedMotion();

  // Animate UI's sidebar hover: one highlight element springs to the hovered
  // row's bounds, so moving between rows slides it rather than cross-fading.
  // The row is passed straight from the event rather than looked up by index —
  // the highlight is itself a child of the <ul>, so children[index] is off by
  // one the moment it mounts. Rows are a plain stack, so offsetTop/Height are
  // exact and avoid getBoundingClientRect layout thrash.
  function handleEnter(row: HTMLElement) {
    setHighlight({ top: row.offsetTop, height: row.offsetHeight });
  }

  return (
    <>
      <aside
        aria-label="Sections"
        className="order-1 hidden w-[224px] shrink-0 self-start py-5 lg:sticky lg:top-[var(--app-header-h)] lg:flex lg:h-[calc(100dvh-var(--app-header-h))]"
      >
        {/* w-full is load-bearing: the aside is a flex ROW (flex-col was
            dropped with the tagline), so without an explicit width this ul
            sizes to its content and the hover pill collapses to text width
            instead of spanning the rail. relative anchors the highlight. */}
        <ul
          className="relative flex w-full flex-col gap-0"
          onMouseLeave={() => setHighlight(null)}
        >
          <AnimatePresence>
            {highlight && (
              <motion.div
                key="rail-highlight"
                aria-hidden
                className="pointer-events-none absolute inset-x-0 z-0 rounded-[20px] bg-black/[0.04]"
                initial={{ top: highlight.top, height: highlight.height, opacity: 0 }}
                animate={{ top: highlight.top, height: highlight.height, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={
                  reduceMotion ? { duration: 0 } : HIGHLIGHT_SPRING
                }
              />
            )}
          </AnimatePresence>
          {TABS.map(({ href, label, icon }) => {
            const active = isActive(pathname, href);
            return (
              <li
                key={href}
                className="relative"
                onMouseEnter={(e) => handleEnter(e.currentTarget)}
              >
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-2 rounded-[20px] px-3 py-2 text-[14px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${
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

      {/* Fixed, not sticky: sticky bottom-0 only holds on screen-tall
          pages and leaves the bar floating mid-screen under short content.
          Fixed pins it to the viewport in both cases; the (app) layout
          pads page content clear of it. Hidden on desktop (sidebar rail). */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-10 order-2 border-t border-border bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
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
