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
| B | Group creation form + UI (name, amount, frequency, threshold) wired to `groups` table | done | `src/app/groups/new/page.tsx` (name/desc/amount + symbol/currency/frequency/threshold-slider form, inline validation, success panel; saves via Truella's `src/lib/supabase/client.ts` with `created_by` = session user, `vote_threshold` = slider/100). Re-skin: form moved onto `DESIGN_TOKENS.md` system (indigo/gold/ink/paper, `font-display` headline, `font-mono` amounts); parallel green/gold landing + header from same commit dropped — `/` is proxy-protected so guests never see a marketing page, her app-home stands. `/groups` is a real RLS-backed server list (newest-first, empty state + create CTA kept) with rows linking to `/groups/[id]` detail. Verified: live `Kora Sandbox Test` card renders via the RLS list (insert → `handle_new_group` member-1 → RLS select); `pnpm build` passes, 14/14 routes. |

## 🔴 PAIR — Split-Payment Integration (highest risk)

| Scope (per BUILD_PLAN) | Status | Evidence / Notes |
|---|---|---|
| Sandbox charge → webhook → `contributions.status = 'paid'` end-to-end, both teammates. Per `PAYMENT_SETUP.md`: Flutterwave v3, keys as Edge Function secrets, `verif-hash` check, server-side re-verify. | done (solo) | `supabase/functions/{create-charge,payment-webhook}` + `_shared/{flw,supabase}.ts` (native fetch; SDK dropped from root) deployed. First live sandbox charge (test Mastercard, ₦1000): `create-charge` → hosted link → paid → webhook re-verified → contribution `7870648a` `pending`→`paid` with `paid_at` set, `trust_score_cache` 100.00 via trigger. Test fixtures (`Kora Sandbox Test` group/cycle) stay until demo seeding. Hardening: verbose error `detail` stripped from `create-charge` responses (generic message, cause stays in function logs); still to add: `SITE_URL` secret for redirect (client passes explicit `redirectUrl` meanwhile, so unblocked). Day 3 unblocked. |

## Day 3 (after pairing) — Contribution + Join Flow (parallel)

| Track | Scope (per BUILD_PLAN) | Status | Evidence / Notes |
|---|---|---|---|
| A | Contribution UI (pay screen, status display) hitting the working payment flow | in progress | `src/app/groups/[id]/page.tsx` (server detail: header amount/currency/frequency/status, per-cycle cards with pending/paid/late badges, paid-date, empty-cycle "Waiting for schedule" state) + `PayButton.tsx` (client: `functions.invoke('create-charge', {cycleId, redirectUrl})` with explicit `origin/groups/[id]?paid=1`, 409 Already-paid surfaced distinctly via `fnError.context.status` + refresh, redirects to hosted link) + `ConfirmingBanner.tsx` (poll-confirm: `router.refresh()` 6×/4s on `?paid=1`, param never trusted as proof; settles on terminal "not confirmed" copy if the webhook never flips). `/groups` rows link to detail. Money writes stay server-side (Edge service role); client is read-only via RLS. Also: `tsconfig.json` excludes `supabase/functions` (Deno runtime broke Next typecheck), `.env.example` gains Edge-secrets checklist (names only). Verified: `npx tsc --noEmit` clean, `pnpm lint` clean, `pnpm build` passes 14/14 routes incl. dynamic `/groups/[id]`. REMAINS: live sandbox e2e through the UI (test Mastercard → return → poll shows `paid`); needs her power-back handoff (function URLs + `SITE_URL`). |
| B | Invite/join-request UI + vote-casting UI, tested against the `tally_join_votes` trigger | in progress | Link-with-id invites (closed circles, no directory — only link holders can find the join page): `src/app/groups/[id]/join/page.tsx` (server: already-member shortcut; `JoinRequestButton.tsx` client inserts `(group_id, applicant_id=me)`, 23505 duplicate → "already pending", applicant-blind success copy) + `InviteButton.tsx` (copies `origin/groups/[id]/join` on detail header) + `VoteButtons.tsx` (client: approve/reject with `voter_id` = caller's `group_members.id`, 23505 → "already voted", `router.refresh()` after vote) + detail "Pending requests" section (per-request yes/no tally). No migration — all writes allowed by existing RLS; status/membership flips stay in `tally_join_votes`. Verified: `tsc` clean, `lint` clean, `build` passes 15/15 routes incl. dynamic `/groups/[id]/join`. REMAINS: live two-account pass (A applies via link, B approves, trigger flips + member row appears). |

## Day 4 — Ledger + Scheduling (parallel)

| Track | Scope (per BUILD_PLAN) | Status | Evidence / Notes |
|---|---|---|---|
| A | Realtime ledger view (Supabase Realtime subscription, live updates across members) | in progress | Both homes sharing one `src/app/activity/LedgerFeed.tsx` client component (server snapshot in, `postgres_changes` INSERT/UPDATE on `contributions`+`payouts` triggers RLS-scoped refetch, reconnect after drop resyncs so no silent gaps, live/connecting dot): global `/activity` feed (server snapshot via `src/lib/ledger.ts getLedgerEvents`, Due-now-by-due-date + History-by-paid-date split since contributions carry no `created_at`, names via shared-group `profiles` with masked fallback, empty state kept) + per-circle "Recent activity" strip on `/groups/[id]` (`previewCount=5`, group filter, "View all activity" link). `supabase/migrations/20260923120000_enable_ledger_realtime.sql` registers `contributions`/`payouts`/`cycles` in `supabase_realtime` (idempotent; RLS untouched — policies already scope the stream). No client money writes. Verified: `tsc` clean, `lint` clean, `build` passes 15/15 routes. REMAINS: (1) apply the migration to the linked project (no Supabase CLI in this env — run via dashboard SQL editor or `supabase db push --linked`); (2) live two-browser pass (A pays via sandbox → B's feed updates with no refresh, plus a reconnect-kill resync check) — the demo-condition rehearsal. |
| B | Cycle generator Edge Function + payout scheduling UI + reminder logic | in progress | `supabase/functions/generate-schedule/{index.ts,deno.json}` (creator-JWT check → 403 for non-creators; one cycle per active member in `payout_position` order, weekly/monthly stepping from picked first-due-date; pending payout row per cycle at pooled pot `contribution_amount × members`; first run flips `forming`→`active`; reruns append-only for vote-added members; generic client errors, cause in logs) + `config.toml` entry. UI on `/groups/[id]`: creator gets `ScheduleGenerator.tsx` card (date picker default today+step, success/refresh handling), non-creators keep the waiting note; cycle cards show recipient `→ Name` + `pot` (shared-group profile resolution, masked fallback); server-computed reminder banners (overdue clay / due-within-3-days gold, no-row-counts-as-unpaid so nudges fire pre-first-payment). No migration — cycles/payouts writes stay service-role by design. Verified: `tsc` clean, `lint` clean (purity rule satisfied via `dueWindows()` helper), `build` passes 15/15 routes. Review fixes: reruns reachable via creator-only sync card (was start-card-only); generator backfills cycles missing payout rows (idempotent repair, `backfilled` in response); 5xx vs connection errors distinguished in the card. REMAINS: (1) deploy the function (no CLI here — `supabase functions deploy generate-schedule` via her setup); (2) fresh-circle e2e (create → join/vote → generate → sandbox pay → webhook → live ledger) which closes the Day 3 live-test gaps too. |

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
