// process-payout — walk a payout row pending → completed | failed.
//
// Called by the app (member JWT) with { cycleId, action?: 'complete' | 'fail' }.
// This is the disbursement step: generate-schedule writes payouts as pending
// and nothing else may write them (RLS blocks clients, the append-only guard
// allows only pending → completed | failed). The service role performs the
// transition after verifying the rule below — never on client say-so.
//
// - complete (default): every active member's contribution for the cycle must
//   be settled (paid or late, webhook-verified). Missing row = unpaid, so the
//   payout unlocks only when all shares arrived. Collection additionally opens
//   on the cycle's due date — all shares in early still waits for the date,
//   otherwise each early collection completes its turn early and the whole
//   rotation compresses. Marks the payout completed (paid_at +
//   payout_reference) and flips the cycle to completed.
// - fail: records a failed disbursement attempt (payout_reference marker,
//   paid_at stays null so the ledger shows it as missed, not paid).
//
// Demo scope: the completion record is the disbursement proof. A live bank /
// mobile-money transfer to the recipient is roadmap (it needs recipient
// account capture first) — see DATABASE_SCHEMA §5.

import "@supabase/functions-js/edge-runtime.d.ts";
import { createAdminClient } from "../_shared/supabase.ts";
import { wasEnrolled } from "../_shared/enrollment.ts";

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

    const { cycleId, action } = await req.json();
    if (!cycleId) return json({ error: "cycleId required" }, 400);
    const mode = action ?? "complete";
    if (mode !== "complete" && mode !== "fail") {
      return json({ error: "action must be 'complete' or 'fail'" }, 400);
    }

    // Cycle → group.
    const { data: cycle, error: cycleError } = await admin
      .from("cycles")
      .select("id, group_id, due_date")
      .eq("id", cycleId)
      .single();
    if (cycleError || !cycle) return json({ error: "Cycle not found" }, 404);

    // Caller must be an active member of this group. Any member may trigger
    // the check — the organizer never custodies funds, the rule decides.
    const { data: caller } = await admin
      .from("group_members")
      .select("id")
      .eq("group_id", cycle.group_id)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();
    if (!caller) return json({ error: "Not an active member" }, 403);

    // Payout must still be pending — completed/failed are terminal and the
    // append-only guard would reject any further write anyway.
    const { data: payout } = await admin
      .from("payouts")
      .select("id, status")
      .eq("cycle_id", cycleId)
      .maybeSingle();
    if (!payout) return json({ error: "Payout not scheduled yet" }, 404);
    if (payout.status !== "pending") {
      return json(
        { error: "Payout already settled", status: payout.status },
        409,
      );
    }

    if (mode === "fail") {
      const failRef = `payout_fail_${cycleId.slice(0, 8)}_${Date.now()}`;
      const { error: failError } = await admin
        .from("payouts")
        .update({ status: "failed", payout_reference: failRef })
        .eq("id", payout.id);
      if (failError) return json({ error: "Could not record payout" }, 500);
      return json({ status: "failed", payoutReference: failRef });
    }

    // Collection opens on the turn's due date, even when every share
    // arrived early. Without this the rotation compresses: collecting on
    // day 1 completes the turn, the next turn opens on day 1, and due
    // dates stop meaning anything. UTC calendar basis, same as the
    // enrollment boundary below.
    const today = new Date().toISOString().slice(0, 10);
    if (cycle.due_date > today) {
      return json(
        { error: "Turn not due for collection", dueDate: cycle.due_date },
        409,
      );
    }

    // Complete: all active members must have settled shares. A missing
    // contribution row means that member never started payment — unpaid.
    //
    // R1: a member only counts as "expected" if they were enrolled when this
    // cycle ran. generate-schedule's sync mode appends a late joiner's
    // recipient slot at the end of the rotation and never backfills the
    // rounds already completed, and it creates no contribution rows at all —
    // so without this a member who joined mid-rotation is counted as owing
    // every past round, permanently blocking the disbursement of rounds they
    // were never part of. /home and the circle page apply the identical
    // boundary so the three never disagree.
    //
    // joined_at is compared as a UTC calendar date, matching utcDateOnly() in
    // src/lib/money.ts. A one-day disagreement between app and function would
    // mean a member is "expected" for a cycle the app says they do not owe,
    // which is a gate that can only ever 409.
    const { data: members } = await admin
      .from("group_members")
      .select("id, joined_at")
      .eq("group_id", cycle.group_id)
      .eq("status", "active");
    const expected = (members ?? []).filter((m) =>
      wasEnrolled(String(m.joined_at), cycle.due_date)
    ).length;
    const { data: settled } = await admin
      .from("contributions")
      .select("id")
      .eq("cycle_id", cycleId)
      .in("status", ["paid", "late"]);
    const settledCount = (settled ?? []).length;
    if (settledCount < expected) {
      return json(
        {
          error: "Contributions incomplete",
          settled: settledCount,
          expected,
        },
        409,
      );
    }

    const payoutRef = `payout_${cycleId.slice(0, 8)}_${Date.now()}`;
    const now = new Date().toISOString();
    const { error: completeError } = await admin
      .from("payouts")
      .update({
        status: "completed",
        payout_reference: payoutRef,
        paid_at: now,
      })
      .eq("id", payout.id);
    if (completeError) return json({ error: "Could not record payout" }, 500);
    await admin.from("cycles").update({ status: "completed" }).eq("id", cycleId);

    return json({ status: "completed", payoutReference: payoutRef });
  } catch (e) {
    console.error("process-payout failed:", e);
    return json({ error: "Payout could not be processed" }, 500);
  }
});
