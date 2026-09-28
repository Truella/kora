// Home snapshot phase 1: session + read waves → raw bundle.
// No derivation here — lib/home-owed, home-totals, home-circles and
// home-activity each take the bundle (plus prior contexts) and compute.
import type { SupabaseClient, User } from "@supabase/supabase-js";
import {
  monthName,
  offsetForCountry,
  todayIn,
} from "./money";
import { SETTLED_STATUSES } from "@/constants/home";
import type {
  ContributionRow,
  CycleRow,
  GroupRow,
  HomeInvite,
  HomeRawBundle,
  InviteRpcRow,
  JoinRequestRow,
  MemberRow,
  PayoutRow,
} from "@/types/home";

export async function fetchHomeBundle(
  supabase: SupabaseClient,
  user: User,
): Promise<HomeRawBundle> {
  // Country lives in auth metadata (onboarding writes it there, not to
  // profiles). It fixes the offset for the greeting, "this month" and event
  // day labels — all four supported countries are fixed-offset with no DST, so
  // the table in lib/money is exact rather than a heuristic.
  const country = (user.user_metadata?.country as string | undefined) ?? null;
  const offset = offsetForCountry(country);
  const today = todayIn(offset);
  const month = monthName(today);

  // Wave 1 — the reads that need nothing but the session. Invites ride along
  // separately: the RPC is best-effort (a DB without the migration answers
  // with an error, never with someone else's invites) and an invitee often
  // has zero circles, so invites must survive the early return below.
  const [profileRes, groupsRes, inviteRows] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
    // RLS ("view groups you belong to") scopes this to the caller's circles,
    // so it doubles as the group-id source for every scoped read below.
    supabase
      .from("groups")
      .select(
        "id, name, currency, contribution_amount, frequency, status, created_at",
      )
      .order("created_at", { ascending: false }),
    supabase.rpc("my_pending_invites").then(
      (res) => (Array.isArray(res.data) ? res.data : []) as InviteRpcRow[],
      () => [] as InviteRpcRow[],
    ),
  ]);

  if (groupsRes.error) {
    throw new Error(`home groups: ${groupsRes.error.message}`);
  }
  // Checked before the data is read, like every other query below. An unchecked
  // profiles error silently degraded to "no name" — the one field in this
  // module whose absence is meant to be a decision, not a failure.
  if (profileRes.error) {
    throw new Error(`home profile: ${profileRes.error.message}`);
  }

  const groups = (groupsRes.data ?? []) as GroupRow[];
  const fullName = (profileRes.data?.full_name as string | null) ?? null;
  const firstName = fullName?.trim().split(/\s+/)[0] || null;

  const invites: HomeInvite[] = inviteRows.map((r) => ({
    inviteId: r.invite_id,
    groupId: r.group_id,
    groupName: r.group_name,
    inviterName: r.inviter_name,
    href: `/groups/${r.group_id}/join`,
  }));

  const empty: HomeRawBundle = {
    userId: user.id,
    offset,
    today,
    month,
    firstName,
    groups,
    invites,
    members: [],
    cycles: [],
    requests: [],
    myContributions: [],
    settledCountRows: [],
    payouts: [],
    voteRows: [],
    groupById: new Map(),
    cycleById: new Map(),
    cyclesByGroup: new Map(),
    payoutByCycle: new Map(),
  };
  if (groups.length === 0) return empty;

  const groupIds = groups.map((g) => g.id);

  // Wave 2 — everything scoped to the caller's circles, in parallel.
  const [membersRes, cyclesRes, requestsRes] = await Promise.all([
    supabase
      .from("group_members")
      .select("id, group_id, user_id, joined_at")
      .in("group_id", groupIds)
      .eq("status", "active"),
    supabase
      .from("cycles")
      .select("id, group_id, cycle_number, recipient_member_id, due_date, status")
      .in("group_id", groupIds)
      .order("cycle_number", { ascending: true }),
    supabase
      .from("join_requests")
      .select("id, group_id, created_at")
      .in("group_id", groupIds)
      .eq("status", "pending")
      .order("created_at", { ascending: true }),
  ]);

  const members = (membersRes.data ?? []) as MemberRow[];
  const cycles = (cyclesRes.data ?? []) as CycleRow[];
  const requests = (requestsRes.data ?? []) as JoinRequestRow[];
  if (membersRes.error) throw new Error(`home members: ${membersRes.error.message}`);
  if (cyclesRes.error) throw new Error(`home cycles: ${cyclesRes.error.message}`);
  if (requestsRes.error) {
    throw new Error(`home join requests: ${requestsRes.error.message}`);
  }

  const cycleIds = cycles.map((c) => c.id);

  // Membership facts are cheap and are needed to *scope* wave 3, so they are
  // derived before it rather than after. One pass, three outputs.
  const myMemberIds = new Set<string>();
  for (const m of members) {
    if (m.user_id === user.id) myMemberIds.add(m.id);
  }
  const myMemberIdList = [...myMemberIds];
  const pendingRequestIds = requests.map((r) => r.id);

  // The only reader of the settled counts is the payout note, and it only ever
  // looks at a cycle whose status is not "completed". Scoping the count query to
  // the open cycles is therefore exact rather than approximate, and it is the
  // difference between walking a circle's whole history and walking the one or
  // two rounds currently in flight.
  const openCycleIds: string[] = [];
  for (const c of cycles) {
    if (c.status !== "completed") openCycleIds.push(c.id);
  }

  // Wave 3 — the rows that hang off cycles and members. See the original
  // module notes: contributions are split by consumer (mine vs counts), and
  // join_votes is scoped to pending request ids because votes accumulate
  // without bound where pending requests do not.
  const [myContribRes, settledCountRes, payoutRes, votesRes] = await Promise.all([
    myMemberIdList.length
      ? supabase
          .from("contributions")
          .select("id, cycle_id, member_id, amount, status, paid_at")
          .in("member_id", myMemberIdList)
          .in("status", SETTLED_STATUSES)
      : Promise.resolve({ data: [], error: null }),
    openCycleIds.length
      ? supabase
          .from("contributions")
          .select("cycle_id, member_id")
          .in("cycle_id", openCycleIds)
          .in("status", SETTLED_STATUSES)
      : Promise.resolve({ data: [], error: null }),
    cycleIds.length
      ? supabase
          .from("payouts")
          .select("id, cycle_id, recipient_member_id, amount, status, paid_at")
          .in("cycle_id", cycleIds)
      : Promise.resolve({ data: [], error: null }),
    pendingRequestIds.length
      ? supabase
          .from("join_votes")
          .select("join_request_id")
          .in("join_request_id", pendingRequestIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const myContributions = (myContribRes.data ?? []) as ContributionRow[];
  const payouts = (payoutRes.data ?? []) as PayoutRow[];
  if (myContribRes.error) {
    throw new Error(`home contributions: ${myContribRes.error.message}`);
  }
  if (settledCountRes.error) {
    throw new Error(
      `home settled contribution counts: ${settledCountRes.error.message}`,
    );
  }
  if (payoutRes.error) throw new Error(`home payouts: ${payoutRes.error.message}`);
  if (votesRes.error) {
    throw new Error(`home join votes: ${votesRes.error.message}`);
  }

  const groupById = new Map(groups.map((g) => [g.id, g]));
  const cycleById = new Map(cycles.map((c) => [c.id, c]));

  // Built once, read once per group below. Filtering the whole cycle list for
  // every group was O(groups × cycles); the payout note's group scan was the
  // same shape again.
  const cyclesByGroup = new Map<string, CycleRow[]>();
  for (const c of cycles) {
    const list = cyclesByGroup.get(c.group_id);
    if (list) list.push(c);
    else cyclesByGroup.set(c.group_id, [c]);
  }

  const payoutByCycle = new Map<string, PayoutRow>();
  for (const p of payouts) payoutByCycle.set(p.cycle_id, p);

  return {
    userId: user.id,
    offset,
    today,
    month,
    firstName,
    groups,
    invites,
    members,
    cycles,
    requests,
    myContributions,
    settledCountRows: (settledCountRes.data ?? []) as {
      cycle_id: string;
      member_id: string;
    }[],
    payouts,
    voteRows: (votesRes.data ?? []) as { join_request_id: string }[],
    groupById,
    cycleById,
    cyclesByGroup,
    payoutByCycle,
  };
}
