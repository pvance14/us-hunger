-- Supabase Initial Schema

-- Volunteers Table
CREATE TABLE public.volunteers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone_number TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending_onboarding'
        CHECK (status IN ('active', 'inactive', 'pending_onboarding')),
    driver_license_url TEXT,
    insurance_url TEXT,
    insurance_expiry DATE
);

-- Shifts Table
CREATE TABLE public.shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    name TEXT NOT NULL,
    location TEXT,
    instructions TEXT,
    required_volunteers INTEGER NOT NULL DEFAULT 1
);

-- Schedules Table (Maps volunteers to concrete shift instances)
CREATE TABLE public.schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    shift_id UUID REFERENCES public.shifts(id) ON DELETE CASCADE,
    volunteer_id UUID REFERENCES public.volunteers(id) ON DELETE SET NULL,
    scheduled_date DATE NOT NULL,
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'scheduled'
        CHECK (status IN (
            'scheduled',
            'confirmed',
            'sub_requested',
            'needs_review',
            'danger_zone',
            'completed',
            'cancelled'
        ))
);

-- Sub Requests Table
CREATE TABLE public.sub_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    schedule_id UUID REFERENCES public.schedules(id) ON DELETE CASCADE,
    requesting_volunteer_id UUID REFERENCES public.volunteers(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'searching'
        CHECK (status IN ('searching', 'resolved', 'failed', 'escalated')),
    resolved_by_volunteer_id UUID REFERENCES public.volunteers(id) ON DELETE SET NULL
);

-- Tracks each sequential substitute offer
CREATE TABLE public.sub_request_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    sub_request_id UUID NOT NULL REFERENCES public.sub_requests(id) ON DELETE CASCADE,
    candidate_volunteer_id UUID NOT NULL REFERENCES public.volunteers(id) ON DELETE CASCADE,
    attempt_order INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued'
        CHECK (status IN ('queued', 'sent', 'accepted', 'declined', 'expired', 'skipped')),
    contacted_at TIMESTAMP WITH TIME ZONE,
    responded_at TIMESTAMP WITH TIME ZONE,
    UNIQUE (sub_request_id, attempt_order)
);

-- Persists simulated inbound/outbound message history for the dashboard and phone view
CREATE TABLE public.message_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    phone_number TEXT NOT NULL,
    volunteer_id UUID REFERENCES public.volunteers(id) ON DELETE SET NULL,
    schedule_id UUID REFERENCES public.schedules(id) ON DELETE SET NULL,
    sub_request_id UUID REFERENCES public.sub_requests(id) ON DELETE SET NULL,
    sub_request_attempt_id UUID REFERENCES public.sub_request_attempts(id) ON DELETE SET NULL,
    direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound', 'system')),
    message_type TEXT NOT NULL DEFAULT 'general',
    normalized_text TEXT,
    requires_review BOOLEAN NOT NULL DEFAULT FALSE,
    body TEXT NOT NULL
);

CREATE INDEX schedules_starts_at_idx ON public.schedules (starts_at);
CREATE INDEX schedules_status_idx ON public.schedules (status);
CREATE INDEX sub_requests_status_idx ON public.sub_requests (status);
CREATE INDEX sub_request_attempts_candidate_idx ON public.sub_request_attempts (candidate_volunteer_id, status);
CREATE INDEX message_events_phone_idx ON public.message_events (phone_number, created_at DESC);
CREATE INDEX message_events_schedule_idx ON public.message_events (schedule_id, created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_request_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_events ENABLE ROW LEVEL SECURITY;

-- Basic volunteer-scoped policies
CREATE POLICY "Volunteers can view their own profile"
    ON public.volunteers FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Volunteers can update their own profile"
    ON public.volunteers FOR UPDATE
    USING (auth.uid() = id);

-- MVP note: internal staff auth is deferred, so server routes use the service role for access.
CREATE POLICY "Authenticated users full access to shifts"
    ON public.shifts FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users full access to schedules"
    ON public.schedules FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users full access to sub_requests"
    ON public.sub_requests FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users full access to sub_request_attempts"
    ON public.sub_request_attempts FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users full access to message_events"
    ON public.message_events FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Storage Buckets Setup
INSERT INTO storage.buckets (id, name, public)
VALUES ('compliance_docs', 'compliance_docs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Volunteers can upload their own docs"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'compliance_docs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Volunteers can read their own docs"
    ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'compliance_docs' AND auth.uid()::text = (storage.foldername(name))[1]);
