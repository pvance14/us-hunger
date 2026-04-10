import 'server-only';

import { supabaseAdmin } from '@/lib/server/supabase-admin';
import type {
  DashboardAlert,
  DashboardPulse,
  DashboardSnapshot,
  MessageDirection,
  MessageEventRecord,
  ScheduleRecord,
  ScheduleStatus,
  ShiftRecord,
  SimulatorConversation,
  SimulatorVolunteerOption,
  SubRequestAttemptRecord,
  SubRequestRecord,
  SubRequestStatus,
  VolunteerRecord,
} from '@/lib/types';

type ScheduleWithShift = ScheduleRecord & {
  shift: ShiftRecord | null;
  volunteer: VolunteerRecord | null;
};

const REVIEWABLE_SCHEDULE_STATUSES: ScheduleStatus[] = [
  'scheduled',
  'confirmed',
  'sub_requested',
  'needs_review',
  'danger_zone',
];

const SEARCHING_SUB_REQUEST_STATUS: SubRequestStatus = 'searching';

export function normalizePhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, '');

  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }

  if (digits.length === 10) {
    return `+1${digits}`;
  }

  return value.trim();
}

export function formatVolunteerName(volunteer: Pick<VolunteerRecord, 'first_name' | 'last_name'> | null): string | null {
  if (!volunteer) {
    return null;
  }

  return `${volunteer.first_name} ${volunteer.last_name}`;
}

export async function findVolunteerByPhone(phoneNumber: string): Promise<VolunteerRecord | null> {
  const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);
  const { data, error } = await supabaseAdmin
    .from('volunteers')
    .select('*')
    .eq('phone_number', normalizedPhoneNumber)
    .maybeSingle<VolunteerRecord>();

  if (error) {
    throw error;
  }

  return data;
}

export async function listSimulatorVolunteers(): Promise<SimulatorVolunteerOption[]> {
  const { data, error } = await supabaseAdmin
    .from('volunteers')
    .select('id, first_name, last_name, phone_number, status')
    .order('first_name', { ascending: true });

  if (error) {
    throw error;
  }

  return (data as Pick<VolunteerRecord, 'id' | 'first_name' | 'last_name' | 'phone_number' | 'status'>[]).map(
    (volunteer) => ({
      id: volunteer.id,
      name: `${volunteer.first_name} ${volunteer.last_name}`,
      phoneNumber: volunteer.phone_number,
      status: volunteer.status,
    }),
  );
}

export async function recordMessageEvent(input: {
  phoneNumber: string;
  direction: MessageDirection;
  body: string;
  messageType?: string;
  normalizedText?: string | null;
  volunteerId?: string | null;
  scheduleId?: string | null;
  subRequestId?: string | null;
  subRequestAttemptId?: string | null;
  requiresReview?: boolean;
}): Promise<MessageEventRecord> {
  const { data, error } = await supabaseAdmin
    .from('message_events')
    .insert({
      phone_number: normalizePhoneNumber(input.phoneNumber),
      direction: input.direction,
      body: input.body,
      message_type: input.messageType ?? 'general',
      normalized_text: input.normalizedText ?? null,
      volunteer_id: input.volunteerId ?? null,
      schedule_id: input.scheduleId ?? null,
      sub_request_id: input.subRequestId ?? null,
      sub_request_attempt_id: input.subRequestAttemptId ?? null,
      requires_review: input.requiresReview ?? false,
    })
    .select('*')
    .single<MessageEventRecord>();

  if (error) {
    throw error;
  }

  return data;
}

