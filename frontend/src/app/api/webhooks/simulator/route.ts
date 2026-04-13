import { NextResponse } from 'next/server';
import { inngest } from '@/lib/inngest/client';
import { getApiErrorMessage } from '@/lib/server/api-errors';
import { supabaseAdmin } from '@/lib/server/supabase-admin';
import {
  findVolunteerByPhone,
  getNextActiveScheduleForVolunteer,
  getOpenSubRequestForSchedule,
  getPendingAttemptForVolunteer,
  recordMessageEvent,
} from '@/lib/server/mvp';
import type { ScheduleRecord, ShiftRecord, SubRequestAttemptRecord, SubRequestRecord, VolunteerRecord } from '@/lib/types';

export const runtime = 'nodejs';

type ScheduleWithShift = ScheduleRecord & {
  shift: ShiftRecord | null;
  volunteer: VolunteerRecord | null;
};

type AttemptWithContext = SubRequestAttemptRecord & {
  sub_request: (SubRequestRecord & {
    schedule: ScheduleWithShift | null;
  }) | null;
};

function normalizeInboundText(text: string | null | undefined): string {
  return text?.trim().toUpperCase() ?? '';
}

async function getSubRequestById(subRequestId: string): Promise<SubRequestRecord | null> {
  const { data, error } = await supabaseAdmin
    .from('sub_requests')
    .select('*')
    .eq('id', subRequestId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as SubRequestRecord | null) ?? null;
}

async function getScheduleById(scheduleId: string): Promise<ScheduleWithShift | null> {
  const { data, error } = await supabaseAdmin
    .from('schedules')
    .select('*, shift:shifts(*), volunteer:volunteers(*)')
    .eq('id', scheduleId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as ScheduleWithShift | null) ?? null;
}

async function getLatestAttemptForVolunteer(volunteerId: string): Promise<AttemptWithContext | null> {
  const { data, error } = await supabaseAdmin
    .from('sub_request_attempts')
    .select('*, sub_request:sub_requests(*, schedule:schedules(*, shift:shifts(*), volunteer:volunteers(*)))')
    .eq('candidate_volunteer_id', volunteerId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as AttemptWithContext | null) ?? null;
}

async function resolveSubstituteAcceptance(
  volunteer: VolunteerRecord,
  attempt: SubRequestAttemptRecord,
): Promise<{ scheduleId: string; shiftName: string }> {
  const subRequest = await getSubRequestById(attempt.sub_request_id);

  if (!subRequest || !subRequest.schedule_id) {
    throw new Error('Substitute attempt is missing its request context.');
  }

  const schedule = await getScheduleById(subRequest.schedule_id);

  if (!schedule) {
    throw new Error('Could not load the schedule for this substitute attempt.');
  }

  await supabaseAdmin
    .from('sub_request_attempts')
    .update({
      status: 'accepted',
      responded_at: new Date().toISOString(),
    })
    .eq('id', attempt.id)
    .eq('status', 'sent');

  await supabaseAdmin
    .from('sub_request_attempts')
    .update({ status: 'skipped' })
    .eq('sub_request_id', attempt.sub_request_id)
    .neq('id', attempt.id)
    .in('status', ['queued', 'sent']);

  await supabaseAdmin
    .from('sub_requests')
    .update({
      status: 'resolved',
      resolved_by_volunteer_id: volunteer.id,
    })
    .eq('id', attempt.sub_request_id);

  await supabaseAdmin
    .from('schedules')
    .update({
      volunteer_id: volunteer.id,
      status: 'confirmed',
    })
    .eq('id', schedule.id);

  await recordMessageEvent({
    phoneNumber: volunteer.phone_number,
    volunteerId: volunteer.id,
    scheduleId: schedule.id,
    subRequestId: attempt.sub_request_id,
    subRequestAttemptId: attempt.id,
    direction: 'outbound',
    body: `You are confirmed for ${schedule.shift?.name ?? 'the open shift'}. Thank you for stepping in.`,
    messageType: 'sub_acceptance',
  });

  if (subRequest.requesting_volunteer_id) {
    const { data: requester } = await supabaseAdmin
      .from('volunteers')
      .select('*')
      .eq('id', subRequest.requesting_volunteer_id)
      .maybeSingle();

    const typedRequester = (requester as VolunteerRecord | null) ?? null;

    if (typedRequester) {
      await recordMessageEvent({
        phoneNumber: typedRequester.phone_number,
        volunteerId: typedRequester.id,
        scheduleId: schedule.id,
        subRequestId: attempt.sub_request_id,
        direction: 'outbound',
        body: `${volunteer.first_name} ${volunteer.last_name} has accepted ${schedule.shift?.name ?? 'your shift'}.`,
        messageType: 'sub_resolved',
      });
    }
  }

  await recordMessageEvent({
    phoneNumber: volunteer.phone_number,
    volunteerId: volunteer.id,
    scheduleId: schedule.id,
    subRequestId: attempt.sub_request_id,
    subRequestAttemptId: attempt.id,
    direction: 'system',
    body: `${volunteer.first_name} ${volunteer.last_name} accepted ${schedule.shift?.name ?? 'the shift'}.`,
    messageType: 'status',
  });

  return {
    scheduleId: schedule.id,
    shiftName: schedule.shift?.name ?? 'the shift',
  };
}

