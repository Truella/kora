# Project Scope — Digital Ajo/Chama Savings Circle

Built for StacStart Borderless Bytes Hackathon (Sept 22 – Sept 28)

## Problem

Millions across Nigeria, Kenya, Uganda, and Ghana participate in informal savings groups (ajo/esusu, chama, susu, VSLA) because they run on trust and social accountability that formal banks lack. But this same structure creates two recurring failure points across all four countries: a single organizer/collector can abscond with pooled funds, and manual, paper-based record-keeping causes disputes with no neutral source of truth. Digitizing naively (public pools, stranger-matching) destroys the trust the model depends on — so the real problem is removing the custody/record risk without removing the social trust that makes people join in the first place.

## Solution

A closed, invite-only digital savings circle app where the organizer never holds the money and membership is decided by group vote, not a single admin — preserving the "everyone already knows everyone" property of the physical version while eliminating the failure points technology can actually fix.

## Core Features (MVP — must ship)

1. **Group creation + invite-only membership** — creator invites via link/code; every join request goes to a member vote (majority/threshold) before admission.
2. **Automated contribution + payout via split payments** (Paystack/Flutterwave) — money flows member → recipient directly on schedule; organizer only sets the schedule, never custodies funds.
3. **Shared, tamper-evident ledger** — every contribution/payout timestamped and visible to all members; single source of truth, kills manual-record disputes.
4. **Payout schedule + automated reminders** — rotation order set at group creation, automated nudges before due dates to reduce late-payment cascades.
5. **Community Trust Score** — visible per-member record of completed cycles / on-time payments; soft-enforcement layer that answers "what stops someone from taking the payout and vanishing."

## Nice-to-haves (only if core is done early)

- USSD companion (2-4 screens, Africa's Talking sandbox) — read-only: check group status, confirm payment, view next payout date. Not a full rebuild of the PWA.
- "Invited by X" visible chain — shows how each member connects to the group, reinforcing social proof.
- Real mobile money STK push via USSD — only after everything else is solid.

## Explicitly Out of Scope (roadmap slide only)

- Public/stranger pools or bidding-for-early-payout
- BVN/NIN/credit bureau identity verification
- Stablecoin/gold inflation hedging
- Smart contracts / blockchain of any kind

## Stack

- **Frontend:** Next.js (or React) + Tailwind, built as a PWA (installable, offline-tolerant shell)
- **Backend:** None separate — Supabase handles auth, database, and realtime directly from the frontend
- **Database + Realtime:** Supabase (Postgres) — realtime subscriptions drive the live shared ledger view
- **Payments:** Paystack or Flutterwave (split payments / sub-accounts for direct member→recipient routing)
- **Auth:** Supabase Auth, phone-primary — phone number → phone OTP (test OTP numbers for now, real Twilio later), `phone_verified = true` on verify. Email OTP is the alternative path: account works in the PWA but the user must add + verify a phone number before anything USSD-related. Phone is the anchor identity (USSD has no email), stored E.164. Skip formal KYC entirely for MVP
- **Icons:** Hugeicons
- **Animation:** Motion
- **Stretch (USSD):** Africa's Talking sandbox + simulator, plain webhook (Supabase Edge Function or Next.js API route)

## Build Breakdown (Sept 22 → Sept 28 submission)

- **Day 1 (Mon):** Finalize data model in Supabase (groups, members, votes, contributions, payouts, trust score), scaffold PWA shell, set up Paystack/Flutterwave sandbox keys
- **Day 2 (Tue):** Group creation + invite flow + vote-to-join logic
- **Day 3 (Wed):** Contribution flow + split-payment integration (highest-risk piece — start early, leave buffer)
- **Day 4 (Thu):** Ledger view (Supabase realtime, all members) + payout scheduling + reminders
- **Day 5 (Fri):** Trust score logic + UI polish across core flows (Hugeicons + Motion pass)
- **Day 6 (Sat):** USSD stretch (only if core is stable) + bug fixes + demo data seeding
- **Day 7 (Sun):** Record video pitch, deploy live URL, write submission copy, final QA pass, submit before 11:59 PM

## Judging-Criteria Alignment (35/25/20/20)

- **Technical execution (35%):** live split-payment flow + Supabase realtime ledger — nothing here is mocked
- **Problem fit (25%):** grounded in country-specific data gathered for Nigeria/Kenya/Ghana/Uganda failure patterns — cite it in the pitch
- **Demo/communication (20%):** lead with the Trust Paradox framing ("here's what stops someone from vanishing with the money") — that's the hook, not the feature list
- **Originality (20%):** vote-based admission + organizer-never-custodies-funds combo is the differentiator versus Chamasoft/esusuPAY/WeSpare — say that explicitly in the pitch

## Risks to Watch

- Split-payment integration is the piece most likely to blow the timeline — build and test it first, not last
- Realtime ledger sync across members needs to actually work live in the demo — don't let it be the thing that breaks on stage
- Keep the pitch disciplined: don't let "nice-to-have" features creep into the demo script even if they get built