export async function getNextActiveScheduleForVolunteer(volunteerId: string): Promise<ScheduleWithShift | null> {
  const { data, error } = await supabaseAdmin
    .from('schedules')
    .select('*, shift:shifts(*), volunteer:volunteers(*)')
    .eq('volunteer_id', volunteerId)
    .in('status', REVIEWABLE_SCHEDULE_STATUSES)
    .gte('starts_at', new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString())
    .order('starts_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as ScheduleWithShift | null) ?? null;
}

export async function getOpenSubRequestForSchedule(scheduleId: string): Promise<SubRequestRecord | null> {
  const { data, error } = await supabaseAdmin
    .from('sub_requests')
    .select('*')
    .eq('schedule_id', scheduleId)
    .in('status', ['searching', 'escalated'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle<SubRequestRecord>();

  if (error) {
    throw error;
  }

  return data;
}

export async function getSearchingSubRequest(scheduleId: string): Promise<SubRequestRecord | null> {
  const { data, error } = await supabaseAdmin
    .from('sub_requests')
    .select('*')
    .eq('schedule_id', scheduleId)
    .eq('status', SEARCHING_SUB_REQUEST_STATUS)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle<SubRequestRecord>();

  if (error) {
    throw error;
  }

  return data;
}

export async function getPendingAttemptForVolunteer(volunteerId: string): Promise<SubRequestAttemptRecord | null> {
  const { data, error } = await supabaseAdmin
    .from('sub_request_attempts')
    .select('*')
    .eq('candidate_volunteer_id', volunteerId)
    .eq('status', 'sent')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle<SubRequestAttemptRecord>();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const { data: subRequest, error: subRequestError } = await supabaseAdmin
    .from('sub_requests')
    .select('id, status')
    .eq('id', data.sub_request_id)
    .maybeSingle<{ id: string; status: SubRequestStatus }>();

  if (subRequestError) {
    throw subRequestError;
  }

  if (!subRequest || subRequest.status !== 'searching') {
    return null;
  }

  return data;
}

export async function buildDashboardSnapshot(): Promise<DashboardSnapshot> {
  const [schedulesResult, messageEventsResult, searchingSubRequestsResult] = await Promise.all([
    supabaseAdmin
      .from('schedules')
      .select('*, shift:shifts(*), volunteer:volunteers(*)')
      .in('status', ['scheduled', 'confirmed', 'sub_requested', 'needs_review', 'danger_zone']),
    supabaseAdmin
      .from('message_events')
      .select('*, volunteer:volunteers(first_name, last_name)')
      .order('created_at', { ascending: false })
      .limit(20),
    supabaseAdmin
      .from('sub_requests')
      .select('*, schedule:schedules(*, shift:shifts(*), volunteer:volunteers(*))')
      .in('status', ['failed', 'escalated'])
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  if (schedulesResult.error) {
    throw schedulesResult.error;
  }

  if (messageEventsResult.error) {
    throw messageEventsResult.error;
  }

  if (searchingSubRequestsResult.error) {
    throw searchingSubRequestsResult.error;
  }

  const schedules = (schedulesResult.data as ScheduleWithShift[]) ?? [];
  const messageEvents =
    ((messageEventsResult.data as (MessageEventRecord & {
      volunteer: Pick<VolunteerRecord, 'first_name' | 'last_name'> | null;
    })[]) ?? []);
  const flaggedSubRequests =
    ((searchingSubRequestsResult.data as (SubRequestRecord & {
      schedule: ScheduleWithShift | null;
    })[]) ?? []);

  const funnel = [
    {
      title: 'Total Shifts',
      value: schedules.length,
    },
    {
      title: 'Confirmed',
      value: schedules.filter((schedule) => schedule.status === 'confirmed').length,
    },
    {
      title: 'Unconfirmed',
      value: schedules.filter((schedule) => schedule.status === 'scheduled').length,
    },
    {
      title: 'Unfilled',
      value: schedules.filter((schedule) =>
        ['sub_requested', 'needs_review', 'danger_zone'].includes(schedule.status),
      ).length,
    },
  ];

  const alertsFromSchedules: DashboardAlert[] = schedules
    .filter((schedule) => schedule.status === 'danger_zone' || schedule.status === 'needs_review')
    .map((schedule) => ({
      id: schedule.id,
      title: schedule.status === 'danger_zone' ? 'Danger Zone Cancellation' : 'Needs Human Review',
      description:
        schedule.status === 'danger_zone'
          ? `${schedule.shift?.name ?? 'Shift'} starts soon and now needs manual coverage.`
          : `${schedule.shift?.name ?? 'Shift'} has a conversation that needs coordinator review.`,
      createdAt: schedule.starts_at,
      severity: 'high',
    }));

  const alertsFromSubRequests: DashboardAlert[] = flaggedSubRequests.map((subRequest) => ({
    id: subRequest.id,
    title: subRequest.status === 'failed' ? 'Substitute Search Exhausted' : 'Escalated Request',
    description:
      subRequest.status === 'failed'
        ? `${subRequest.schedule?.shift?.name ?? 'Shift'} ran out of automated substitutes.`
        : `${subRequest.schedule?.shift?.name ?? 'Shift'} has been escalated for manual follow-up.`,
    createdAt: subRequest.created_at,
    severity: 'high',
  }));

  const pulses: DashboardPulse[] = messageEvents.map((event) => ({
    id: event.id,
    createdAt: event.created_at,
    body: event.body,
    direction: event.direction,
    messageType: event.message_type,
    requiresReview: event.requires_review,
    volunteerName: formatVolunteerName(event.volunteer),
  }));

  return {
    funnel,
    alerts: [...alertsFromSchedules, ...alertsFromSubRequests]
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, 8),
    pulses,
  };
}

export async function buildSimulatorConversation(phoneNumber: string): Promise<SimulatorConversation> {
  const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);
  const [volunteer, messagesResult] = await Promise.all([
    findVolunteerByPhone(normalizedPhoneNumber),
    supabaseAdmin
      .from('message_events')
      .select('*, volunteer:volunteers(first_name, last_name)')
      .eq('phone_number', normalizedPhoneNumber)
      .order('created_at', { ascending: true }),
  ]);

  if (messagesResult.error) {
    throw messagesResult.error;
  }

  const messages =
    ((messagesResult.data as (MessageEventRecord & {
      volunteer: Pick<VolunteerRecord, 'first_name' | 'last_name'> | null;
    })[]) ?? []).map((event) => ({
      id: event.id,
      createdAt: event.created_at,
      body: event.body,
      direction: event.direction,
      messageType: event.message_type,
      requiresReview: event.requires_review,
      volunteerName: formatVolunteerName(event.volunteer),
    }));

  return {
    volunteer: volunteer
      ? {
          id: volunteer.id,
          name: `${volunteer.first_name} ${volunteer.last_name}`,
          phoneNumber: volunteer.phone_number,
          status: volunteer.status,
        }
      : null,
    messages,
  };
}
