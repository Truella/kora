import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Home01Icon,
  Book02Icon,
  UserMultipleIcon,
} from "@hugeicons/core-free-icons";

// Circle tab bar — the old 4-tile quick-action grid merged into the header
// as a section switcher: Overview / Ledger / Members in one borderless
// pill, the current view in primary teal. Invite lives outside the pill as
// a standalone button (it is an action, not a section); the Recent activity
// strip stays on the overview with no tab pointing at it.
export default function CircleTabs({
  groupId,
  active,
}: {
  groupId: string;
  active: "overview" | "ledger" | "members";
}) {
  const base =
    "flex shrink-0 items-center gap-1.5 rounded-[10px] px-3 py-2 text-[13px] whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
  const activeCls = "bg-primary font-semibold text-white";
  const idleCls =
    "font-medium text-text-secondary hover:bg-black/[0.04] hover:text-text-primary";

  return (
    <nav
      aria-label="Circle sections"
      className="flex w-auto min-w-0 max-w-full items-center gap-1 overflow-x-auto rounded-[14px] bg-surface p-1.5 shadow-[0_2px_8px_rgba(11,38,36,0.04)] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <Link
        href={`/groups/${groupId}`}
        aria-current={active === "overview" ? "page" : undefined}
        className={`${base} ${active === "overview" ? activeCls : idleCls}`}
      >
        <HugeiconsIcon icon={Home01Icon} size={16} />
        Overview
      </Link>
      <Link
        href={`/groups/${groupId}/ledger`}
        aria-current={active === "ledger" ? "page" : undefined}
        className={`${base} ${active === "ledger" ? activeCls : idleCls}`}
      >
        <HugeiconsIcon icon={Book02Icon} size={16} />
        Ledger
      </Link>
      <Link
        href={`/groups/${groupId}/members`}
        aria-current={active === "members" ? "page" : undefined}
        className={`${base} ${active === "members" ? activeCls : idleCls}`}
      >
        <HugeiconsIcon icon={UserMultipleIcon} size={16} />
        Members
      </Link>
    </nav>
  );
}
