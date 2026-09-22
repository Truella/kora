# AGENTS.md — Working Rules for Kora

## Tracker rule (mandatory)

`docs/BUILD_TRACKER.md` mirrors `docs/BUILD_PLAN.md` (Day → Track A / Track B,
plus the two 🔴 PAIR checkpoints). After finishing any unit of work:

1. Update the matching tracker row **in the same change** — status
   (`pending` → `in progress` → `done`), plus evidence/notes
   (files touched, migration name, verification command + result).
2. Keep the division: one row per Track per Day. Never roll two tracks into
   one row, and never mark a row `done` if its listed scope is only partial —
   mark `in progress` and name exactly what remains (see Day 1 Track B).
3. A row is `done` only with verification evidence: passing build, passing
   query/CLI check, or a green end-to-end run — state which one.
4. Do not edit `docs/BUILD_PLAN.md`, `docs/SCOPE.md`, `docs/DATABASE_SCHEMA.md`,
   or `docs/PAYMENT_SETUP.md` to record progress. The tracker is the only
   progress log; the other docs are the spec.

## Constraints

- Money state (`contributions.*`, `payouts.*`) is written only by Edge
  Functions with the service role after webhook verification — never from the
  client. Membership changes only via the `handle_new_group` /
  `tally_join_votes` triggers.
- Payments: Flutterwave **v3** in Test Mode (Paystack excludes UG).
  Secret key lives in Edge Function secrets, never in frontend code or git.
- Out of scope: public/stranger pools, BVN/NIN/KYC, stablecoin hedging,
  blockchain. USSD is a read-only stretch, not a rebuild.
