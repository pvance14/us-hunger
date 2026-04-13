// Run from the repo root (reads from frontend/.env.local):
//   node -e "require('fs').readdirSync('frontend').includes('.env.local') && Object.assign(process.env, require('dotenv').parse(require('fs').readFileSync('frontend/.env.local')))" && node seed.js
//
// Or manually:
//   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=xxx node seed.js

const { createClient } = require('./frontend/node_modules/@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing env vars. Run: NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node seed.js');
  console.error('Or from the frontend dir: node -r dotenv/config ../seed.js dotenv_config_path=.env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

function addHours(h) {
  return new Date(Date.now() + h * 60 * 60 * 1000).toISOString();
}
function addMinutes(m) {
  return new Date(Date.now() + m * 60 * 1000).toISOString();
}
function subHours(h) {
  return new Date(Date.now() - h * 60 * 60 * 1000).toISOString();
}
function subMinutes(m) {
  return new Date(Date.now() - m * 60 * 1000).toISOString();
}
function subTime({ days = 0, hours = 0, minutes = 0 }) {
  return new Date(
    Date.now() - (
      (days * 24 * 60 * 60 * 1000)
      + (hours * 60 * 60 * 1000)
      + (minutes * 60 * 1000)
    ),
  ).toISOString();
}
function dateOnly(iso) {
  return iso.slice(0, 10);
}
function addDays(d) {
  return dateOnly(new Date(Date.now() + d * 86400000).toISOString());
}
function subDays(d) {
  return dateOnly(new Date(Date.now() - d * 86400000).toISOString());
}

async function run() {
  console.log('Clearing existing data...');

  // Delete in FK-safe order
  for (const table of ['message_events', 'sub_request_attempts', 'sub_requests', 'schedules', 'shifts', 'volunteers']) {
    const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) {
      // Some tables use non-uuid PKs — try a broader delete
      const { error: e2 } = await supabase.from(table).delete().gte('id', 0);
      if (e2) console.warn(`  Warning clearing ${table}:`, e2.message);
    }
  }
  console.log('  Done.\n');

  // ─── Volunteers ──────────────────────────────────────────────────────────────
  console.log('Inserting volunteers...');
  const { error: vErr } = await supabase.from('volunteers').insert([
    { id: '00000000-0000-0000-0000-000000000101', first_name: 'Maya',   last_name: 'Rodriguez', phone_number: '+15551000001', status: 'active',             is_substitute: false, substitute_rank: null, insurance_expiry: addDays(120) },
    { id: '00000000-0000-0000-0000-000000000102', first_name: 'Leo',    last_name: 'Nguyen',    phone_number: '+15551000002', status: 'active',             is_substitute: false, substitute_rank: null, insurance_expiry: addDays(14) },
    { id: '00000000-0000-0000-0000-000000000103', first_name: 'Sofia',  last_name: 'Okafor',    phone_number: '+15551000003', status: 'active',             is_substitute: false, substitute_rank: null, insurance_expiry: addDays(90) },
    { id: '00000000-0000-0000-0000-000000000104', first_name: 'James',  last_name: 'Walker',    phone_number: '+15551000004', status: 'active',             is_substitute: false, substitute_rank: null, insurance_expiry: addDays(60) },
    { id: '00000000-0000-0000-0000-000000000105', first_name: 'Diana',  last_name: 'Chen',      phone_number: '+15551000005', status: 'active',             is_substitute: false, substitute_rank: null, insurance_expiry: addDays(200) },
    { id: '00000000-0000-0000-0000-000000000106', first_name: 'Marcus', last_name: 'Johnson',   phone_number: '+15551000006', status: 'active',             is_substitute: false, substitute_rank: null, insurance_expiry: addDays(45) },
    { id: '00000000-0000-0000-0000-000000000107', first_name: 'Ava',    last_name: 'Thompson',  phone_number: '+15551000007', status: 'active',             is_substitute: true,  substitute_rank: 1,    insurance_expiry: addDays(180) },
    { id: '00000000-0000-0000-0000-000000000108', first_name: 'Noah',   last_name: 'Patel',     phone_number: '+15551000008', status: 'active',             is_substitute: true,  substitute_rank: 2,    insurance_expiry: addDays(90) },
    { id: '00000000-0000-0000-0000-000000000109', first_name: 'Eli',    last_name: 'Santos',    phone_number: '+15551000009', status: 'active',             is_substitute: true,  substitute_rank: 3,    insurance_expiry: addDays(30) },
    { id: '00000000-0000-0000-0000-000000000110', first_name: 'Grace',  last_name: 'Kim',       phone_number: '+15551000010', status: 'active',             is_substitute: true,  substitute_rank: 4,    insurance_expiry: subDays(2) },
    { id: '00000000-0000-0000-0000-000000000111', first_name: 'Carlos', last_name: 'Mendez',    phone_number: '+15551000011', status: 'pending_onboarding', is_substitute: false, substitute_rank: null, insurance_expiry: null },
    { id: '00000000-0000-0000-0000-000000000112', first_name: 'Rita',   last_name: 'Moss',      phone_number: '+15551000012', status: 'inactive',           is_substitute: false, substitute_rank: null, insurance_expiry: addDays(10) },
  ]);
  if (vErr) { console.error('  Volunteers error:', vErr.message); process.exit(1); }
  console.log('  12 volunteers inserted.\n');

  // ─── Shifts ──────────────────────────────────────────────────────────────────
  console.log('Inserting shifts...');
  const { error: sErr } = await supabase.from('shifts').insert([
    { id: '10000000-0000-0000-0000-000000000201', name: 'Route 4A',  location: 'North Pantry',         instructions: 'Bring blue insulated bags. Check the volunteer map link before departure.', required_volunteers: 1 },
    { id: '10000000-0000-0000-0000-000000000202', name: 'Route 7B',  location: 'Senior Center Annex',  instructions: 'Pick up meal boxes at dock 2. Call dispatch if elevator is out.', required_volunteers: 1 },
    { id: '10000000-0000-0000-0000-000000000203', name: 'Route 10C', location: 'Downtown Hub',          instructions: 'Bring printed manifests and park in the volunteer lot on 3rd Ave.', required_volunteers: 1 },
    { id: '10000000-0000-0000-0000-000000000204', name: 'Route 12D', location: 'Westside Kitchen',      instructions: 'Use the silver coolers. Call dispatch if traffic on I-90 is heavy.', required_volunteers: 1 },
    { id: '10000000-0000-0000-0000-000000000205', name: 'Route 3E',  location: 'Eastside Distribution', instructions: 'Arrive 15 min early for loading. Wear the orange vest from the supply closet.', required_volunteers: 1 },
    { id: '10000000-0000-0000-0000-000000000206', name: 'Route 9F',  location: 'Midtown Drop',          instructions: 'Buzz unit 4B on arrival. Leave cooler in the lobby if no answer.', required_volunteers: 1 },
  ]);
  if (sErr) { console.error('  Shifts error:', sErr.message); process.exit(1); }
  console.log('  6 shifts inserted.\n');

  // ─── Schedules ───────────────────────────────────────────────────────────────
  console.log('Inserting schedules...');
  const { error: scErr } = await supabase.from('schedules').insert([
    { id: '20000000-0000-0000-0000-000000000301', shift_id: '10000000-0000-0000-0000-000000000201', volunteer_id: '00000000-0000-0000-0000-000000000101', scheduled_date: dateOnly(addHours(6)),  starts_at: addHours(6),  status: 'confirmed' },
    { id: '20000000-0000-0000-0000-000000000302', shift_id: '10000000-0000-0000-0000-000000000202', volunteer_id: '00000000-0000-0000-0000-000000000102', scheduled_date: dateOnly(addHours(8)),  starts_at: addHours(8),  status: 'confirmed' },
    { id: '20000000-0000-0000-0000-000000000303', shift_id: '10000000-0000-0000-0000-000000000203', volunteer_id: '00000000-0000-0000-0000-000000000103', scheduled_date: dateOnly(addHours(10)), starts_at: addHours(10), status: 'confirmed' },
    { id: '20000000-0000-0000-0000-000000000304', shift_id: '10000000-0000-0000-0000-000000000204', volunteer_id: '00000000-0000-0000-0000-000000000104', scheduled_date: dateOnly(addHours(26)), starts_at: addHours(26), status: 'confirmed' },
    { id: '20000000-0000-0000-0000-000000000305', shift_id: '10000000-0000-0000-0000-000000000205', volunteer_id: '00000000-0000-0000-0000-000000000105', scheduled_date: dateOnly(addHours(30)), starts_at: addHours(30), status: 'confirmed' },
    { id: '20000000-0000-0000-0000-000000000306', shift_id: '10000000-0000-0000-0000-000000000206', volunteer_id: '00000000-0000-0000-0000-000000000106', scheduled_date: dateOnly(addHours(48)), starts_at: addHours(48), status: 'confirmed' },
    { id: '20000000-0000-0000-0000-000000000307', shift_id: '10000000-0000-0000-0000-000000000201', volunteer_id: '00000000-0000-0000-0000-000000000101', scheduled_date: dateOnly(addHours(54)), starts_at: addHours(54), status: 'scheduled' },
    { id: '20000000-0000-0000-0000-000000000308', shift_id: '10000000-0000-0000-0000-000000000203', volunteer_id: '00000000-0000-0000-0000-000000000103', scheduled_date: dateOnly(addHours(56)), starts_at: addHours(56), status: 'scheduled' },
    { id: '20000000-0000-0000-0000-000000000309', shift_id: '10000000-0000-0000-0000-000000000205', volunteer_id: '00000000-0000-0000-0000-000000000105', scheduled_date: dateOnly(addHours(58)), starts_at: addHours(58), status: 'scheduled' },
    { id: '20000000-0000-0000-0000-000000000310', shift_id: '10000000-0000-0000-0000-000000000202', volunteer_id: '00000000-0000-0000-0000-000000000102', scheduled_date: dateOnly(addHours(5)),  starts_at: addHours(5),  status: 'confirmed' },
    { id: '20000000-0000-0000-0000-000000000311', shift_id: '10000000-0000-0000-0000-000000000204', volunteer_id: '00000000-0000-0000-0000-000000000105', scheduled_date: dateOnly(addHours(3)),  starts_at: addHours(3),  status: 'needs_review' },
    { id: '20000000-0000-0000-0000-000000000312', shift_id: '10000000-0000-0000-0000-000000000206', volunteer_id: '00000000-0000-0000-0000-000000000106', scheduled_date: dateOnly(addMinutes(90)), starts_at: addMinutes(90), status: 'danger_zone' },
  ]);
  if (scErr) { console.error('  Schedules error:', scErr.message); process.exit(1); }
  console.log('  12 schedules inserted.\n');

  // ─── Sub Requests ─────────────────────────────────────────────────────────────
  console.log('Inserting sub requests...');
  const { error: srErr } = await supabase.from('sub_requests').insert([
    { id: '30000000-0000-0000-0000-000000000402', schedule_id: '20000000-0000-0000-0000-000000000311', requesting_volunteer_id: '00000000-0000-0000-0000-000000000105', status: 'escalated' },
    { id: '30000000-0000-0000-0000-000000000403', schedule_id: '20000000-0000-0000-0000-000000000312', requesting_volunteer_id: '00000000-0000-0000-0000-000000000106', status: 'searching' },
  ]);
  if (srErr) { console.error('  Sub requests error:', srErr.message); process.exit(1); }
  console.log('  2 sub requests inserted.\n');

  // ─── Sub Request Attempts ─────────────────────────────────────────────────────
  console.log('Inserting sub request attempts...');
  const { error: saErr } = await supabase.from('sub_request_attempts').insert([
    { sub_request_id: '30000000-0000-0000-0000-000000000403', candidate_volunteer_id: '00000000-0000-0000-0000-000000000107', attempt_order: 1, status: 'sent',     contacted_at: subMinutes(10), responded_at: null },
  ]);
  if (saErr) { console.error('  Sub request attempts error:', saErr.message); process.exit(1); }
  console.log('  1 sub request attempt inserted.\n');

  // ─── Message Events ───────────────────────────────────────────────────────────
  console.log('Inserting message events...');
  const { error: mErr } = await supabase.from('message_events').insert([
    // Maya — drip reminders + confirmation for Route 4A
    { phone_number: '+15551000001', volunteer_id: '00000000-0000-0000-0000-000000000101', schedule_id: '20000000-0000-0000-0000-000000000307', sub_request_id: null, direction: 'outbound', message_type: 'reminder_t72',    normalized_text: null,  requires_review: false, body: 'Checking in on Route 4A this week. Reply YES to confirm or SUB if you need a replacement.', created_at: subTime({ days: 3 }) },
    { phone_number: '+15551000001', volunteer_id: '00000000-0000-0000-0000-000000000101', schedule_id: '20000000-0000-0000-0000-000000000307', sub_request_id: null, direction: 'inbound',  message_type: 'confirmation',    normalized_text: 'YES', requires_review: false, body: 'YES', created_at: subTime({ days: 2, hours: 23, minutes: 55 }) },
    { phone_number: '+15551000001', volunteer_id: '00000000-0000-0000-0000-000000000101', schedule_id: '20000000-0000-0000-0000-000000000307', sub_request_id: null, direction: 'system',   message_type: 'status',          normalized_text: null,  requires_review: false, body: 'Maya Rodriguez confirmed for Route 4A. Shift is set.', created_at: subTime({ days: 2, hours: 23, minutes: 54 }) },
    { phone_number: '+15551000001', volunteer_id: '00000000-0000-0000-0000-000000000101', schedule_id: '20000000-0000-0000-0000-000000000301', sub_request_id: null, direction: 'outbound', message_type: 'reminder_t24',    normalized_text: null,  requires_review: false, body: 'Tomorrow is Route 4A. Bring blue insulated bags and check the volunteer map before departure.', created_at: subHours(24) },
    { phone_number: '+15551000001', volunteer_id: '00000000-0000-0000-0000-000000000101', schedule_id: '20000000-0000-0000-0000-000000000301', sub_request_id: null, direction: 'outbound', message_type: 'reminder_t2',     normalized_text: null,  requires_review: false, body: 'Route 4A starts soon. Thanks for serving today. Reply HELP if you need a coordinator.', created_at: subHours(2) },
    // Sofia — confirmed Route 10C
    { phone_number: '+15551000003', volunteer_id: '00000000-0000-0000-0000-000000000103', schedule_id: '20000000-0000-0000-0000-000000000303', sub_request_id: null, direction: 'outbound', message_type: 'reminder',        normalized_text: null,  requires_review: false, body: 'Hi Sofia! Your Route 10C shift is tomorrow. Bring printed manifests. Reply YES to confirm.', created_at: subTime({ hours: 23 }) },
    { phone_number: '+15551000003', volunteer_id: '00000000-0000-0000-0000-000000000103', schedule_id: '20000000-0000-0000-0000-000000000303', sub_request_id: null, direction: 'inbound',  message_type: 'confirmation',    normalized_text: 'YES', requires_review: false, body: 'YES will be there!', created_at: subTime({ hours: 22, minutes: 50 }) },
    { phone_number: '+15551000003', volunteer_id: '00000000-0000-0000-0000-000000000103', schedule_id: '20000000-0000-0000-0000-000000000303', sub_request_id: null, direction: 'system',   message_type: 'status',          normalized_text: null,  requires_review: false, body: 'Sofia Okafor confirmed for Route 10C.', created_at: subTime({ hours: 22, minutes: 49 }) },
    // Leo — live substitute request starts from a clean thread
    { phone_number: '+15551000002', volunteer_id: '00000000-0000-0000-0000-000000000102', schedule_id: '20000000-0000-0000-0000-000000000310', sub_request_id: null, direction: 'outbound', message_type: 'reminder_t24', normalized_text: null, requires_review: false, body: 'Tomorrow is Route 7B. Pick up meal boxes at dock 2 and call dispatch if the elevator is out.', created_at: subTime({ hours: 23, minutes: 30 }) },
    // Diana — needs review
    { phone_number: '+15551000005', volunteer_id: '00000000-0000-0000-0000-000000000105', schedule_id: '20000000-0000-0000-0000-000000000311', sub_request_id: null, direction: 'outbound', message_type: 'reminder',        normalized_text: null,  requires_review: false, body: 'Hi Diana! Your Route 12D shift starts in 3 hrs at Westside Kitchen. Reply YES to confirm or NO to cancel.', created_at: subTime({ hours: 3 }) },
    { phone_number: '+15551000005', volunteer_id: '00000000-0000-0000-0000-000000000105', schedule_id: '20000000-0000-0000-0000-000000000311', sub_request_id: null, direction: 'inbound',  message_type: 'general',         normalized_text: null,  requires_review: true,  body: 'I am not sure where exactly to park, the volunteer lot is closed today according to the sign', created_at: subTime({ hours: 2, minutes: 58 }) },
    { phone_number: '+15551000005', volunteer_id: '00000000-0000-0000-0000-000000000105', schedule_id: '20000000-0000-0000-0000-000000000311', sub_request_id: null, direction: 'system',   message_type: 'flagged',         normalized_text: null,  requires_review: false, body: 'Flagged for human review — Diana sent a message the system could not interpret as a confirmation or cancellation.', created_at: subTime({ hours: 2, minutes: 57 }) },
    // Marcus — danger zone
    { phone_number: '+15551000006', volunteer_id: '00000000-0000-0000-0000-000000000106', schedule_id: '20000000-0000-0000-0000-000000000312', sub_request_id: null,                                          direction: 'inbound',  message_type: 'cancellation',    normalized_text: 'NO', requires_review: false, body: 'I am so sorry I cannot make it today, family emergency', created_at: subTime({ minutes: 50 }) },
    { phone_number: '+15551000006', volunteer_id: '00000000-0000-0000-0000-000000000106', schedule_id: '20000000-0000-0000-0000-000000000312', sub_request_id: null,                                          direction: 'outbound', message_type: 'acknowledgement', normalized_text: null,  requires_review: false, body: 'We understand Marcus. We will try to find someone to cover Route 9F immediately.', created_at: subTime({ minutes: 49 }) },
    { phone_number: '+15551000007', volunteer_id: '00000000-0000-0000-0000-000000000107', schedule_id: '20000000-0000-0000-0000-000000000312', sub_request_id: '30000000-0000-0000-0000-000000000403', direction: 'outbound', message_type: 'sub_offer',       normalized_text: null,  requires_review: false, body: 'URGENT: Ava, can you cover Route 9F (Midtown Drop) starting in 90 min? Reply YES or NO.', created_at: subTime({ minutes: 48 }) },
    { phone_number: '+15551000010', volunteer_id: null,                                   schedule_id: '20000000-0000-0000-0000-000000000312', sub_request_id: '30000000-0000-0000-0000-000000000403', direction: 'system',   message_type: 'danger_zone',     normalized_text: null,  requires_review: false, body: 'Danger zone alert: Route 9F starts in under 2 hours with no confirmed volunteer. Coordinator should call directly.', created_at: subTime({ minutes: 47 }) },
  ]);
  if (mErr) { console.error('  Message events error:', mErr.message); process.exit(1); }
  console.log('  15 message events inserted.\n');

  console.log('✓ Seed complete!');
}

run().catch((err) => { console.error(err); process.exit(1); });
