export const SCHEDULE_STATUSES = [
  'scheduled',
  'confirmed',
  'sub_requested',
  'needs_review',
  'danger_zone',
  'completed',
  'cancelled',
] as const;

export const SUB_REQUEST_STATUSES = [
  'searching',
  'resolved',
  'failed',
  'escalated',
] as const;

export const SUB_REQUEST_ATTEMPT_STATUSES = [
  'queued',
  'sent',
  'accepted',
  'declined',
  'expired',
  'skipped',
] as const;

export const MESSAGE_DIRECTIONS = ['inbound', 'outbound', 'system'] as const;

export type ScheduleStatus = (typeof SCHEDULE_STATUSES)[number];
export type SubRequestStatus = (typeof SUB_REQUEST_STATUSES)[number];
export type SubRequestAttemptStatus = (typeof SUB_REQUEST_ATTEMPT_STATUSES)[number];
export type MessageDirection = (typeof MESSAGE_DIRECTIONS)[number];

export type VolunteerRecord = {
  id: string;
  created_at: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  status: 'active' | 'inactive' | 'pending_onboarding';
  is_substitute: boolean;
  substitute_rank: number | null;
  driver_license_url: string | null;
  insurance_url: string | null;
  insurance_expiry: string | null;
};

export type ShiftRecord = {
  id: string;
  name: string;
  location: string | null;
  instructions: string | null;
  required_volunteers: number;
};

export type ScheduleRecord = {
  id: string;
  created_at: string;
  shift_id: string | null;
  volunteer_id: string | null;
  scheduled_date: string;
  starts_at: string;
  coordinator_taken_over: boolean;
  status: ScheduleStatus;
};

export type SubRequestRecord = {
  id: string;
  created_at: string;
  schedule_id: string | null;
  requesting_volunteer_id: string | null;
  coordinator_taken_over: boolean;
  status: SubRequestStatus;
  resolved_by_volunteer_id: string | null;
};

export type SubRequestAttemptRecord = {
  id: string;
  created_at: string;
  sub_request_id: string;
  candidate_volunteer_id: string;
  attempt_order: number;
  status: SubRequestAttemptStatus;
  contacted_at: string | null;
  responded_at: string | null;
};

export type MessageEventRecord = {
  id: string;
  created_at: string;
  phone_number: string;
  volunteer_id: string | null;
  schedule_id: string | null;
  sub_request_id: string | null;
  sub_request_attempt_id: string | null;
  direction: MessageDirection;
  message_type: string;
  normalized_text: string | null;
  requires_review: boolean;
  body: string;
};

export type DashboardStatCard = {
  title: string;
  value: number;
};

export type DashboardAlert = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  entityId: string;
  entityType: 'schedule' | 'sub_request';
  takenOver: boolean;
  severity: 'high' | 'medium';
};

export type DashboardPulse = {
  id: string;
  createdAt: string;
  body: string;
  direction: MessageDirection;
  messageType: string;
  requiresReview: boolean;
  volunteerName: string | null;
};

export type DashboardSnapshot = {
  funnel: DashboardStatCard[];
  alerts: DashboardAlert[];
  pulses: DashboardPulse[];
};

export type SimulatorVolunteerOption = {
  id: string;
  name: string;
  phoneNumber: string;
  status: VolunteerRecord['status'];
};

export type SimulatorConversation = {
  volunteer: SimulatorVolunteerOption | null;
  messages: DashboardPulse[];
};
