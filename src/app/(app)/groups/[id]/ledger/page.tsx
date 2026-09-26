import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  formatCycleDateShort,
  formatCycleRange,
  formatMoney,
  parseDateOnly,
  toDateOnly,
  utcDateOnly,
} from "@/lib/money";
import CircleHeader from "../components/CircleHeader";
import LedgerBook, {
  type LedgerCyclePage,
  type LedgerPageRow,
  type LedgerRowStatus,
} from "./LedgerBook";

export const metadata = { title: "Ledger book" };

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

  const { data: group } = await supabase
    .from("groups")
    .select(
      "id, name, contribution_amount, currency, frequency, status, created_by",
    )
    .eq("id", id)
    .maybeSingle();

  const { data: member } = user
    ? await supabase
        .from("group_members")
        .select("id")
        .eq("group_id", id)
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle()
    : { data: null };

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

  const { data: cycles } = await supabase
    .from("cycles")
    .select("id, cycle_number, due_date, status, recipient_member_id")
    .eq("group_id", id)
    .order("cycle_number", { ascending: true });

  const sortedCycles = [...(cycles ?? [])].sort(
    (a, b) => a.cycle_number - b.cycle_number,
  );

  type MemberRow = {
    id: string;
    user_id: string;
    payout_position: number | null;
    joined_at: string;
  };
  const { data: circleMembers } = await supabase
    .from("group_members")
    .select("id, user_id, payout_position, joined_at")
    .eq("group_id", id)
    .eq("status", "active")
    .order("payout_position", { ascending: true });

  const memberRows = (circleMembers ?? []) as MemberRow[];
  const orderedMembers = [...memberRows].sort(
    (a, b) => (a.payout_position ?? 0) - (b.payout_position ?? 0),
  );

  const needUserIds = [...new Set(orderedMembers.map((m) => m.user_id))];
  let nameByUser = new Map<string, string>();
  if (needUserIds.length > 0) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", needUserIds);
    nameByUser = new Map(
      ((profs ?? []) as { id: string; full_name: string }[]).map((p) => [
        p.id,
        p.full_name,
      ]),
    );
  }
  const memberName = (m: MemberRow) =>
    user && m.user_id === user.id
      ? "You"
      : (nameByUser.get(m.user_id) ?? `····${m.user_id.slice(-4)}`);
  const memberById = new Map(orderedMembers.map((m) => [m.id, m]));

  const cycleIds = sortedCycles.map((c) => c.id);
  const { data: contributions } =
    cycleIds.length > 0
      ? await supabase
          .from("contributions")
          .select("cycle_id, member_id, status, amount, paid_at")
          .in("cycle_id", cycleIds)
      : { data: [] };
  type ContribInfo = { status: string; amount: number | string | null; paidAt: string | null };
  const contribByKey = new Map(
    ((contributions ?? []) as {
      cycle_id: string;
      member_id: string;
      status: string;
      amount: number | string | null;
      paid_at: string | null;
    }[]).map((c) => [
      `${c.cycle_id}:${c.member_id}`,
      { status: c.status, amount: c.amount, paidAt: c.paid_at },
    ] as [string, ContribInfo]),
  );

  const { data: payouts } =
    cycleIds.length > 0
      ? await supabase
          .from("payouts")
          .select("cycle_id, status, amount, paid_at")
          .in("cycle_id", cycleIds)
      : { data: [] };
  type PayoutInfo = { status: string; amount: number | string | null; paidAt: string | null };
  const payoutByCycle = new Map(
    ((payouts ?? []) as {
      cycle_id: string;
      status: string;
      amount: number | string | null;
      paid_at: string | null;
    }[]).map((p) => [
      p.cycle_id,
      { status: p.status, amount: p.amount, paidAt: p.paid_at },
    ] as [string, PayoutInfo]),
  );

  const enrolledIn = (m: MemberRow, dueDate: string) =>
    utcDateOnly(m.joined_at) <= dueDate;

  // Whole-day shifts on pinned calendar fields — never through an instant,
  // so a date-only value cannot drift a day the way `new Date("…")` can.
  function shiftDateOnly(value: string, days: number): string {
    const c = parseDateOnly(value);
    if (!c) return value;
    const t = new Date(Date.UTC(c.y, c.m - 1, c.d) + days * 86_400_000);
    return toDateOnly({
      y: t.getUTCFullYear(),
      m: t.getUTCMonth() + 1,
      d: t.getUTCDate(),
    });
  }

  // Cycle 1 has no previous due date to start from: step back one period —
  // six days for a weekly rotation, the same calendar day last month
  // (clamped, so 31 Mar opens on 28 Feb) for a monthly one.
  const frequency = group.frequency;
  function firstCycleStart(value: string): string {
    if (frequency === "monthly") {
      const c = parseDateOnly(value);
      if (!c) return value;
      const pm = c.m === 1 ? 12 : c.m - 1;
      const py = c.m === 1 ? c.y - 1 : c.y;
      const dim = new Date(Date.UTC(py, pm, 0)).getUTCDate();
      return toDateOnly({ y: py, m: pm, d: Math.min(c.d, dim) });
    }
    return shiftDateOnly(value, -6);
  }

  // The turn in flight: the earliest cycle that hasn't completed. Unpaid
  // shares at or behind it are Due; anything further out is Upcoming.
  const firstOpenNumber =
    sortedCycles
      .filter((c) => c.status !== "completed")
      .map((c) => c.cycle_number)
      .sort((a, b) => a - b)[0] ?? null;

  function unpaidStatus(cycleNumber: number): "due" | "upcoming" {
    if (firstOpenNumber === null) return "due";
    return cycleNumber <= firstOpenNumber ? "due" : "upcoming";
  }

  // Settled timestamps render as their UTC calendar day — the same reading
  // `lib/ledger.ts` gives every paid event, so the two surfaces agree.
  const shortPaidAt = (paidAt: string | null): string | null =>
    paidAt ? formatCycleDateShort(utcDateOnly(paidAt)) : null;

  const pages: LedgerCyclePage[] = sortedCycles.map((cycle, i) => {
    const dueShort = formatCycleDateShort(cycle.due_date);
    const startDue =
      i > 0
        ? shiftDateOnly(sortedCycles[i - 1].due_date, 1)
        : firstCycleStart(cycle.due_date);
    const recipient = memberById.get(cycle.recipient_member_id);
    const payout = payoutByCycle.get(cycle.id);
    const payoutStatus = payout?.status ?? "pending";

    const rows: LedgerPageRow[] = [];
    let settledCount = 0;
    for (const m of orderedMembers) {
      // No row for turns that ran before the member joined: the notebook
      // lists who owed that turn, not the whole roster.
      if (!enrolledIn(m, cycle.due_date)) continue;
      const raw = contribByKey.get(`${cycle.id}:${m.id}`);
      const settled = raw?.status === "paid" || raw?.status === "late";
      if (settled) settledCount += 1;
      const status: LedgerRowStatus = settled
        ? (raw.status as "paid" | "late")
        : unpaidStatus(cycle.cycle_number);
      rows.push({
        key: `c:${cycle.id}:${m.id}`,
        dateLabel: settled ? (shortPaidAt(raw.paidAt) ?? dueShort) : dueShort,
        memberLabel: memberName(m),
        contributionLabel:
          raw?.amount != null
            ? formatMoney(raw.amount, group.currency)
            : shareLabel,
        payoutLabel: null,
        status,
        remarks: "—",
      });
    }

    const potLabel = formatMoney(rows.length * shareAmount, group.currency);
    const payoutDone = payoutStatus === "completed";
    const payoutFailed = payoutStatus === "failed";
    rows.push({
      key: `p:${cycle.id}`,
      dateLabel: shortPaidAt(payout?.paidAt ?? null) ?? dueShort,
      memberLabel: recipient ? memberName(recipient) : "—",
      contributionLabel: null,
      payoutLabel:
        payout?.amount != null
          ? formatMoney(payout.amount, group.currency)
          : potLabel,
      status: payoutDone
        ? "paid"
        : payoutFailed
          ? "due"
          : unpaidStatus(cycle.cycle_number),
      remarks: payoutFailed ? "Payout failed" : "Payout",
    });

    return {
      cycleNumber: cycle.cycle_number,
      rangeLabel: formatCycleRange(startDue, cycle.due_date),
      turnLabel: `Turn ${cycle.cycle_number}/${sortedCycles.length}`,
      tone: payoutDone ? "paid" : unpaidStatus(cycle.cycle_number),
      rows,
      collectedLabel: formatMoney(settledCount * shareAmount, group.currency),
      paidOutLabel:
        payoutDone && payout?.amount != null
          ? formatMoney(payout.amount, group.currency)
          : potLabel,
      paidOutDimmed: !payoutDone,
    };
  });

  // Open on the turn in flight; a finished rotation opens on its last page.
  const initialPage = (() => {
    if (pages.length === 0) return 0;
    if (firstOpenNumber === null) return pages.length - 1;
    const idx = pages.findIndex((p) => p.cycleNumber === firstOpenNumber);
    return idx < 0 ? pages.length - 1 : idx;
  })();

  return (
    <main className="mx-auto flex w-full flex-1 flex-col gap-4 px-4 py-6 sm:px-6">
      <CircleHeader
        group={group}
        memberCount={orderedMembers.length}
        inviterId={user?.id ?? null}
        showInvite={group.status !== "completed"}
        active="ledger"
      />
      <LedgerBook
        groupId={group.id}
        groupName={group.name}
        printedLabel={new Date().toISOString().slice(0, 10)}
        pages={pages}
        initialPage={initialPage}
        currentCycleNumber={firstOpenNumber}
        empty={pages.length === 0}
      />
    </main>
  );
}
