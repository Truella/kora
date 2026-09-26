import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  formatCycleDate,
  formatMoney,
  parseDateOnly,
  utcDateOnly,
} from "@/lib/money";
import CircleHeader from "../components/CircleHeader";
import ExportButton from "./ExportButton";
import LedgerBook, {
  type LedgerBookCell,
  type LedgerBookMemberTotal,
  type LedgerBookPeriod,
} from "./LedgerBook";

export const metadata = { title: "Ledger book" };

const MONTH_ABBR = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// "2026-09-26" → "26 Sep 2026" — the meta line reads as print, not storage.
function formatPrintedLabel(dateOnly: string): string {
  const c = parseDateOnly(dateOnly);
  if (!c) return dateOnly;
  return `${c.d} ${MONTH_ABBR[c.m - 1]} ${c.y}`;
}

export default async function LedgerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Wave 1 — group + membership need nothing but the route id.
  const [groupRes, memberRes] = await Promise.all([
    supabase
      .from("groups")
      .select(
        "id, name, contribution_amount, currency, frequency, status, created_by",
      )
      .eq("id", id)
      .maybeSingle(),
    user
      ? supabase
          .from("group_members")
          .select("id")
          .eq("group_id", id)
          .eq("user_id", user.id)
          .eq("status", "active")
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const group = groupRes.data;
  const member = memberRes.data;

  if (!group || !member) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-3 px-8 py-12 text-center">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-text-primary">
          Ledger unavailable
        </h1>
        <p className="max-w-xs text-sm leading-6 text-text-secondary">
          It may not exist, or you are not a member of it.
        </p>
        <Link
          href="/groups"
          className="mt-2 rounded-[10px] bg-primary px-5 py-[13px] text-sm font-semibold text-white hover:bg-primary-hover"
        >
          Back to circles
        </Link>
      </main>
    );
  }

  const shareAmount = Number(group.contribution_amount);
  const shareLabel = formatMoney(shareAmount, group.currency);
  // Periods read as turns, never calendar weeks — the rotation position is
  // what matters, not the weekday it lands on.
  const periodWord = "Turn";
  const today = new Date().toISOString().slice(0, 10);

  // Wave 2 — rotation + roster need only the group id.
  const [cyclesRes, rosterRes] = await Promise.all([
    supabase
      .from("cycles")
      .select("id, cycle_number, due_date, status, recipient_member_id")
      .eq("group_id", id)
      .order("cycle_number", { ascending: true }),
    supabase
      .from("group_members")
      .select("id, user_id, payout_position, joined_at")
      .eq("group_id", id)
      .eq("status", "active")
      .order("payout_position", { ascending: true }),
  ]);
  const cycles = cyclesRes.data;
  const circleMembers = rosterRes.data;

  const sortedCycles = [...(cycles ?? [])].sort(
    (a, b) => a.cycle_number - b.cycle_number,
  );

  type MemberRow = {
    id: string;
    user_id: string;
    payout_position: number | null;
    joined_at: string;
  };
  const memberRows = (circleMembers ?? []) as MemberRow[];
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
  const memberName = (m: MemberRow) =>
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

  const enrolledIn = (m: MemberRow, dueDate: string) =>
    utcDateOnly(m.joined_at) <= dueDate;

  const periods: LedgerBookPeriod[] = sortedCycles.map((cycle) => {
    const cells: LedgerBookCell[] = orderedMembers.map((m) => {
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

    const expectedCount = orderedMembers.filter((m) =>
      enrolledIn(m, cycle.due_date),
    ).length;
    const settledCount = cells.filter(
      (c) => c.status === "paid" || c.status === "late",
    ).length;

    return {
      cycleNumber: cycle.cycle_number,
      periodLabel: `${periodWord} ${cycle.cycle_number}`,
      dueLabel: `Due ${formatCycleDate(cycle.due_date)}`,
      expectedCount,
      settledCount,
      payoutStatus: payoutByCycle.get(cycle.id) ?? "pending",
      cells,
    };
  });

  const totalsByMember = new Map<string, { paid: number; late: number }>();
  for (const c of (contributions ?? []) as {
    member_id: string;
    status: string;
  }[]) {
    const t = totalsByMember.get(c.member_id) ?? { paid: 0, late: 0 };
    if (c.status === "paid") t.paid += 1;
    else if (c.status === "late") t.late += 1;
    totalsByMember.set(c.member_id, t);
  }

  const memberTotals: LedgerBookMemberTotal[] = orderedMembers.map((m) => {
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
      name: memberName(m),
      paid: t.paid,
      late: t.late,
      pending,
      overdue,
      totalPaidLabel: formatMoney(
        (t.paid + t.late) * shareAmount,
        group.currency,
      ),
    };
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

  // The turn in flight: earliest cycle whose payout hasn't completed.
  // Null once the rotation is fully disbursed.
  const currentCycleNumber =
    sortedCycles.find((c) => payoutByCycle.get(c.id) !== "completed")
      ?.cycle_number ?? null;

  return (
    <main className="mx-auto flex w-full max-w-[960px] flex-1 flex-col gap-4 px-4 py-6 sm:px-6">
      <CircleHeader
        group={group}
        memberCount={orderedMembers.length}
        inviterId={user?.id ?? null}
        showInvite={group.status !== "completed"}
        active="ledger"
        trailing={<ExportButton disabled={periods.length === 0} />}
      />
      <LedgerBook
        groupId={group.id}
        groupName={group.name}
        metaLine={`${group.frequency} · ${orderedMembers.length} members · ${periods.length} ${periodWord.toLowerCase()}s · Share ${shareLabel}`}
        printedLabel={formatPrintedLabel(today)}
        summary={{
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
            periods.length > 0
              ? `${payoutsDone} of ${periods.length}`
              : "—",
        }}
        members={orderedMembers.map((m, i) => ({
          id: m.id,
          name: memberName(m),
          position: m.payout_position ?? i + 1,
        }))}
        periods={periods}
        memberTotals={memberTotals}
        expectedPerMemberLabel={formatMoney(
          periods.length * shareAmount,
          group.currency,
        )}
        currentCycleNumber={currentCycleNumber}
        empty={periods.length === 0}
      />
    </main>
  );
}
