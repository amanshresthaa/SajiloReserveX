---
task: email-config-audit
timestamp_utc: 2025-11-18T12:50:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Implementation Checklist

## Setup

- [ ] Add feature flags/env parsing for reminders and review requests defaults.
- [x] Define new email job types and payload helpers.

## Core

- [x] Extend queue and worker to handle new job types.
- [x] Add trigger logic in booking side-effects to enqueue reminder/review jobs with idempotent jobIds and sensible delays.
- [x] Implement send handlers/templates for reminder and review emails with safe copy.

## Safety

- [x] Respect suppression flags and basic expired-booking guard in worker.
- [x] Ensure one send per booking per type; dedupe via jobId and runtime checks (jobId `{type}:{bookingId}`).

## Tests/Verification

- [x] Typecheck.
- [ ] Manual dry-run via mock Resend or `/api/test-email` to confirm payloads.
- [ ] Document behaviors in `email-summary.md`.
