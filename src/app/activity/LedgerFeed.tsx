"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Activity01Icon } from "@hugeicons/core-free-icons";
import { createClient } from "@/lib/supabase/client";
import { getLedgerEvents, type LedgerEvent } from "@/lib/ledger";

const BADGE: Record<string, string> = {
  pending: "bg-gold/15 text-ink dark:text-white",
  paid: "bg-jade/15 text-jade",
  completed: "bg-jade/15 text-jade",
  late: "bg-clay/15 text-clay",
  failed: "bg-clay/15 text-clay",
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
  const [live, setLive] = useState(false);
  const subscribedOnce = useRef(false);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function refresh() {
      try {
        const next = await getLedgerEvents(supabase, groupId);
        if (!cancelled) {
          setDue(next.due);
          setHistory(next.history);
        }
      } catch (err) {
        // Keep the stale list; the live dot shows the connection state.
        console.error("ledger refresh failed", err);
      }
    }

    const channel = supabase
      .channel(`ledger:${groupId ?? "all"}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contributions" },
        () => {
          void refresh();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "payouts" },
        () => {
          void refresh();
        },
      )
      .on(
        // Cycle rows carry the due dates the Due-now section orders by —
        // without this a rescheduled cycle never refreshes the feed.
        "postgres_changes",
        { event: "*", schema: "public", table: "cycles" },
        () => {
          void refresh();
        },
      )
      .subscribe((status) => {
        if (cancelled) return;
        if (status === "SUBSCRIBED") {
          setLive(true);
          // First SUBSCRIBED has fresh server data; anything later is a
          // reconnect after a drop, so resync to cover missed events.
          if (subscribedOnce.current) void refresh();
          else subscribedOnce.current = true;
        } else if (
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT" ||
          status === "CLOSED"
        ) {
          setLive(false);
        }
      });

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [groupId]);

  const shownDue =
    previewCount !== undefined ? due.slice(0, previewCount) : due;
  const shownHistory =
    previewCount !== undefined ? history.slice(0, previewCount) : history;
  const empty = due.length === 0 && history.length === 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full ${live ? "bg-jade" : "bg-zinc-400"}`}
        />
        <p className="text-xs text-zinc-500">
          {live ? "Live" : "Connecting…"}
        </p>
      </div>

      {empty ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-black/10 bg-white px-8 py-12 text-center dark:border-white/10 dark:bg-ink">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo/10 dark:bg-white/10">
            <HugeiconsIcon
              icon={Activity01Icon}
              size={26}
              className="text-indigo dark:text-gold"
            />
          </span>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink dark:text-white">
            Nothing yet
          </h1>
          <p className="max-w-xs text-sm leading-6 text-zinc-500">
            Contributions and payouts will stream in here once your circles
            are active.
          </p>
        </div>
      ) : (
        <>
          {shownDue.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2 className="font-display text-lg font-semibold text-ink dark:text-white">
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
              <h2 className="font-display text-lg font-semibold text-ink dark:text-white">
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
                    className="text-sm font-medium text-indigo dark:text-gold"
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
    <li className="flex items-center justify-between gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3 dark:border-white/10 dark:bg-ink">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-ink dark:text-white">
          {event.actor}{" "}
          <span className="font-normal text-zinc-500">
            · {event.kind === "payout" ? "receives" : "owes"} {event.amountLabel}{" "}
            {event.currency}
          </span>
        </p>
        <p className="truncate font-mono text-xs text-zinc-500">
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
