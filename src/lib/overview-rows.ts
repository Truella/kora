// Circle overview reads: waves 1–3 from the detail page, verbatim.
// No derivation here — lib/overview-model.ts turns this bundle into the
// view model the components render.

import type { SupabaseClient } from "@supabase/supabase-js";

export type OverviewGroupRow = {
  id: string;
  name: string;
  description: string | null;
  contribution_amount: number | string;
  currency: string;
  frequency: string;
  status: string;
  created_by: string;
};

export type OverviewMemberRow = {
  id: string;
  joined_at: string;
};

export type OverviewCycleRow = {
  id: string;
  cycle_number: number;
  due_date: string;
  status: string;
  recipient_member_id: string;
};

export type OverviewRows = {
  group: OverviewGroupRow | null;
  member: OverviewMemberRow | null;
  cycles: OverviewCycleRow[];
  contributions: { id: string; cycle_id: string; status: string; paid_at: string | null }[];
  payouts: {
    cycle_id: string;
    amount: number | string;
    recipient_member_id: string;
    status: string;
    paid_at: string | null;
  }[];
  recipientMembers: { id: string; user_id: string }[];
  activeCount: number | null;
  currentContributions: { member_id: string; status: string }[];
  circleMembers: {
    id: string;
    user_id: string;
    payout_position: number | null;
    joined_at: string;
  }[];
  recipientProfiles: { id: string; full_name: string }[];
};

export async function fetchOverviewRows(
  supabase: SupabaseClient,
  groupId: string,
  userId: string | null,
): Promise<OverviewRows> {
  // RLS ("view groups you belong to") returns a row only for members —
  // a missing row means not-found or not-a-member, same UI either way.
  // Wave 1 — group, membership, and rotation need nothing but the route
  // id, so all three fly together.
  const [groupRes, memberRes, cyclesRes] = await Promise.all([
    supabase
      .from("groups")
      .select(
        "id, name, description, contribution_amount, currency, frequency, status, created_by",
      )
      .eq("id", groupId)
      .maybeSingle(),
    userId
      ? supabase
          .from("group_members")
          .select("id, joined_at")
          .eq("group_id", groupId)
          .eq("user_id", userId)
          .eq("status", "active")
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("cycles")
      .select("id, cycle_number, due_date, status, recipient_member_id")
      .eq("group_id", groupId)
      .order("cycle_number", { ascending: true }),
  ]);
  const group = (groupRes.data ?? null) as OverviewGroupRow | null;
  const member = (memberRes.data ?? null) as OverviewMemberRow | null;
  const cycles = ((cyclesRes.data ?? []) as OverviewCycleRow[]).sort(
    (a, b) => a.cycle_number - b.cycle_number,
  );

  const currentCycle =
    cycles.find((c) => c.status !== "completed") ??
    cycles[cycles.length - 1] ??
    null;

  const recipientIds = [...new Set(cycles.map((c) => c.recipient_member_id))];

  // Wave 2 — everything that needs only wave 1, in parallel.
  const [
    { data: contributions },
    { data: payouts },
    { data: recipientMembers },
    { count: activeCount },
    { data: currentContributions },
    { data: circleMembers },
  ] = await Promise.all([
    member
      ? supabase
          .from("contributions")
          .select("id, cycle_id, status, paid_at")
          .eq("member_id", member.id)
      : Promise.resolve({ data: [] }),
    member && cycles.length > 0
      ? supabase
          .from("payouts")
          .select("cycle_id, amount, recipient_member_id, status, paid_at")
          .in(
            "cycle_id",
            cycles.map((c) => c.id),
          )
      : Promise.resolve({ data: [] }),
    member && recipientIds.length > 0
      ? supabase
          .from("group_members")
          .select("id, user_id")
          .in("id", recipientIds)
      : Promise.resolve({ data: [] }),
    member
      ? supabase
          .from("group_members")
          .select("id", { count: "exact", head: true })
          .eq("group_id", groupId)
          .eq("status", "active")
      : Promise.resolve({ count: null }),
    member && currentCycle
      ? supabase
          .from("contributions")
          .select("member_id, status")
          .eq("cycle_id", currentCycle.id)
      : Promise.resolve({ data: [] }),
    member
      ? supabase
          .from("group_members")
          .select("id, user_id, payout_position, joined_at")
          .eq("group_id", groupId)
          .eq("status", "active")
          .order("payout_position", { ascending: true })
      : Promise.resolve({ data: [] }),
  ]);

  const rrows = (recipientMembers ?? []) as { id: string; user_id: string }[];
  const userIds = [...new Set(rrows.map((m) => m.user_id))];

  // Wave 3 — profile names need wave 2's roster; the only serial hop left.
  const { data: rprofs } =
    userIds.length > 0
      ? await supabase.from("profiles").select("id, full_name").in("id", userIds)
      : { data: [] };

  return {
    group,
    member,
    cycles,
    contributions: (contributions ?? []) as OverviewRows["contributions"],
    payouts: (payouts ?? []) as OverviewRows["payouts"],
    recipientMembers: rrows,
    activeCount: (activeCount ?? null) as number | null,
    currentContributions:
      (currentContributions ?? []) as OverviewRows["currentContributions"],
    circleMembers: (circleMembers ?? []) as OverviewRows["circleMembers"],
    recipientProfiles: ((rprofs ?? []) as { id: string; full_name: string }[]).map(
      (p) => ({ id: p.id, full_name: p.full_name }),
    ),
  };
}
