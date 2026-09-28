// Circle overview turn builders: the current-turn hero model and the
// upcoming-turn rows. Pure derivation — the caller threads explicit
// context so this module never reaches into query state.
import { formatCycleDate, formatCycleDateShort, utcDateOnly } from "./money";
import { collectTurnLabel } from "./rotation";
import type { CurrentTurnModel, UpcomingTurnRow } from "@/types/circle";
import type { OverviewCycleRow } from "./overview-rows";

type RosterRow = { id: string; joined_at: string };

// Shares a turn asks for: enrolled members on its due day, not pot ÷ share.
// Enrollment is the source of truth; the payout figure only names the pot.
function enrolledFor(roster: RosterRow[], dueDate: string): number {
  return roster.filter((m) => utcDateOnly(m.joined_at) <= dueDate).length;
}

function sharesFor(
  roster: RosterRow[],
  cycle: { due_date: string },
): number | null {
  const n = enrolledFor(roster, cycle.due_date);
  return n > 0 ? n : null;
}

export type CurrentTurnContext = {
  cycle: OverviewCycleRow;
  memberId: string | null;
  amountLabel: string;
  myContribution: { status: string; paid_at: string | null } | undefined;
  enrolledCurrent: boolean;
  payout:
    | { status: string; paid_at: string | null; amount: number | string }
    | undefined;
  recipientName: string | null;
  pot: string | null;
  myTurnPosition: number | null;
  roster: RosterRow[];
  activeCount: number | null;
  settledByMember: Map<string, string>;
};

export function buildCurrentTurn(ctx: CurrentTurnContext): CurrentTurnModel {
  const {
    cycle,
    memberId,
    amountLabel,
    myContribution,
    enrolledCurrent,
    payout,
    recipientName,
    pot,
    myTurnPosition,
    roster,
    activeCount,
    settledByMember,
  } = ctx;

  // Hero derivations for the current turn. R1 enrollment applies: a turn
  // that fell due before the caller joined is not theirs to pay.
  const myCurrentStatus = enrolledCurrent
    ? myContribution?.status ?? "pending"
    : "skipped";
  const myCurrentSettled =
    myCurrentStatus === "paid" || myCurrentStatus === "late";
  const currentPayoutStatus = payout?.status ?? "pending";
  const isMyTurn = !!memberId && cycle.recipient_member_id === memberId;

  // Shares the payout gate waits on: active members enrolled on or before
  // the turn's due date — the same boundary process-payout enforces. A late
  // joiner never owed this turn, so counting them would stall the button
  // forever. Enrolled-only settlement for the same reason.
  const enrolledCount = enrolledFor(roster, cycle.due_date);
  const expectedCount =
    enrolledCount > 0 ? enrolledCount : (activeCount ?? roster.length);
  const enrolledIds = new Set(
    roster
      .filter((m) => utcDateOnly(m.joined_at) <= cycle.due_date)
      .map((m) => m.id),
  );
  const settledCount = [...settledByMember.entries()].filter(
    ([id, s]) => (s === "paid" || s === "late") && enrolledIds.has(id),
  ).length;
  // The confirm button only exists once the payout can actually complete.
  // Before that the row says what's missing instead of offering a dead tap.
  // Demo rule: the moment every enrolled share lands, the receiver can
  // collect — no waiting for the due date. process-payout enforces the same,
  // so the two can never disagree.
  const payoutReady = expectedCount > 0 && settledCount >= expectedCount;

  return {
    cycleId: cycle.id,
    anchorId: `cycle-${cycle.id}`,
    turnNumber: cycle.cycle_number,
    status: cycle.status,
    chip:
      cycle.status === "completed"
        ? { kind: "settled" }
        : {
            kind: "due",
            label: `Due ${formatCycleDate(cycle.due_date)}`,
          },
    positionLine: collectTurnLabel(
      myTurnPosition,
      cycle.cycle_number,
      cycle.status === "completed",
    ),
    contributionAmount: amountLabel,
    contribution:
      myCurrentStatus === "skipped"
        ? { kind: "skipped" }
        : myCurrentSettled
          ? {
              kind: "paid",
              late: myCurrentStatus === "late",
              paidAt: myContribution?.paid_at ?? null,
            }
          : memberId && enrolledCurrent
            ? {
                kind: "pending-member",
                due: formatCycleDate(cycle.due_date),
              }
            : {
                kind: "plain",
                due: formatCycleDate(cycle.due_date),
              },
    receiver: {
      label: isMyTurn ? "Your payout" : "Receiver",
      amount: pot ?? amountLabel,
      highlight: isMyTurn,
      sub: resolveReceiverSub(),
    },
    settled: settledCount,
    expected: expectedCount,
    contributionDue:
      memberId &&
      cycle.status !== "completed" &&
      enrolledCurrent &&
      !myCurrentSettled
        ? {
            turnNumber: cycle.cycle_number,
            amount: amountLabel,
            due: formatCycleDate(cycle.due_date),
          }
        : null,
    payoutReady:
      memberId && currentPayoutStatus === "pending" && payoutReady && isMyTurn
        ? { turnNumber: cycle.cycle_number, pot }
        : null,
  };

  function resolveReceiverSub(): string {
    if (currentPayoutStatus === "completed") {
      if (isMyTurn) {
        const when = payout?.paid_at
          ? formatCycleDateShort(payout.paid_at)
          : formatCycleDate(cycle.due_date);
        return `✓ Received ${when}`;
      }
      return recipientName ? `${recipientName} received` : "Disbursed";
    }
    if (currentPayoutStatus === "failed") {
      return "Payout failed. Contact the organizer";
    }
    if (isMyTurn) {
      return `You receive · ${formatCycleDate(cycle.due_date)}`;
    }
    if (recipientName) {
      return `${recipientName} receives · ${formatCycleDate(cycle.due_date)}`;
    }
    return `Due ${formatCycleDate(cycle.due_date)}`;
  }
}

