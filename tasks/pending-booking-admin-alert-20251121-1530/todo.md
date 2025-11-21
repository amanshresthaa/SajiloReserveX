---
task: pending-booking-admin-alert
timestamp_utc: 2025-11-21T15:30:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Implementation Checklist

## Setup

- [x] Locate auto-assign failure/exhaust paths (inline and job) and existing mailer.
- [x] Confirm admin email source (restaurants contact_email) and booking status for pending.

## Core

- [x] Add idempotent pending-notification trigger on auto-assign failure.
- [x] Implement email payload using existing mailer and booking details.
- [x] Persist notification sent marker to avoid duplicates (JSON `details.pending_admin_notified_at`).

## Tests

- [ ] Unit/integration tests for failure path → single email send.
- [ ] Guard against missing admin email (logs, no send file).

## Notes

- Assumptions:
  - Pending definition: booking remains pending/pending_allocation after assignment failure.
  - Use existing Resend mailer; no new provider.
- Deviations:
  - Email dedupe stored in booking `details` JSON (no schema migration).

## Batched Questions

- None currently.
