# Product Requirements Document: Intelligent Volunteer Coordination Agent

## 1. Executive Summary
The Intelligent Volunteer Coordination Agent is a purpose-built AI solution designed to transition the Volunteer Coordinator role from a manual scheduler of logistics to a high-value community builder. By automating the highest-friction operational tasks—manual sub-filling, compliance tracking, and route-specific reminders—the tool ensures 100% service reliability for vulnerable populations while returning 10–15 hours of weekly bandwidth to staff. This agent acts as a tireless administrative partner that quietly handles the noise of coordination, allowing organizations like Meals on Wheels and United Angels to focus on their core mission of human connection.

## 2. User Personas & Sentiment

### The Overwhelmed Coordinator (e.g., Jana, Sylvia)
* **The "Why"**: These users are driven by their organizations’ missions (community support, welfare checks) but are bogged down by tedious and anxiety-inducing tasks. For example, a volunteer cancellation at 7:00 AM currently triggers a 2-hour manual outreach marathon.
* **Desired Sentiment**: Peace of mind. They want to know that if a problem arises, a system is already solving it before they even know about it.

### The Dedicated Volunteer (e.g., Students, Retirees)
* **The "Why"**: They want to give back but have busy lives. Friction in onboarding or confusion about route details (like bag colors or insurance updates) leads to churn.
* **Desired Sentiment**: Empowered and Informed. They want a frictionless, professional experience that respects their time and makes it easy to say "yes" to a shift.

## 3. User Stories

### For the Volunteer Coordinator
* **As a Coordinator**, I want the system to automate the administrative steps of employee onboarding, so that new staff members are service-ready and integrated into the workflow without manual paperwork delays.
* **As a Coordinator**, I want a dashboard that flags only the volunteers who are not compliant (e.g., expired insurance), so I don't have to manually audit hundreds of folders.
* **As a Coordinator**, I want the system to handle the "night-before" reminders, so that volunteers arrive with the correct instructions without me sending individual texts.
* **As a Coordinator**, I want an agent to automatically find and confirm a substitute when a regular volunteer cancels, so I don't have to spend my morning manually hunting down a substitute.

### For the Volunteer
* **As a Volunteer**, I want to upload my driver’s license and insurance once and be "cleared" for service automatically, so I can start helping sooner.
* **As a Volunteer**, I want to receive a check-in text in advance of my shift with clear "Confirm" or "Cancel" buttons, so I can easily manage my commitment if my schedule changes.
* **As a Substitute**, I want to receive a text with a clear "Accept" button for open shifts, so I can pick up routes on the go without back-and-forth calls.
* **As a Driver**, I want a reminder the evening before my shift that tells me exactly where to go and what specific equipment (e.g., blue bags) I need.

## 4. Feature Descriptions & Functional Requirements

### 4.1 Proactive Onboarding & Compliance Portal
A self-service onboarding "concierge" that guides new applicants through background checks, vehicle insurance uploads, and training videos.
* **UI/UX Desire**: A progress bar at the top or bottom so that the user knows how close they are to finishing. If a document is blurry or expired, the agent sends a polite, automated nudge to the volunteer with a direct upload link.
* **Compliance Monitoring**: The system proactively identifies insurance policies expiring in 30 days and manages the renewal request/collection without staff intervention.

### 4.2 Autonomous Sub-filling Agent (The "Bridge")
A reactive agent triggered by a volunteer "Request a Substitute" event. It intelligently scans the substitute pool based on availability, proximity, history, and reliability.
* **Sequential Tiering**: The system pings the next 5 qualified volunteers on the waitlist in 15-minute intervals rather than "blasting" the whole group and causing confusion.
* **The "Danger Zone" Protocol**: If a volunteer sends CANCEL within a 4-hour window of their shift, the system bypasses standard automation and triggers a High-Priority Red Alert for staff intervention.
* **UI/UX Desire**: The Coordinator should see a "Substitute Search in Progress" status on their dashboard. Once a sub accepts the shift, the status changes to "Substitute Found" with the sub's name highlighted.

### 4.3 Platform-Agnostic Ingestion (Webhooks)
To solve "data sprawl," the system acts as a universal listener for the diverse software stack used across the sector.
* **Requirement**: Support incoming Webhooks to trigger workflows based on external data changes (e.g., a Google Form sign-up or a status change in ClickUp).
* **Compatibility**: Must integrate seamlessly with middleware like Zapier or Make.com to bridge the gap between modern tools and legacy systems (like Stockbox) that may only support periodic CSV exports.