export type UpcomingTurnsContext = {
  upcomingCycles: OverviewCycleRow[];
  currentTurnNumber: number | null;
  memberId: string | null;
  amountLabel: string;
  roster: RosterRow[];
  statusFor: (cycleId: string) => string | undefined;
  isEnrolled: (cycle: { due_date: string }) => boolean;
  recipientName: (memberId: string) => string | null;
  potFor: (cycleId: string) => string | null;
};

// Compressed upcoming rows, read-only: only the current turn is payable,
// so an unpaid future turn says when it opens instead of offering Pay.
// Completed turns are absent — the ledger feeds carry settled history.
export function buildUpcomingTurns(
  ctx: UpcomingTurnsContext,
): UpcomingTurnRow[] {
  const {
    upcomingCycles,
    currentTurnNumber,
    memberId,
    amountLabel,
    roster,
    statusFor,
    isEnrolled,
    recipientName,
    potFor,
  } = ctx;

  return upcomingCycles.map((cycle) => {
    const enrolled = isEnrolled(cycle);
    const status = enrolled ? statusFor(cycle.id) ?? "pending" : "skipped";
    const recipient = recipientName(cycle.recipient_member_id);
    // "You" when the caller is the collector — with no past-turn list, this
    // row is the only place a future turn says it is yours to receive.
    const receiver =
      memberId && cycle.recipient_member_id === memberId ? "You" : recipient;
    const pot = potFor(cycle.id);
    const shares = sharesFor(roster, cycle);
    const date = formatCycleDate(cycle.due_date);
    const collectionSentence =
      shares === null
        ? null
        : `${shares} ${shares === 1 ? "person" : "people"} will pay ${amountLabel}${shares > 1 ? " each" : ""}.`;
    const paymentSentence = !pot
      ? receiver
        ? `${receiver} will receive the collected money on ${date}.`
        : `The collected money will be sent on ${date}.`
      : receiver
        ? `${receiver} will receive ${pot} on ${date}.`
        : `${pot} will be paid on ${date}.`;
    const meta =
      collectionSentence && paymentSentence
        ? `${collectionSentence} ${paymentSentence}`
        : paymentSentence;
    // The one fact only the caller can know: what this turn asks of them.
    // The `skipped` branch is defensive — an upcoming turn's due date is
    // always after the join date.
    const opener =
      currentTurnNumber !== null
        ? ` · pay opens after Turn ${currentTurnNumber}`
        : "";
    const shareLine =
      status === "skipped"
        ? "You joined after this turn"
        : status === "paid"
          ? `You paid ${amountLabel}`
          : status === "late"
            ? `You paid ${amountLabel} late`
            : `You owe ${amountLabel}${opener}`;
    return {
      anchorId: `cycle-${cycle.id}`,
      turnNumber: cycle.cycle_number,
      meta,
      shareLine,
    };
  });
}
