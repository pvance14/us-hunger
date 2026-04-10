import { inngest } from './client';
import { supabaseAdmin } from '@/lib/server/supabase-admin';
import {
  getSearchingSubRequest,
  recordMessageEvent,
} from '@/lib/server/mvp';
import type {
  ScheduleRecord,
  ShiftRecord,
  SubRequestAttemptRecord,
  VolunteerRecord,
} from '@/lib/types';

type ShiftSubRequestedEventData = {
  subRequestId: string;
  scheduleId: string;
  shiftId: string;
  volunteerId: string;
  scheduledDate: string;
  startsAt: string;
};

type ScheduleWithContext = ScheduleRecord & {
  shift: ShiftRecord | null;
  volunteer: VolunteerRecord | null;
};

const SUBSTITUTE_PING_INTERVAL =
  process.env.SUBSTITUTE_PING_INTERVAL || (process.env.NODE_ENV === 'development' ? '1m' : '15m');

function getHoursUntil(timestamp: string): number {
  return (new Date(timestamp).getTime() - Date.now()) / (1000 * 60 * 60);
}

async function getScheduleWithContext(scheduleId: string): Promise<ScheduleWithContext | null> {
  const { data, error } = await supabaseAdmin
    .from('schedules')
    .select('*, shift:shifts(*), volunteer:volunteers(*)')
    .eq('id', scheduleId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as ScheduleWithContext | null) ?? null;
}

async function getAttemptById(attemptId: string): Promise<SubRequestAttemptRecord | null> {
  const { data, error } = await supabaseAdmin
    .from('sub_request_attempts')
    .select('*')
    .eq('id', attemptId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as SubRequestAttemptRecord | null) ?? null;
}

async function sendSimulatedMessage(input: {
  phoneNumber: string;
  volunteerId?: string | null;
  scheduleId?: string | null;
  subRequestId?: string | null;
  subRequestAttemptId?: string | null;
  body: string;
  messageType: string;
}): Promise<void> {
  await recordMessageEvent({
    phoneNumber: input.phoneNumber,
    volunteerId: input.volunteerId,
    scheduleId: input.scheduleId,
    subRequestId: input.subRequestId,
    subRequestAttemptId: input.subRequestAttemptId,
    direction: 'outbound',
    body: input.body,
    messageType: input.messageType,
  });
}

