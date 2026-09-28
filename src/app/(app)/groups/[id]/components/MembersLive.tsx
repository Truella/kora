"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MembersPanel, type MemberRow } from "./TurnViews";

// Live roster: server snapshot in, realtime merges on top. Any INSERT/UPDATE
// on group_members (admission, removal) refetches the (RLS-scoped) rows —
// cheap at this size and always consistent. A reconnect after a drop
// refetches too, so missed events never leave a silent gap.
export default function MembersLive({
  groupId,
  initialRows,
}: {
  groupId: string;
  initialRows: MemberRow[];
}) {
  const [rows, setRows] = useState(initialRows);

  // A fresh server snapshot must win over state seeded at mount —
  // otherwise the list sits on stale rows until the next realtime event
  // happens to arrive.
  const [synced, setSynced] = useState(initialRows);
  if (initialRows !== synced) {
    setSynced(initialRows);
    setRows(initialRows);
  }

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/members?groupId=${encodeURIComponent(groupId)}`,
        { cache: "no-store" },
      );
      if (!res.ok) return;
      const next = (await res.json()) as { rows: MemberRow[] };
      if (mounted.current) setRows(next.rows);
    } catch {
      // Keep the stale list; the next event or navigation will retry.
    }
  }, [groupId]);

  // Debounced so the trigger's request-UPDATE + member-INSERT pair
  // collapses into one refetch instead of two back-to-back.
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const subscribedOnce = useRef(false);
  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    const notify = () => {
      if (cancelled) return;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        void refresh();
      }, 300);
    };
    const channel = supabase
      .channel(`members:${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "group_members",
          filter: `group_id=eq.${groupId}`,
        },
        notify,
      )
      .subscribe((status) => {
        if (cancelled) return;
        // First SUBSCRIBED has fresh server data; anything later is a
        // reconnect after a drop, so resync to cover missed events.
        if (status === "SUBSCRIBED") {
          if (subscribedOnce.current) notify();
          else subscribedOnce.current = true;
        }
      });
    return () => {
      cancelled = true;
      if (timer.current) clearTimeout(timer.current);
      void supabase.removeChannel(channel);
    };
  }, [groupId, refresh]);

  // Stays mounted when empty so the first admitted member appears without
  // navigation — same rule as the pending-requests wrapper.
  if (rows.length === 0) {
    return (
      <div className="rounded-[14px] border-[0.5px] border-border bg-surface p-5 text-center">
        <p className="font-display text-lg font-semibold text-text-primary">
          No members yet
        </p>
      </div>
    );
  }

  return <MembersPanel count={rows.length} rows={rows} />;
}