### 4.4 Automated Two-Way Messaging (Fixed Input)
A robust, keyword-driven communication loop that replaces the exhausting "back-and-forth" of traditional texting.
* **Outbound**: Automated SMS sequences triggered by "T-Minus" drip logic.
* **Inbound (The Shortcode Protocol)**:
  * `YES`: Logs a timestamped confirmation and updates the Staff Dashboard.
  * `NO`: Declines the shift; the system immediately logs the opening and updates the "Unfilled Shifts" widget.
  * `SUB`: Triggers the "Auto-Sub" search logic.

### 4.5 The "Control Tower" Dashboard
A modern, high-bandwidth web interface designed for "glanceable" decision-making, lightweight enough to run on refurbished hardware.
* **Live Pulse**: A real-time, scrolling feed of active SMS conversations, allowing staff to "drop in" and take over manually.
* **Staffing Funnel**: A visual breakdown of Total Shifts -> Confirmed -> Unconfirmed -> Unfilled.
* **Red Alert Sidebar**: A persistent, high-contrast list of critical items, such as "Danger Zone" cancellations or exhausted substitute lists.
* **Impact Ticker**: A live ROI calculator showing "Staff Hours Saved" (Automated interactions × 5-minute baseline).

### 4.6 Human-in-the-Loop (HITL) Triggers
The system handles 90% of logistics but identifies the 10% requiring human empathy or complex problem-solving.
* **Keyword HELP or HUMAN**: Immediately overrides all automation and flags the conversation for staff.
* **Unrecognized Responses**: Complex sentences (e.g., "My car broke down, but I can come tomorrow...") are flagged as "Needs Review."
* **Substitution Exhaustion**: If the Auto-Sub logic cycles through the pool without a `YES`, the system pings the coordinator to initiate "manual recovery."

## 5. Proposed Drip Campaign Logic (The "T-Minus" Protocol)

| Timing | Content Goal | Reasoning | Expected Outcome |
| :--- | :--- | :--- | :--- |
| **Trigger + 5m** | Instant Confirmation | "Strike while the iron is hot" to confirm the volunteer's intent. | Immediate record-keeping. |
| **T-72 Hours** | Confirmation Request | Provides enough lead time for "Auto-Sub" logic to find a replacement if they decline. | Identifies gaps early. |
| **T-24 Hours** | Logistics Drop | Pushes specific data (Bag Color, Map Link) right when the volunteer is planning their next day. | Reduces logistical "no-shows." |
| **T-2 Hours** | Final Nudge | Serves as a digital "tap on the shoulder" for busy volunteers. | Minimizes forgetfulness. |

## 6. UI/UX Principles for CBOs
* **Hyper-Simplicity**: Use large touch targets, high-contrast text, and minimal navigation levels for older or less tech-savvy volunteers.
* **Mobile-First Delivery**: Most interactions happen via SMS or mobile-responsive web views to avoid the friction of downloading a native app.
* **The "Human-in-the-Loop" Override**: A persistent interrupt/override button for Coordinators to manually take over high-priority routes.

## 7. Project Timeline
* **March 30**: Prototype MVP Launch
  * Core logic for sub-filling and basic text reminders.
  * Initial UI "wireframe" for the onboarding portal.
* **April 1**: Final MVP Delivery
  * Full integration of the Compliance Agent (document tracking).
  * Refined messaging templates for route-specific instructions.
* **April 10**: Final Presentation Preparation
  * Final polish of the Coordinator Dashboard.
  * Pre-delivery testing with organization-specific data.
* **April 13**: Final Presentation to Stakeholders

## 8. Future Success Indicators
* **Friction Reduction**: Zero hours spent by volunteer coordinators on manual sub-filling for the first month.
* **Compliance Confidence**: 100% of active drivers having valid insurance on file without manual audits.
* **Service Reliability**: Zero missed "welfare checks" due to volunteer "no-shows" or sub-confusion.

## 9. Future Roadmap (Phase 2 & Beyond)
The goal of Phase 1 is to stabilize the "logistics of kindness." Future phases will focus on expanding the platform's intelligence and breadth of impact.
* **AI Natural Language Integration**: Transitioning from rigid shortcodes to an NLP engine. This will allow the system to handle conversational rescheduling requests and provide context-aware answers to volunteer questions based on organization-specific "knowledge bases."
* **Bi-Directional Write-Back & Sync**: Building a "closed-loop" ecosystem. Instead of just showing confirmations on our dashboard, Phase 2 will push those status updates directly back to the CBO's source of truth (e.g., updating a Google Sheet or ClickUp task).
* **Multi-Channel Presence**: Expansion beyond SMS to include automated Email summaries for long-form instructions, WhatsApp integration, and automated Voice nudges (text-to-speech) for elderly volunteers using landlines.
* **The "Unified Intake" Module**: A lightweight, mobile-optimized form that dynamically triggers workflows across multiple departments (Legal, Food, Hygiene) based on real-time client assessments, ensuring no client falls through a departmental gap.
