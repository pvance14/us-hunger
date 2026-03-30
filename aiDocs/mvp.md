# MVP Definition: Intelligent Volunteer Coordination Agent

## 1. Overview
The Minimum Viable Product (MVP) focuses on stabilizing the "logistics of kindness" by delivering the highest-impact automation features for volunteer coordination. It aims to eliminate manual sub-filling, automate basic communication, and streamline the initial compliance steps, returning immediate bandwidth to the Volunteer Coordinator.

## 2. Core MVP Features (Phase 1)

### 2.1 Autonomous Sub-filling Agent
The core engine to handle volunteer cancellations without manual intervention.
* **Trigger**: A volunteer cancels a shift (e.g., via SMS replying "NO" or "SUB").
* **Logic**: The system automatically identifies the next 5 qualified volunteers on the waitlist.
* **Execution**: Pings available substitutes in 15-minute sequential intervals to avoid confusion.
* **Resolution**: Once a substitute replies "YES", the shift is confirmed, and the system updates the staff dashboard.

### 2.2 Automated SMS Reminders (T-Minus Protocol)
A fixed-input, two-way messaging loop to reduce no-shows and confusion.
* **T-72 Hours**: Advance confirmation request to identify gaps early.
* **T-24 Hours**: Logistics drop detailing specific instructions (e.g., Bag Color, Map Link).
* **T-2 Hours**: Final digital "tap on the shoulder" reminder.
* **Supported Shortcodes**: Users can reply with `YES` (Confirm), `NO` (Decline/Cancel), `SUB` (Request Substitute), or `HELP` (Escalate to Human).

### 2.3 Proactive Onboarding & Compliance Portal
A self-service portal for new volunteers to become service-ready.
* **Initial UI Wireframe**: A structured, mobile-friendly web form guiding volunteers through onboarding steps.
* **Document Tracking (Compliance Agent)**: Capability for volunteers to upload necessary documents like background checks and vehicle insurance. The system tracks expiration dates and triggers automated renewal nudges starting 30 days prior to expiration.

### 2.4 The "Control Tower" Dashboard (Lightweight Version)
A high-level interface for the Volunteer Coordinator to monitor the agent's activities.
* **Staffing Funnel**: Visual breakdown of total shifts versus confirmed, unconfirmed, and unfilled shifts.
* **Live Status**: Visibility into "Substitute Search in Progress" and successful matches.
* **Red Alert Sidebar**: Highlights critical, unresolved issues such as "Danger Zone" cancellations (cancellations within 4 hours of a shift) or exhausted substitute lists.

### 2.5 Human-in-the-Loop (HITL) Escapements
Safety valves ensuring staff can intervene when automation cannot resolve an issue.
* **Keyword Escalation**: Any message containing `HELP` or `HUMAN` immediately pauses automation and routes the conversation to the Coordinator.
* **Unrecognized Input**: Complex replies not matching standard shortcodes are flagged for manual review.
* **Auto-Sub Exhaustion**: If the system cycles through the entire substitute list without a match, it alerts the Coordinator to begin manual recovery.

## 3. Out of Scope for MVP (Deferred to Phase 2+)
To ensure rapid delivery by the MVP deadline, the following features are deliberately excluded from the initial release:
* **AI conversational NLP**: No open-ended chat; the system relies on standard keywords and fixed inputs.
* **Deep Bi-Directional Write-Backs**: Will rely on dashboard visibility and basic webhooks rather than deeply mutating complex external legacy systems (e.g., Stockbox).
* **Multi-Channel Presence**: Communication restricted to SMS; Email, WhatsApp, and Voice calls are deferred.
* **The "Unified Intake" Module**: Expanding logic to multiple departments (Legal, Food, Hygiene) is out of scope.

## 4. MVP Success Criteria
* **Time Savings**: Zero Coordinator hours spent on standard manual sub-filling in the first month.
* **Compliance Confidence**: 100% of active drivers mapped to valid insurance documents without manual auditing.
* **Service Reliability**: Complete elimination of missed routes caused by miscommunication or unhandled volunteer cancellations (outside of extreme short-notice exceptions).

## 5. Cost Considerations (MVP)
To ensure the proof-of-concept remains financially viable for the CBO, the architecture leverages generous free-tier services:
* **Hosting (Vercel)**: **$0**. Handled completely by the free Hobby tier for Next.js.
* **Database & Auth (Supabase)**: **$0**. The open-source free tier (500MB DB, 1GB storage) is massive enough to store thousands of volunteer documents.
* **Communication/SMS (Twilio)**: **$0 for trial, then ~$2-$10/month**. After utilizing the initial $15 free trial, we avoid $1,000+ shortcodes by using a standard local 10-digit number ($1-2/mo) and pay per message ($0.0079/msg).
* **Custom Domain (Optional but Recommended)**: **~$12/year**. Essential to prevent SMS links from looking like spam (`ushunger.org` instead of `ushunger.vercel.app`).
