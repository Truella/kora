import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// USSD companion (Day 6 stretch, read-only). Africa's Talking POSTs
// form-encoded { sessionId, serviceCode, phoneNumber, text } where `text`
// accumulates with "*" separators ("1*2" = menu 1, item 2). Responses are
// plain text starting with CON (keep session) or END (hang up).
//
// Scope per SCOPE.md: three read-only screens — circle status, payment
// confirmation, next payout. No writes anywhere: the caller is identified
// by phone (profiles.phone exact E.164 match, the same anchor the DB
// enforces) and every query below is a select. Unauthenticated callers
// can't reach Supabase Auth, so this route uses the server-only service
// role key (SUPABASE_SERVICE_ROLE_KEY — never NEXT_PUBLIC_); without it
// the route reports itself unavailable instead of failing open.

export async function POST(req: Request) {
  const params = new URLSearchParams(await req.text());
  const phone = normalizeCaller(params.get("phoneNumber") ?? "");
  const text = (params.get("text") ?? "").trim();
  if (!phone) return ussd("END Invalid request. Dial again.");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return ussd("END Kora USSD is unavailable right now. Try again later.");
  }
  const admin = createClient(url, serviceKey);

  const { data: profile } = await admin
    .from("profiles")
    .select("id, full_name")
    .eq("phone", phone)
    .maybeSingle();
  if (!profile) {
    return ussd(
      "END This number is not registered on Kora. Create an account in the app first.",
    );
  }

  const parts = text === "" ? [] : text.split("*");
  if (parts.length === 0) {
    return ussd(
      "CON Welcome to Kora.\n1. My circles\n2. Confirm my payment\n3. Next payout",
    );
  }

  const [menu, pick] = parts;
  if (!["1", "2", "3"].includes(menu) || (parts.length > 1 && !pick)) {
    return ussd("END Invalid choice. Dial again.");
  }

  // The member's circles, newest first — shared by all three screens.
  const { data: memberships } = await admin
    .from("group_members")
    .select("id, trust_score_cache, group_id, groups!inner(id, name)")
    .eq("user_id", (profile as { id: string }).id)
    .eq("status", "active")
    .limit(5);
  const circles = ((memberships ?? []) as unknown as {
    id: string;
    trust_score_cache: number | string;
    group_id: string;
    groups: { id: string; name: string };
  }[]);
  if (circles.length === 0) {
    return ussd("END You are not in any circle yet. Ask for an invite link.");
  }

  // Level 1: pick a circle.
  if (parts.length === 1) {
    const titles = ["My circles", "Check payment", "Next payout"] as const;
    const title = titles[Number(menu) - 1];
    const lines = circles.map((m, i) => `${i + 1}. ${m.groups.name}`);
    return ussd(`CON ${title}:\n${lines.join("\n")}`);
  }

  // Level 2: one circle chosen (1-based index into the same list).
  const chosen = circles[Number(pick) - 1];
  if (!chosen) return ussd("END Invalid choice. Dial again.");

  if (menu === "1") return ussd(await circleStatus(admin, chosen));
  if (menu === "2") return ussd(await paymentStatus(admin, chosen));
  return ussd(await nextPayout(admin, chosen));
}

// AT sends E.164 already, but normalize defensively (strip separators,
// ensure leading +) so the exact-match lookup never misses on format.
function normalizeCaller(raw: string): string | null {
  const digits = raw.replace(/[^\d+]/g, "");
  const e164 = digits.startsWith("+") ? digits : `+${digits}`;
  return /^\+[1-9][0-9]{6,14}$/.test(e164) ? e164 : null;
}

