TRUNCATE TABLE public.message_events RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.sub_request_attempts RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.sub_requests RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.schedules RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.shifts RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.volunteers RESTART IDENTITY CASCADE;

WITH volunteers_seed AS (
    INSERT INTO public.volunteers (id, first_name, last_name, phone_number, status, insurance_expiry)
    VALUES
        ('00000000-0000-0000-0000-000000000101', 'Maya', 'Driver', '+15551000001', 'active', CURRENT_DATE + 30),
        ('00000000-0000-0000-0000-000000000102', 'Leo', 'Driver', '+15551000002', 'active', CURRENT_DATE + 7),
        ('00000000-0000-0000-0000-000000000103', 'Sofia', 'Helper', '+15551000003', 'active', CURRENT_DATE + 90),
        ('00000000-0000-0000-0000-000000000104', 'Ava', 'Sub', '+15551000004', 'active', CURRENT_DATE + 45),
        ('00000000-0000-0000-0000-000000000105', 'Noah', 'Sub', '+15551000005', 'active', CURRENT_DATE + 60),
        ('00000000-0000-0000-0000-000000000106', 'Eli', 'Sub', '+15551000006', 'active', CURRENT_DATE + 15),
        ('00000000-0000-0000-0000-000000000107', 'Grace', 'Sub', '+15551000007', 'active', CURRENT_DATE - 1),
        ('00000000-0000-0000-0000-000000000108', 'Tara', 'Pending', '+15551000008', 'pending_onboarding', NULL)
    RETURNING id, first_name
),
shifts_seed AS (
    INSERT INTO public.shifts (id, name, location, instructions, required_volunteers)
    VALUES
        ('10000000-0000-0000-0000-000000000201', 'Route 4A', 'North Pantry', 'Bring blue insulated bags and check the volunteer map link.', 1),
        ('10000000-0000-0000-0000-000000000202', 'Route 7B', 'Senior Center Annex', 'Pick up meal boxes at dock 2 before departure.', 1),
        ('10000000-0000-0000-0000-000000000203', 'Route 10C', 'Downtown Hub', 'Bring printed manifests and park in the volunteer lot.', 1),
        ('10000000-0000-0000-0000-000000000204', 'Route 12D', 'Westside Kitchen', 'Use the silver coolers and call dispatch if traffic is heavy.', 1)
    RETURNING id, name
)
INSERT INTO public.schedules (id, shift_id, volunteer_id, scheduled_date, starts_at, status)
VALUES
    (
        '20000000-0000-0000-0000-000000000301',
        '10000000-0000-0000-0000-000000000201',
        '00000000-0000-0000-0000-000000000101',
        (NOW() + INTERVAL '72 hours')::date,
        NOW() + INTERVAL '72 hours',
        'scheduled'
    ),
    (
        '20000000-0000-0000-0000-000000000302',
        '10000000-0000-0000-0000-000000000202',
        '00000000-0000-0000-0000-000000000102',
        (NOW() + INTERVAL '2 hours')::date,
        NOW() + INTERVAL '2 hours',
        'scheduled'
    ),
    (
        '20000000-0000-0000-0000-000000000303',
        '10000000-0000-0000-0000-000000000203',
        '00000000-0000-0000-0000-000000000103',
        (NOW() + INTERVAL '24 hours')::date,
        NOW() + INTERVAL '24 hours',
        'confirmed'
    ),
    (
        '20000000-0000-0000-0000-000000000304',
        '10000000-0000-0000-0000-000000000204',
        NULL,
        (NOW() + INTERVAL '48 hours')::date,
        NOW() + INTERVAL '48 hours',
        'needs_review'
    );

INSERT INTO public.message_events (
    phone_number,
    volunteer_id,
    schedule_id,
    direction,
    message_type,
    normalized_text,
    body
)
VALUES
    (
        '+15551000003',
        '00000000-0000-0000-0000-000000000103',
        '20000000-0000-0000-0000-000000000303',
        'outbound',
        'reminder',
        'YES',
        'Tomorrow is your Route 10C shift. Bring printed manifests and park in the volunteer lot.'
    ),
    (
        '+15551000003',
        '00000000-0000-0000-0000-000000000103',
        '20000000-0000-0000-0000-000000000303',
        'inbound',
        'confirmation',
        'YES',
        'YES'
    ),
    (
        '+15551000003',
        '00000000-0000-0000-0000-000000000103',
        '20000000-0000-0000-0000-000000000303',
        'system',
        'status',
        NULL,
        'Route 10C is confirmed and visible on the Control Tower dashboard.'
    );
