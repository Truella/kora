import type { SupabaseClient } from "@supabase/supabase-js";

// Shared ledger shape for Day 4A. Used by the server pages for the
// initial snapshot AND by LedgerFeed for client-side refetches, so the
// realtime merge path renders exactly what the server rendered.
// Money rows stay read-only everywhere — this module only selects.

export type LedgerEvent = {
  id: string;
  kind: "contribution" | "payout";
  groupId: string;
  groupName: string;
  amountLabel: string;
  currency: string;
  status: string;
  actor: string;
  detail: string;
  paidAt: string | null;
  dueDate: string | null;
};

export type LedgerSnapshot = {
  due: LedgerEvent[];
  history: LedgerEvent[];
};

const SYMBOLS: Record<string, string> = {
  NGN: "₦",
  GHS: "GH₵",
  KES: "KSh",
  UGX: "USh",
};

function money(amount: number | string, currency: string): string {
  const symbol = SYMBOLS[currency] ?? currency;
  return `${symbol}${Number(amount).toLocaleString()}`;
}

function fmtDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

type CycleJoin = {
  id: string;
  cycle_number: number;
  due_date: string;
  group_id: string;
  groups: { id: string; name: string; currency: string };
};

type ContributionRow = {
  id: string;
  amount: number | string;
  status: string;
  paid_at: string | null;
  created_at: string | null;
  member_id: string;
  cycles: CycleJoin;
};

type PayoutRow = {
  id: string;
  amount: number | string;
  status: string;
  paid_at: string | null;
  recipient_member_id: string;
  cycles: CycleJoin;
};

// RLS scopes every query below to groups the caller belongs to —
// a non-member simply gets empty arrays, no error branch needed.
export async function getLedgerEvents(
  supabase: SupabaseClient,
  groupId?: string,
): Promise<LedgerSnapshot> {
  const [contribRes, payoutRes] = await Promise.all([
    supabase
      .from("contributions")
      .select(
        "id, amount, status, paid_at, created_at, member_id, cycles!inner(id, cycle_number, due_date, group_id, groups!inner(id, name, currency))",
      )
      .limit(200),
    supabase
      .from("payouts")
      .select(
        "id, amount, status, paid_at, recipient_member_id, cycles!inner(id, cycle_number, due_date, group_id, groups!inner(id, name, currency))",
      )
      .limit(200),
  ]);

  const contributions = (contribRes.data ?? []) as unknown as ContributionRow[];
  const payouts = (payoutRes.data ?? []) as unknown as PayoutRow[];

  // A malformed select must fail loudly, never masquerade as an empty
  // ledger — the join-hint strings are invisible to tsc.
  if (contribRes.error) throw new Error(`ledger contributions: ${contribRes.error.message}`);
  if (payoutRes.error) throw new Error(`ledger payouts: ${payoutRes.error.message}`);

  // Resolve payer/recipient names. profiles are visible for shared-group
  // members via RLS; anything unresolvable falls back to a masked id.
  const memberIds = [
    ...new Set([
      ...contributions.map((c) => c.member_id),
      ...payouts.map((p) => p.recipient_member_id),
    ]),
  ];
  const names = new Map<string, string>();
  if (memberIds.length > 0) {
    const { data: members } = await supabase
      .from("group_members")
      .select("id, user_id")
      .in("id", memberIds);
    const memberRows = (members ?? []) as { id: string; user_id: string }[];
    const userIds = [...new Set(memberRows.map((m) => m.user_id))];
    const profiles = new Map<string, string>();
    if (userIds.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);
      for (const p of (profs ?? []) as { id: string; full_name: string }[]) {
        profiles.set(p.id, p.full_name);
      }
    }
    for (const m of memberRows) {
      names.set(m.id, profiles.get(m.user_id) ?? `····${m.user_id.slice(-4)}`);
    }
  }

  const due: LedgerEvent[] = [];
  const history: LedgerEvent[] = [];

  for (const c of contributions) {
    if (groupId && c.cycles.group_id !== groupId) continue;
    // Contributions carry created_at for new rows (old/sandbox rows stay
    // NULL by choice — no rewritten history). Pendings order by cycle due
    // date, so NULL rows render exactly as today; settled rows by paid_at. Both are pre-formatted server-side
    // so server and client renders never disagree (no hydration drift).
    // Late means the money arrived (webhook-verified, just past due),
    // so late rows are history, never upcoming.
    const settled = c.status === "paid" || c.status === "late";
    const event: LedgerEvent = {
      id: `c:${c.id}`,
      kind: "contribution",
      groupId: c.cycles.group_id,
      groupName: c.cycles.groups.name,
      amountLabel: money(c.amount, c.cycles.groups.currency),
      currency: c.cycles.groups.currency,
      status: c.status,
      actor: names.get(c.member_id) ?? "A member",
      detail: settled
        ? c.status === "late"
          ? `Cycle ${c.cycles.cycle_number} · paid late ${fmtDate(c.paid_at)}`
          : `Cycle ${c.cycles.cycle_number} · paid ${fmtDate(c.paid_at)}`
        : `Cycle ${c.cycles.cycle_number} · due ${fmtDate(c.cycles.due_date)}`,
      paidAt: c.paid_at,
      dueDate: c.cycles.due_date,
    };
    (settled ? history : due).push(event);
  }

  for (const p of payouts) {
    if (groupId && p.cycles.group_id !== groupId) continue;
    const event: LedgerEvent = {
      id: `p:${p.id}`,
      kind: "payout",
      groupId: p.cycles.group_id,
      groupName: p.cycles.groups.name,
      amountLabel: money(p.amount, p.cycles.groups.currency),
      currency: p.cycles.groups.currency,
      status: p.status,
      actor: names.get(p.recipient_member_id) ?? "A member",
      detail:
        p.status === "pending"
          ? `Payout · Cycle ${p.cycles.cycle_number} · scheduled`
          : `Payout · Cycle ${p.cycles.cycle_number} · ${p.status} ${fmtDate(p.paid_at)}`,
      paidAt: p.paid_at,
      dueDate: p.cycles.due_date,
    };
    // Pending payouts are upcoming obligations; settled ones are history.
    // Failed payouts surface in history so a missed payout stays visible.
    if (p.status === "pending") due.push(event);
    else history.push(event);
  }

  due.sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""));
  history.sort((a, b) => (b.paidAt ?? "").localeCompare(a.paidAt ?? ""));

  return { due: due.slice(0, 20), history: history.slice(0, 50) };
}
