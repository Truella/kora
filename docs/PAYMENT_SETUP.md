# Payment Provider Setup — Flutterwave (v3 API)

## Why Flutterwave over Paystack

Paystack only supports Nigeria, Ghana, Kenya, and South Africa — it does not support Uganda. Since this hackathon targets NG/KE/UG/GH, Paystack would leave one full target country unable to use the app. Flutterwave supports all four countries plus mobile money across all of them, and offers split payments/subaccounts equivalent to what the schema needs.

**Use the v3 API, not v4.** v4 is in public beta with a different OAuth2 auth model and fewer resources online. v3 (Public Key / Secret Key / Encryption Key model) is the stable, documented, production-standard version — use it for the hackathon.

---

## 1. Create the account

1. Go to flutterwave.com and sign up (individual/developer signup is fine for sandbox use — full business KYC is not required to test).
2. Log into the dashboard.

## 2. Switch to Test Mode

- Use the Live/Test toggle at the bottom of the sidebar menu.
- All test keys are prefixed `_TEST` (e.g. `FLWPUBK_TEST-...`, `FLWSECK_TEST-...`).
- Stay in Test Mode for the entire build — no real money moves, but webhooks and API responses behave like production.

## 3. Get API keys

1. In the dashboard, go to **Settings → API**.
2. Copy the three keys shown:
   - **Public Key** (`FLWPUBK_TEST-...`) — safe for frontend use
   - **Secret Key** (`FLWSECK_TEST-...`) — server-side only, never expose
   - **Encryption Key** — only needed if using the direct card-charge endpoint

## 4. Store keys as Supabase Edge Function secrets

Since there's no separate backend, the Secret Key must live in Supabase Edge Function environment secrets — never in frontend code or committed to git.

```bash
supabase secrets set FLW_SECRET_KEY=FLWSECK_TEST-xxxxxxxxxxxxx
supabase secrets set FLW_ENCRYPTION_KEY=xxxxxxxxxxxxx
supabase secrets set FLW_WEBHOOK_HASH=<a string you choose — see step 5>
```

The Public Key goes in the frontend `.env` (e.g. `NEXT_PUBLIC_FLW_PUBLIC_KEY`) since it's safe for client-side use.

## 5. Set up the webhook

1. In the dashboard, go to **Settings → Webhooks**.
2. Enter your **Webhook URL** — this will be your Supabase Edge Function URL once deployed, e.g.:
   `https://<project-ref>.functions.supabase.co/payment-webhook`
3. In **Secret Hash**, enter a password you make up yourself (Flutterwave does not issue this — you choose it and it must match what you store as `FLW_WEBHOOK_HASH`).
4. Check all webhook preference boxes, then Save.
5. In your Edge Function, verify every incoming webhook by checking the `verif-hash` request header equals your stored `FLW_WEBHOOK_HASH` before trusting the payload. Reject anything that doesn't match.

## 6. Install the SDK

In your Edge Function project:

```bash
npm install flutterwave-node-v3
```

```js
const Flutterwave = require('flutterwave-node-v3');
const flw = new Flutterwave(process.env.FLW_PUBLIC_KEY, process.env.FLW_SECRET_KEY);
```

## 7. Create test subaccounts (one per group member who can receive a payout)

```js
flw.Subaccount.create({
  account_bank: "044",            // bank code — varies by country, see note below
  account_number: "0690000037",   // test account number
  business_name: "Member Name",
  business_mobile: "09087930450",
  country: "NG",                  // NG, GH, KE, or UG
  split_type: "percentage",
  split_value: 1.0                // 100% to this subaccount for a pure pass-through payout
});
```

Bank codes and valid test account numbers differ per country (NG, GH, KE, UG each have their own bank code list and test account formats) — check the current **Bank Account Verification** and **Supported Countries** sections of Flutterwave's docs for the specific country you're testing, since these change and a stale hardcoded list would break the demo.

## 8. Test payment credentials (sandbox)

**Test cards:**

| Card | Number | CVV | Expiry | PIN | OTP |
|---|---|---|---|---|---|
| Mastercard | 5531886652142950 | 564 | 09/32 | 3310 | 12345 |
| Visa | 4187427415564246 | 828 | 09/32 | 3310 | 12345 |

**Mobile money:** Flutterwave's sandbox supports two test flows — a default flow that simulates an authorization prompt on the customer's device, and a redirect flow. Country-specific test phone numbers for MTN/Airtel/M-Pesa etc. are listed on Flutterwave's **Testing** documentation page — pull the current numbers from there when you get to this step, since sandbox test accounts get rotated/archived (Flutterwave notes test data is archived after 30 days).

## 9. Verify a transaction (server-side, after webhook fires)

Always re-verify server-side before trusting a webhook payload — don't act on the webhook alone:

```js
const response = await flw.Transaction.verify({ id: transactionId });
if (response.data.status === "successful") {
  // mark contribution as paid
}
```

## 10. Before the demo

- Confirm test mode is still active (don't accidentally flip to Live on stage).
- Re-run the full charge → webhook → ledger-update flow once, end-to-end, the morning of the demo — sandbox test data can be archived/reset, so don't assume last week's setup still works.

## 11. Payout details collection (post-MVP — live transfers)

Status: specced, not built. `process-payout` currently records disbursement
(completed/failed) without moving money — the completion record is the proof.
When live transfers get built, the missing input is *where to send each
recipient's payout*. This section is that build's spec.

### When to collect — never in onboarding

Payout details are captured at payout time, not signup: a
"Where should your payout go?" prompt when a member's first receiving turn
approaches (or a profile section for the impatient). Front-loading bank
forms before someone ever saves kills conversion; the circle works fully
without them until money needs to leave.

### Fields per country

| Country | Method | Fields |
|---|---|---|
| NG | bank | `bank_code` (Flutterwave `/v3/banks/NG` list) + `account_number` (10 digits) |
| GH | bank | `bank_code` (`/v3/banks/GH`) + `account_number` |
| KE | momo | `provider` (`MPESA`) + mobile number (E.164, may equal the profile phone) |
| UG | momo | `provider` (`MTN` / `AIRTEL`) + mobile number (E.164) |

The member's home country (auth metadata, set at onboarding) preselects the
method — bank for NG/GH, mobile money for KE/UG — with manual override.

### Verification before first use

Never trust a typed account number. In sandbox AND live, resolve it first:

- Banks: Flutterwave account verification (`/v3/accounts/resolve`-family —
  pull the current endpoint from the docs at build time) must return the
  account name; show it back to the member ("Is this you?") before saving.
- Mobile money: an OTP or a GH₵/KSh/USh 1 micro-charge confirm loop.

Only `verified = true` rows are transfer-eligible. Re-verify on every edit.

### Storage

New table `payout_details` (migration at build time):

- `user_id uuid primary key references profiles(id)` — one destination per member (update in place on change + re-verify).
- `country`, `method ('bank'|'momo')`, `bank_code`, `account_number`, `provider`, `verified boolean not null default false`, `verified_at`.
- Account numbers are secrets: store via Supabase Vault (or app-level
  encryption with the key in Edge Function secrets) — never plaintext in a
  readable table. RLS: owner insert/select/update own row only, no delete;
  transfers read it exclusively through the service role.

### Money-state rule preserved

No client writes to money state — the details form calls an Edge Function
that verifies (Flutterwave resolve) then writes; `process-payout` grows a
transfer attempt *after* its all-settled check, marking `completed` only on
a successful transfer response and `failed` otherwise (current record-only
behavior stays as the fallback when details are missing/unverified).
