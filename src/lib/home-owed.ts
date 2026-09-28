// Home snapshot phase 2: owed queue + attention items.
// Pure derivation over the fetch bundle — no queries.
import {
  daysUntil,
  formatCycleDate,
  formatMoney,
  utcDateOnly,
} from "./money";
import { DUE_SOON_DAYS } from "@/constants/home";
import type {
  HomeAttention,
  HomeRawBundle,
  OwedContext,
  OwedItem,
} from "@/types/home";

export function buildOwedContext(bundle: HomeRawBundle): OwedContext {
  const {
    userId,
    today,
    groups,
    members,
    cycles,
    requests,
    groupById,
    voteRows,
  } = bundle;

  // One pass over the roster: active counts, per-group rosters, and the
  // caller's own membership facts (the rotation lookup needs the membership
  // id — that is what `cycles.recipient_member_id` points at — not the user
  // id, and only one membership per group can be the caller's).
  const myMemberIdByGroup = new Map<string, string>();
  const myJoinedByGroup = new Map<string, string>();
  const activeCountByGroup = new Map<string, number>();
  // Roster per group for enrolled-only payout math: a turn's pot is the
  // members present on its due day, not the current headcount.
  const membersByGroup = new Map<string, { id: string; joined_at: string }[]>();
  for (const m of members) {
    activeCountByGroup.set(
      m.group_id,
      (activeCountByGroup.get(m.group_id) ?? 0) + 1,
    );
    const list = membersByGroup.get(m.group_id) ?? [];
    list.push({ id: m.id, joined_at: m.joined_at });
    membersByGroup.set(m.group_id, list);
    if (m.user_id !== userId) continue;
    myMemberIdByGroup.set(m.group_id, m.id);
    myJoinedByGroup.set(m.group_id, m.joined_at);
  }

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

  // Both contribution queries already filtered to settled, so neither map
  // re-checks status. This is the one place that distinction is load-bearing:
  // the payout note compares this against *all* active members, not just the
  // caller's rows, which is why it needs its own query rather than
  // myContributions.
  const settledMembersByCycle = new Map<string, Set<string>>();
  for (const row of bundle.settledCountRows) {
    const set = settledMembersByCycle.get(row.cycle_id) ?? new Set<string>();
    set.add(row.member_id);
    settledMembersByCycle.set(row.cycle_id, set);
  }

  // Keyed by cycle: one member has at most one contribution per cycle, and
  // every reader only ever asks "did mine settle?".
  const mySettledByCycle = new Map(
    bundle.myContributions.map((c) => [c.cycle_id, c]),
  );

  const owedByGroup = new Map<string, OwedItem[]>();
  const allOwed: OwedItem[] = [];

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
    const owed: OwedItem = {
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

  const votedOn = new Set(voteRows.map((v) => v.join_request_id));
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

  return {
    owedByGroup,
    moneyItems,
    voteItems,
    attention,
    mySettledByCycle,
    joinedDateByGroup,
    settledMembersByCycle,
    myMemberIdByGroup,
    membersByGroup,
    activeCountByGroup,
  };
}