export const findSubstitutes = inngest.createFunction(
  { id: 'find-substitutes', triggers: [{ event: 'shift/sub.requested' }] },
  async ({ event, step }) => {
    const payload = event.data as ShiftSubRequestedEventData;

    const schedule = await step.run('load-schedule-context', async () => getScheduleWithContext(payload.scheduleId));

    if (!schedule || !schedule.shift || !schedule.volunteer) {
      await step.run('record-missing-context', async () => {
        await recordMessageEvent({
          phoneNumber: '+10000000000',
          scheduleId: payload.scheduleId,
          subRequestId: payload.subRequestId,
          direction: 'system',
          body: 'Substitute search could not start because the schedule context was incomplete.',
          messageType: 'status',
          requiresReview: true,
        });
      });

      return { status: 'missing-context' };
    }

    const scheduleShift = schedule.shift;
    const scheduleVolunteer = schedule.volunteer;

    const hoursUntilShift = getHoursUntil(payload.startsAt);
    if (hoursUntilShift <= 4) {
      await step.run('escalate-danger-zone', async () => {
        await supabaseAdmin.from('schedules').update({ status: 'danger_zone' }).eq('id', payload.scheduleId);
        await supabaseAdmin.from('sub_requests').update({ status: 'escalated' }).eq('id', payload.subRequestId);
        await recordMessageEvent({
          phoneNumber: scheduleVolunteer.phone_number,
          volunteerId: scheduleVolunteer.id,
          scheduleId: payload.scheduleId,
          subRequestId: payload.subRequestId,
          direction: 'system',
          body: `${scheduleShift.name} entered danger zone and now requires manual coordinator support.`,
          messageType: 'status',
          requiresReview: true,
        });
      });

      return { status: 'danger-zone' };
    }

    const candidates = await step.run('fetch-candidates', async () => {
      const { data, error } = await supabaseAdmin
        .from('volunteers')
        .select('*')
        .eq('status', 'active')
        .neq('id', payload.volunteerId)
        .order('created_at', { ascending: true })
        .limit(5);

      if (error) {
        throw error;
      }

      return (data as VolunteerRecord[]) ?? [];
    });

    for (const [index, candidate] of candidates.entries()) {
      const activeSubRequest = await step.run(`check-sub-request-${candidate.id}`, async () =>
        getSearchingSubRequest(payload.scheduleId),
      );

      if (!activeSubRequest) {
        return { status: 'resolved' };
      }

      const attempt = await step.run(`create-attempt-${candidate.id}`, async () => {
        const { data, error } = await supabaseAdmin
          .from('sub_request_attempts')
          .insert({
            sub_request_id: payload.subRequestId,
            candidate_volunteer_id: candidate.id,
            attempt_order: index + 1,
            status: 'sent',
            contacted_at: new Date().toISOString(),
          })
          .select('*')
          .single();

        if (error) {
          throw error;
        }

        return data as SubRequestAttemptRecord;
      });

      await step.run(`notify-candidate-${candidate.id}`, async () => {
        await sendSimulatedMessage({
          phoneNumber: candidate.phone_number,
          volunteerId: candidate.id,
          scheduleId: payload.scheduleId,
          subRequestId: payload.subRequestId,
          subRequestAttemptId: attempt.id,
          messageType: 'sub_offer',
          body: `Open shift: ${scheduleShift.name} at ${scheduleShift.location ?? 'the assigned location'}. Reply YES to accept or HELP for a human.`,
        });

        await recordMessageEvent({
          phoneNumber: scheduleVolunteer.phone_number,
          volunteerId: scheduleVolunteer.id,
          scheduleId: payload.scheduleId,
          subRequestId: payload.subRequestId,
          subRequestAttemptId: attempt.id,
          direction: 'system',
          body: `Attempt ${index + 1}: ${candidate.first_name} ${candidate.last_name} was offered ${scheduleShift.name}.`,
          messageType: 'status',
        });
      });

      await step.sleep(`await-response-${candidate.id}`, SUBSTITUTE_PING_INTERVAL);

      const currentAttempt = await step.run(`check-attempt-status-${candidate.id}`, async () => getAttemptById(attempt.id));

      const searchingSubRequest = await step.run(`recheck-sub-request-${candidate.id}`, async () =>
        getSearchingSubRequest(payload.scheduleId),
      );

      if (!currentAttempt || !searchingSubRequest) {
        return { status: 'resolved' };
      }

      if (currentAttempt.status === 'sent') {
        await step.run(`expire-attempt-${candidate.id}`, async () => {
          await supabaseAdmin
            .from('sub_request_attempts')
            .update({ status: 'expired' })
            .eq('id', currentAttempt.id)
            .eq('status', 'sent');

          await recordMessageEvent({
            phoneNumber: candidate.phone_number,
            volunteerId: candidate.id,
            scheduleId: payload.scheduleId,
            subRequestId: payload.subRequestId,
            subRequestAttemptId: currentAttempt.id,
            direction: 'system',
            body: `${candidate.first_name} ${candidate.last_name} did not respond before the simulator timeout.`,
            messageType: 'status',
          });
        });
      }
    }

    await step.run('mark-search-failed', async () => {
      await supabaseAdmin.from('sub_requests').update({ status: 'failed' }).eq('id', payload.subRequestId);
      await supabaseAdmin.from('schedules').update({ status: 'needs_review' }).eq('id', payload.scheduleId);

      await recordMessageEvent({
        phoneNumber: scheduleVolunteer.phone_number,
        volunteerId: scheduleVolunteer.id,
        scheduleId: payload.scheduleId,
        subRequestId: payload.subRequestId,
        direction: 'system',
        body: `Automated substitute outreach was exhausted for ${scheduleShift.name}.`,
        messageType: 'status',
        requiresReview: true,
      });
    });

    return { status: 'failed' };
  },
);

