"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { createClient } from "@/lib/supabase/client";
import type { HomeCircle, HomeSnapshot } from "@/lib/home";
import { countLine, sortCircles } from "@/lib/circles";
import { CircleRow } from "./CircleRow";
import { GroupsEmpty } from "./GroupsEmpty";

// Live directory: server snapshot in, realtime merges on top. A new
// membership (my own admission included), a status flip, or a decided join
// request refetches the (RLS-scoped, uncapped) snapshot — so an admitted
// applicant sees the circle appear without navigating. A reconnect after a
// drop refetches too, so missed events never leave a silent gap.
export default function GroupsLive({
  initialCircles,
}: {
  initialCircles: HomeCircle[];
}) {
  const [circles, setCircles] = useState(() => sortCircles(initialCircles));

  // A fresh server snapshot must win over state seeded at mount —
  // otherwise the list sits on stale rows until the next realtime event
  // happens to arrive.
  const [synced, setSynced] = useState(initialCircles);
  if (initialCircles !== synced) {
    setSynced(initialCircles);
    setCircles(sortCircles(initialCircles));
  }

  const router = useRouter();
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/circles", { cache: "no-store" });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) return;
      const next = (await res.json()) as HomeSnapshot;
      if (mounted.current) setCircles(sortCircles(next.circles));
    } catch {
      // Keep the stale list; the next event or navigation will retry.
    }
  }, [router]);

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
    // group_members carries no useful per-circle filter for the directory
    // (my own admission arrives as someone else's circle), and RLS already
    // scopes every event to rows I can select — same tradeoff LedgerFeed
    // makes on the money tables.
    const channel = supabase
      .channel("circles")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "group_members" },
        notify,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "groups" },
        notify,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "join_requests" },
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
  }, [refresh]);

  // Stays mounted when empty so the first circle appears without
  // navigation — same rule as the other live wrappers.
  if (circles.length === 0) {
    return <GroupsEmpty />;
  }

  const counts = countLine(circles);

  return (
    <main className="mx-auto flex w-full max-w-[760px] flex-1 flex-col gap-4 px-4 py-6 sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-text-primary">
            Your circles
          </h1>
          {counts && (
            <p className="mt-1 text-xs text-text-secondary">{counts}</p>
          )}
        </div>
        <Link
          href="/groups/new"
          aria-label="Create a circle"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white hover:bg-primary-hover"
        >
          <HugeiconsIcon icon={Add01Icon} size={20} />
        </Link>
      </div>
      <ul className="flex flex-col gap-4">
        {circles.map((circle, i) => (
          <CircleRow key={circle.groupId} circle={circle} index={i} />
        ))}
      </ul>
    </main>
  );
}
