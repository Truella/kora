# Build Tracker — Digital Ajo/Chama App

Mirrors `BUILD_PLAN.md`. Every row is a Track A / Track B unit — update status
as work lands (see `AGENTS.md` for the update rule).

Legend: `done` · `in progress` · `pending` · `blocked`

## Day 1 — Foundation (fully parallel, zero dependencies)

| Track | Scope (per BUILD_PLAN) | Status | Evidence / Notes |
|---|---|---|---|
| A | Supabase project setup, run schema + RLS SQL from `DATABASE_SCHEMA.md`, verify tables/policies via dashboard | done | `supabase/migrations/20260922112403_initial_schema.sql` pushed to linked project `kora`; 8/8 tables, RLS on all 8, 13/13 policies, 3/3 triggers verified via `supabase db query --linked`. Deviations: `uuid_generate_v4()` → `gen_random_uuid()` (doc version errors on current Supabase); added `nullif` divide-by-zero guard in `tally_join_votes`. |
| B | PWA scaffold (Next.js, manifest, service worker), Tailwind + Hugeicons + Motion wired in, base layout/nav shell | done | PWA: `public/manifest.webmanifest`, `public/icons/` (192/512/maskable/apple + SVG mark), `public/sw.js`, `src/app/offline/page.tsx`, `src/app/sw-register.tsx`, PWA metadata in `layout.tsx`. Shell: brand header + bottom tab nav (`src/app/nav.tsx`, active-pill via Motion `layoutId`, `usePathname`), Kora home (`page.tsx`), stubs for `/groups` `/activity` `/profile` (replaced Day 2+). Motion v13 (`motion/react`) + Hugeicons (`HugeiconsIcon` + core-free icons) wired and used. Verified: `pnpm lint` clean, `pnpm build` passes, 6/6 routes prerender. Note: PWA PNGs are solid-brand placeholders — final art optional Day 5. |

## Day 2 — Auth + Group Creation (parallel, light coordination)

