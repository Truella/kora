import type { SupabaseClient } from "@supabase/supabase-js";
import {
  formatCycleDate,
  formatMoney,
  greetingFor,
  daysUntil,
  localParts,
  monthName,
  offsetForCountry,
  relativeDayLabel,
  settledDayLabel,
  todayIn,
  utcDateOnly,
} from "./money";

// Command-centre data for /home. Read-only: money rows are selected, never
// written, and no schema or policy change is involved — every query below is
// already covered by the existing RLS policies.
//
// Two things this module is deliberate about:
//
// - Aggregates come from their own uncapped queries. The ledger feed selects
//   `.limit(200)`, which is fine for a scrolling feed and wrong for a lifetime
//   sum: it would put a silent ceiling on the headline number.
// - Every string it returns is pre-formatted. Server render and the /api/home
//   refetch both go through here, so they cannot disagree.

const DUE_SOON_DAYS = 3;

export type HomeMoney = {
  currency: string;
  label: string;
  amount: number;
};

export type HomeTotals = {
  contributed: HomeMoney;
  received: HomeMoney | null;
  month: HomeMoney;
  monthCount: number;
  monthName: string;
  others: { currency: string; label: string; amount: number; circleCount: number }[];
  hasAny: boolean;
};

export type HomePaymentProgress = {
  settledCount: number;
  onTimeCount: number;
  lateCount: number;
  percent: number;
};

export type HomeAttention =
  | {
      kind: "money";
      tone: "overdue" | "soon";
      groupId: string;
      groupName: string;
      cycleId: string;
      cycleNumber: number;
      dueDate: string;
      dueLabel: string;
      amountLabel: string;
      daysLate: number;
      href: string;
    }
  | {
      kind: "vote";
      groupId: string;
      groupName: string;
      pendingCount: number;
      href: string;
    };

export type HomeCircle = {
  groupId: string;
  name: string;
  status: "forming" | "active" | "paused" | "completed";
  currency: string;
  amountLabel: string;
  savedLabel: string;
  targetLabel: string;
  cyclesEnrolled: number;
  cyclesSettled: number;
  percent: number;
  showBar: boolean;
  awaitingSchedule: boolean;
  nextDueLabel: string | null;
  payoutNote: string | null;
  urgent: boolean;
  // Cadence remains useful beside the circle name; membership and round-count
  // tiles were removed from the card because they repeated information already
  // available on the circle detail page.
  frequency: string;
  // The member's own position in the rotation: their payout round number and
  // the circle size. Null when the rotation has no row naming them yet (e.g.
  // joined after every cycle ran) — the card then falls back to circle totals.
  myRoundNumber: number | null;
  rotationTotal: number;
  memberCount: number;
  // Null once the round has been paid out — at that point it belongs in
  // activity as "You received", and repeating it here would be a second,
  // staler copy of the same fact.
  myPayoutLabel: string | null;
  myPayoutDateLabel: string | null;
  // Current turn in flight (the inPlay cycle the payoutNote is about).
  // Needed so the card never presents the member's *future* payout as if
  // they were collecting now.
  currentTurnNumber: number | null;
  isMyTurnNow: boolean;
  currentPotLabel: string | null;
  currentDueLabel: string | null;
  // True when the caller is one of the outstanding shares blocking the
  // current payout — the note then names them ("waiting on you") instead
  // of the anonymous "waiting on 1 member".
  waitingOnYou: boolean;
  href: string;
};

export type HomeActivity = {
  id: string;
  tone: "paid" | "received" | "circle-payout";
  headline: string;
  amountLabel: string;
  groupName: string;
  dayLabel: string;
  // "Turn 3" — turns a ledger line into an event in the rotation. Free: the
  // cycle is already resolved for every activity row.
  contextLabel: string | null;
};

// Directed phone invite awaiting this user. Resolved server-side by the
// my_pending_invites() RPC (verified-phone match — no directory lookup), so
// the snapshot carries names the caller's RLS could never read directly.
export type HomeInvite = {
  inviteId: string;
  groupId: string;
  groupName: string;
  inviterName: string;
  href: string;
};

/** Sort key is build-time only and never serialized. */
type RankedActivity = HomeActivity & { sortKey: number };

