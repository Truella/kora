-- Demo seed (Day 6) — realistic circles for local `supabase db reset` and the
-- stage demo, so the ledger looks alive without touching real money.
--
-- Staging-only fixtures (same role as the remote "Kora Sandbox Test" rows):
-- the app NEVER writes these paths at runtime — contributions still flip
-- pending → paid | late only via the payment webhook, payouts only via
-- process-payout. Amounts/phones are obviously fake (+234 test range).
--
-- Flow note: inserting auth.users fires handle_new_user (profiles row) and
-- inserting groups fires handle_new_group (founder member row) — the seed
-- updates those rows and references member ids via subselect, never
-- duplicating trigger work.
--
-- joined_at is set EXPLICITLY on every member row, never left to default
-- now(). That is load-bearing: under the R1 rule a member owes only the
-- cycles whose due date falls on or after the day they became active, so a
-- seeded member whose joined_at defaulted to the seed-run date would be
-- "not enrolled" in the backdated cycles below. Their history would still
-- count toward totals, but the progress denominator would collapse to the
-- one future cycle and the card would read ₦30,000 / ₦15,000.

-- 1. Test users (local auth only).
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'adaeze.demo@kora.test', 'dummy-hash-local-only',
    now(), '{"provider":"email","providers":["email"]}',
    '{"full_name":"Adaeze Okafor","country":"NG"}',
    now(), now()
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'chidi.demo@kora.test', 'dummy-hash-local-only',
    now(), '{"provider":"email","providers":["email"]}',
    '{"full_name":"Chidi Eze","country":"NG"}',
    now(), now()
  ),
  (
    'f1f1f1f1-1111-4111-8111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'tunde.demo@kora.test', 'dummy-hash-local-only',
    now(), '{"provider":"email","providers":["email"]}',
    '{"full_name":"Tunde Bakare","country":"NG"}',
    now(), now()
  )
on conflict (id) do nothing;

-- 2. Profiles: names + verified test phones (E.164 — the USSD lookup key).
update public.profiles
set full_name = 'Adaeze Okafor', phone = '+2348012345678', phone_verified = true
where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

update public.profiles
set full_name = 'Chidi Eze', phone = '+2348098765432', phone_verified = true
where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

update public.profiles
set full_name = 'Tunde Bakare', phone = '+2348055551234', phone_verified = true
where id = 'f1f1f1f1-1111-4111-8111-111111111111';

-- 3. Circle 1 — Lagos Market Circle (inserted active directly; founder row
--    auto-created by trigger, then backdated below).
insert into public.groups (
  id, name, description, created_by,
  contribution_amount, currency, frequency, vote_threshold, status
) values (
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'Lagos Market Circle',
  'Demo circle — traders saving weekly toward stall restock.',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  5000.00, 'NGN', 'weekly', 0.60, 'active'
)
on conflict (id) do nothing;

-- Founder row from handle_new_group — give it the same explicit joined_at,
-- and hand payout position 1 to Chidi. The rotation is Ada → Chidi → Chidi →
-- ... so cycle 2 is the one Adaeze is actually owed, and it is the most
-- recent settled cycle in the seed. That puts a "you received" row inside
-- /home's five-row activity strip instead of burying both of her receipts
-- under four newer contributions. Positions are set BEFORE the cycles are
-- inserted, since the cycle subselects resolve on payout_position.
update public.group_members
set joined_at = '2026-09-01T08:00:00Z', trust_score_cache = 100.00, payout_position = 2
where group_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'
  and user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- Second member (invited by the founder). Trust 50 via paid + late + missing.
insert into public.group_members (
  id, group_id, user_id, invited_by, status, payout_position, trust_score_cache, joined_at
) values (
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'active', 1, 50.00, '2026-09-01T09:00:00Z'
)
on conflict (group_id, user_id) do nothing;

