# Implementation Roadmap: Intelligent Volunteer Coordination Agent (MVP)

## Phase 1: Foundation & Architecture Setup (Target: Pre-March 30)
- **Initialize Repository**: Set up Next.js (React) project with Tailwind CSS.
- **Database Provisioning (Supabase)**:
  - Create Supabase project.
  - Define schema (`Volunteers`, `Shifts`, `Schedules`, `Sub_Requests`).
  - Configure Row Level Security (RLS) to ensure data privacy.
  - Set up private storage buckets for compliance documents (driver's licenses, insurance).
- **Communication Infrastructure (Twilio)**:
  - Provision a local 10-digit phone number (A2P 10DLC).
  - Configure Twilio webhooks to route incoming SMS to the Next.js backend.
- **Automation Setup**: Configure Inngest or Vercel Serverless Cron Jobs for scheduled tasks.

## Phase 2: Core Engine & Prototype Setup (Target: March 30)
*Milestone: Prototype MVP Launch with core logic for sub-filling, basic text reminders, and initial UI wireframe for onboarding.*
- **Two-Way Messaging (Inbound Webhooks)**:
  - Implement parsing for shortcodes: `YES`, `NO`, `SUB`, `HELP`/`HUMAN`.
  - Handle `HELP`/`HUMAN` logic to pause automation and route to staff dashboard.
  - Handle `NO` and `SUB` logic to trigger substitution workflows.
- **Autonomous Sub-Filling Agent Logic**:
  - Build query logic to find the next 5 qualified volunteers on the waitlist.
  - Implement 15-minute sequential SMS pinging sequences.
  - Handle "Danger Zone" protocol (cancellations within 4 hours trigger Red Alert instead of auto-sub).
- **Automated T-Minus Reminders**:
  - T-72 Hours: Advance confirmation requests.
  - T-24 Hours: Logistics drop.
  - T-2 Hours: Final digital nudge ("tap on the shoulder").
- **Onboarding UI Wireframe**: Build a basic mobile-friendly web form structure for volunteer sign-ups.

## Phase 3: Compliance & Refinement (Target: April 1)
*Milestone: Final MVP Delivery with Compliance Agent and refined messaging.*
- **Proactive Onboarding & Compliance Portal**:
  - Implement secure document upload to Supabase private buckets.
  - Build the "Compliance Agent" logic (track 30-day policy expirations and send automated renewal nudges).
- **Control Tower Dashboard (Lightweight)**:
  - Build the "Live Pulse" scrolling feed (listening to Supabase Real-Time).
  - Implement the "Staffing Funnel" visual breakdown.
  - Build the "Red Alert Sidebar" for critical issues.
  - Implement CSV Import/Export utility for data seeding and reporting.
- **Message Template Polish**: Refine route-specific instructions (e.g., bag colors, map links).

## Phase 4: Final Polish & Pre-Delivery (Target: April 10)
*Milestone: Final presentation preparation, polishing the Coordinator Dashboard, and testing with organization-specific data.*
- **End-to-End Testing**: Test webhook reliability, cron job timing, and sub-filling fallback logic (Auto-Sub exhaustion).
- **UI/UX Polish**: Ensure large touch targets, high-contrast text, and desktop optimization for the Control Tower.
- **Data Integration**: Seed testing environment with realistic/organization-specific CBO data via CSV import.
- **Human-in-the-Loop Validation**: Verify complex sentence handling (unrecognized inputs) and manual override toggles work smoothly.

## Phase 5: Handoff & Presentation (Target: April 13)
*Milestone: Final Presentation to Stakeholders.*
- Finalize demo scripts.
- Deploy stable MVP branch to Vercel free tier.
- Prepare technical documentation and project handoff instructions.

---

**Future Enhancements (Phase 2+ Overview)**
- Explore NLP for conversational replies in place of rigid shortcodes.
- Build bi-directional write-backs to external sources of truth (e.g., Stockbox/ClickUp).
- Multi-channel expansion (Email, WhatsApp, Voice text-to-speech for landlines).
- "Unified Intake" Module for cross-departmental client workflows.
