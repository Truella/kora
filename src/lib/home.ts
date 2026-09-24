import type { SupabaseClient } from "@supabase/supabase-js";
import {
  formatAmount,
  formatCycleDate,
  formatMoney,
  greetingFor,
  daysUntil,
  localParts,
  monthName,
  offsetForCountry,
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
  status: string;
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
  // A row that reads as a circle rather than a progress bar needs to say who is
  // in it and how often it runs — otherwise it is just a bar with a name on it.
  memberCount: number;
  frequency: string;
  href: string;
};

export type HomeActivity = {
  id: string;
  tone: "paid" | "received" | "circle-payout";
  headline: string;
  amountLabel: string;
  groupName: string;
  dayLabel: string;
};

/** Sort key is build-time only and never serialized. */
type RankedActivity = HomeActivity & { sortKey: number };

export type HomeSnapshot = {
  greeting: "morning" | "afternoon" | "evening";
  firstName: string | null;
  totals: HomeTotals;
  attention: HomeAttention[];
  attentionState: "items" | "caught-up" | "complete" | "none";
  nextDueLabel: string | null;
  circles: HomeCircle[];
  circlesTotal: number;
  activity: HomeActivity[];
  makeContributionHref: string | null;
  memberCount: number;
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

// Settled is defined once and pushed into the query as a filter, so the
// in-memory code never has to re-test the same condition the database already
// applied. A JS-side `SETTLED` set would only be a second place for the rule to
// drift out of sync with the SQL.
const SETTLED_STATUSES: string[] = ["paid", "late"];

export async function getHomeSnapshot(
  supabase: SupabaseClient,
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

  // Wave 1 — the three reads that need nothing but the session.
  const [profileRes, groupsRes] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
    // RLS ("view groups you belong to") scopes this to the caller's circles,
    // so it doubles as the group-id source for every scoped read below.
    supabase
      .from("groups")
      .select(
        "id, name, currency, contribution_amount, frequency, status, created_at",
      )
      .order("created_at", { ascending: false }),
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

  if (groups.length === 0) {
    return {
      ...emptySnapshot(),
      greeting: greetingFor(offset),
      firstName,
      memberCount: 0,
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
      .select("id, group_id, cycle_number, due_date, status")
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
  const activeCountByGroup = new Map<string, number>();
  for (const m of members) {
    activeCountByGroup.set(
      m.group_id,
      (activeCountByGroup.get(m.group_id) ?? 0) + 1,
    );
    if (m.user_id !== user.id) continue;
    myMemberIds.add(m.id);
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
          .select("cycle_id")
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
  const scheduledGroupIds = new Set<string>();
  for (const c of cycles) {
    const list = cyclesByGroup.get(c.group_id);
    if (list) list.push(c);
    else cyclesByGroup.set(c.group_id, [c]);
    scheduledGroupIds.add(c.group_id);
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
  for (const row of settledCountRes.data ?? []) {
    settledCountByCycle.set(
      row.cycle_id,
      (settledCountByCycle.get(row.cycle_id) ?? 0) + 1,
    );
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

  for (const cycle of cycles) {
    // Disbursed rounds are history, not a work queue.
    if (cycle.status === "completed") continue;
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

  const attention = [...moneyItems, ...voteItems];

  // A rotation that is finished everywhere is a success state, not an empty
  // shell. And a member with no rotation started anywhere is not "caught up" —
  // there is nothing to be caught up on, so the section is suppressed rather
  // than contradicting the circle card that says "waiting for schedule".
  // scheduledGroupIds was built in the single pass over cycles, so this is a
  // set lookup per group rather than a scan of every cycle.
  const scheduledGroups = groups.filter((g) => scheduledGroupIds.has(g.id));
  const attentionState: HomeSnapshot["attentionState"] =
    attention.length > 0
      ? "items"
      : allOwed.length > 0
        ? "caught-up"
        : scheduledGroups.length === 0
          ? "none"
          : scheduledGroups.every((g) => g.status === "completed")
            ? "complete"
            : "caught-up";
  const nextDueLabel =
    attentionState === "caught-up" && allOwed.length > 0
      ? formatCycleDate(allOwed[0].dueDate)
      : null;

  // --------------------------------------------------------------- totals
  const contributed = new Map<string, number>();
  const received = new Map<string, number>();
  // Each circle's saved figure used to be its own filter over the entire
  // contributions table. It falls out of the same pass as the lifetime total —
  // same rows, same group lookup, one scan instead of one scan per group.
  const savedByGroup = new Map<string, number>();
  // Rows that resolved to a real cycle and group, carried through to the
  // activity feed so it does not repeat the lookups.
  const mySettled: { contribution: ContributionRow; group: GroupRow }[] = [];
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
    mySettled.push({ contribution: c, group });
    if (c.paid_at) {
      const at = localParts(c.paid_at, offset);
      if (at.y === today.y && at.m === today.m) {
        monthAmount += amount;
        monthCount += 1;
      }
    }
  }

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

    const nextOwed = (owedByGroup.get(group.id) ?? [])[0] ?? null;
    const inPlay =
      groupCycles.find(
        (c) => c.status !== "completed" && payoutByCycle.get(c.id)?.status === "pending",
      ) ?? null;
    let payoutNote: string | null = null;
    if (inPlay) {
      const active = activeCountByGroup.get(group.id) ?? 0;
      const settled = settledCountByCycle.get(inPlay.id) ?? 0;
      const outstanding = Math.max(0, active - settled);
      payoutNote =
        outstanding > 0
          ? `Payout pending · ${outstanding} member${outstanding === 1 ? "" : "s"} outstanding`
          : "Payout pending · ready to disburse";
    }

    return {
      groupId: group.id,
      name: group.name,
      status: group.status,
      currency: group.currency,
      amountLabel: formatMoney(share, group.currency),
      savedLabel: formatAmount(saved),
      targetLabel: formatAmount(target),
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
      urgent: (owedByGroup.get(group.id) ?? []).some((o) => o.days <= 0),
      memberCount: activeCountByGroup.get(group.id) ?? 0,
      frequency: group.frequency,
      href: `/groups/${group.id}`,
    };
  });

  // "Circles that matter most right now": anything with money due (soonest
  // first), then circles still waiting on a schedule because that needs the
  // organizer to act, then the rest newest-first.
  circles.sort((a, b) => {
    const rank = (c: HomeCircle) => {
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
  for (const { contribution: c, group } of mySettled) {
    if (!c.paid_at) continue;
    activity.push({
      id: `c:${c.id}`,
      tone: "paid",
      headline: "You contributed",
      amountLabel: formatMoney(c.amount, group.currency),
      groupName: group.name,
      dayLabel: settledDayLabel(c.paid_at, offset, today),
      sortKey: new Date(c.paid_at).getTime(),
    });
  }
  for (const p of payouts) {
    if (p.status !== "completed" || !p.paid_at) continue;
    const cycle = cycleById.get(p.cycle_id);
    const group = cycle ? groupById.get(cycle.group_id) : undefined;
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
  }));

  // "Make contribution" routes into the payment flow rather than being one of
  // its own — one owed cycle goes straight to it, several go to the queue that
  // is already on screen, none means the action is hidden.
  const makeContributionHref =
    moneyItems.length === 1
      ? moneyItems[0].href
      : moneyItems.length > 1
        ? "#attention"
        : null;

  return {
    greeting: greetingFor(offset),
    firstName,
    totals,
    attention,
    attentionState,
    nextDueLabel,
    circles: circles.slice(0, 3),
    circlesTotal: groups.length,
    activity: recent,
    makeContributionHref,
    memberCount: myMemberIds.size,
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
    attention: [],
    attentionState: "caught-up",
    nextDueLabel: null,
    circles: [],
    circlesTotal: 0,
    activity: [],
    makeContributionHref: null,
    memberCount: 0,
  };
}
