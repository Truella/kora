"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Activity01Icon } from "@hugeicons/core-free-icons";
import { createClient } from "@/lib/supabase/client";
import { getLedgerEvents, type LedgerEvent } from "@/lib/ledger";
import { useLedgerLive } from "@/lib/use-ledger-live";

const BADGE: Record<string, string> = {
  pending: "bg-[#F8EDD9] text-[#8A5F14]",
  paid: "bg-[#E0ECE9] text-[#1E5A4E]",
  completed: "bg-[#E0ECE9] text-[#1E5A4E]",
  late: "bg-[#F3E1E0] text-[#8A2A21]",
  failed: "bg-[#F3E1E0] text-[#8A2A21]",
};

// Live ledger: server snapshot in, realtime merges on top. Any INSERT or
// UPDATE on contributions/payouts refetches the (RLS-scoped, capped)
// snapshot — cheap at this size and always consistent. A reconnect after
// a drop refetches too, so missed events never leave a silent gap.
export default function LedgerFeed({
  initialDue,
  initialHistory,
  groupId,
  previewCount,
}: {
  initialDue: LedgerEvent[];
  initialHistory: LedgerEvent[];
  groupId?: string;
  previewCount?: number;
}) {
  const [due, setDue] = useState(initialDue);
  const [history, setHistory] = useState(initialHistory);

  // A fresh server snapshot (router.refresh() after a payment return, say)
  // must win over state seeded at mount — otherwise the feed sits on stale
  // rows until the next realtime event happens to arrive. Adjusting during
  // render rather than in an effect is the sanctioned pattern here and avoids
  // painting one frame of the stale list first.
  const [synced, setSynced] = useState({ due: initialDue, history: initialHistory });
  if (initialDue !== synced.due || initialHistory !== synced.history) {
    setSynced({ due: initialDue, history: initialHistory });
    setDue(initialDue);
    setHistory(initialHistory);
  }

  // The subscription itself now lives in useLedgerLive, shared with /home.
  // This mounted ref replaces the old closure-local `cancelled` flag so a
  // refetch still in flight cannot setState after unmount.
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    try {
      const next = await getLedgerEvents(createClient(), groupId);
      if (mounted.current) {
        setDue(next.due);
        setHistory(next.history);
      }
    } catch (err) {
      // Keep the stale list; the live dot shows the connection state.
      console.error("ledger refresh failed", err);
    }
  }, [groupId]);

  const live = useLedgerLive(`ledger:${groupId ?? "all"}`, () => {
    void refresh();
  });

  const shownDue =
    previewCount !== undefined ? due.slice(0, previewCount) : due;
  const shownHistory =
    previewCount !== undefined ? history.slice(0, previewCount) : history;
  const empty = due.length === 0 && history.length === 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full ${live ? "bg-success" : "bg-text-secondary"}`}
        />
        <p className="font-mono text-xs text-text-secondary">
          {live ? "Live" : "Connecting…"}
        </p>
      </div>

      {empty ? (
        <div className="flex flex-col items-center gap-3 rounded-[14px] border-[0.5px] border-border bg-surface px-8 py-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-[14px] bg-primary/10">
            <HugeiconsIcon
              icon={Activity01Icon}
              size={26}
              className="text-primary"
            />
          </span>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-text-primary">
            Nothing yet
          </h1>
          <p className="max-w-xs text-sm leading-6 text-text-secondary">
            Contributions and payouts will stream in here once your circles
            are active.
          </p>
        </div>
      ) : (
        <>
          {shownDue.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2 className="font-display text-lg font-semibold text-text-primary">
                Due now
              </h2>
              <ul className="flex flex-col gap-2">
                {shownDue.map((e) => (
                  <LedgerRow key={e.id} event={e} showGroup={!groupId} />
                ))}
              </ul>
            </section>
          )}

          {shownHistory.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2 className="font-display text-lg font-semibold text-text-primary">
                History
              </h2>
              <ul className="flex flex-col gap-2">
                {shownHistory.map((e) => (
                  <LedgerRow key={e.id} event={e} showGroup={!groupId} />
                ))}
              </ul>
              {previewCount !== undefined &&
                (history.length > previewCount ||
                  due.length > previewCount) && (
                  <Link
                    href="/activity"
                    className="text-sm font-semibold text-text-primary"
                  >
                    View all activity
                  </Link>
                )}
            </section>
          )}
        </>
      )}
    </div>
  );
}

function LedgerRow({
  event,
  showGroup,
}: {
  event: LedgerEvent;
  showGroup: boolean;
}) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-[10px] border-[0.5px] border-border bg-surface px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-text-primary">
          {event.actor}{""}
          <span className="font-display font-semibold tabular-nums">
            · {event.kind === "payout" ? "receives" : "owes"} {event.amountLabel}{""}
            {event.currency}
          </span>
        </p>
        <p className="truncate font-mono text-xs text-text-secondary">
          {showGroup ? `${event.groupName} · ` : ""}
          {event.detail}
        </p>
      </div>
      <span
        className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold capitalize ${BADGE[event.status] ?? BADGE.pending}`}
      >
        {event.status}
      </span>
    </li>
  );
}
