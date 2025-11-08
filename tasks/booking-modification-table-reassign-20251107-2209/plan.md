# Implementation Plan: Booking Modification Reassignment Flow

## Objective

We will ensure every booking edit that impacts allocation re-enters the planner pipeline: guests receive a “modification requested” email immediately, bookings flip back to `pending`, and a background allocator re-confirms the reservation before dispatching a “modification confirmed” email.

## Success Criteria

- [ ] Editing a booking (guest or ops) that changes date/time/party triggers status `pending`, clears table assignments, and enqueues a background allocation attempt.
- [ ] Guests receive a “reservation modification requested” email within the update request path.
- [ ] Once background allocation succeeds, booking status returns to `confirmed` and the guest receives a “reservation modified” confirmation email.
- [ ] Automated tests cover both guest + ops APIs, status transitions, email scheduling, and bypassing the feature flag.

## Architecture & Components

- **Shared helper (`server/bookings/modification-flow.ts`)**: encapsulates logic to (a) detect realignment requirement, (b) update status to pending, (c) clear assignments, (d) queue background job, (e) send acknowledgement email.
  State: uses Supabase service client; returns updated booking payload for API responses.
- **API routes (`src/app/api/bookings/[id]/route.ts`, `src/app/api/ops/bookings/[id]/route.ts`)**: delegate to helper once validation passes; no longer try synchronous `updateBookingWithCapacityCheck`.
- **Background allocator (`server/jobs/auto-assign.ts`)**: add optional `opts?: { bypassFeatureFlag?: boolean; emailMode?: 'modified' | 'standard' }` to reuse for modification flows.
- **Email system (`server/emails/bookings.ts`, `scripts/queues/email-worker.ts`, `server/jobs/booking-side-effects.ts`)**: extend `dispatchEmail` to support new types `modification_pending` + `modification_confirmed`; add queue payload type to differentiate copy.

## Data Flow & API Contracts

1. PATCH/PUT payload validated as today.
2. If `requiresTableRealignment` is false → existing path.
3. If true → call `beginBookingModificationFlow({ existing, payload, bookingId, restaurantId, source })` which:
   - Updates booking row via `updateBookingRecord` (or uses RPC for non-capacity fields) setting `status='pending'`, `pending_ref=generatePendingToken()`, and writes new start/end.
   - Calls `clearBookingTableAssignments` and `enqueueBookingModificationEmails('pending')` (synchronous send when queue disabled).
   - Invokes `scheduleModificationAutoAssign(bookingId, { bypassFeatureFlag: true })`.
4. Helper returns latest booking (still pending). API responds with that state, so UI can show awaiting confirmation.
5. Background job reuses allocator pipeline; on success, set `status='confirmed'` & send “modification confirmed” email.

## UI/UX States

- Loading: existing spinner while PATCH/PUT in flight.
- Pending: booking detail surfaces should already support `pending` state; ensure response payload matches.
- Success: once background job confirms, nothing to change UI-side because clients poll/subscribe.

## Edge Cases

- Capacity failure even after retries → booking remains pending; we should log `auto_assign.failed` event containing `modification=true` for ops triage.
- Email suppression env flags: ensure new templates respect `SUPPRESS_EMAILS`.
- Ops editing a booking already pending should not double-send the pending email.

## Testing Strategy

- Unit: new helper tests to verify status flip, emails enqueued, and background scheduler invoked.
- Integration: extend route tests (`src/app/api/bookings/[id]/route.test.ts`, `src/app/api/ops/bookings/[id]/route.test.ts`) to cover modification flows.
- Jobs: add tests for `autoAssignAndConfirmIfPossible` when invoked with bypass flag to ensure confirmation emails use “modified” copy.
- Accessibility/UI: no UI change, so rely on API + email coverage.

## Rollout

- Feature flag: add `FEATURE_AUTO_ASSIGN_ON_BOOKING` bypass parameter inside helper, no new flag unless QA requires fallback.
- Deploy backend; emails will start sending immediately. Monitor observability events `booking.modification.pending` + `booking.modification.confirmed`.
- Kill-switch: fallback by reverting helper to previous synchronous RPC path (retain feature branch for easy rollback).
