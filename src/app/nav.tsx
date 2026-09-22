"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Home01Icon,
  UserGroupIcon,
  Activity01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";

const TABS = [
  { href: "/", label: "Home", icon: Home01Icon },
  { href: "/groups", label: "Circles", icon: UserGroupIcon },
  { href: "/activity", label: "Activity", icon: Activity01Icon },
  { href: "/profile", label: "Profile", icon: UserIcon },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Primary"
      className="sticky bottom-0 z-10 border-t border-black/10 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-white/10 dark:bg-ink/95"
    >
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {TABS.map(({ href, label, icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                  active
                    ? "text-indigo dark:text-gold"
                    : "text-zinc-500 dark:text-zinc-400"
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
  );
}