| Track | Scope (per BUILD_PLAN) | Status | Evidence / Notes |
|---|---|---|---|
| A | Auth flow — Supabase Auth OTP, profile creation, protected routes | done | Phone-first: `/login` takes phone only (NG/KE/UG/GH via `normalizeToE164`) → SMS OTP → `/verify` sets `phone_verified`, then new users (empty `full_name`) → `/onboarding` (name + country → `profiles`), existing users → destination. Email path sends a **magic link** (matches actual provider behavior), exchanged at `/auth/callback` → onboarding / add-phone / destination by profile state. `/add-phone` skippable; `/profile` shows session + jade/clay badge + sign-out. Session: `src/lib/supabase/{client,server}.ts` + `src/proxy.ts` (Next 16 convention; public `/login` `/verify` `/offline` `/auth/callback`, `next` passthrough). Verified: `pnpm lint` clean, `pnpm build` green. NOT yet verified: live OTP send/verify — needs dashboard test SMS numbers + sender config, then one real phone + email pass. Dashboard: allowlist `/auth/callback` (+ `next` passthrough) in Auth redirect URLs. |
| B | Group creation form + UI (name, amount, frequency, threshold) wired to `groups` table | in progress | `src/app/groups/new/page.tsx` (name/desc/amount + symbol/currency/frequency/threshold-slider form, inline validation, success panel; saves via Truella's `src/lib/supabase/client.ts` with `created_by` = session user, `vote_threshold` = slider/100; entry CTA added to `/groups` stub). Re-skin: form moved onto `DESIGN_TOKENS.md` system (indigo/gold/ink/paper, `font-display` headline, `font-mono` amounts); parallel green/gold landing + header from same commit dropped — `/` is proxy-protected so guests never see a marketing page, her app-home stands. Verified: `pnpm build` passes, `/groups/new` prerenders. REMAINS: live insert test against linked project (env just configured, needs one signed-in create + confirm `handle_new_group` member-1 row + RLS reject when logged out). `/groups` stub upgraded to a real RLS-backed list (server component, ordered newest-first, empty state + create CTA kept) so created circles are visible and the wiring is testable. |

## 🔴 PAIR — Split-Payment Integration (highest risk)

| Scope (per BUILD_PLAN) | Status | Evidence / Notes |
|---|---|---|
| Sandbox charge → webhook → `contributions.status = 'paid'` end-to-end, both teammates. Per `PAYMENT_SETUP.md`: Flutterwave v3, keys as Edge Function secrets, `verif-hash` check, server-side re-verify. | pending | Prep done: `FLW_SECRET_KEY` / `FLW_ENCRYPTION_KEY` / `FLW_WEBHOOK_HASH` confirmed set (`supabase secrets list`); `flutterwave-node-v3` installed but in root `package.json` — relocate into `supabase/functions/` when scaffolding the webhook. Still to do in pairing: `payment-webhook` Edge Function + deploy + dashboard webhook URL + test subaccounts + first sandbox charge. Do NOT start Day 3 until this is green. |

## Day 3 (after pairing) — Contribution + Join Flow (parallel)

| Track | Scope (per BUILD_PLAN) | Status | Evidence / Notes |
|---|---|---|---|
| A | Contribution UI (pay screen, status display) hitting the working payment flow | pending | Depends on PAIR piece above. |
| B | Invite/join-request UI + vote-casting UI, tested against the `tally_join_votes` trigger | pending | — |

## Day 4 — Ledger + Scheduling (parallel)

| Track | Scope (per BUILD_PLAN) | Status | Evidence / Notes |
|---|---|---|---|
| A | Realtime ledger view (Supabase Realtime subscription, live updates across members) | pending | Must work live in the demo — rehearse on stage conditions. |
| B | Cycle generator Edge Function + payout scheduling UI + reminder logic | pending | Cycles have no client insert policy by design — Edge Function with service role only. |

## Day 5 — Trust Score + Polish (parallel)

| Track | Scope (per BUILD_PLAN) | Status | Evidence / Notes |
|---|---|---|---|
| A | Trust score display, "invited by X" chain UI, Motion pass on core screens | pending | Requires `motion` package (see Day 1 Track B gap). |
| B | Edge cases — late payment handling, vote-rejection flow, empty/error states | pending | — |

## Day 6 — Stretch + Hardening

| Scope (per BUILD_PLAN) | Status | Evidence / Notes |
|---|---|---|
| USSD stretch (only if core stable) + full click-through QA + realistic demo seed data | pending | USSD is read-only per `SCOPE.md` (status, confirm payment, next payout) — not a PWA rebuild. |

## Side tracks (outside BUILD_PLAN)

| Spec | Status | Evidence / Notes |
|---|---|---|
| `DESIGN_TOKENS.md` — adire-indigo palette + Newsreader/Plex type system | done | `globals.css` replaced with `@theme` tokens (`ink/indigo/paper/gold/jade/clay`, `font-display/sans/mono`); Geist → Newsreader + IBM Plex Sans/Mono via `next/font/google` in `layout.tsx`; shell re-skinned (`bg-indigo`, `bg-gold`/`text-ink` CTAs, `font-display` empty-state/hero copy, `text-indigo`/`dark:text-gold` nav); manifest + theme-color + icon mark moved to indigo `#26306B`/gold `#C98A2C`. Verified: `pnpm lint` clean, `pnpm build` passes, 6/6 routes prerender. |
| Phone-primary auth model — `phone_verified` + E.164 enforcement | done | `supabase/migrations/20260922121902_add_phone_verification.sql` pushed: `profiles.phone_verified boolean not null default false`, `phone` stays nullable, `profiles_phone_e164` check (`^\+[1-9][0-9]{6,14}$`, NULL allowed) + column comments. Verified live: column present with default `false`, check def matches, pattern tested against +234/+254/+256/+233 (pass) vs local-format/spaced/garbage (fail). Shared normalizer `src/lib/phone.ts` (`normalizeToE164`, NG/KE/UG/GH) runtime-tested via esbuild bundle (9 formats ok, 4 invalid throw). Docs: `DATABASE_SCHEMA.md` profiles def + migration + anchor-identity note; `SCOPE.md` auth line → phone-primary. No RLS change (existing policy covers it). No frontend auth code exists yet — util ready for Day 2. Follow-up: SW static cache bumped to v2 after brand re-skin so stale green PWA icons propagate (cache-first needs version bumps on asset change). Follow-up 2: `20260922133154_fix_handle_new_user_e164` — test SMS numbers arrive without `+`, which aborted signup on the E.164 check; trigger now normalizes (verified SQL-side incl. the exact failing input). |

## 🔴 PAIR — Day 7 — Demo + Submission

| Scope (per BUILD_PLAN) | Status | Evidence / Notes |
|---|---|---|
| Rehearse live demo together, record pitch video, deploy, submission copy, final QA, submit before 11:59 PM | pending | Lead pitch with Trust Paradox framing; keep nice-to-haves out of the demo script. |