async function resolveSubstituteDecline(
  volunteer: VolunteerRecord,
  attempt: SubRequestAttemptRecord,
): Promise<{ scheduleId: string | null; shiftName: string }> {
  const subRequest = await getSubRequestById(attempt.sub_request_id);

  if (!subRequest || !subRequest.schedule_id) {
    throw new Error('Substitute attempt is missing its request context.');
  }

  const schedule = await getScheduleById(subRequest.schedule_id);

  await supabaseAdmin
    .from('sub_request_attempts')
    .update({
      status: 'declined',
      responded_at: new Date().toISOString(),
    })
    .eq('id', attempt.id)
    .eq('status', 'sent');

  await recordMessageEvent({
    phoneNumber: volunteer.phone_number,
    volunteerId: volunteer.id,
    scheduleId: schedule?.id ?? null,
    subRequestId: attempt.sub_request_id,
    subRequestAttemptId: attempt.id,
    direction: 'outbound',
    body: `Thanks for letting us know. We’ll move on to the next substitute candidate.`,
    messageType: 'sub_decline',
  });

  await recordMessageEvent({
    phoneNumber: volunteer.phone_number,
    volunteerId: volunteer.id,
    scheduleId: schedule?.id ?? null,
    subRequestId: attempt.sub_request_id,
    subRequestAttemptId: attempt.id,
    direction: 'system',
    body: `${volunteer.first_name} ${volunteer.last_name} declined ${schedule?.shift?.name ?? 'the open shift'}.`,
    messageType: 'status',
  });

  return {
    scheduleId: schedule?.id ?? null,
    shiftName: schedule?.shift?.name ?? 'the open shift',
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { from, text } = body;
    const normalizedText = normalizeInboundText(text);
    const volunteer = await findVolunteerByPhone(from);

    await recordMessageEvent({
      phoneNumber: from,
      volunteerId: volunteer?.id ?? null,
      direction: 'inbound',
      body: text ?? '',
      normalizedText,
      messageType: 'incoming',
      requiresReview: !['YES', 'NO', 'SUB', 'HELP', 'HUMAN'].includes(normalizedText),
    });

    if (!volunteer) {
      return NextResponse.json({ success: false, error: 'Volunteer not found' }, { status: 404 });
    }

    const [schedule, pendingAttempt] = await Promise.all([
      getNextActiveScheduleForVolunteer(volunteer.id),
      getPendingAttemptForVolunteer(volunteer.id),
    ]);

    switch (normalizedText) {
      case 'YES': {
        if (pendingAttempt) {
          const acceptance = await resolveSubstituteAcceptance(volunteer, pendingAttempt);

          return NextResponse.json({
            success: true,
            parsed: normalizedText,
            action: 'accepted_substitute_offer',
            scheduleId: acceptance.scheduleId,
            shiftName: acceptance.shiftName,
          });
        }

        if (!schedule) {
          const latestAttempt = await getLatestAttemptForVolunteer(volunteer.id);

          if (latestAttempt?.sub_request?.schedule) {
            const offerShiftName = latestAttempt.sub_request.schedule.shift?.name ?? 'that open shift';
            const offerStillActive =
              latestAttempt.status === 'sent' && latestAttempt.sub_request.status === 'searching';

            if (!offerStillActive) {
              await recordMessageEvent({
                phoneNumber: volunteer.phone_number,
                volunteerId: volunteer.id,
                scheduleId: latestAttempt.sub_request.schedule.id,
                subRequestId: latestAttempt.sub_request.id,
                subRequestAttemptId: latestAttempt.id,
                direction: 'outbound',
                body: `That ${offerShiftName} coverage offer is no longer active, so we couldn't confirm you for it. Reply HELP and a coordinator can check the next steps.`,
                messageType: 'offer_closed',
              });

              return NextResponse.json({
                success: true,
                parsed: normalizedText,
                action: 'stale_substitute_offer',
                scheduleId: latestAttempt.sub_request.schedule.id,
                shiftName: offerShiftName,
              });
            }
          }

          await recordMessageEvent({
            phoneNumber: volunteer.phone_number,
            volunteerId: volunteer.id,
            direction: 'outbound',
            body: `We could not find an active shift to confirm. Reply HELP and a coordinator will jump in.`,
            messageType: 'review',
            requiresReview: true,
          });

          return NextResponse.json({ success: true, parsed: normalizedText, action: 'needs_review' });
        }

        await supabaseAdmin.from('schedules').update({ status: 'confirmed' }).eq('id', schedule.id);
        await recordMessageEvent({
          phoneNumber: volunteer.phone_number,
          volunteerId: volunteer.id,
          scheduleId: schedule.id,
          direction: 'outbound',
          body: `Thanks, you’re confirmed for ${schedule.shift?.name ?? 'your shift'}.`,
          messageType: 'confirmation',
        });

        return NextResponse.json({ success: true, parsed: normalizedText, action: 'confirmed_shift' });
      }
      case 'NO':
      case 'SUB': {
        if (pendingAttempt && normalizedText === 'NO') {
          const decline = await resolveSubstituteDecline(volunteer, pendingAttempt);

          return NextResponse.json({
            success: true,
            parsed: normalizedText,
            action: 'declined_substitute_offer',
            scheduleId: decline.scheduleId,
            shiftName: decline.shiftName,
          });
        }

        if (!schedule || !schedule.shift_id) {
          await recordMessageEvent({
            phoneNumber: volunteer.phone_number,
            volunteerId: volunteer.id,
            direction: 'outbound',
            body: `We could not find a shift to update. Reply HELP for coordinator support.`,
            messageType: 'review',
            requiresReview: true,
          });

          return NextResponse.json({ success: true, parsed: normalizedText, action: 'needs_review' });
        }

        const hoursUntilShift = (new Date(schedule.starts_at).getTime() - Date.now()) / (1000 * 60 * 60);

        if (hoursUntilShift <= 4) {
          const existingSubRequest = await getOpenSubRequestForSchedule(schedule.id);
          let subRequestId = existingSubRequest?.id ?? null;

          if (!subRequestId) {
            const { data: createdSubRequest, error: subRequestError } = await supabaseAdmin
              .from('sub_requests')
              .insert({
                schedule_id: schedule.id,
                requesting_volunteer_id: volunteer.id,
                status: 'escalated',
              })
              .select('*')
              .single();

            if (subRequestError) {
              throw subRequestError;
            }

            subRequestId = (createdSubRequest as SubRequestRecord).id;
          } else {
            await supabaseAdmin.from('sub_requests').update({ status: 'escalated' }).eq('id', subRequestId);
          }

          await supabaseAdmin.from('schedules').update({ status: 'danger_zone' }).eq('id', schedule.id);

          await recordMessageEvent({
            phoneNumber: volunteer.phone_number,
            volunteerId: volunteer.id,
            scheduleId: schedule.id,
            subRequestId,
            direction: 'outbound',
            body: `This shift starts soon, so a coordinator has been alerted for manual coverage.`,
            messageType: 'danger_zone',
            requiresReview: true,
          });

          return NextResponse.json({ success: true, parsed: normalizedText, action: 'danger_zone' });
        }

        const existingSearchingRequest = await getOpenSubRequestForSchedule(schedule.id);
        let subRequest = existingSearchingRequest;

        await supabaseAdmin.from('schedules').update({ status: 'sub_requested' }).eq('id', schedule.id);

        if (!subRequest || subRequest.status !== 'searching') {
          const { data: createdSubRequest, error: subRequestError } = await supabaseAdmin
            .from('sub_requests')
            .insert({
              schedule_id: schedule.id,
              requesting_volunteer_id: volunteer.id,
              status: 'searching',
            })
            .select('*')
            .single();

          if (subRequestError) {
            throw subRequestError;
          }

          subRequest = createdSubRequest as SubRequestRecord;
        }

        await recordMessageEvent({
          phoneNumber: volunteer.phone_number,
          volunteerId: volunteer.id,
          scheduleId: schedule.id,
          subRequestId: subRequest.id,
          direction: 'outbound',
          body: `We’re now searching for a substitute for ${schedule.shift?.name ?? 'your shift'}.`,
          messageType: 'sub_request',
        });

        await inngest.send({
          name: 'shift/sub.requested',
          data: {
            subRequestId: subRequest.id,
            scheduleId: schedule.id,
            shiftId: schedule.shift_id,
            volunteerId: volunteer.id,
            scheduledDate: schedule.scheduled_date,
            startsAt: schedule.starts_at,
          },
        });

        return NextResponse.json({ success: true, parsed: normalizedText, action: 'sub_requested' });
      }
      case 'HELP':
      case 'HUMAN': {
        if (schedule) {
          await supabaseAdmin.from('schedules').update({ status: 'needs_review' }).eq('id', schedule.id);
        }

        if (pendingAttempt) {
          await supabaseAdmin
            .from('sub_requests')
            .update({ status: 'escalated' })
            .eq('id', pendingAttempt.sub_request_id);
        }

        await recordMessageEvent({
          phoneNumber: volunteer.phone_number,
          volunteerId: volunteer.id,
          scheduleId: schedule?.id ?? null,
          subRequestId: pendingAttempt?.sub_request_id ?? null,
          direction: 'outbound',
          body: `A coordinator has been notified and will take over this conversation.`,
          messageType: 'help',
          requiresReview: true,
        });

        return NextResponse.json({ success: true, parsed: normalizedText, action: 'escalated' });
      }
      default: {
        if (schedule) {
          await supabaseAdmin.from('schedules').update({ status: 'needs_review' }).eq('id', schedule.id);
        }

        if (pendingAttempt) {
          await supabaseAdmin
            .from('sub_requests')
            .update({ status: 'escalated' })
            .eq('id', pendingAttempt.sub_request_id);
        }

        await recordMessageEvent({
          phoneNumber: volunteer.phone_number,
          volunteerId: volunteer.id,
          scheduleId: schedule?.id ?? null,
          subRequestId: pendingAttempt?.sub_request_id ?? null,
          direction: 'outbound',
          body: `We flagged that message for a human because it needs more than the simulator shortcuts.`,
          messageType: 'review',
          requiresReview: true,
        });

        return NextResponse.json({ success: true, parsed: normalizedText, action: 'needs_review' });
      }
    }
  } catch (error) {
    console.error(`[SMS SIMULATOR] Error processing webhook:`, error);
    return NextResponse.json(
      { success: false, error: getApiErrorMessage(error, 'The simulator could not process that message.') },
      { status: 500 },
    );
  }
}
