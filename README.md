# US Hunger Volunteer Coordination Agent

This repository contains an MVP for an AI-assisted volunteer coordination system designed for food delivery and community support organizations. The current project combines a coordinator dashboard, onboarding flow, simulator-driven messaging workflows, and Supabase-backed data models to test the highest-friction parts of volunteer operations.

## What is in this repo

- `frontend/`: Next.js app for the dashboard, onboarding flow, simulator, and API routes
- `supabase/`: local Supabase config, migrations, and seed data
- `aiDocs/`: architecture notes, MVP scope, and roadmap documents
- `prd.md`: product requirements for the volunteer coordination agent

## Current stack

- Next.js 16 with React 19
- Supabase for data and storage
- Inngest for background workflow orchestration
- TypeScript
- Tailwind CSS

## Getting started

### 1. Install frontend dependencies

```bash
cd frontend
npm install
```

### 2. Create local environment variables

Create `frontend/.env.local` with:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-local-service-role-key
SUBSTITUTE_PING_INTERVAL=1m
```

Notes:

- `SUBSTITUTE_PING_INTERVAL` is optional. The app already defaults to `1m` in development and `15m` otherwise.
- Some code paths fall back to mock values, but real local testing works best with actual Supabase credentials.

### 3. Start Supabase locally

From the project root:

```bash
supabase start
```

If you need a clean local database with the seed data reapplied:

```bash
supabase db reset
```

### 4. Run the frontend

```bash
cd frontend
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## Useful commands

```bash
cd frontend && npm run lint
cd frontend && npm run build
supabase start
supabase db reset
```

## Project focus

The MVP is centered on a few key workflows:

- volunteer onboarding and compliance tracking
- dashboard visibility into staffing status
- simulated inbound and outbound shift messaging
- automated substitute search flows with escalation logic

## Additional context

Product and planning details live in:

- `prd.md`
- `aiDocs/mvp.md`
- `aiDocs/architecture.md`
- `aiDocs/roadmaps/mvp_roadmap.md`