function ussd(body: string) {
  return new NextResponse(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

type Circle = {
  id: string;
  trust_score_cache: number | string;
  group_id: string;
  groups: { id: string; name: string };
};

// Screen 1: circle terms + the caller's settled/total shares this rotation.
async function circleStatus(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  circle: Circle,
): Promise<string> {
  const { data: group } = await admin
    .from("groups")
    .select("name, contribution_amount, currency, frequency, status")
    .eq("id", circle.group_id)
    .single();
  const g = group as {
    name: string;
    contribution_amount: number | string;
    currency: string;
    frequency: string;
    status: string;
  } | null;
  if (!g) return "END Circle not found.";
  const { data: cycles } = await admin
    .from("cycles")
    .select("id")
    .eq("group_id", circle.group_id);
  const ids = ((cycles ?? []) as { id: string }[]).map((c) => c.id);
  let settled = 0;
  if (ids.length > 0) {
    const { data: mine } = await admin
      .from("contributions")
      .select("id")
      .eq("member_id", circle.id)
      .in("cycle_id", ids)
      .in("status", ["paid", "late"]);
    settled = ((mine ?? []) as unknown[]).length;
  }
  return (
    `END ${g.name}: ${Number(g.contribution_amount).toLocaleString()} ` +
    `${g.currency} ${g.frequency}, ${g.status}. ` +
    `Your shares: ${settled}/${ids.length} settled. Trust ${circle.trust_score_cache}.`
  );
}

// Screen 2: the caller's current share — paid (with date) or still due.
async function paymentStatus(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  circle: Circle,
): Promise<string> {
  const { data: cycles } = await admin
    .from("cycles")
    .select("id, cycle_number, due_date")
    .eq("group_id", circle.group_id)
    .order("due_date", { ascending: true });
  const list = ((cycles ?? []) as {
    id: string;
    cycle_number: number;
    due_date: string;
  }[]);
  if (list.length === 0) return "END No rotation yet. The organizer starts it.";
  const { data: mine } = await admin
    .from("contributions")
    .select("cycle_id, status, paid_at")
    .eq("member_id", circle.id)
    .in(
      "cycle_id",
      list.map((c) => c.id),
    );
  const byCycle = new Map(
    ((mine ?? []) as { cycle_id: string; status: string; paid_at: string | null }[]).map(
      (c) => [c.cycle_id, c],
    ),
  );
  const open = list.find(
    (c) => byCycle.get(c.id)?.status !== "paid" && byCycle.get(c.id)?.status !== "late",
  );
  const target = open ?? list[list.length - 1];
  const row = byCycle.get(target.id);
  if (row && (row.status === "paid" || row.status === "late")) {
    const when = row.paid_at
      ? new Date(row.paid_at).toLocaleDateString()
      : target.due_date;
    const late = row.status === "late" ? "(late)" : "";
    return `END Cycle ${target.cycle_number}: received${late} ${when}. Trust ${circle.trust_score_cache}.`;
  }
  return `END Cycle ${target.cycle_number}: share due ${target.due_date}. Pay in the app to protect your trust.`;
}

// Screen 3: the next pending payout — who receives, how much, when.
async function nextPayout(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  circle: Circle,
): Promise<string> {
  const { data: cycles } = await admin
    .from("cycles")
    .select("id, cycle_number, due_date, recipient_member_id")
    .eq("group_id", circle.group_id)
    .order("due_date", { ascending: true });
  const list = ((cycles ?? []) as {
    id: string;
    cycle_number: number;
    due_date: string;
    recipient_member_id: string;
  }[]);
  const { data: payouts } = await admin
    .from("payouts")
    .select("cycle_id, amount, status")
    .in(
      "cycle_id",
      list.map((c) => c.id),
    );
  const pending = new Set(
    ((payouts ?? []) as { cycle_id: string; status: string }[])
      .filter((p) => p.status === "pending")
      .map((p) => p.cycle_id),
  );
  const potByCycle = new Map(
    ((payouts ?? []) as { cycle_id: string; amount: number | string }[]).map(
      (p) => [p.cycle_id, p.amount],
    ),
  );
  const next = list.find((c) => pending.has(c.id));
  if (!next) return "END No upcoming payout. All caught up.";
  const { data: rm } = await admin
    .from("group_members")
    .select("user_id")
    .eq("id", next.recipient_member_id)
    .single();
  let name = "a member";
  const userId = (rm as { user_id: string } | null)?.user_id;
  if (userId) {
    const { data: prof } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .single();
    name = (prof as { full_name: string } | null)?.full_name ?? name;
  }
  const pot = potByCycle.get(next.id);
  return (
    `END Cycle ${next.cycle_number}: ${pot ? `${Number(pot).toLocaleString()} to ` : "pot to"}` +
    `${name}, due ${next.due_date}.`
  );
}
