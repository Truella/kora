import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert02Icon,
  Clock01Icon,
  UserMultipleIcon,
} from "@hugeicons/core-free-icons";
import type { HomeSnapshot } from "@/lib/home";
import InviteList from "./InviteList";

// The Next Up surface owns the first, most urgent action so the dashboard opens
// with one clear decision. This queue only exists when more work remains behind
// it; when the list is empty, the entire section disappears.
export default function Attention({ snapshot }: { snapshot: HomeSnapshot }) {
  const { attention, invites } = snapshot;
  const items = attention.slice(1);
  if (items.length === 0 && invites.length === 0) return null;

  return (
    <section
      id="attention"
      className="scroll-mt-[calc(var(--app-header-h)+1rem)] rounded-[20px] border-[0.5px] border-border bg-surface p-4 shadow-[0_12px_30px_rgba(11,38,36,0.05)] sm:p-5"
    >
      <div className="px-1 pb-3">
        <h2 className="font-display text-lg font-semibold tracking-tight text-text-primary">
          More to handle
        </h2>
        <p className="mt-1 text-xs text-text-secondary">
          Other contributions and decisions waiting for you
        </p>
      </div>

      <ul className="grid gap-2 lg:grid-cols-2">
        {items.map((item) =>
          item.kind === "money" ? (
            <li key={`${item.groupId}:${item.cycleId}`}>
              <Link
                href={item.href}
                className={`flex min-h-[76px] items-center gap-3 rounded-[14px] px-4 py-3 transition-[background-color,transform] duration-150 ease-out active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
                  item.tone === "overdue"
                    ? "bg-[#F3E1E0] hover:bg-[#EBD3D1]"
                    : "bg-[#F8EDD9] hover:bg-[#F3E5CB]"
                }`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/60 text-[#8A2A21]">
                  <HugeiconsIcon
                    icon={item.tone === "overdue" ? Alert02Icon : Clock01Icon}
                    size={17}
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-[#8A2A21]">
                    {item.tone === "overdue"
                      ? `Overdue by ${item.daysLate} day${item.daysLate === 1 ? "" : "s"}`
                      : `Due ${item.dueLabel}`}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-[#8A2A21]/75">
                    {item.groupName} · Round {item.cycleNumber}
                  </span>
                </span>
                <span className="shrink-0 font-display text-sm font-semibold tabular-nums text-[#8A2A21]">
                  {item.amountLabel}
                </span>
              </Link>
            </li>
          ) : (
            <li key={`vote:${item.groupId}`}>
              <Link
                href={item.href}
                className="flex min-h-[76px] items-center gap-3 rounded-[14px] bg-black/[0.025] px-4 py-3 transition-colors hover:bg-black/[0.045] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface active:scale-[0.99]"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E0ECE9] text-primary">
                  <HugeiconsIcon icon={UserMultipleIcon} size={17} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-text-primary">
                    {item.pendingCount} pending join
                    {item.pendingCount === 1 ? "" : "s"}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-text-secondary">
                    {item.groupName} · Your vote is needed
                  </span>
                </span>
              </Link>
            </li>
          ),
        )}
        {invites.length > 0 && <InviteList invites={invites} />}
      </ul>
    </section>
  );
}
