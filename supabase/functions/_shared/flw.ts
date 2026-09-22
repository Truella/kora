// Shared Flutterwave v3 REST helpers (native fetch — no SDK in edge runtime).
// Secrets (FLW_SECRET_KEY) live in Edge Function secrets, never in code.

const FLW_BASE = "https://api.flutterwave.com/v3";

function secret(): string {
  const key = Deno.env.get("FLW_SECRET_KEY");
  if (!key) throw new Error("FLW_SECRET_KEY not configured");
  return key;
}

export interface FlwPaymentLinkParams {
  txRef: string;
  amount: number;
  currency: string;
  redirectUrl: string;
  customer: { email?: string; phone?: string; name?: string };
}

export async function createPaymentLink(
  params: FlwPaymentLinkParams,
): Promise<string> {
  const res = await fetch(`${FLW_BASE}/payments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tx_ref: params.txRef,
      amount: params.amount,
      currency: params.currency,
      redirect_url: params.redirectUrl,
      // Omit empty identifiers — FLW validates what it receives.
      customer: Object.fromEntries(
        Object.entries({
          email: params.customer.email || undefined,
          phonenumber: params.customer.phone || undefined,
          name: params.customer.name || undefined,
        }).filter(([, v]) => v !== undefined),
      ),
    }),
  });
  const json = await res.json();
  if (!res.ok || json.status !== "success" || !json.data?.link) {
    throw new Error(`Flutterwave payment failed: ${JSON.stringify(json)}`);
  }
  return json.data.link as string;
}

export interface FlwVerifiedTransaction {
  id: number;
  txRef: string;
  status: string;
  amount: number;
  currency: string;
}

export async function verifyTransaction(
  transactionId: number,
): Promise<FlwVerifiedTransaction> {
  const res = await fetch(`${FLW_BASE}/transactions/${transactionId}/verify`, {
    headers: { Authorization: `Bearer ${secret()}` },
  });
  const json = await res.json();
  if (!res.ok || json.status !== "success" || !json.data) {
    throw new Error(`Flutterwave verify failed: ${JSON.stringify(json)}`);
  }
  return {
    id: json.data.id,
    txRef: json.data.tx_ref,
    status: json.data.status,
    amount: Number(json.data.amount),
    currency: json.data.currency,
  };
}
