// generate-schedule — build the payout rotation for a circle.
//
// Called by the app (creator JWT) with { groupId, firstDueDate? }.
// Creates one cycles row per active member in payout_position order plus
// one pending payouts row per cycle at the pooled-pot amount
// (contribution_amount x active members). First run flips the group
// forming -> active. Reruns are append-only: members added later by vote
// get cycles numbered after the existing max; existing rows are never
// rewritten. Since the on_member_admitted trigger (migration
// 20260926130000) appends a voted-in member's turn at approval time, reruns
// are now a repair path — pre-trigger unscheduled members, or a lost race —
// not a step the organizer owes. Money rows are written with the service
// role — RLS blocks clients from inserting cycles/payouts by design.

import "@supabase/functions-js/edge-runtime.d.ts";
import { createAdminClient } from "../_shared/supabase.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

function stepDate(date: Date, frequency: string): Date {
  const next = new Date(date);
  if (frequency === "monthly") next.setUTCMonth(next.getUTCMonth() + 1);
  else next.setUTCDate(next.getUTCDate() + 7);
  return next;
}

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  try {
    const admin = createAdminClient();

    const jwt = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    if (!jwt) return json({ error: "Missing Authorization" }, 401);
    const {
      data: { user },
      error: userError,
    } = await admin.auth.getUser(jwt);
    if (userError || !user) return json({ error: "Invalid session" }, 401);

    const { groupId, firstDueDate } = await req.json();
    if (!groupId) return json({ error: "groupId required" }, 400);

    // Group + creator check. Only the organizer starts the rotation.
    const { data: group, error: groupError } = await admin
      .from("groups")
      .select("id, created_by, contribution_amount, frequency, status")
      .eq("id", groupId)
      .single();
    if (groupError || !group) return json({ error: "Circle not found" }, 404);
    if (group.created_by !== user.id) {
      return json({ error: "Only the organizer can start the rotation" }, 403);
    }
    if (group.status === "completed") {
      return json({ error: "Circle is already completed" }, 400);
    }

    // Active members in payout order; existing rotation, if any.
    const { data: members } = await admin
      .from("group_members")
      .select("id, payout_position")
      .eq("group_id", groupId)
      .eq("status", "active")
      .order("payout_position", { ascending: true });
    if (!members || members.length === 0) {
      return json({ error: "No active members to schedule" }, 400);
    }

    const { data: existing } = await admin
      .from("cycles")
      .select("id, cycle_number, recipient_member_id, due_date")
      .eq("group_id", groupId)
      .order("cycle_number", { ascending: true });

    const scheduled = new Set(
      (existing ?? []).map((c) => c.recipient_member_id as string),
    );

    // Pooled pot, snapshotted at generation and locked afterwards.
    // The repair path below uses the same snapshot for its backfills.
    const pot = Number(group.contribution_amount) * members.length;

    // Repair path: a previous run may have written a cycle but failed
    // before its payout row (the loop returns 500 mid-rotation). Such
    // cycles look "scheduled" below, so backfill their missing payouts
    // first — otherwise they could never pay out.
    const existingIds = (existing ?? []).map((c) => c.id as string);
    let backfilled = 0;
    if (existingIds.length > 0) {
      const { data: existingPayouts } = await admin
        .from("payouts")
        .select("cycle_id")
        .in("cycle_id", existingIds);
      const withPayout = new Set(
        (existingPayouts ?? []).map((p) => p.cycle_id as string),
      );
      for (const c of existing ?? []) {
        if (withPayout.has(c.id as string)) continue;
        const { error: backfillError } = await admin.from("payouts").insert({
          cycle_id: c.id,
          recipient_member_id: c.recipient_member_id,
          amount: pot,
          status: "pending",
        });
        if (backfillError) {
          return json({ error: "Could not generate the schedule" }, 500);
        }
        backfilled += 1;
      }
    }

    const pending = members.filter((m) => !scheduled.has(m.id as string));
    if (pending.length === 0) {
      return json({ created: 0, backfilled, status: group.status });
    }

    // Base due date: appended cycles continue from the last existing due
    // date; a first run uses the picked date (or today + one step).
    let cursor: Date;
    let nextNumber: number;
    if (existing && existing.length > 0) {
      const last = existing[existing.length - 1];
      cursor = stepDate(new Date(`${last.due_date as string}T00:00:00Z`), group.frequency as string);
      nextNumber =
        Math.max(...existing.map((c) => c.cycle_number as number)) + 1;
    } else if (firstDueDate && /^\d{4}-\d{2}-\d{2}$/.test(firstDueDate)) {
      cursor = new Date(`${firstDueDate}T00:00:00Z`);
      nextNumber = 1;
    } else {
      cursor = stepDate(new Date(), group.frequency as string);
      nextNumber = 1;
    }

    const created: { cycle_number: number; due_date: string }[] = [];
    for (const m of pending) {
      const due = toISODate(cursor);
      const { data: cycle, error: cycleError } = await admin
        .from("cycles")
        .insert({
          group_id: groupId,
          cycle_number: nextNumber,
          recipient_member_id: m.id,
          due_date: due,
          status: "upcoming",
        })
        .select("id")
        .single();
      if (cycleError || !cycle) {
        return json({ error: "Could not generate the schedule" }, 500);
      }
      const { error: payoutError } = await admin.from("payouts").insert({
        cycle_id: (cycle as { id: string }).id,
        recipient_member_id: m.id,
        amount: pot,
        status: "pending",
      });
      if (payoutError) {
        return json({ error: "Could not generate the schedule" }, 500);
      }
      created.push({ cycle_number: nextNumber, due_date: due });
      nextNumber += 1;
      cursor = stepDate(cursor, group.frequency as string);
    }

    if (group.status === "forming") {
      await admin.from("groups").update({ status: "active" }).eq("id", groupId);
    }

    return json({ created: created.length, backfilled, cycles: created, status: "active" });
  } catch {
    // Cause stays in the function logs; the client gets a generic message.
    return json({ error: "Could not generate the schedule" }, 500);
  }
});