-- Rotation: 3 weekly cycles (Chidi → Adaeze → Chidi).
insert into public.cycles (group_id, cycle_number, recipient_member_id, due_date, status) values
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc', 1,
    (select id from public.group_members
     where group_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' and payout_position = 1),
    '2026-09-11', 'completed'
  ),
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc', 2,
    (select id from public.group_members
     where group_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' and payout_position = 2),
    '2026-09-18', 'completed'
  ),
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc', 3,
    (select id from public.group_members
     where group_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' and payout_position = 1),
    '2026-09-25', 'upcoming'
  )
on conflict (group_id, cycle_number) do nothing;

-- Shares: Ada 3× paid (trust 100); Chidi paid + late + not-started
-- (no row = unpaid, exercises the reminder path) → trust 50.
insert into public.contributions (cycle_id, member_id, amount, status, payment_reference, paid_at) values
  (
    (select id from public.cycles where group_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' and cycle_number = 1),
    (select id from public.group_members where group_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' and payout_position = 1),
    5000.00, 'paid', 'demo_ada_c1', '2026-09-10T10:00:00Z'
  ),
  (
    (select id from public.cycles where group_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' and cycle_number = 1),
    (select id from public.group_members where group_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' and payout_position = 2),
    5000.00, 'paid', 'demo_chidi_c1', '2026-09-10T14:00:00Z'
  ),
  (
    (select id from public.cycles where group_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' and cycle_number = 2),
    (select id from public.group_members where group_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' and payout_position = 1),
    5000.00, 'paid', 'demo_ada_c2', '2026-09-17T09:00:00Z'
  ),
  (
    (select id from public.cycles where group_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' and cycle_number = 2),
    (select id from public.group_members where group_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' and payout_position = 2),
    5000.00, 'late', 'demo_chidi_c2', '2026-09-20T09:00:00Z'
  ),
  (
    (select id from public.cycles where group_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' and cycle_number = 3),
    (select id from public.group_members where group_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' and payout_position = 1),
    5000.00, 'paid', 'demo_ada_c3', '2026-09-23T09:00:00Z'
  )
on conflict (cycle_id, member_id) do nothing;

-- Disbursements: cycles 1–2 out, cycle 3 waiting on Chidi (pot ₦10,000).
-- Cycle 1's payout is stamped 20:00 rather than 18:00 so it does not tie with
-- Weekend Chama's cycle-1 payout at the same instant — the tie would fall to
-- array order and push the one payout addressed to Adaeze out of /home's
-- five-row activity strip, leaving the "you received" variant undemonstrated.
insert into public.payouts (cycle_id, recipient_member_id, amount, status, payout_reference, paid_at) values
  (
    (select id from public.cycles where group_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' and cycle_number = 1),
    (select id from public.group_members where group_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' and payout_position = 1),
    10000.00, 'completed', 'demo_payout_c1', '2026-09-11T20:00:00Z'
  ),
  (
    (select id from public.cycles where group_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' and cycle_number = 2),
    (select id from public.group_members where group_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' and payout_position = 2),
    10000.00, 'completed', 'demo_payout_c2', '2026-09-20T18:00:00Z'
  ),
  (
    (select id from public.cycles where group_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' and cycle_number = 3),
    (select id from public.group_members where group_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' and payout_position = 1),
    10000.00, 'pending', null, null
  )
on conflict (cycle_id) do nothing;

-- 8. Circle 2 — LASU Developers Ajo. The healthy case: a partial progress bar
--    (2 of 3 cycles settled) and a contribution due in a few days, which is
--    what the /home attention queue leads with.
insert into public.groups (
  id, name, description, created_by,
  contribution_amount, currency, frequency, vote_threshold, status
) values (
  'e2e2e2e2-0000-4000-8000-000000000002',
  'LASU Developers Ajo',
  'Monthly savings toward gear and certification fees.',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  15000.00, 'NGN', 'monthly', 0.60, 'active'
)
on conflict (id) do nothing;

update public.group_members
set joined_at = '2026-09-01T08:00:00Z', trust_score_cache = 100.00
where group_id = 'e2e2e2e2-0000-4000-8000-000000000002'
  and user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

insert into public.group_members (
  id, group_id, user_id, invited_by, status, payout_position, trust_score_cache, joined_at
) values
  (
    'a1000000-0000-4000-8000-000000000002',
    'e2e2e2e2-0000-4000-8000-000000000002',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'active', 2, 100.00, '2026-09-01T10:00:00Z'
  ),
  (
    'a1000000-0000-4000-8000-000000000003',
    'e2e2e2e2-0000-4000-8000-000000000002',
    'f1f1f1f1-1111-4111-8111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'active', 3, 100.00, '2026-09-01T11:00:00Z'
  )
on conflict (group_id, user_id) do nothing;

insert into public.cycles (group_id, cycle_number, recipient_member_id, due_date, status) values
  (
    'e2e2e2e2-0000-4000-8000-000000000002', 1,
    (select id from public.group_members
     where group_id = 'e2e2e2e2-0000-4000-8000-000000000002' and payout_position = 1),
    '2026-09-04', 'completed'
  ),
  (
    'e2e2e2e2-0000-4000-8000-000000000002', 2,
    (select id from public.group_members
     where group_id = 'e2e2e2e2-0000-4000-8000-000000000002' and payout_position = 2),
    '2026-09-18', 'completed'
  ),
  (
    'e2e2e2e2-0000-4000-8000-000000000002', 3,
    (select id from public.group_members
     where group_id = 'e2e2e2e2-0000-4000-8000-000000000002' and payout_position = 1),
    '2026-09-27', 'upcoming'
  )
on conflict (group_id, cycle_number) do nothing;

-- Cycles 1–2 fully settled. Cycle 3 deliberately has NO rows at all, so the
-- "no row means unpaid" path drives the due-soon attention item for everyone.
insert into public.contributions (cycle_id, member_id, amount, status, payment_reference, paid_at) values
  (
    (select id from public.cycles where group_id = 'e2e2e2e2-0000-4000-8000-000000000002' and cycle_number = 1),
    (select id from public.group_members where group_id = 'e2e2e2e2-0000-4000-8000-000000000002' and payout_position = 1),
    15000.00, 'paid', 'demo_lasu_m1', '2026-09-03T10:00:00Z'
  ),
  (
    (select id from public.cycles where group_id = 'e2e2e2e2-0000-4000-8000-000000000002' and cycle_number = 1),
    (select id from public.group_members where group_id = 'e2e2e2e2-0000-4000-8000-000000000002' and payout_position = 2),
    15000.00, 'paid', 'demo_lasu_chidi_m1', '2026-09-03T12:00:00Z'
  ),
  (
    (select id from public.cycles where group_id = 'e2e2e2e2-0000-4000-8000-000000000002' and cycle_number = 1),
    (select id from public.group_members where group_id = 'e2e2e2e2-0000-4000-8000-000000000002' and payout_position = 3),
    15000.00, 'paid', 'demo_lasu_tunde_m1', '2026-09-03T15:00:00Z'
  ),
  (
    (select id from public.cycles where group_id = 'e2e2e2e2-0000-4000-8000-000000000002' and cycle_number = 2),
    (select id from public.group_members where group_id = 'e2e2e2e2-0000-4000-8000-000000000002' and payout_position = 1),
    15000.00, 'paid', 'demo_lasu_m2', '2026-09-17T09:00:00Z'
  ),
  (
    (select id from public.cycles where group_id = 'e2e2e2e2-0000-4000-8000-000000000002' and cycle_number = 2),
    (select id from public.group_members where group_id = 'e2e2e2e2-0000-4000-8000-000000000002' and payout_position = 2),
    15000.00, 'paid', 'demo_lasu_chidi_m2', '2026-09-17T11:00:00Z'
  ),
  (
    (select id from public.cycles where group_id = 'e2e2e2e2-0000-4000-8000-000000000002' and cycle_number = 2),
    (select id from public.group_members where group_id = 'e2e2e2e2-0000-4000-8000-000000000002' and payout_position = 3),
    15000.00, 'paid', 'demo_lasu_tunde_m2', '2026-09-17T14:00:00Z'
  )
on conflict (cycle_id, member_id) do nothing;

insert into public.payouts (cycle_id, recipient_member_id, amount, status, payout_reference, paid_at) values
  (
    (select id from public.cycles where group_id = 'e2e2e2e2-0000-4000-8000-000000000002' and cycle_number = 1),
    (select id from public.group_members where group_id = 'e2e2e2e2-0000-4000-8000-000000000002' and payout_position = 1),
    45000.00, 'completed', 'demo_lasu_payout_c1', '2026-09-05T18:00:00Z'
  ),
  (
    (select id from public.cycles where group_id = 'e2e2e2e2-0000-4000-8000-000000000002' and cycle_number = 2),
    (select id from public.group_members where group_id = 'e2e2e2e2-0000-4000-8000-000000000002' and payout_position = 2),
    45000.00, 'completed', 'demo_lasu_payout_c2', '2026-09-19T18:00:00Z'
  ),
  (
    (select id from public.cycles where group_id = 'e2e2e2e2-0000-4000-8000-000000000002' and cycle_number = 3),
    (select id from public.group_members where group_id = 'e2e2e2e2-0000-4000-8000-000000000002' and payout_position = 1),
    45000.00, 'pending', null, null
  )
on conflict (cycle_id) do nothing;

-- 9. Circle 3 — Weekend Chama. The overdue case: cycle 2 fell due on the
--    20th and only one of three members has paid, so /home leads with an
--    overdue row and the card carries the payout-stall note.
insert into public.groups (
  id, name, description, created_by,
  contribution_amount, currency, frequency, vote_threshold, status
) values (
  'e3e3e3e3-0000-4000-8000-000000000003',
  'Weekend Chama',
  'Weekly top-ups toward the December trip.',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  10000.00, 'NGN', 'weekly', 0.60, 'active'
)
on conflict (id) do nothing;

update public.group_members
set joined_at = '2026-09-01T08:00:00Z', trust_score_cache = 100.00
where group_id = 'e3e3e3e3-0000-4000-8000-000000000003'
  and user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

insert into public.group_members (
  id, group_id, user_id, invited_by, status, payout_position, trust_score_cache, joined_at
) values
  (
    'a2000000-0000-4000-8000-000000000002',
    'e3e3e3e3-0000-4000-8000-000000000003',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'active', 2, 100.00, '2026-09-01T10:00:00Z'
  ),
  (
    'a2000000-0000-4000-8000-000000000003',
    'e3e3e3e3-0000-4000-8000-000000000003',
    'f1f1f1f1-1111-4111-8111-111111111111',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'active', 3, 100.00, '2026-09-01T11:00:00Z'
  )
on conflict (group_id, user_id) do nothing;

insert into public.cycles (group_id, cycle_number, recipient_member_id, due_date, status) values
  (
    'e3e3e3e3-0000-4000-8000-000000000003', 1,
    (select id from public.group_members
     where group_id = 'e3e3e3e3-0000-4000-8000-000000000003' and payout_position = 1),
    '2026-09-11', 'completed'
  ),
  (
    'e3e3e3e3-0000-4000-8000-000000000003', 2,
    (select id from public.group_members
     where group_id = 'e3e3e3e3-0000-4000-8000-000000000003' and payout_position = 2),
    '2026-09-20', 'upcoming'
  ),
  (
    'e3e3e3e3-0000-4000-8000-000000000003', 3,
    (select id from public.group_members
     where group_id = 'e3e3e3e3-0000-4000-8000-000000000003' and payout_position = 3),
    '2026-09-27', 'upcoming'
  )
on conflict (group_id, cycle_number) do nothing;

-- Cycle 1 settled by everyone. Cycle 2: Chidi paid, Adaeze and Tunde have no
-- row — Adaeze's missed share is the overdue item, Tunde's is why cycle 2's
-- payout is still pending.
insert into public.contributions (cycle_id, member_id, amount, status, payment_reference, paid_at) values
  (
    (select id from public.cycles where group_id = 'e3e3e3e3-0000-4000-8000-000000000003' and cycle_number = 1),
    (select id from public.group_members where group_id = 'e3e3e3e3-0000-4000-8000-000000000003' and payout_position = 1),
    10000.00, 'paid', 'demo_chama_c1', '2026-09-10T10:00:00Z'
  ),
  (
    (select id from public.cycles where group_id = 'e3e3e3e3-0000-4000-8000-000000000003' and cycle_number = 1),
    (select id from public.group_members where group_id = 'e3e3e3e3-0000-4000-8000-000000000003' and payout_position = 2),
    10000.00, 'paid', 'demo_chama_ada_c1', '2026-09-10T13:00:00Z'
  ),
  (
    (select id from public.cycles where group_id = 'e3e3e3e3-0000-4000-8000-000000000003' and cycle_number = 1),
    (select id from public.group_members where group_id = 'e3e3e3e3-0000-4000-8000-000000000003' and payout_position = 3),
    10000.00, 'paid', 'demo_chama_tunde_c1', '2026-09-10T16:00:00Z'
  ),
  (
    (select id from public.cycles where group_id = 'e3e3e3e3-0000-4000-8000-000000000003' and cycle_number = 2),
    (select id from public.group_members where group_id = 'e3e3e3e3-0000-4000-8000-000000000003' and payout_position = 1),
    10000.00, 'paid', 'demo_chama_c2', '2026-09-19T10:00:00Z'
  )
on conflict (cycle_id, member_id) do nothing;

insert into public.payouts (cycle_id, recipient_member_id, amount, status, payout_reference, paid_at) values
  (
    (select id from public.cycles where group_id = 'e3e3e3e3-0000-4000-8000-000000000003' and cycle_number = 1),
    (select id from public.group_members where group_id = 'e3e3e3e3-0000-4000-8000-000000000003' and payout_position = 1),
    30000.00, 'completed', 'demo_chama_payout_c1', '2026-09-11T18:00:00Z'
  ),
  (
    (select id from public.cycles where group_id = 'e3e3e3e3-0000-4000-8000-000000000003' and cycle_number = 2),
    (select id from public.group_members where group_id = 'e3e3e3e3-0000-4000-8000-000000000003' and payout_position = 2),
    30000.00, 'pending', null, null
  ),
  (
    (select id from public.cycles where group_id = 'e3e3e3e3-0000-4000-8000-000000000003' and cycle_number = 3),
    (select id from public.group_members where group_id = 'e3e3e3e3-0000-4000-8000-000000000003' and payout_position = 3),
    30000.00, 'pending', null, null
  )
on conflict (cycle_id) do nothing;

-- 10. Circle 4 — no schedule yet. The organizer (Adaeze) has not run
--     generate-schedule, so the card renders the "Waiting for schedule"
--     branch instead of a progress bar with no denominator.
insert into public.groups (
  id, name, description, created_by,
  contribution_amount, currency, frequency, vote_threshold, status
) values (
  'e4e4e4e4-0000-4000-8000-000000000004',
  'Family Savings Circle',
  'Quiet weekly savings with home friends — schedule not started yet.',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  5000.00, 'NGN', 'weekly', 0.60, 'forming'
)
on conflict (id) do nothing;

update public.group_members
set joined_at = '2026-09-20T08:00:00Z', trust_score_cache = 100.00
where group_id = 'e4e4e4e4-0000-4000-8000-000000000004'
  and user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
