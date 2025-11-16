---
task: booking-edit-flow
timestamp_utc: 2025-11-16T01:45:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Implementation Plan: Booking edit flow alignment

## Objective

Align the edit (booking update) flow with creation: attempt inline confirmation when possible, fall back to pending with a single “modification requested” email, and ensure confirmation is sent exactly once when the booking becomes confirmed.

## Success Criteria

- Edit requests attempt immediate confirmation (bounded timeout) and do not double-send emails.
- Pending edits send one “modification requested” email; confirmations send one confirmation (standard or modified variant, per requirement).
- Background auto-assign continues to retry when inline fails or times out.

## Architecture & Components

- `src/app/api/bookings/[id]/route.ts`: edit handler; currently queues auto-assign only.
- `server/jobs/auto-assign.ts`: background confirmation pipeline with retry telemetry.
- `server/jobs/booking-side-effects.ts`: email dispatch for modification/confirmation.
- `server/emails/bookings.ts`: templates for modification/confirmation.

## Data Flow & API Contracts

- PUT /api/bookings/[id]: add inline auto-assign attempt (reusing creation helpers) with timeout and result recording; then enqueue side-effects and background job if still pending.
- Emails: only side-effects path sends; inline path records result with `emailSent: false`.

## UI/UX States

- API only; guest/staff UI should observe faster confirmations when capacity is available.

## Edge Cases

- Suppress flags should bypass all sends.
- Idempotent edits shouldn’t emit duplicate emails.
- If inline times out, request should still return success with pending state while background job continues.

## Testing Strategy

- Unit/integration: cover edit flow inline success, inline fail → pending, suppress flags, and dedupe of emails.
- Manual smoke: create booking, edit booking to a new time that can confirm; verify logs/emails once each.

## Rollout

- Guard optional inline path behind a feature flag or reuse existing inline settings; default on for parity.
- Monitor logs for duplicate emails and auto-assign summaries.

## DB Change Plan

- None.
