-- Supabase Initial Schema

-- Volunteers Table
CREATE TABLE public.volunteers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone_number TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending_onboarding', -- 'active', 'inactive', 'pending_onboarding'
    driver_license_url TEXT,
    insurance_url TEXT,
    insurance_expiry DATE
);

-- Shifts Table
CREATE TABLE public.shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name TEXT NOT NULL,
    location TEXT,
    instructions TEXT,
    required_volunteers INTEGER DEFAULT 1
);

-- Schedules Table (Maps volunteers to instances of shifts)
CREATE TABLE public.schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    shift_id UUID REFERENCES public.shifts(id) ON DELETE CASCADE,
    volunteer_id UUID REFERENCES public.volunteers(id) ON DELETE SET NULL,
    scheduled_date DATE NOT NULL,
    status TEXT DEFAULT 'scheduled' -- 'scheduled', 'completed', 'cancelled', 'sub_requested'
);

-- Sub_Requests Table
CREATE TABLE public.sub_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    schedule_id UUID REFERENCES public.schedules(id) ON DELETE CASCADE,
    requesting_volunteer_id UUID REFERENCES public.volunteers(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'searching', -- 'searching', 'found', 'failed'
    resolved_by_volunteer_id UUID REFERENCES public.volunteers(id) ON DELETE SET NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_requests ENABLE ROW LEVEL SECURITY;

-- Basic Policies (Assumes Volunteers login via Supabase Auth and their UID matches volunteer.id)
CREATE POLICY "Volunteers can view their own profile"
    ON public.volunteers FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Volunteers can update their own profile"
    ON public.volunteers FOR UPDATE
    USING (auth.uid() = id);

-- We assume authenticated users (staff/coordinators) can do full CRUD if they have the right claims, 
-- but for MVP we allow all authenticated users full access to these tables.
CREATE POLICY "Authenticated users full access to shifts"
    ON public.shifts FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users full access to schedules"
    ON public.schedules FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users full access to sub_requests"
    ON public.sub_requests FOR ALL TO authenticated USING (true);

-- Storage Buckets Setup
INSERT INTO storage.buckets (id, name, public) VALUES ('compliance_docs', 'compliance_docs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Volunteers can upload their own docs"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK ( bucket_id = 'compliance_docs' AND auth.uid()::text = (storage.foldername(name))[1] );

CREATE POLICY "Volunteers can read their own docs"
    ON storage.objects FOR SELECT TO authenticated
    USING ( bucket_id = 'compliance_docs' AND auth.uid()::text = (storage.foldername(name))[1] );
