import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert02Icon,
  Clock01Icon,
  UserMultipleIcon,
} from "@hugeicons/core-free-icons";
import type { HomeSnapshot } from "@/lib/home";
import InviteList from "./InviteList";

// The work queue. Every row here is something the member can actually act on —
// a stalled payout is deliberately not in this list (you cannot unblock someone
// else's late payment), it lives on the circle row instead.
//
// Order is fixed by the data layer: overdue money, then money due within the
// window, then circle invites, then pending votes. Money has a deadline; an
// invite or a join request does not.
export default function Attention({ snapshot }: { snapshot: HomeSnapshot }) {
  const { attention, attentionState, invites } = snapshot;

  // Nothing owed, and no rotation started anywhere — there is no queue to show
  // and "you're all caught up" would read as a contradiction next to a circle
  // that says "waiting for schedule".
  if (attentionState === "none") return null;

  // An empty queue is not a section — no "caught up" card, no muted line.
  // The section only exists once there is something in it.
  if (attention.length === 0 && invites.length === 0) return null;

  if (attentionState === "complete") return null;

  // Money first, then invites, then votes — the data layer already orders
  // money before votes, so the queue is two filtered passes with the shared
  // invite rows between them.
  const money = attention.filter((item) => item.kind === "money");
  const votes = attention.filter((item) => item.kind === "vote");

  return (
    <section
      id="attention"
      className="flex scroll-mt-[calc(var(--app-header-h)+1rem)] flex-col gap-2 border-t border-border pt-4"
    >
      <h2 className="font-display text-base font-semibold text-text-primary">
        Needs your attention
      </h2>
      <ul className="flex flex-col gap-1.5">
        {money.map((item) => (
          <li key={`${item.groupId}:${item.cycleId}`}>
            {/* The one place a filled background earns its keep. Everything
                else on this page is type on the page background, so when a
                clay or gold block appears it means money, not decoration. */}
            <Link
              href={item.href}
              className={`flex items-start gap-3 rounded-[10px] px-4 py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${
                item.tone === "overdue"
                  ? "bg-[#F3E1E0] hover:bg-[#EBD3D1]"
                  : "bg-[#F8EDD9] hover:bg-[#F3E5CB]"
              }`}
            >
              <HugeiconsIcon
                icon={item.tone === "overdue" ? Alert02Icon : Clock01Icon}
                size={18}
                className="mt-0.5 shrink-0 text-[#8A2A21]"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#8A2A21]">
                  {item.tone === "overdue"
                    ? `Contribution overdue by ${item.daysLate} day${item.daysLate === 1 ? "" : "s"}`
                    : `Contribution due ${item.dueLabel}`}
                </p>
                <p className="truncate text-xs text-[#8A2A21]/80">
                  {item.groupName} · Cycle {item.cycleNumber}
                </p>
              </div>
              <span className="shrink-0 font-display text-sm font-semibold tabular-nums text-[#8A2A21]">
                {item.amountLabel}
              </span>
            </Link>
          </li>
        ))}
        <InviteList invites={invites} />
        {votes.map((item) => (
          <li key={`vote:${item.groupId}`}>
            {/* Votes are not money, so they get no warning tint — keeping the
                gold and clay meaning "your money" is worth more than matching
                the queue's row styling. */}
            <Link
              href={item.href}
              className="flex items-start gap-3 rounded-[10px] bg-black/[0.02] px-4 py-3 transition-colors hover:bg-black/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              <HugeiconsIcon
                icon={UserMultipleIcon}
                size={18}
                className="mt-0.5 shrink-0 text-primary"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-text-primary">
                  {item.pendingCount} pending join
                  {item.pendingCount === 1 ? "" : "s"}
                </p>
                <p className="truncate text-xs text-text-secondary">
                  {item.groupName} · waiting on your vote
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
