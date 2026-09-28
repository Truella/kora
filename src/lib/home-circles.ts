// Home snapshot phase 4: per-circle cards, ranked for the directory.
// Pure derivation over the fetch bundle + owed/totals contexts.
import {
  formatCycleDate,
  formatMoney,
  relativeDayLabel,
  utcDateOnly,
} from "./money";
import { DUE_SOON_DAYS } from "@/constants/home";
import type {
  HomeCircle,
  HomeRawBundle,
  OwedContext,
  TotalsContext,
} from "@/types/home";

export function buildCircles(
  bundle: HomeRawBundle,
  owed: OwedContext,
  totals: TotalsContext,
): HomeCircle[] {
  const { today } = bundle;
  const {
    owedByGroup,
    mySettledByCycle,
    joinedDateByGroup,
    settledMembersByCycle,
    myMemberIdByGroup,
    membersByGroup,
    activeCountByGroup,
  } = owed;
  const { savedByGroup } = totals;
  const { groups, cyclesByGroup, payoutByCycle } = bundle;

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
      // Enrolled-only gate: the turn's pot is the members present on its due
      // day. A pre-join orphan share (crafted request, now refused) must not
      // cover for a missing enrolled one.
      const roster = membersByGroup.get(group.id) ?? [];
      const enrolledIds = new Set(
        roster
          .filter((m) => utcDateOnly(m.joined_at) <= inPlay.due_date)
          .map((m) => m.id),
      );
      const settledMembers = settledMembersByCycle.get(inPlay.id);
      let enrolledSettled = 0;
      if (settledMembers) {
        for (const id of settledMembers) {
          if (enrolledIds.has(id)) enrolledSettled += 1;
        }
      }
      const outstanding = Math.max(0, enrolledIds.size - enrolledSettled);
      // Whether the stalled round pays the caller decides who the note is
      // about — "your payout is waiting on someone" is actionable in a way
      // "a payout is waiting" is not.
      const mine = inPlay.recipient_member_id === myMemberId;
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
    const enrolledForPot = inPlay
      ? (membersByGroup.get(group.id) ?? []).filter(
          (m) => utcDateOnly(m.joined_at) <= inPlay.due_date,
        ).length
      : 0;
    const currentPotLabel = inPlay
      ? formatMoney(
          inPlayPayout ? inPlayPayout.amount : share * enrolledForPot,
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

  return circles;
}
