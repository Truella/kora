import { createClient } from "@/lib/supabase/server";
import { getHomeSnapshot } from "@/lib/home";
import GroupsLive from "./components/GroupsLive";

export const metadata = { title: "Circles" };

export default async function GroupsPage() {
  const supabase = await createClient();
  // The full HomeCircle model (R1-aware dues, payout resolution, relative
  // dates) rather than a second derivation that could disagree with home.
  let snapshot;
  try {
    snapshot = await getHomeSnapshot(supabase, {
      circleLimit: Number.POSITIVE_INFINITY,
    });
  } catch (err) {
    console.error("circles directory failed", err);
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-3 px-8 py-12 text-center">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-text-primary">
          Could not load your circles
        </h1>
        <p className="max-w-xs text-sm leading-6 text-text-secondary">
          Something went wrong reading your circles. Refresh to try again.
        </p>
      </main>
    );
  }

  // Snapshot for the first paint; GroupsLive owns sorting + realtime
  // merging from here — same snapshot via /api/circles, so the two cannot
  // drift.
  return <GroupsLive initialCircles={snapshot.circles} />;
}
