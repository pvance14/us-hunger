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

### Changed
- **Communication Architecture Pivot:** Formally pivoted the MVP architecture away from a live Twilio integration to an in-app "SMS Simulator." This adjustment bypasses the lengthy A2P 10DLC registration process to allow frictionless testing and stakeholder presentation. Updated `architecture.md` and `mvp_roadmap.md` to reflect the change.
- **Environment Context:** Added local development credential mappings to `.env.example` and `.env.local` for Supabase and Inngest.
