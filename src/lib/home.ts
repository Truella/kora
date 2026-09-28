import type { SupabaseClient } from "@supabase/supabase-js";
import { greetingFor } from "./money";
import type { HomeSnapshot } from "@/types/home";
import { fetchHomeBundle } from "./home-fetch";
import { buildOwedContext } from "./home-owed";
import { buildTotalsContext } from "./home-totals";
import { buildCircles } from "./home-circles";
import { buildRecentActivity } from "./home-activity";

// Command-centre data for /home. Read-only: money rows are selected, never
// written, and no schema or policy change is involved — every query below is
// already covered by the existing RLS policies.
//
// Two things this pipeline is deliberate about:
//
// - Aggregates come from their own uncapped queries. The ledger feed selects
//   `.limit(200)`, which is fine for a scrolling feed and wrong for a lifetime
//   sum: it would put a silent ceiling on the headline number.
// - Every string it returns is pre-formatted. Server render and the /api/home
//   refetch both go through here, so they cannot disagree.
//
// Pipeline (each phase is its own module, threaded by explicit contexts in
// @/types/home): fetchHomeBundle → buildOwedContext → buildTotalsContext →
// buildCircles + buildRecentActivity → assemble.

// Types live in @/types/home and constants in @/constants/home. They are
// re-exported here so the existing `import ... from "@/lib/home"` call sites
// keep working unchanged.
export type {
  ContributionRow,
  CycleRow,
  GroupRow,
  HomeActivity,
  HomeAttention,
  HomeCircle,
  HomeInvite,
  HomeMoney,
  HomePaymentProgress,
  HomeSnapshot,
  HomeTotals,
  InviteRpcRow,
  JoinRequestRow,
  MemberRow,
  PayoutRow,
  RankedActivity,
} from "@/types/home";
export { DUE_SOON_DAYS, SETTLED_STATUSES } from "@/constants/home";

export async function getHomeSnapshot(
  supabase: SupabaseClient,
  opts: { circleLimit?: number } = {},
): Promise<HomeSnapshot> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return emptySnapshot();

  const bundle = await fetchHomeBundle(supabase, user);
  if (bundle.groups.length === 0) {
    return {
      ...emptySnapshot(),
      greeting: greetingFor(bundle.offset),
      firstName: bundle.firstName,
      invites: bundle.invites,
    };
  }

  const owed = buildOwedContext(bundle);
  const totals = buildTotalsContext(bundle);
  const circles = buildCircles(bundle, owed, totals);
  const activity = buildRecentActivity(bundle, totals);

  const activeCircleCount = bundle.groups.filter(
    (g) => g.status === "active",
  ).length;

  return {
    greeting: greetingFor(bundle.offset),
    firstName: bundle.firstName,
    totals: totals.totals,
    activeCircleCount,
    paymentProgress: totals.paymentProgress,
    attention: owed.attention,
    invites: bundle.invites,
    // Home shows the top-ranked few; the /groups directory passes
    // circleLimit: Infinity for the full list (circlesTotal stays whole).
    circles: circles.slice(0, opts.circleLimit ?? 4),
    circlesTotal: bundle.groups.length,
    activity,
  };
}

function emptySnapshot(): HomeSnapshot {
  return {
    greeting: "morning",
    firstName: null,
    totals: {
      contributed: { currency: "NGN", label: "₦0", amount: 0 },
      received: null,
      month: { currency: "NGN", label: "₦0", amount: 0 },
      monthCount: 0,
      monthName: "",
      others: [],
      hasAny: false,
    },
    activeCircleCount: 0,
    paymentProgress: {
      settledCount: 0,
      onTimeCount: 0,
      lateCount: 0,
      percent: 0,
    },
    attention: [],
    invites: [],
    circles: [],
    circlesTotal: 0,
    activity: [],
  };
}
