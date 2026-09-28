// Ledger period grid: per-turn cells + per-member totals.
// Pure derivation — the caller (lib/ledger-grid) threads explicit context.
import { formatCycleDate, formatMoney, utcDateOnly } from "./money";
import type {
  LedgerBookCell,
  LedgerBookMemberTotal,
  LedgerBookPeriod,
} from "@/app/(app)/groups/[id]/ledger/LedgerBook";
import type { CircleMemberRow } from "@/types/circle";

export type LedgerCycle = {
  id: string;
  cycle_number: number;
  due_date: string;
  status: string;
  recipient_member_id: string;
};

export type PeriodsContext = {
  cycles: LedgerCycle[];
  members: CircleMemberRow[];
  contributions: { member_id: string; status: string }[];
  contribByKey: Map<string, string>;
  payoutByCycle: Map<string, string>;
  shareAmount: number;
  currency: string;
  today: string;
  nameOf: (m: CircleMemberRow) => string;
};

export function buildLedgerPeriods(ctx: PeriodsContext): {
  periods: LedgerBookPeriod[];
  memberTotals: LedgerBookMemberTotal[];
} {
  const {
    cycles,
    members,
    contributions,
    contribByKey,
    payoutByCycle,
    shareAmount,
    currency,
    today,
    nameOf,
  } = ctx;

  // Periods read as turns, never calendar weeks — the rotation position is
  // what matters, not the weekday it lands on.
  const enrolledIn = (m: CircleMemberRow, dueDate: string) =>
    utcDateOnly(m.joined_at) <= dueDate;

  const periods: LedgerBookPeriod[] = cycles.map((cycle) => {
    const cells: LedgerBookCell[] = members.map((m) => {
      const isRecipient = m.id === cycle.recipient_member_id;
      if (!enrolledIn(m, cycle.due_date)) {
        return { memberId: m.id, status: "skipped", isRecipient };
      }
      const raw = contribByKey.get(`${cycle.id}:${m.id}`);
      if (raw === "paid" || raw === "late") {
        return { memberId: m.id, status: raw, isRecipient };
      }
      return {
        memberId: m.id,
        status: cycle.due_date < today ? "overdue" : "pending",
        isRecipient,
      };
    });

    const expectedCount = members.filter((m) =>
      enrolledIn(m, cycle.due_date),
    ).length;
    const settledCount = cells.filter(
      (c) => c.status === "paid" || c.status === "late",
    ).length;

    const recipient = members.find(
      (m) => m.id === cycle.recipient_member_id,
    );

    return {
      cycleNumber: cycle.cycle_number,
      periodLabel: `Turn ${cycle.cycle_number}`,
      dueLabel: `Due ${formatCycleDate(cycle.due_date)}`,
      recipientName: recipient ? nameOf(recipient) : "—",
      expectedCount,
      settledCount,
      collectedLabel: formatMoney(settledCount * shareAmount, currency),
      expectedLabel: formatMoney(expectedCount * shareAmount, currency),
      payoutStatus: payoutByCycle.get(cycle.id) ?? "pending",
      cells,
    };
  });

  const totalsByMember = new Map<string, { paid: number; late: number }>();
  for (const c of contributions) {
    const t = totalsByMember.get(c.member_id) ?? { paid: 0, late: 0 };
    if (c.status === "paid") t.paid += 1;
    else if (c.status === "late") t.late += 1;
    totalsByMember.set(c.member_id, t);
  }

  const memberTotals: LedgerBookMemberTotal[] = members.map((m) => {
    const t = totalsByMember.get(m.id) ?? { paid: 0, late: 0 };
    const pending = periods.filter((p) =>
      p.cells.some(
        (c) => c.memberId === m.id && c.status === "pending",
      ),
    ).length;
    const overdue = periods.filter((p) =>
      p.cells.some(
        (c) => c.memberId === m.id && c.status === "overdue",
      ),
    ).length;
    return {
      memberId: m.id,
      name: nameOf(m),
      paid: t.paid,
      late: t.late,
      pending,
      overdue,
      totalPaidLabel: formatMoney(
        (t.paid + t.late) * shareAmount,
        currency,
      ),
    };
  });

  return { periods, memberTotals };
}
