# Changelog

All notable changes to this project will be documented in this file.

## [2026-04-06]

### Added
- **Database & Auth (Supabase):** Provisioned the local Supabase container via Docker. Added `001_initial_schema.sql` defining `volunteers`, `shifts`, `schedules`, and `sub_requests` tables, along with Row Level Security (RLS) policies and private storage buckets. Created the Next.js Supabase client (`src/lib/supabase.ts`).
- **Automation Logic (Inngest):** Installed Inngest SDK and implemented foundational configuration files, including the core Next.js API route handler, the Inngest client, and a stubbed `findSubstitutes` background workflow logic.
- **Simulated Webhook API:** Configured `src/app/api/webhooks/simulator/route.ts` to process mocked SMS payloads.
- **Phase 2 - Core Engine & Prototype Setup:** 
  - **Inbound Webhooks:** Added parsing and database connectivity to `simulator/route.ts` for shortcodes `YES`, `NO`, `SUB`, and `HELP/HUMAN` so they correctly update schedule statuses and trigger Inngest events on Supabase.
  - **Autonomous Sub-Filling:** Updated `findSubstitutes` Inngest workflow to query available waitlist volunteers from Supabase, applying "Danger Zone" protocol for <4 hour cancellations and sequentially pinging substitutes with customized mock SMS.
  - **Automated Reminders:** Created `automatedReminders` Inngest cron job to evaluate schedules hourly and dispatch T-72, T-24, and T-2 mock SMS logistics/confirmations.
  - **Onboarding UI Wireframe:** Built a mobile-first, premium glassmorphic web form at `/onboarding` for volunteer sign-ups, including basic inputs and document upload placeholders.
- **Phase 3 - Compliance & Refinement:**
  - **Compliance Portal:** Refactored the onboarding UI to a fully controlled React form (`src/app/onboarding/page.tsx`). Created a server-side `src/app/api/upload/route.ts` using the Supabase Service Role to allow unauthenticated but secure PDF/JPEG uploads to the private `compliance_docs` bucket.
  - **Compliance Agent Workflow:** Added a daily `complianceAgent` cron job in Inngest to audit volunteer insurance expiries and automatically dispatch simulated text messages indicating "action required" at 30 days, 7 days, and 0 days.
  - **Control Tower Dashboard:** Created `/dashboard` with an ultra-premium dark glassmorphic design. Built the **Staffing Funnel**, the **Red Alert Sidebar** for exhausted automated sub sequences and 4-hour cancellations, and the **Live Pulse Feed** powered by `supabase.channel()` to observe real-time PostgreSQL updates on active sub requests and schedules. Added a mock CSV import handler utility for easy presentation seeding.
  - **Message Optimization:** Polished Inngest templates with context-specific phrasing (e.g. dynamic locations and instructions).


### Changed
- **Communication Architecture Pivot:** Formally pivoted the MVP architecture away from a live Twilio integration to an in-app "SMS Simulator." This adjustment bypasses the lengthy A2P 10DLC registration process to allow frictionless testing and stakeholder presentation. Updated `architecture.md` and `mvp_roadmap.md` to reflect the change.
- **Environment Context:** Added local development credential mappings to `.env.example` and `.env.local` for Supabase and Inngest.
