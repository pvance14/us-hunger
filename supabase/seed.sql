-- ─────────────────────────────────────────────────────────────────────────────
-- Seed data for Control Tower dashboard
-- Wipes all tables and inserts a realistic snapshot for demo/dev purposes.
-- ─────────────────────────────────────────────────────────────────────────────

TRUNCATE TABLE public.message_events RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.sub_request_attempts RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.sub_requests RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.schedules RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.shifts RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.volunteers RESTART IDENTITY CASCADE;

-- ─── Volunteers ───────────────────────────────────────────────────────────────
-- 6 regular drivers, 4 substitutes, 1 inactive, 1 pending onboarding

INSERT INTO public.volunteers (id, first_name, last_name, phone_number, status, is_substitute, substitute_rank, insurance_expiry)
VALUES
  -- Regular drivers
  ('00000000-0000-0000-0000-000000000101', 'Maya',    'Rodriguez',  '+15551000001', 'active',             FALSE, NULL, CURRENT_DATE + 120),
  ('00000000-0000-0000-0000-000000000102', 'Leo',     'Nguyen',     '+15551000002', 'active',             FALSE, NULL, CURRENT_DATE + 14),
  ('00000000-0000-0000-0000-000000000103', 'Sofia',   'Okafor',     '+15551000003', 'active',             FALSE, NULL, CURRENT_DATE + 90),
  ('00000000-0000-0000-0000-000000000104', 'James',   'Walker',     '+15551000004', 'active',             FALSE, NULL, CURRENT_DATE + 60),
  ('00000000-0000-0000-0000-000000000105', 'Diana',   'Chen',       '+15551000005', 'active',             FALSE, NULL, CURRENT_DATE + 200),
  ('00000000-0000-0000-0000-000000000106', 'Marcus',  'Johnson',    '+15551000006', 'active',             FALSE, NULL, CURRENT_DATE + 45),
  -- Substitutes (ranked by reliability)
  ('00000000-0000-0000-0000-000000000107', 'Ava',     'Thompson',   '+15551000007', 'active',             TRUE,  1,    CURRENT_DATE + 180),
  ('00000000-0000-0000-0000-000000000108', 'Noah',    'Patel',      '+15551000008', 'active',             TRUE,  2,    CURRENT_DATE + 90),
  ('00000000-0000-0000-0000-000000000109', 'Eli',     'Santos',     '+15551000009', 'active',             TRUE,  3,    CURRENT_DATE + 30),
  ('00000000-0000-0000-0000-000000000110', 'Grace',   'Kim',        '+15551000010', 'active',             TRUE,  4,    CURRENT_DATE - 2),  -- expired insurance
  -- Inactive / pending
  ('00000000-0000-0000-0000-000000000111', 'Carlos',  'Mendez',     '+15551000011', 'pending_onboarding', FALSE, NULL, NULL),
  ('00000000-0000-0000-0000-000000000112', 'Rita',    'Moss',       '+15551000012', 'inactive',           FALSE, NULL, CURRENT_DATE + 10);


-- ─── Shifts ───────────────────────────────────────────────────────────────────

INSERT INTO public.shifts (id, name, location, instructions, required_volunteers)
VALUES
  ('10000000-0000-0000-0000-000000000201', 'Route 4A',  'North Pantry',          'Bring blue insulated bags. Check the volunteer map link before departure.', 1),
  ('10000000-0000-0000-0000-000000000202', 'Route 7B',  'Senior Center Annex',   'Pick up meal boxes at dock 2. Call dispatch if elevator is out.', 1),
  ('10000000-0000-0000-0000-000000000203', 'Route 10C', 'Downtown Hub',           'Bring printed manifests and park in the volunteer lot on 3rd Ave.', 1),
  ('10000000-0000-0000-0000-000000000204', 'Route 12D', 'Westside Kitchen',       'Use the silver coolers. Call dispatch if traffic on I-90 is heavy.', 1),
  ('10000000-0000-0000-0000-000000000205', 'Route 3E',  'Eastside Distribution',  'Arrive 15 min early for loading. Wear the orange vest from the supply closet.', 1),
  ('10000000-0000-0000-0000-000000000206', 'Route 9F',  'Midtown Drop',           'Buzz unit 4B on arrival. Leave cooler in the lobby if no answer.', 1);


-- ─── Schedules ────────────────────────────────────────────────────────────────
-- 6 confirmed (today/tomorrow), 3 scheduled/unconfirmed, 1 sub_requested,
-- 1 needs_review, 1 danger_zone

