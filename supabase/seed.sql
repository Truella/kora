-- Demo seed (Day 6) — realistic circle for local `supabase db reset` and the
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
    '{"full_name":"Adaeze Okafor"}',
    now(), now()
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'chidi.demo@kora.test', 'dummy-hash-local-only',
    now(), '{"provider":"email","providers":["email"]}',
    '{"full_name":"Chidi Eze"}',
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

-- 3. Circle (inserted active directly; founder row auto-created by trigger).
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

-- 4. Second member (invited by the founder).
insert into public.group_members (
  id, group_id, user_id, invited_by, status, payout_position, trust_score_cache
) values (
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'active', 2, 50.00
)
on conflict (group_id, user_id) do nothing;

-- 5. Rotation: 3 weekly cycles (Ada → Chidi → Ada).
insert into public.cycles (group_id, cycle_number, recipient_member_id, due_date, status)
values
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

-- 6. Shares: Ada 3× paid (trust 100); Chidi paid + late + not-started
-- (no row = unpaid, exercises the reminder path) → trust 50.
insert into public.contributions (cycle_id, member_id, amount, status, payment_reference, paid_at)
values
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

-- 7. Disbursements: cycles 1–2 out, cycle 3 waiting on Chidi (pot ₦10,000).
insert into public.payouts (cycle_id, recipient_member_id, amount, status, payout_reference, paid_at)
values
  (
    (select id from public.cycles where group_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' and cycle_number = 1),
    (select id from public.group_members where group_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' and payout_position = 1),
    10000.00, 'completed', 'demo_payout_c1', '2026-09-11T18:00:00Z'
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
