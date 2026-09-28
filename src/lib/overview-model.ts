// Circle overview view model: pure derivation over lib/overview-rows.
// Moved verbatim from the detail page so the page is composition only.
// Every string the UI shows is pre-formatted here, so server render and
// client components cannot disagree. Turn-level models build in
// lib/overview-turns from explicit context.

import {
  utcDateOnly,
  formatCycleDate,
  currencySymbol,
} from "./money";
import type {
  OverviewData,
  OverviewViewModel,
} from "@/types/circle";
import type { OverviewRows } from "./overview-rows";
import { buildCurrentTurn, buildUpcomingTurns } from "./overview-turns";

// Reminder windows, computed once per render outside the component body
// so the purity lint stays quiet — values are plain date strings.
function dueWindows(): { today: string; soonCutoff: string } {
  const today = new Date().toISOString().slice(0, 10);
  const soonCutoff = new Date(Date.now() + 3 * 86400000)
    .toISOString()
    .slice(0, 10);
  return { today, soonCutoff };
}

export function buildOverviewModel(
  rows: OverviewRows,
  opts: { userId: string | null; confirming: boolean },
): OverviewViewModel {
  const { group, member, cycles } = rows;
  if (!group) return { found: false };

  const { userId, confirming } = opts;
  const symbol = currencySymbol(group.currency);
  const amountLabel = `${symbol}${Number(group.contribution_amount).toLocaleString()}`;

  // Finished circles read differently everywhere below: invites, sync and
  // votes go away — a circle that is over must not silently gain members,
  // dues or turns.
  const isCompleted = group.status === "completed";

  // Current turn = the first cycle still in flight, oldest first. All
  // settled → the hero shows the last one with a Settled state instead of
  // going empty.
  const sortedCycles = rows.cycles;
  const currentCycle =
    sortedCycles.find((c) => c.status !== "completed") ??
    sortedCycles[sortedCycles.length - 1] ??
    null;
  const upcomingCycles = currentCycle
    ? sortedCycles.filter((c) => c.cycle_number > currentCycle.cycle_number)
    : [];

  const byUser = new Map(rows.recipientProfiles.map((p) => [p.id, p.full_name]));
  const recipientNames = new Map(
    rows.recipientMembers.map((m) => [
      m.id,
      byUser.get(m.user_id) ?? `····${m.user_id.slice(-4)}`,
    ]),
  );
  const payoutByCycle = new Map(rows.payouts.map((p) => [p.cycle_id, p]));
  const potFor = (cycleId: string): string | null => {
    const row = payoutByCycle.get(cycleId);
    if (!row) return null;
    return `${symbol}${Number(row.amount).toLocaleString()}`;
  };

  // Active member count — feeds the generator card pre-schedule and the
  // creator's sync affordance once the rotation exists.
  const scheduledCount = new Set(cycles.map((c) => c.recipient_member_id)).size;
  // Repair fallback, not a step the organizer owes: voted-in members get
  // their turn appended at approval time, so this only fires for
  // pre-trigger members or a lost admission/sync race.
  const showSync =
    !!member &&
    !!userId &&
    !isCompleted &&
    group.created_by === userId &&
    cycles.length > 0 &&
    (rows.activeCount ?? 0) > scheduledCount;

  const byCycle = new Map(rows.contributions.map((c) => [c.cycle_id, c]));
  const settledByMember = new Map(
    rows.currentContributions.map((r) => [r.member_id, r.status]),
  );

  // R1 — a member owes a cycle only if its due date falls on or after the
  // day they became an active member. Billing only: settled money is history
  // and still counts. utcDateOnly (not the member's offset) so this agrees
  // with process-payout's settle gate.
  const joinedAt = member?.joined_at ?? null;
  const joinedDate = joinedAt ? utcDateOnly(joinedAt) : null;
  const enrolledIn = (c: { due_date: string }) =>
    !joinedDate || c.due_date >= joinedDate;

  const isCreator = !!userId && group.created_by === userId;
  const { today, soonCutoff } = dueWindows();

  // In-app reminders from already-fetched rows, no new queries. "No row"
  // counts as unpaid so the nudge fires before the first payment too; only
  // the current turn is payable, so only it can nudge.
  const unpaidCycles = cycles.filter((c) => {
    if (c.id !== currentCycle?.id) return false;
    if (!enrolledIn(c)) return false;
    const mine = byCycle.get(c.id);
    return !mine || (mine.status !== "paid" && mine.status !== "late");
  });
  const overdueCycles = unpaidCycles.filter((c) => c.due_date < today);
  const dueSoonCycles =
    overdueCycles.length === 0
      ? unpaidCycles.filter((c) => c.due_date <= soonCutoff)
      : [];

  const circleRows = rows.circleMembers;
  const myCircleRow = userId
    ? circleRows.find((m) => m.user_id === userId)
    : undefined;
  const myTurnPosition = myCircleRow?.payout_position ?? null;

  const current = currentCycle
    ? buildCurrentTurn({
        cycle: currentCycle,
        memberId: member?.id ?? null,
        amountLabel,
        myContribution: byCycle.get(currentCycle.id),
        enrolledCurrent: enrolledIn(currentCycle),
        payout: payoutByCycle.get(currentCycle.id),
        recipientName:
          recipientNames.get(currentCycle.recipient_member_id) ?? null,
        pot: potFor(currentCycle.id),
        myTurnPosition,
        roster: circleRows,
        activeCount: rows.activeCount,
        settledByMember,
      })
    : null;

  const upcoming = buildUpcomingTurns({
    upcomingCycles,
    currentTurnNumber: currentCycle?.cycle_number ?? null,
    memberId: member?.id ?? null,
    amountLabel,
    roster: circleRows,
    statusFor: (cycleId) => byCycle.get(cycleId)?.status,
    isEnrolled: (cycle) => enrolledIn(cycle),
    recipientName: (id) => recipientNames.get(id) ?? null,
    potFor: (cycleId) => potFor(cycleId),
  });

  const data: OverviewData = {
    found: true,
    groupId: group.id,
    amountLabel,
    frequency: group.frequency,
    confirming,
    isCompleted,
    hasMember: !!member,
    isCreator,
    overdue:
      member && overdueCycles.length > 0
        ? {
            count: overdueCycles.length,
            firstNumber: overdueCycles[0].cycle_number,
            firstDue: formatCycleDate(overdueCycles[0].due_date),
          }
        : null,
    dueSoon:
      member && dueSoonCycles.length > 0
        ? {
            amountLabel,
            firstDue: formatCycleDate(dueSoonCycles[0].due_date),
            firstNumber: dueSoonCycles[0].cycle_number,
            extra: dueSoonCycles.length - 1,
          }
        : null,
    schedule:
      cycles.length === 0
        ? !isCompleted && member && isCreator
          ? { kind: "generate", memberCount: rows.activeCount ?? 1 }
          : !isCompleted
            ? { kind: "waiting" }
            : { kind: "ready" }
        : { kind: "ready" },
    current,
    upcoming,
    sync: showSync
      ? {
          memberCount: rows.activeCount ?? scheduledCount,
          newCount: (rows.activeCount ?? scheduledCount) - scheduledCount,
        }
      : null,
  };
  return data;
}