INSERT INTO public.schedules (id, shift_id, volunteer_id, scheduled_date, starts_at, status)
VALUES
  -- ✅ Confirmed (automation handled these)
  ('20000000-0000-0000-0000-000000000301',
    '10000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000101',
    (NOW() + INTERVAL '6 hours')::date,  NOW() + INTERVAL '6 hours',  'confirmed'),

  ('20000000-0000-0000-0000-000000000302',
    '10000000-0000-0000-0000-000000000202',
    '00000000-0000-0000-0000-000000000102',
    (NOW() + INTERVAL '8 hours')::date,  NOW() + INTERVAL '8 hours',  'confirmed'),

  ('20000000-0000-0000-0000-000000000303',
    '10000000-0000-0000-0000-000000000203',
    '00000000-0000-0000-0000-000000000103',
    (NOW() + INTERVAL '10 hours')::date, NOW() + INTERVAL '10 hours', 'confirmed'),

  ('20000000-0000-0000-0000-000000000304',
    '10000000-0000-0000-0000-000000000204',
    '00000000-0000-0000-0000-000000000104',
    (NOW() + INTERVAL '26 hours')::date, NOW() + INTERVAL '26 hours', 'confirmed'),

  ('20000000-0000-0000-0000-000000000305',
    '10000000-0000-0000-0000-000000000205',
    '00000000-0000-0000-0000-000000000105',
    (NOW() + INTERVAL '30 hours')::date, NOW() + INTERVAL '30 hours', 'confirmed'),

  ('20000000-0000-0000-0000-000000000306',
    '10000000-0000-0000-0000-000000000206',
    '00000000-0000-0000-0000-000000000106',
    (NOW() + INTERVAL '48 hours')::date, NOW() + INTERVAL '48 hours', 'confirmed'),

  -- 📩 Scheduled / unconfirmed (reminder sent, no response yet)
  ('20000000-0000-0000-0000-000000000307',
    '10000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000101',
    (NOW() + INTERVAL '54 hours')::date, NOW() + INTERVAL '54 hours', 'scheduled'),

  ('20000000-0000-0000-0000-000000000308',
    '10000000-0000-0000-0000-000000000203',
    '00000000-0000-0000-0000-000000000103',
    (NOW() + INTERVAL '56 hours')::date, NOW() + INTERVAL '56 hours', 'scheduled'),

  ('20000000-0000-0000-0000-000000000309',
    '10000000-0000-0000-0000-000000000205',
    '00000000-0000-0000-0000-000000000105',
    (NOW() + INTERVAL '58 hours')::date, NOW() + INTERVAL '58 hours', 'scheduled'),

  -- 🔄 Sub requested (James can't make it, searching for cover)
  ('20000000-0000-0000-0000-000000000310',
    '10000000-0000-0000-0000-000000000202',
    '00000000-0000-0000-0000-000000000102',
    (NOW() + INTERVAL '5 hours')::date,  NOW() + INTERVAL '5 hours',  'confirmed'),

  -- ⚠️ Needs review (Diana sent a free-text message the bot couldn't parse)
  ('20000000-0000-0000-0000-000000000311',
    '10000000-0000-0000-0000-000000000204',
    '00000000-0000-0000-0000-000000000105',
    (NOW() + INTERVAL '3 hours')::date,  NOW() + INTERVAL '3 hours',  'needs_review'),

  -- 🚨 Danger zone (Marcus cancelled with 90 min notice, no sub found)
  ('20000000-0000-0000-0000-000000000312',
    '10000000-0000-0000-0000-000000000206',
    '00000000-0000-0000-0000-000000000106',
    (NOW() + INTERVAL '90 minutes')::date, NOW() + INTERVAL '90 minutes', 'danger_zone');


-- ─── Sub Requests ─────────────────────────────────────────────────────────────

INSERT INTO public.sub_requests (id, schedule_id, requesting_volunteer_id, status)
VALUES
  -- Escalated: Diana's shift needs human follow-up
  ('30000000-0000-0000-0000-000000000402',
    '20000000-0000-0000-0000-000000000311',
    '00000000-0000-0000-0000-000000000105',
    'escalated'),

  -- Searching: Marcus's danger-zone shift, still trying
  ('30000000-0000-0000-0000-000000000403',
    '20000000-0000-0000-0000-000000000312',
    '00000000-0000-0000-0000-000000000106',
    'searching');


-- ─── Sub Request Attempts ─────────────────────────────────────────────────────

INSERT INTO public.sub_request_attempts (sub_request_id, candidate_volunteer_id, attempt_order, status, contacted_at, responded_at)
VALUES
  -- For the searching request (Marcus's danger zone): Ava contacted, waiting
  ('30000000-0000-0000-0000-000000000403', '00000000-0000-0000-0000-000000000107', 1, 'sent',
    NOW() - INTERVAL '10 minutes', NULL);


-- ─── Message Events ───────────────────────────────────────────────────────────
-- Realistic conversation history across multiple volunteers

INSERT INTO public.message_events (phone_number, volunteer_id, schedule_id, sub_request_id, direction, message_type, normalized_text, requires_review, body, created_at)
VALUES
  -- Maya (Route 4A, drip reminders + confirmed) ───────────────────────────
  ('+15551000001', '00000000-0000-0000-0000-000000000101', '20000000-0000-0000-0000-000000000307', NULL,
    'outbound', 'reminder_t72', NULL, FALSE,
    'Checking in on Route 4A this week. Reply YES to confirm or SUB if you need a replacement.',
    NOW() - INTERVAL '72 hours'),
  ('+15551000001', '00000000-0000-0000-0000-000000000101', '20000000-0000-0000-0000-000000000307', NULL,
    'inbound', 'confirmation', 'YES', FALSE,
    'YES',
    NOW() - INTERVAL '71 hours 55 minutes'),
  ('+15551000001', '00000000-0000-0000-0000-000000000101', '20000000-0000-0000-0000-000000000307', NULL,
    'system', 'status', NULL, FALSE,
    'Maya Rodriguez confirmed for Route 4A. Shift is set.',
    NOW() - INTERVAL '71 hours 54 minutes'),
  ('+15551000001', '00000000-0000-0000-0000-000000000101', '20000000-0000-0000-0000-000000000301', NULL,
    'outbound', 'reminder_t24', NULL, FALSE,
    'Tomorrow is Route 4A. Bring blue insulated bags and check the volunteer map before departure.',
    NOW() - INTERVAL '24 hours'),
  ('+15551000001', '00000000-0000-0000-0000-000000000101', '20000000-0000-0000-0000-000000000301', NULL,
    'outbound', 'reminder_t2', NULL, FALSE,
    'Route 4A starts soon. Thanks for serving today. Reply HELP if you need a coordinator.',
    NOW() - INTERVAL '2 hours'),

  -- Sofia (Route 10C, confirmed) ────────────────────────────────────────────
  ('+15551000003', '00000000-0000-0000-0000-000000000103', '20000000-0000-0000-0000-000000000303', NULL,
    'outbound', 'reminder', NULL, FALSE,
    'Hi Sofia! Your Route 10C shift is tomorrow. Bring printed manifests. Reply YES to confirm.',
    NOW() - INTERVAL '23 hours'),
  ('+15551000003', '00000000-0000-0000-0000-000000000103', '20000000-0000-0000-0000-000000000303', NULL,
    'inbound', 'confirmation', 'YES', FALSE,
    'YES will be there!',
    NOW() - INTERVAL '22 hours 50 minutes'),
  ('+15551000003', '00000000-0000-0000-0000-000000000103', '20000000-0000-0000-0000-000000000303', NULL,
    'system', 'status', NULL, FALSE,
    'Sofia Okafor confirmed for Route 10C.',
    NOW() - INTERVAL '22 hours 49 minutes'),

  -- Leo (Route 7B → ready for a live SUB request) ─────────────────────────
  ('+15551000002', '00000000-0000-0000-0000-000000000102', '20000000-0000-0000-0000-000000000310', NULL,
    'outbound', 'reminder_t24', NULL, FALSE,
    'Tomorrow is Route 7B. Pick up meal boxes at dock 2 and call dispatch if the elevator is out.',
    NOW() - INTERVAL '24 hours'),

  -- Diana (Route 12D → needs review) ───────────────────────────────────────
  ('+15551000005', '00000000-0000-0000-0000-000000000105', '20000000-0000-0000-0000-000000000311', NULL,
    'outbound', 'reminder', NULL, FALSE,
    'Hi Diana! Your Route 12D shift starts in 3 hrs at Westside Kitchen. Reply YES to confirm or NO to cancel.',
    NOW() - INTERVAL '3 hours'),
  ('+15551000005', '00000000-0000-0000-0000-000000000105', '20000000-0000-0000-0000-000000000311', NULL,
    'inbound', 'general', NULL, TRUE,
    'I am not sure where exactly to park, the volunteer lot is closed today according to the sign',
    NOW() - INTERVAL '2 hours 58 minutes'),
  ('+15551000005', '00000000-0000-0000-0000-000000000105', '20000000-0000-0000-0000-000000000311', NULL,
    'system', 'flagged', NULL, FALSE,
    'Flagged for human review — Diana sent a message the system could not interpret as a confirmation or cancellation.',
    NOW() - INTERVAL '2 hours 57 minutes'),

  -- Marcus (Route 9F → danger zone) ────────────────────────────────────────
  ('+15551000006', '00000000-0000-0000-0000-000000000106', '20000000-0000-0000-0000-000000000312', NULL,
    'inbound', 'cancellation', 'NO', FALSE,
    'I am so sorry I cannot make it today, family emergency',
    NOW() - INTERVAL '50 minutes'),
  ('+15551000006', '00000000-0000-0000-0000-000000000106', '20000000-0000-0000-0000-000000000312', NULL,
    'outbound', 'acknowledgement', NULL, FALSE,
    'We understand Marcus. We will try to find someone to cover Route 9F immediately.',
    NOW() - INTERVAL '49 minutes'),
  ('+15551000007', '00000000-0000-0000-0000-000000000107', '20000000-0000-0000-0000-000000000312', '30000000-0000-0000-0000-000000000403',
    'outbound', 'sub_offer', NULL, FALSE,
    'URGENT: Ava, can you cover Route 9F (Midtown Drop) starting in 90 min? Reply YES or NO.',
    NOW() - INTERVAL '48 minutes'),
  ('+15551000010', NULL, '20000000-0000-0000-0000-000000000312', '30000000-0000-0000-0000-000000000403',
    'system', 'danger_zone', NULL, FALSE,
    'Danger zone alert: Route 9F starts in under 2 hours with no confirmed volunteer. Coordinator should call directly.',
    NOW() - INTERVAL '47 minutes');
