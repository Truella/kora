// payment-webhook — Flutterwave → contributions.status = 'paid' or 'late'.
//
// 1. Reject anything whose `verif-hash` header ≠ FLW_WEBHOOK_HASH.
// 2. On charge.completed: re-verify server-side (never trust the payload).
// 3. Match by payment_reference = tx_ref, confirm amount + currency,
//    then mark paid — or late when the money arrives after the cycle
//    due date (Day 5B: this is what moves trust scores off 100).
//    The update_trust_score trigger fires automatically.
// Always 200 known events (Flutterwave retries 500s); 401 only on bad hash.

import "@supabase/functions-js/edge-runtime.d.ts";
import { createAdminClient } from "../_shared/supabase.ts";
import { verifyTransaction } from "../_shared/flw.ts";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const expectedHash = Deno.env.get("FLW_WEBHOOK_HASH");
  const receivedHash = req.headers.get("verif-hash");
  if (!expectedHash || receivedHash !== expectedHash) {
    return json({ error: "Invalid webhook signature" }, 401);
  }

  let payload: { event?: string; data?: { id?: number } };
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Bad JSON" }, 400);
  }

  if (payload.event !== "charge.completed") {
    return json({ received: true, ignored: payload.event ?? null });
  }

  const transactionId = payload.data?.id;
  if (!transactionId) return json({ error: "Missing transaction id" }, 400);

  try {
    const admin = createAdminClient();
    const tx = await verifyTransaction(transactionId);

    if (tx.status !== "successful") {
      console.log(`Ignoring unsuccessful charge ${transactionId}: ${tx.status}`);
      return json({ received: true, ignored: tx.status });
    }

    const { data: contribution } = await admin
      .from("contributions")
      .select(
        "id, amount, status, cycles!inner(group_id, due_date, groups!inner(currency))",
      )
      .eq("payment_reference", tx.txRef)
      .maybeSingle();

    if (!contribution) {
      console.error(`No contribution for tx_ref ${tx.txRef}`);
      return json({ received: true, unmatched: true });
    }
    // Terminal states — a retried webhook must never flip late back
    // to paid (that would repair a trust hit the member earned).
    if (contribution.status === "paid" || contribution.status === "late") {
      return json({ received: true, duplicate: true });
    }

    const cycle = contribution.cycles as unknown as {
      due_date: string;
      groups: { currency: string };
    };
    if (
      Number(contribution.amount) !== tx.amount ||
      cycle.groups.currency !== tx.currency
    ) {
      console.error(
        `Amount/currency mismatch for ${contribution.id}: expected ${contribution.amount} ${cycle.groups.currency}, got ${tx.amount} ${tx.currency}`,
      );
      return json({ received: true, mismatch: true });
    }

    // Late rule: money arriving after the cycle due date settles as
    // 'late', not 'paid'. Date-only compare in UTC — the same basis as
    // the app's reminder windows, so webhook and banners never disagree
    // about which side of the due date a payment falls on.
    const today = new Date().toISOString().slice(0, 10);
    const finalStatus = today > cycle.due_date ? "late" : "paid";

    const { error: updateError } = await admin
      .from("contributions")
      .update({ status: finalStatus, paid_at: new Date().toISOString() })
      .eq("id", contribution.id);
    if (updateError) {
      console.error(
        `Mark-${finalStatus} failed for ${contribution.id}:`,
        updateError,
      );
      return json({ error: "Could not confirm payment" }, 500);
    }

    return json({
      received: true,
      contributionId: contribution.id,
      status: finalStatus,
    });
  } catch (e) {
    console.error("payment-webhook failed:", e);
    return json({ error: "Webhook processing failed" }, 500);
  }
});