export const automatedReminders = inngest.createFunction(
  { id: 'automated-reminders', triggers: [{ cron: '0 * * * *' }] },
  async ({ step }) => {
    await step.run('process-reminders', async () => {
      const { data, error } = await supabaseAdmin
        .from('schedules')
        .select('*, shift:shifts(*), volunteer:volunteers(*)')
        .in('status', ['scheduled', 'confirmed']);

      if (error) {
        throw error;
      }

      const schedules = (data as ScheduleWithContext[]) ?? [];

      for (const schedule of schedules) {
        if (!schedule.volunteer || !schedule.shift) {
          continue;
        }

        const scheduleVolunteer = schedule.volunteer;
        const scheduleShift = schedule.shift;

        const hoursUntilShift = getHoursUntil(schedule.starts_at);
        let reminderType: string | null = null;
        let body: string | null = null;

        if (hoursUntilShift > 71 && hoursUntilShift <= 72) {
          reminderType = 'reminder_t72';
          body = `Checking in on ${scheduleShift.name}. Reply YES to confirm or SUB if you need a replacement.`;
        } else if (hoursUntilShift > 23 && hoursUntilShift <= 24) {
          reminderType = 'reminder_t24';
          body = `Tomorrow is ${scheduleShift.name}. ${scheduleShift.instructions ?? 'Please review your route details in the Control Tower.'}`;
        } else if (hoursUntilShift > 1 && hoursUntilShift <= 2) {
          reminderType = 'reminder_t2';
          body = `${scheduleShift.name} starts soon. Thanks for serving today. Reply HELP if you need a coordinator.`;
        }

        if (!reminderType || !body) {
          continue;
        }

        const { data: existingReminder, error: reminderLookupError } = await supabaseAdmin
          .from('message_events')
          .select('id')
          .eq('schedule_id', schedule.id)
          .eq('phone_number', scheduleVolunteer.phone_number)
          .eq('message_type', reminderType)
          .limit(1)
          .maybeSingle<{ id: string }>();

        if (reminderLookupError) {
          throw reminderLookupError;
        }

        if (existingReminder) {
          continue;
        }

        await sendSimulatedMessage({
          phoneNumber: scheduleVolunteer.phone_number,
          volunteerId: scheduleVolunteer.id,
          scheduleId: schedule.id,
          messageType: reminderType,
          body,
        });
      }
    });

    return { success: true };
  },
);

export const complianceAgent = inngest.createFunction(
  { id: 'compliance-agent', triggers: [{ cron: '0 8 * * *' }] },
  async ({ step }) => {
    await step.run('check-compliance', async () => {
      const { data, error } = await supabaseAdmin
        .from('volunteers')
        .select('*')
        .eq('status', 'active');

      if (error) {
        throw error;
      }

      const volunteers = (data as VolunteerRecord[]) ?? [];

      for (const volunteer of volunteers) {
        if (!volunteer.insurance_expiry) {
          continue;
        }

        const expiryDate = new Date(volunteer.insurance_expiry);
        const daysUntilExpiry = Math.floor((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

        let reminderType: string | null = null;
        let body: string | null = null;

        if (daysUntilExpiry === 30) {
          reminderType = 'compliance_30';
          body = `Your insurance on file expires in 30 days. Please upload an updated copy in the onboarding portal.`;
        } else if (daysUntilExpiry === 7) {
          reminderType = 'compliance_7';
          body = `Insurance expires in 7 days. Please upload a new document so you stay active.`;
        } else if (daysUntilExpiry <= 0) {
          reminderType = 'compliance_expired';
          body = `Your insurance has expired. A coordinator has been notified so they can help you renew it.`;
        }

        if (!reminderType || !body) {
          continue;
        }

        const { data: existingComplianceMessage, error: complianceLookupError } = await supabaseAdmin
          .from('message_events')
          .select('id')
          .eq('phone_number', volunteer.phone_number)
          .eq('message_type', reminderType)
          .limit(1)
          .maybeSingle<{ id: string }>();

        if (complianceLookupError) {
          throw complianceLookupError;
        }

        if (existingComplianceMessage) {
          continue;
        }

        await sendSimulatedMessage({
          phoneNumber: volunteer.phone_number,
          volunteerId: volunteer.id,
          messageType: reminderType,
          body,
        });

        if (daysUntilExpiry <= 0) {
          await supabaseAdmin.from('volunteers').update({ status: 'inactive' }).eq('id', volunteer.id);
        }
      }
    });

    return { success: true };
  },
);