export type HomeSnapshot = {
  greeting: "morning" | "afternoon" | "evening";
  firstName: string | null;
  totals: HomeTotals;
  activeCircleCount: number;
  paymentProgress: HomePaymentProgress;
  attention: HomeAttention[];
  invites: HomeInvite[];
  circles: HomeCircle[];
  circlesTotal: number;
  activity: HomeActivity[];
};

type GroupRow = {
  id: string;
  name: string;
  currency: string;
  contribution_amount: number | string;
  frequency: string;
  status: string;
  created_at: string | null;
};

type MemberRow = {
  id: string;
  group_id: string;
  user_id: string;
  joined_at: string;
};

type CycleRow = {
  id: string;
  group_id: string;
  cycle_number: number;
  // Which member this round pays out to. One extra column on a row we already
  // fetch, and it carries the entire rotation model: "your round" is simply the
  // cycle that names you. Nullable in the sense that a member who joins after
  // the rotation was generated is named by no cycle until a sync appends one —
  // hence the null-tolerant reads below rather than an assumption.
  recipient_member_id: string;
  due_date: string;
  status: string;
};

type ContributionRow = {
  id: string;
  cycle_id: string;
  member_id: string;
  amount: number | string;
  status: string;
  paid_at: string | null;
};

type PayoutRow = {
  id: string;
  cycle_id: string;
  recipient_member_id: string;
  amount: number | string;
  status: string;
  paid_at: string | null;
};

type JoinRequestRow = {
  id: string;
  group_id: string;
  created_at: string | null;
};

type InviteRpcRow = {
  invite_id: string;
  group_id: string;
  group_name: string;
  inviter_name: string;
  created_at: string | null;
};

// Settled is defined once and pushed into the query as a filter, so the
// in-memory code never has to re-test the same condition the database already
// applied. A JS-side `SETTLED` set would only be a second place for the rule to
// drift out of sync with the SQL.
const SETTLED_STATUSES: string[] = ["paid", "late"];

