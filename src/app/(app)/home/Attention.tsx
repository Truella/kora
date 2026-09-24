import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert02Icon,
  CheckmarkCircle01Icon,
  Clock01Icon,
  UserMultipleIcon,
} from "@hugeicons/core-free-icons";
import type { HomeSnapshot } from "@/lib/home";

// The work queue. Every row here is something the member can actually act on —
// a stalled payout is deliberately not in this list (you cannot unblock
// someone else's late payment), it lives on the circle card instead.
//
// Order is fixed by the data layer: overdue money, then money due within the
// window, then pending votes. Money has a deadline; a join request does not.
export default function Attention({ snapshot }: { snapshot: HomeSnapshot }) {
  const { attention, attentionState, nextDueLabel } = snapshot;

  // Nothing owed, and no rotation started anywhere — there is no queue to show
  // and "you're all caught up" would read as a contradiction next to a circle
  // card that says "waiting for schedule".
  if (attentionState === "none") return null;

  if (attentionState === "complete") {
    return (
      <section id="attention" className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold text-text-primary">
          Needs your attention
        </h2>
        {/* A finished rotation is the best possible state, so it gets words
            rather than vanishing into an empty shell. */}
        <div className="flex items-center gap-3 rounded-[10px] border-[0.5px] border-border bg-surface px-4 py-3">
          <HugeiconsIcon
            icon={CheckmarkCircle01Icon}
            size={18}
            className="shrink-0 text-success"
          />
          <p className="text-sm text-text-primary">
            You&apos;re all caught up. This rotation is complete.
          </p>
        </div>
      </section>
    );
  }

  if (attention.length === 0) {
    return (
      <section id="attention" className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold text-text-primary">
          Needs your attention
        </h2>
        {/* The forward-looking date survives here, and only here — the summary
            deliberately does not repeat it. */}
        <div className="flex items-center gap-3 rounded-[10px] border-[0.5px] border-border bg-surface px-4 py-3">
          <HugeiconsIcon
            icon={CheckmarkCircle01Icon}
            size={18}
            className="shrink-0 text-success"
          />
          <p className="text-sm text-text-primary">
            You&apos;re all caught up
            {nextDueLabel ? ` — next contribution ${nextDueLabel}` : "."}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="attention" className="flex flex-col gap-3">
      <h2 className="font-display text-lg font-semibold text-text-primary">
        Needs your attention
      </h2>
      <ul className="flex flex-col gap-2">
        {attention.map((item) =>
          item.kind === "money" ? (
            <li key={`${item.groupId}:${item.cycleId}`}>
              <Link
                href={item.href}
                className={`flex items-start gap-3 rounded-[10px] px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${
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
          ) : (
            <li key={`vote:${item.groupId}`}>
              {/* Votes are not money and get no warning tint — a neutral row
                  keeps the tints above meaning "your money". */}
              <Link
                href={item.href}
                className="flex items-start gap-3 rounded-[10px] border-[0.5px] border-border bg-surface px-4 py-3 hover:bg-black/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
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
          ),
        )}
      </ul>
    </section>
  );
}
