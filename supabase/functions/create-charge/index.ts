// create-charge — start a contribution payment.
//
// Called by the app (user JWT) with { cycleId, redirectUrl? }.
// Resolves the caller's active membership, creates (or reuses) the pending
// contributions row, and returns a Flutterwave hosted payment link.
// Money rows are written with the service role — RLS blocks clients.

import "@supabase/functions-js/edge-runtime.d.ts";
import { createAdminClient } from "../_shared/supabase.ts";
import { createPaymentLink } from "../_shared/flw.ts";

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

    const { cycleId, redirectUrl } = await req.json();
    if (!cycleId) return json({ error: "cycleId required" }, 400);

    // Cycle → group (amount + currency live on the group).
    const { data: cycle, error: cycleError } = await admin
      .from("cycles")
      .select("id, group_id, groups!inner(contribution_amount, currency)")
      .eq("id", cycleId)
      .single();
    if (cycleError || !cycle) return json({ error: "Cycle not found" }, 404);
    const group = cycle.groups as unknown as {
      contribution_amount: number;
      currency: string;
    };

    // Caller must be an active member of this group.
    const { data: member } = await admin
      .from("group_members")
      .select("id")
      .eq("group_id", cycle.group_id)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();
    if (!member) return json({ error: "Not an active member" }, 403);

    // Only the current turn is payable: the first open cycle of the
    // group. UI buttons already hide for later turns; this refuses
    // crafted requests too.
    const { data: openCycle } = await admin
      .from("cycles")
      .select("id")
      .eq("group_id", cycle.group_id)
      .neq("status", "completed")
      .order("cycle_number", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (!openCycle || openCycle.id !== cycleId) {
      return json({ error: "This turn is not open for payment" }, 409);
    }

    // Reuse a pending row (payment retry); refuse if already settled —
    // paid or late both mean the money arrived, never charge twice.
    const { data: existing } = await admin
      .from("contributions")
      .select("id, status, payment_reference")
      .eq("cycle_id", cycleId)
      .eq("member_id", member.id)
      .maybeSingle();
    if (existing?.status === "paid" || existing?.status === "late") {
      // Settled either way — the client words it without guessing which.
      return json(
        { error: "Already settled", status: existing.status },
        409,
      );
    }

    const amount = Number(group.contribution_amount);
    let contributionId: string;
    let txRef: string;

    if (existing) {
      contributionId = existing.id;
      txRef =
        existing.payment_reference ??
        `kora_${contributionId.slice(0, 8)}_${Date.now()}`;
    } else {
      txRef = `kora_${crypto.randomUUID().slice(0, 8)}_${Date.now()}`;
      const { data: created, error: createError } = await admin
        .from("contributions")
        .insert({
          cycle_id: cycleId,
          member_id: member.id,
          amount,
          status: "pending",
          payment_reference: txRef,
        })
        .select("id")
        .single();
      if (createError || !created) {
        return json({ error: "Could not start contribution" }, 500);
      }
      contributionId = created.id;
    }

    // Ensure the pending row carries this attempt's tx_ref.
    await admin
      .from("contributions")
      .update({ payment_reference: txRef })
      .eq("id", contributionId);

    const { data: profile } = await admin
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .single();

    const paymentLink = await createPaymentLink({
      txRef,
      amount,
      currency: group.currency,
      redirectUrl:
        redirectUrl ?? Deno.env.get("SITE_URL") ?? "http://localhost:3000",
      customer: {
        // Hosted checkout requires an email; phone users have none, so use
        // a non-routable placeholder (test mode — receipts go nowhere).
        email: user.email || `${txRef}@kora.test`,
        phone: profile?.phone ?? user.phone,
        name: profile?.full_name,
      },
    });

    return json({ paymentLink, contributionId, txRef });
  } catch (e) {
    console.error("create-charge failed:", e);
    return json({ error: "Charge failed to start" }, 500);
  }
});
