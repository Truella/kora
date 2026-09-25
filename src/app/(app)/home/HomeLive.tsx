"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLedgerLive } from "@/lib/use-ledger-live";
import type { HomeSnapshot } from "@/lib/home";
import Summary from "./Summary";
import NextUp from "./NextUp";
import Attention from "./Attention";
import CircleList from "./CircleList";
import ActivityStrip from "./ActivityStrip";
import ProgressPanel from "./ProgressPanel";
import HomeActions from "./HomeActions";
import HomeEmptyState from "./HomeEmptyState";

const GREETING = {
  morning: "Good morning",
  afternoon: "Good afternoon",
  evening: "Good evening",
} as const;

// Home owns the snapshot as state so a realtime event can swap every figure at
// once. The section components hold no state and no server-only imports, so
// they compile into this client graph unchanged — and because client components
// are still server-rendered, the HTML arrives complete.
export default function HomeLive({ initial }: { initial: HomeSnapshot }) {
  const [snapshot, setSnapshot] = useState(initial);
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
    return <HomeEmptyState snapshot={snapshot} />;
  }

  const hasBottomPanel =
    snapshot.activity.length > 0 || snapshot.paymentProgress.settledCount > 0;

  return (
    <main className="flex w-full flex-1 flex-col gap-8 px-4 pt-6 sm:px-6 lg:px-0 lg:pb-10 lg:pt-8 xl:gap-10">
      <header className="flex flex-col items-start gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-text-primary lg:text-3xl">
            {GREETING[snapshot.greeting]}
            {snapshot.firstName ? `, ${snapshot.firstName}` : ""}
          </h1>
        </div>
        <HomeActions />
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(270px,0.8fr)]">
        <Summary snapshot={snapshot} />
        <NextUp snapshot={snapshot} />
      </div>

      <Attention snapshot={snapshot} />
      <CircleList snapshot={snapshot} />

      {hasBottomPanel && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(270px,0.75fr)]">
          <ActivityStrip snapshot={snapshot} />
          {snapshot.paymentProgress.settledCount > 0 && (
            <div
              className={
                snapshot.activity.length === 0
                  ? "lg:col-span-2 lg:max-w-[420px] lg:justify-self-end"
                  : ""
              }
            >
              <ProgressPanel snapshot={snapshot} />
            </div>
          )}
        </div>
      )}
    </main>
  );
}
