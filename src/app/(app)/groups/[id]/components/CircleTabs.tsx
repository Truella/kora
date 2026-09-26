"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Home01Icon,
  Book02Icon,
  UserMultipleIcon,
} from "@hugeicons/core-free-icons";
import {
  Tabs as TabsRoot,
  TabsList as TabsListPrimitive,
  TabsTab as TabsTabPrimitive,
  TabsHighlightItem as TabsHighlightItemPrimitive,
} from "@/components/animate-ui/primitives/base/tabs";
import { Highlight as TabsHighlight } from "@/components/animate-ui/primitives/effects/highlight";

// Circle section switcher, built on the animate-ui base tabs (same
// sliding-highlight primitive family as the app's other motion chrome).
// Overview / Ledger / Members are real routes, so each tab renders a
// Next Link (prefetch + semantics for free) — the highlight follows the
// controlled `active` value each page passes in. Styling is pure Kora
// tokens: the shadcn defaults (`bg-muted`, `text-muted-foreground`, …)
// don't exist in this theme.
//
// Invite lives outside the pill as a standalone button (an action, not a
// section); the Recent activity strip stays on the overview untabbed.
const TABS = [
  {
    value: "overview",
    label: "Overview",
    icon: Home01Icon,
    href: (groupId: string) => `/groups/${groupId}`,
  },
  {
    value: "ledger",
    label: "Ledger",
    icon: Book02Icon,
    href: (groupId: string) => `/groups/${groupId}/ledger`,
  },
  {
    value: "members",
    label: "Members",
    icon: UserMultipleIcon,
    href: (groupId: string) => `/groups/${groupId}/members`,
  },
] as const;

type TabValue = (typeof TABS)[number]["value"];

export default function CircleTabs({
  groupId,
  active,
}: {
  groupId: string;
  active: TabValue;
}) {
  return (
    <TabsRoot
      value={active}
      className="w-auto min-w-0 max-w-full"
    >
      {/* Parent mode: the backdrop is measured off the active item's real
          bounds (the tabs wrapper's children mode renders a zero-size box).
          Driven by the same controlled value as the tabs root. Base UI
          marks the selected tab `data-active`, not `data-selected`. */}
      <TabsHighlight
        mode="parent"
        controlledItems
        value={active}
        containerClassName="flex w-auto max-w-full items-center gap-1 overflow-x-auto rounded-[14px] bg-surface p-1.5 shadow-[0_2px_8px_rgba(11,38,36,0.04)] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        className="rounded-[10px] bg-primary"
      >
        <TabsListPrimitive className="contents">
          {TABS.map((tab) => (
            <TabsHighlightItemPrimitive
              key={tab.value}
              value={tab.value}
              className="relative z-[1] shrink-0"
            >
              <TabsTabPrimitive
                value={tab.value}
                nativeButton={false}
                render={
                  <Link
                    href={tab.href(groupId)}
                    className="flex items-center gap-1.5 rounded-[10px] px-3 py-2 text-[13px] font-medium whitespace-nowrap text-text-secondary transition-colors data-[active=true]:text-white hover:text-text-primary data-[active=true]:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  />
                }
              >
                <HugeiconsIcon icon={tab.icon} size={16} />
                {tab.label}
              </TabsTabPrimitive>
            </TabsHighlightItemPrimitive>
          ))}
        </TabsListPrimitive>
      </TabsHighlight>
    </TabsRoot>
  );
}
