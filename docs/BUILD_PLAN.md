# Build Plan — Digital Ajo/Chama App

Work split for two full-stack-capable teammates. Most days run as two independent parallel tracks; two checkpoints are marked PAIR because a bug there is either invisible until the live demo or catastrophic on stage — both people need working knowledge of these pieces.

## Day 1 — Foundation (fully parallel, zero dependencies)
- **Track A:** Supabase project setup, run schema + RLS SQL from DATABASE_SCHEMA.md, verify tables/policies via Supabase dashboard
- **Track B:** PWA scaffold (Next.js, manifest, service worker), Tailwind + Hugeicons + Motion wired in, base layout/nav shell

No shared files yet — safe to fully split.

## Day 2 — Auth + Group Creation (parallel, light coordination)
- **Track A:** Auth flow — Supabase Auth OTP, profile creation, protected routes
- **Track B:** Group creation form + UI (name, amount, frequency, threshold) wired to `groups` table

Track B needs Track A's auth session to attach `created_by` — sync by midday, not a full blocker.

## 🔴 PAIR — Split-Payment Integration (highest risk)
Get sandbox charge → webhook → `contributions.status = 'paid'` working end-to-end together before splitting again. Both people need to understand this flow well enough to debug it solo later.

## Day 3 (after pairing) — Contribution + Join Flow (parallel)
- **Track A:** Contribution UI (pay screen, status display) hitting the working payment flow
- **Track B:** Invite/join-request UI + vote-casting UI, tested against the `tally_join_votes` trigger

## Day 4 — Ledger + Scheduling (parallel)
- **Track A:** Realtime ledger view (Supabase Realtime subscription, live updates across members)
- **Track B:** Cycle generator Edge Function + payout scheduling UI + reminder logic

## Day 5 — Trust Score + Polish (parallel)
- **Track A:** Trust score display, "invited by X" chain UI, Motion pass on core screens
- **Track B:** Edge cases — late payment handling, vote-rejection flow, empty/error states

## Day 6 — Stretch + Hardening
Whoever's ahead picks up USSD stretch (if time allows); the other runs a full click-through QA pass and seeds realistic demo data (fake groups/members so the ledger looks alive on stage).

## 🔴 PAIR — Day 7 — Demo + Submission
Rehearse the live demo together (this is where realtime sync bugs surface), record the pitch video, deploy, write submission copy, final QA, submit before 11:59 PM.