export async function getHomeSnapshot(
  supabase: SupabaseClient,
  opts: { circleLimit?: number } = {},
): Promise<HomeSnapshot> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return emptySnapshot();

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

  if (groups.length === 0) {
    return {
      ...emptySnapshot(),
      greeting: greetingFor(offset),
      firstName,
      invites,
    };
  }

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
  const myJoinedByGroup = new Map<string, string>();
  // group_id -> the caller's own membership row id. The rotation lookup needs
  // the membership id (that is what `cycles.recipient_member_id` points at),
  // not the user id, and only one membership per group can be the caller's.
  const myMemberIdByGroup = new Map<string, string>();
  const activeCountByGroup = new Map<string, number>();
  for (const m of members) {
    activeCountByGroup.set(
      m.group_id,
      (activeCountByGroup.get(m.group_id) ?? 0) + 1,
    );
    if (m.user_id !== user.id) continue;
    myMemberIds.add(m.id);
    myMemberIdByGroup.set(m.group_id, m.id);
    myJoinedByGroup.set(m.group_id, m.joined_at);
  }
  const myMemberIdList = [...myMemberIds];
  const pendingRequestIds = requests.map((r) => r.id);

  // The only reader of settledCountByCycle is the payout note, and it only ever
  // looks at a cycle whose status is not "completed". Scoping the count query to
  // the open cycles is therefore exact rather than approximate, and it is the
  // difference between walking a circle's whole history and walking the one or
  // two rounds currently in flight.
  const openCycleIds: string[] = [];
  for (const c of cycles) {
    if (c.status !== "completed") openCycleIds.push(c.id);
  }

  // Wave 3 — the rows that hang off cycles and members.
  //
  // contributions is the table that actually grows: one row per member per
  // cycle, forever. It is also the one table here where *every* downstream use
  // filters to settled, so it is never fetched whole. It is split by what each
  // consumer needs instead:
  //
  //   mine    — the caller's own rows, with the columns the lifetime total, the
  //             month bucket, each circle's saved figure and the activity feed
  //             all read from. One row set, four answers.
  //   counts  — settled contributions for the open cycles only, one column,
  //             purely to answer "how many of this cycle's shares have landed"
  //             for the payout note.
  //
  // join_votes used to fetch every vote the member has ever cast, on requests
  // in any state, to decide which *pending* requests they have not voted on.
  // Scoping it to the pending request ids is the same answer over a fraction of
  // the rows, and votes accumulate without bound where pending requests do not.
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

  // ---------------------------------------------------------------- R1
  // Retroactive contribution bug. generate-schedule appends a late joiner's
  // recipient cycle at the end of the rotation and never backfills the ones
  // that already ran, and it creates no contribution rows at all — so the
  // circle page used to read "no row" as unpaid and offer a Pay button for
  // rounds that finished before the member joined.
  //
  // A member owes a cycle only if its due date falls on or after the day they
  // became an active member. This governs *billing* only: settled money is
  // history and always counts, however late it was paid.
  const joinedDateByGroup = new Map<string, string>();
  for (const [groupId, joinedAt] of myJoinedByGroup) {
    joinedDateByGroup.set(groupId, utcDateOnly(joinedAt));
  }

  // Both queries above already filtered to settled, so neither map re-checks
  // status. This is the one place that distinction is load-bearing: the payout
  // note compares this against *all* active members, not just the caller's
  // rows, which is why it needs its own query rather than myContributions.
  const settledCountByCycle = new Map<string, number>();
  const settledMembersByCycle = new Map<string, Set<string>>();
  for (const row of (settledCountRes.data ?? []) as {
    cycle_id: string;
    member_id: string;
  }[]) {
    settledCountByCycle.set(
      row.cycle_id,
      (settledCountByCycle.get(row.cycle_id) ?? 0) + 1,
    );
    const set = settledMembersByCycle.get(row.cycle_id) ?? new Set<string>();
    set.add(row.member_id);
    settledMembersByCycle.set(row.cycle_id, set);
  }

  // Keyed by cycle: one member has at most one contribution per cycle, and
  // every reader only ever asks "did mine settle?".
  const mySettledByCycle = new Map<string, ContributionRow>();
  for (const c of myContributions) {
    mySettledByCycle.set(c.cycle_id, c);
  }

  type Owed = {
    groupId: string;
    groupName: string;
    cycleId: string;
    cycleNumber: number;
    dueDate: string;
    amountLabel: string;
    days: number;
  };

  const owedByGroup = new Map<string, Owed[]>();
  const allOwed: Owed[] = [];

  // Paused circles freeze: no new dues accrue while paused, so their cycles
  // never enter the owed queue (attention + NextUp money picks derive from
  // this queue and stay clean automatically).
  const pausedGroupIds = new Set(
    groups.filter((g) => g.status === "paused").map((g) => g.id),
  );

  // Only the current turn is payable: the first open (non-completed)
  // cycle per group. Cycles arrive ordered by cycle_number ascending,
  // so the first open id seen per group wins.
  const firstOpenByGroup = new Map<string, string>();
  for (const cycle of cycles) {
    if (cycle.status === "completed") continue;
    if (!firstOpenByGroup.has(cycle.group_id))
      firstOpenByGroup.set(cycle.group_id, cycle.id);
  }

  for (const cycle of cycles) {
    // Disbursed rounds are history, not a work queue.
    if (cycle.status === "completed") continue;
    // Later turns open when the current one settles — they never enter
    // the queue, so attention and NextUp can only point at payable turns.
    if (firstOpenByGroup.get(cycle.group_id) !== cycle.id) continue;
    if (pausedGroupIds.has(cycle.group_id)) continue;
    const joinedDate = joinedDateByGroup.get(cycle.group_id);
    // No membership row means the caller cannot be a current member of a circle
    // RLS returned, so there is nothing to owe.
    if (!joinedDate) continue;
    if (cycle.due_date < joinedDate) continue; // R1: predates their membership

    // The query already returned settled rows only, so membership in this map
    // *is* the settled test.
    if (mySettledByCycle.has(cycle.id)) continue;

    const group = groupById.get(cycle.group_id);
    if (!group) continue;
    const owed: Owed = {
      groupId: cycle.group_id,
      groupName: group.name,
      cycleId: cycle.id,
      cycleNumber: cycle.cycle_number,
      dueDate: cycle.due_date,
      amountLabel: formatMoney(group.contribution_amount, group.currency),
      days: daysUntil(cycle.due_date, today),
    };
    const list = owedByGroup.get(cycle.group_id) ?? [];
    list.push(owed);
    owedByGroup.set(cycle.group_id, list);
    allOwed.push(owed);
  }
  allOwed.sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  // ------------------------------------------------------------ attention
  // Overdue first, then due within the window, then votes. Money has a
  // deadline; a pending join request does not.
  const moneyItems: Extract<HomeAttention, { kind: "money" }>[] = allOwed
    .filter((o) => o.days <= DUE_SOON_DAYS)
    .map((o) => ({
      kind: "money",
      tone: o.days < 0 ? "overdue" : "soon",
      groupId: o.groupId,
      groupName: o.groupName,
      cycleId: o.cycleId,
      cycleNumber: o.cycleNumber,
      dueDate: o.dueDate,
      dueLabel: formatCycleDate(o.dueDate),
      amountLabel: o.amountLabel,
      daysLate: o.days < 0 ? -o.days : 0,
      href: `/groups/${o.groupId}#cycle-${o.cycleId}`,
    }));

  const votedOn = new Set(
    ((votesRes.data ?? []) as { join_request_id: string }[]).map(
      (v) => v.join_request_id,
    ),
  );
  const pendingByGroup = new Map<string, number>();
  for (const r of requests) {
    if (votedOn.has(r.id)) continue;
    pendingByGroup.set(r.group_id, (pendingByGroup.get(r.group_id) ?? 0) + 1);
  }
  const voteItems: Extract<HomeAttention, { kind: "vote" }>[] = [...pendingByGroup]
    .map(([groupId, pendingCount]) => ({ groupId, pendingCount }))
    .filter((v) => groupById.has(v.groupId))
    .map((v) => ({
      kind: "vote" as const,
      groupId: v.groupId,
      groupName: groupById.get(v.groupId)!.name,
      pendingCount: v.pendingCount,
      href: `/groups/${v.groupId}#pending-requests`,
    }))
    .sort((a, b) => b.pendingCount - a.pendingCount);

  // Directed invites stay as their own snapshot collection: the Attention
  // surface inserts them between money and votes, while their Accept/Decline
  // controls need RPC-specific fields that money/vote rows do not share.
  const attention = [...moneyItems, ...voteItems];

  // --------------------------------------------------------------- totals
  const contributed = new Map<string, number>();
  const received = new Map<string, number>();
  // Each circle's saved figure used to be its own filter over the entire
  // contributions table. It falls out of the same pass as the lifetime total —
  // same rows, same group lookup, one scan instead of one scan per group.
  const savedByGroup = new Map<string, number>();
  // Rows that resolved to a real cycle and group, carried through to the
  // activity feed so it does not repeat the lookups.
  const mySettled: {
    contribution: ContributionRow;
    cycle: CycleRow;
    group: GroupRow;
  }[] = [];
  let monthAmount = 0;
  let monthCount = 0;

  // Settled money is history: it counts whatever the dates say. The R1 rule is
  // about what you are billed for, never about erasing a payment — and the
  // query already restricted this set to paid|late.
  for (const c of myContributions) {
    const cycle = cycleById.get(c.cycle_id);
    if (!cycle) continue;
    const group = groupById.get(cycle.group_id);
    if (!group) continue;
    const amount = Number(c.amount);
    contributed.set(
      group.currency,
      (contributed.get(group.currency) ?? 0) + amount,
    );
    savedByGroup.set(group.id, (savedByGroup.get(group.id) ?? 0) + amount);
    mySettled.push({ contribution: c, cycle, group });
    if (c.paid_at) {
      const at = localParts(c.paid_at, offset);
      if (at.y === today.y && at.m === today.m) {
        monthAmount += amount;
        monthCount += 1;
      }
    }
  }

  // The same settled rows that feed the money totals also answer the member's
  // reliability question. No extra query: `late` is settled history too, so the
  // denominator is every payment they have made and the numerator is the subset
  // that landed on time.
  const settledCount = myContributions.length;
  const onTimeCount = myContributions.filter((c) => c.status === "paid").length;
  const lateCount = settledCount - onTimeCount;
  const paymentProgress: HomePaymentProgress = {
    settledCount,
    onTimeCount,
    lateCount,
    percent:
      settledCount > 0 ? Math.round((onTimeCount / settledCount) * 100) : 0,
  };

  for (const p of payouts) {
    if (p.status !== "completed" || !myMemberIds.has(p.recipient_member_id)) {
      continue;
    }
    const cycle = cycleById.get(p.cycle_id);
    if (!cycle) continue;
    const group = groupById.get(cycle.group_id);
    if (!group) continue;
    received.set(
      group.currency,
      (received.get(group.currency) ?? 0) + Number(p.amount),
    );
  }

  const circlesPerCurrency = new Map<string, Set<string>>();
  for (const g of groups) {
    const set = circlesPerCurrency.get(g.currency) ?? new Set<string>();
    set.add(g.id);
    circlesPerCurrency.set(g.currency, set);
  }

  // One currency owns the whole card — the most circles, ties broken by the
  // largest contributed total. A card reading ₦185,000 directly above
  // GH₵2,000 with no relationship is not one statement.
  const currencies = [...new Set(groups.map((g) => g.currency))];
  const primary =
    [...currencies].sort((a, b) => {
      const byCircles =
        (circlesPerCurrency.get(b)?.size ?? 0) -
        (circlesPerCurrency.get(a)?.size ?? 0);
      if (byCircles !== 0) return byCircles;
      return (contributed.get(b) ?? 0) - (contributed.get(a) ?? 0);
    })[0] ?? "NGN";

  const contributedAmount = contributed.get(primary) ?? 0;
  const receivedAmount = received.get(primary) ?? 0;
  const totals: HomeTotals = {
    contributed: {
      currency: primary,
      label: formatMoney(contributedAmount, primary),
      amount: contributedAmount,
    },
    // Hidden until it is non-zero: a permanent ₦0 beside a growing figure
    // teaches nothing and takes up the card.
    received:
      receivedAmount > 0
        ? {
            currency: primary,
            label: formatMoney(receivedAmount, primary),
            amount: receivedAmount,
          }
        : null,
    month: {
      currency: primary,
      label: formatMoney(monthAmount, primary),
      amount: monthAmount,
    },
    monthCount,
    monthName: month,
    others: currencies
      .filter((c) => c !== primary && (contributed.get(c) ?? 0) > 0)
      .map((c) => ({
        currency: c,
        label: formatMoney(contributed.get(c) ?? 0, c),
        amount: contributed.get(c) ?? 0,
        circleCount: circlesPerCurrency.get(c)?.size ?? 0,
      })),
    // Every figure at zero means the card teaches nothing — drop it.
    hasAny: contributedAmount > 0 || receivedAmount > 0 || monthAmount > 0,
  };

  // -------------------------------------------------------------- circles
  const circles: HomeCircle[] = groups.map((group) => {
    const isPaused = group.status === "paused";
    const groupCycles = cyclesByGroup.get(group.id) ?? [];
    const joinedDate = joinedDateByGroup.get(group.id);
    // Enrolled = the cycles this member was actually present for. A member who
    // joined after the rotation ran has none, and owes none.
    const allEnrolled = groupCycles.filter(
      (c) => joinedDate && c.due_date >= joinedDate,
    );
    // Scoped to this group's own slice, and a map lookup rather than a status
    // test per cycle.
    const settledCount = allEnrolled.reduce(
      (n, c) => n + (mySettledByCycle.has(c.id) ? 1 : 0),
      0,
    );

    const share = Number(group.contribution_amount);
    const saved = savedByGroup.get(group.id) ?? 0;
    const target = share * allEnrolled.length;

    // The next payout is read from the member's first unfinished recipient
    // cycle. A circle may rotate longer than its membership, so this must not
    // be the first cycle that merely names them; that would keep showing a
    // payout they already received.
    const myMemberId = myMemberIdByGroup.get(group.id) ?? null;
    const myCycle = myMemberId
      ? (groupCycles.find(
          (c) => c.recipient_member_id === myMemberId && c.status !== "completed",
        ) ?? null)
      : null;
    const myPayout = myCycle ? (payoutByCycle.get(myCycle.id) ?? null) : null;
    // A non-completed cycle with a paid-out payout should not exist — the Edge
    // Function flips both together — but the figure is money, so the row only
    // shows it when the row itself says pending.
    const payoutPending = myPayout !== null && myPayout.status !== "completed";

    const nextOwed = isPaused
      ? null
      : ((owedByGroup.get(group.id) ?? [])[0] ?? null);
    const inPlay = isPaused
      ? null
      : (groupCycles.find(
          (c) =>
            c.status !== "completed" &&
            payoutByCycle.get(c.id)?.status === "pending",
        ) ?? null);
    let payoutNote: string | null = null;
    // True when the caller still owes their share of the in-play turn.
    // R1-enrolled: a turn due before they joined is never theirs to owe.
    let waitingOnYou = false;
    if (inPlay) {
      const active = activeCountByGroup.get(group.id) ?? 0;
      const settled = settledCountByCycle.get(inPlay.id) ?? 0;
      const outstanding = Math.max(0, active - settled);
      // Whether the stalled round pays the caller decides who the note is
      // about — "your payout is waiting on someone" is actionable in a way
      // "a payout is waiting" is not.
      const mine = inPlay.recipient_member_id === myMemberId;
      const settledMembers = settledMembersByCycle.get(inPlay.id);
      const enrolledInPlay =
        !!myMemberId && !!joinedDate && inPlay.due_date >= joinedDate;
      waitingOnYou =
        enrolledInPlay && !!settledMembers && !settledMembers.has(myMemberId!);
      // Name the turn when it is not the caller's, so a blocked Turn 1 never
      // reads as the caller's own Turn 2 payout stalling.
      const subject = mine
        ? "Your payout"
        : `Turn ${inPlay.cycle_number} payout`;
      if (outstanding > 0) {
        if (waitingOnYou && outstanding === 1) {
          payoutNote = mine
            ? "Your payout waiting on you"
            : `Turn ${inPlay.cycle_number} payout waiting on you`;
        } else if (waitingOnYou) {
          const others = outstanding - 1;
          payoutNote = `${subject} waiting on you + ${others} other${others === 1 ? "" : "s"}`;
        } else {
          payoutNote = `${subject} waiting on ${outstanding} member${outstanding === 1 ? "" : "s"}`;
        }
      } else {
        payoutNote = `${subject} ready to disburse`;
      }
    }
    const isMyTurnNow =
      !!inPlay && !!myMemberId && inPlay.recipient_member_id === myMemberId;
    const inPlayPayout = inPlay ? payoutByCycle.get(inPlay.id) : undefined;
    const activeForPot = activeCountByGroup.get(group.id) ?? 0;
    const currentPotLabel = inPlay
      ? formatMoney(
          inPlayPayout ? inPlayPayout.amount : share * activeForPot,
          group.currency,
        )
      : null;
    const currentDueLabel = inPlay
      ? relativeDayLabel(inPlay.due_date, today)
      : null;

    return {
      groupId: group.id,
      name: group.name,
      status: group.status as HomeCircle["status"],
      currency: group.currency,
      amountLabel: formatMoney(share, group.currency),
      // Symbol included here rather than prepended in the component: this module
      // pre-formats every string so the server render and the /api/home refetch
      // cannot disagree, and a component-side symbol would be one more place
      // for them to.
      savedLabel: formatMoney(saved, group.currency),
      targetLabel: formatMoney(target, group.currency),
      cyclesEnrolled: allEnrolled.length,
      cyclesSettled: settledCount,
      percent:
        allEnrolled.length > 0
          ? Math.min(100, Math.round((settledCount / allEnrolled.length) * 100))
          : 0,
      // A 0-of-0 bar is not a number. A member who joined after every cycle
      // ran genuinely owes nothing, and the card says so rather than claiming
      // a perfect score.
      showBar: allEnrolled.length > 0,
      awaitingSchedule: groupCycles.length === 0,
      nextDueLabel: nextOwed ? formatCycleDate(nextOwed.dueDate) : null,
      payoutNote,
      urgent: (owedByGroup.get(group.id) ?? []).some(
        (o) => o.days <= DUE_SOON_DAYS,
      ),
      frequency: group.frequency,
      myRoundNumber: myCycle ? myCycle.cycle_number : null,
      rotationTotal: groupCycles.length,
      memberCount: activeCountByGroup.get(group.id) ?? 0,
      myPayoutLabel: payoutPending
        ? formatMoney(myPayout.amount, group.currency)
        : null,
      myPayoutDateLabel: myCycle
        ? relativeDayLabel(myCycle.due_date, today)
        : null,
      currentTurnNumber: inPlay ? inPlay.cycle_number : null,
      isMyTurnNow,
      currentPotLabel,
      currentDueLabel,
      waitingOnYou,
      href: `/groups/${group.id}`,
    };
  });

  // "Circles that matter most right now": anything with money due (soonest
  // first), then circles still waiting on a schedule because that needs the
  // organizer to act, then live circles at rest, then paused, then completed
  // history last.
  circles.sort((a, b) => {
    const rank = (c: HomeCircle) => {
      if (c.status === "completed") return 4;
      if (c.status === "paused") return 3;
      const due = (owedByGroup.get(c.groupId) ?? [])[0];
      if (due && due.days <= DUE_SOON_DAYS) return 0;
      if (c.awaitingSchedule) return 1;
      return 2;
    };
    const byRank = rank(a) - rank(b);
    if (byRank !== 0) return byRank;
    const da = (owedByGroup.get(a.groupId) ?? [])[0]?.dueDate ?? "9999";
    const db = (owedByGroup.get(b.groupId) ?? [])[0]?.dueDate ?? "9999";
    if (da !== db) return da.localeCompare(db);
    return a.name.localeCompare(b.name);
  });

  // ------------------------------------------------------------- activity
  // Settled only. Everything still upcoming already lives in the attention
  // queue, and repeating it here would undo that separation.
  const activity: RankedActivity[] = [];
  for (const { contribution: c, cycle, group } of mySettled) {
    if (!c.paid_at) continue;
    activity.push({
      id: `c:${c.id}`,
      tone: "paid",
      headline: "You contributed",
      amountLabel: formatMoney(c.amount, group.currency),
      groupName: group.name,
      dayLabel: settledDayLabel(c.paid_at, offset, today),
      contextLabel: `Turn ${cycle.cycle_number}`,
      sortKey: new Date(c.paid_at).getTime(),
    });
  }
  for (const p of payouts) {
    if (p.status !== "completed" || !p.paid_at) continue;
    const cycle = cycleById.get(p.cycle_id);
    if (!cycle) continue;
    const group = groupById.get(cycle.group_id);
    if (!group) continue;
    const mine = myMemberIds.has(p.recipient_member_id);
    activity.push({
      id: `p:${p.id}`,
      tone: mine ? "received" : "circle-payout",
      // A payouts row is a per-cycle disbursement for the whole circle, so
      // "received" is only true when the recipient is the caller.
      headline: mine ? "You received" : "Circle payout",
      amountLabel: formatMoney(p.amount, group.currency),
      groupName: group.name,
      dayLabel: settledDayLabel(p.paid_at, offset, today),
      contextLabel: `Turn ${cycle.cycle_number}`,
      sortKey: new Date(p.paid_at).getTime(),
    });
  }
  activity.sort((a, b) => b.sortKey - a.sortKey);
  const recent: HomeActivity[] = activity.slice(0, 5).map((item) => ({
    id: item.id,
    tone: item.tone,
    headline: item.headline,
    amountLabel: item.amountLabel,
    groupName: item.groupName,
    dayLabel: item.dayLabel,
    contextLabel: item.contextLabel,
  }));

  const activeCircleCount = groups.filter((g) => g.status === "active").length;

  return {
    greeting: greetingFor(offset),
    firstName,
    totals,
    activeCircleCount,
    paymentProgress,
    attention,
    invites,
    // Home shows the top-ranked few; the /groups directory passes
    // circleLimit: Infinity for the full list (circlesTotal stays whole).
    circles: circles.slice(0, opts.circleLimit ?? 4),
    circlesTotal: groups.length,
    activity: recent,
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
