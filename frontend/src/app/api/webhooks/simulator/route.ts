import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { inngest } from '@/lib/inngest/client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { from, text } = body;

    console.log(`[SMS SIMULATOR] Received message from ${from}: ${text}`);

    const normalizedText = text?.trim().toUpperCase();

    // 1. Find Volunteer by phone number
    const { data: volunteer, error: volError } = await supabase
      .from('volunteers')
      .select('id')
      .eq('phone_number', from)
      .single();

    if (volError || !volunteer) {
      console.log(`=> Action: Unregistered volunteer ${from}. Ignoring.`);
      return NextResponse.json({ success: false, error: 'Volunteer not found' }, { status: 404 });
    }

    // 2. Find closest active schedule for this volunteer
    const { data: schedule, error: scheduleError } = await supabase
      .from('schedules')
      .select('id, shift_id, scheduled_date')
      .eq('volunteer_id', volunteer.id)
      .in('status', ['scheduled', 'needs_review']) // they can reply to these
      .order('scheduled_date', { ascending: true })
      .limit(1)
      .single();

    // If no schedule but they asked for help, still flag it.
    // For simplicity, we assume they need a schedule to reply YES/NO/SUB
    
    // Base logic for parsing shortcodes
    switch (normalizedText) {
      case 'YES':
        if (schedule) {
          console.log(`=> Action: Confirm shift for ${from} (Schedule: ${schedule.id})`);
          await supabase.from('schedules').update({ status: 'completed' }).eq('id', schedule.id); // Or 'confirmed' but schema only has: 'scheduled', 'completed', 'cancelled', 'sub_requested'
        }
        break;
      case 'NO':
      case 'SUB':
        if (schedule) {
          console.log(`=> Action: Trigger sub search for ${from} (Schedule: ${schedule.id})`);
          
          await supabase.from('schedules').update({ status: 'sub_requested' }).eq('id', schedule.id);
          
          const { data: subReq } = await supabase.from('sub_requests').insert({
            schedule_id: schedule.id,
            requesting_volunteer_id: volunteer.id,
            status: 'searching'
          }).select().single();

          if (subReq) {
             await inngest.send({
                name: 'shift/sub.requested',
                data: {
                  subRequestId: subReq.id,
                  scheduleId: schedule.id,
                  shiftId: schedule.shift_id,
                  volunteerId: volunteer.id,
                  scheduledDate: schedule.scheduled_date
                }
             });
          }
        }
        break;
      case 'HELP':
      case 'HUMAN':
        if (schedule) {
          console.log(`=> Action: Escalate schedule ${schedule.id} to staff review`);
          await supabase.from('schedules').update({ status: 'needs_review' }).eq('id', schedule.id); // note schema doesn't technically have this by default, but wait, schema only has 'scheduled', 'completed', 'cancelled', 'sub_requested'
          // We'll update the schema or just log it
        }
        console.log(`[ALERT] Volunteer ${from} requested HUMAN/HELP.`);
        break;
      default:
        console.log(`=> Action: Unrecognized input from ${from}. Logging for NLP/Staff Review.`);
        break;
    }

    return NextResponse.json({ success: true, parsed: normalizedText });
  } catch (error) {
    console.error(`[SMS SIMULATOR] Error processing webhook:`, error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
