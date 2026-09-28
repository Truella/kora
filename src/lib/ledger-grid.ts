// Ledger grid data: waves + summary for the circle ledger book.
// Moved from the ledger page so the page is fetch, build, render.
// Per-turn cells and per-member totals build in lib/ledger-periods.
import type { SupabaseClient } from "@supabase/supabase-js";
import { formatMoney } from "./money";
import type {
  LedgerBookMemberTotal,
  LedgerBookPeriod,
} from "@/app/(app)/groups/[id]/ledger/LedgerBook";
import type { CircleMemberRow } from "@/types/circle";
import { buildLedgerPeriods } from "./ledger-periods";

export type LedgerGridData = {
  groupId: string;
  summary: {
    rotationExpectedLabel: string;
    rotationCollectedLabel: string;
    outstandingLabel: string;
    collectionRate: string;
    payoutsCompleted: string;
  };
  members: { id: string; name: string; position: number }[];
  periods: LedgerBookPeriod[];
  memberTotals: LedgerBookMemberTotal[];
  expectedPerMemberLabel: string;
  empty: boolean;
};

export async function loadLedgerGrid(
  supabase: SupabaseClient,
  groupId: string,
  userId: string | null,
): Promise<LedgerGridData | null> {
  // Wave 1 — group + membership need nothing but the route id.
  const [groupRes, memberRes] = await Promise.all([
    supabase
      .from("groups")
      .select(
        "id, name, contribution_amount, currency, frequency, status, created_by",
      )
      .eq("id", groupId)
      .maybeSingle(),
    userId
      ? supabase
          .from("group_members")
          .select("id")
          .eq("group_id", groupId)
          .eq("user_id", userId)
          .eq("status", "active")
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const group = groupRes.data as {
    id: string;
    contribution_amount: number | string;
    currency: string;
  } | null;
  const member = memberRes.data;

  if (!group || !member) return null;

  const shareAmount = Number(group.contribution_amount);
  const today = new Date().toISOString().slice(0, 10);

  // Wave 2 — rotation + roster need only the group id.
  const [cyclesRes, rosterRes] = await Promise.all([
    supabase
      .from("cycles")
      .select("id, cycle_number, due_date, status, recipient_member_id")
      .eq("group_id", groupId)
      .order("cycle_number", { ascending: true }),
    supabase
      .from("group_members")
      .select("id, user_id, payout_position, joined_at")
      .eq("group_id", groupId)
      .eq("status", "active")
      .order("payout_position", { ascending: true }),
  ]);

  const sortedCycles = (
    ((cyclesRes.data ?? []) as {
      id: string;
      cycle_number: number;
      due_date: string;
      status: string;
      recipient_member_id: string;
    }[]).sort((a, b) => a.cycle_number - b.cycle_number)
  );

  const memberRows = (rosterRes.data ?? []) as CircleMemberRow[];
  const orderedMembers = [...memberRows].sort(
    (a, b) => (a.payout_position ?? 0) - (b.payout_position ?? 0),
  );

  const needUserIds = [...new Set(orderedMembers.map((m) => m.user_id))];
  const cycleIds = sortedCycles.map((c) => c.id);
  // Wave 3 — names, shares, and disbursements need wave 2's roster and
  // rotation, so they fly together.
  const [{ data: profs }, { data: contributions }, { data: payouts }] =
    await Promise.all([
      needUserIds.length > 0
        ? supabase.from("profiles").select("id, full_name").in("id", needUserIds)
        : Promise.resolve({ data: [] }),
      cycleIds.length > 0
        ? supabase
            .from("contributions")
            .select("cycle_id, member_id, status")
            .in("cycle_id", cycleIds)
        : Promise.resolve({ data: [] }),
      cycleIds.length > 0
        ? supabase
            .from("payouts")
            .select("cycle_id, status")
            .in("cycle_id", cycleIds)
        : Promise.resolve({ data: [] }),
    ]);
  const nameByUser = new Map(
    ((profs ?? []) as { id: string; full_name: string }[]).map((p) => [
      p.id,
      p.full_name,
    ]),
  );
  const memberName = (m: CircleMemberRow) =>
    nameByUser.get(m.user_id) ?? `····${m.user_id.slice(-4)}`;

  const contribByKey = new Map(
    ((contributions ?? []) as {
      cycle_id: string;
      member_id: string;
      status: string;
    }[]).map((c) => [`${c.cycle_id}:${c.member_id}`, c.status]),
  );

  const payoutByCycle = new Map(
    ((payouts ?? []) as { cycle_id: string; status: string }[]).map((p) => [
      p.cycle_id,
      p.status,
    ]),
  );

  const { periods, memberTotals } = buildLedgerPeriods({
    cycles: sortedCycles,
    members: orderedMembers,
    contributions: (contributions ?? []) as {
      member_id: string;
      status: string;
    }[],
    contribByKey,
    payoutByCycle,
    shareAmount,
    currency: group.currency,
    today,
    nameOf: memberName,
  });

  const rotationExpected = periods.reduce(
    (sum, p) => sum + p.expectedCount * shareAmount,
    0,
  );
  const rotationCollected = periods.reduce(
    (sum, p) => sum + p.settledCount * shareAmount,
    0,
  );
  const payoutsDone = sortedCycles.filter(
    (c) => payoutByCycle.get(c.id) === "completed",
  ).length;

  return {
    groupId: group.id,
    summary: {
      rotationExpectedLabel: formatMoney(rotationExpected, group.currency),
      rotationCollectedLabel: formatMoney(
        rotationCollected,
        group.currency,
      ),
      outstandingLabel: formatMoney(
        rotationExpected - rotationCollected,
        group.currency,
      ),
      collectionRate:
        rotationExpected > 0
          ? `${Math.round((rotationCollected / rotationExpected) * 100)}%`
          : "—",
      payoutsCompleted:
        periods.length > 0 ? `${payoutsDone} of ${periods.length}` : "—",
    },
    members: orderedMembers.map((m, i) => ({
      id: m.id,
      name: memberName(m),
      position: m.payout_position ?? i + 1,
    })),
    periods,
    memberTotals,
    expectedPerMemberLabel: formatMoney(
      periods.length * shareAmount,
      group.currency,
    ),
    empty: periods.length === 0,
  };
}
