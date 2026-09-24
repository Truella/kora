"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLedgerLive } from "@/lib/use-ledger-live";
import type { HomeSnapshot } from "@/lib/home";
import Summary from "./Summary";
import Attention from "./Attention";
import CircleList from "./CircleList";
import QuickActions from "./QuickActions";
import ActivityStrip from "./ActivityStrip";
import EmptyHome from "./EmptyHome";

// Home owns the snapshot as state so a realtime event can swap every figure at
// once. The section components hold no state and no server-only imports, so
// they compile into this client graph unchanged — and because client
// components are still server-rendered, the HTML arrives complete and this
// only costs hydration, not first paint.
export default function HomeLive({ initial }: { initial: HomeSnapshot }) {
  const [snapshot, setSnapshot] = useState(initial);
  // A fresh server snapshot (router.refresh() after a payment return) must
  // win over state seeded at mount. Adjusting during render rather than in an
  // effect is the sanctioned pattern for "props changed, state should follow"
  // — and it avoids painting one frame of the stale snapshot first.
  const [synced, setSynced] = useState(initial);
  if (initial !== synced) {
    setSynced(initial);
    setSnapshot(initial);
  }
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  const refetch = useCallback(async () => {
    try {
      const res = await fetch("/api/home", { cache: "no-store" });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) return;
      setSnapshot((await res.json()) as HomeSnapshot);
    } catch {
      // Keep the stale snapshot — the next event or navigation will retry.
    }
  }, [router]);

  // Debounced: a single payment can land as several row changes in a couple
  // of hundred milliseconds, and each one would otherwise be a full snapshot
  // round trip.
  const onEvent = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void refetch();
    }, 300);
  }, [refetch]);

  useLedgerLive("home", onEvent);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  if (snapshot.circlesTotal === 0) {
    return (
      <main className="flex flex-1 flex-col px-4 py-6">
        <EmptyHome snapshot={snapshot} />
        <div className="mt-6">
          <QuickActions />
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-6">
      <Summary snapshot={snapshot} />
      <Attention snapshot={snapshot} />
      <CircleList snapshot={snapshot} />
      <ActivityStrip snapshot={snapshot} />
      {/* Last, because it is a footer rather than a section — the hairline above
          it closes the page instead of introducing another block. */}
      <QuickActions />
    </main>
  );
}
