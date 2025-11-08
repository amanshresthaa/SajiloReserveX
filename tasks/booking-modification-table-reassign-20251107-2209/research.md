# Research: Booking Modification Reassignment Flow

## Requirements

- Functional:
  - Any booking edit (guest or ops) that changes party size, date, or time must re-trigger table assignment.
  - Immediately acknowledge the change via a “Reservation modification requested” email and flip the booking status to `pending` so ops can see it needs attention.
  - Background allocator must recompute the plan using the new details and, once tables are secured, transition the booking back to `confirmed` and send a modified confirmation email.
- Non-functional:
  - Avoid blocking PATCH/PUT responses on allocator latency—background flow must be fire-and-forget.
  - Preserve audit logs, RLS constraints, and existing Supabase RPC usage.
  - New emails should reuse existing Resend infrastructure and remain suppressible via `SUPPRESS_EMAILS` env flags.

## Existing Patterns & Reuse

- Guest edit route already calculates `requiresTableRealignment` and invokes `updateBookingWithCapacityCheck`; see `src/app/api/bookings/[id]/route.ts:706-823`.
- Ops edit route mirrors the same synchronous reassignment; see `src/app/api/ops/bookings/[id]/route.ts:332-492`.
- Both routes fall back to `updateBookingRecord` and optionally call `clearBookingTableAssignments` (in `server/bookings.ts:463`) but **never** change `status`, so bookings remain `confirmed` even when tables are dropped.
- `autoAssignAndConfirmIfPossible` (`server/jobs/auto-assign.ts:20-208`) already performs asynchronous allocation+confirmation and sends the confirmation email once successful.
- Booking email templates live in `server/emails/bookings.ts` with helper `dispatchEmail(type, booking)` that already supports different subjects for created/updated/cancelled messages; we can extend it for new modification-specific copy.
- Email queue worker (`scripts/queues/email-worker.ts:1-138`) pulls `EmailJobPayload` records and calls `sendBookingConfirmationEmail`; adding new job types keeps scheduling consistent.

## External Resources

- Internal analytics/events rely on `recordObservabilityEvent` (server/observability.ts). Need to emit new events when modification requests transition to pending.
- Supabase RPC `update_booking_with_capacity_check` (supabase/schema.sql:2805-3250) expects bookings to remain `confirmed`; background job should still rely on it via allocator helpers so no new DB migrations are necessary.

## Constraints & Risks

- Root cause: synchronous RPC-based reassignment fails silently (e.g., capacity exceeded) and we immediately return success while leaving `status=confirmed`. Without a queued background attempt or status change, ops assumes the table is re-assigned even when it is not.
- Need to respect feature flag `FEATURE_AUTO_ASSIGN_ON_BOOKING`; for explicit modification flows we likely must bypass the flag or introduce an override, otherwise background assignment would still be skipped.
- Two new email templates increase localisation footprint; keep copy concise and reuse existing rendering helpers to avoid html regressions.
- Status transitions must be atomic—if we set `pending` but crash before queuing the background job, booking would stay pending forever. We should perform updates and enqueueing within the same request scope.

## Open Questions (owner, due)

- Should background reassignment bypass `FEATURE_AUTO_ASSIGN_ON_BOOKING` when explicitly triggered by a modification? (Owner: Eng, Due: before implementation) — Leaning yes because ops explicitly requested automatic replan.
- Do we need a dedicated `pending_allocation` status vs. plain `pending`? (Owner: PM, Due: after QA) — defaulting to `pending` per user request until directed otherwise.

## Recommended Direction (with rationale)

- Introduce a shared helper (e.g., `beginBookingModificationFlow`) that both guest and ops routes call once `requiresTableRealignment` is true. It should:
  1. Update the booking record (via RPC or standard update) and explicitly set `status` to `pending` while clearing table assignments.
  2. Send the “modification requested” email immediately (queue-able) by extending `dispatchEmail` with a new template type.
  3. Fire-and-forget a background allocator task that reuses `autoAssignAndConfirmIfPossible` but exposes an override flag so modifications always retry.
- When the background allocator confirms the booking it can continue to call `sendBookingConfirmationEmail`, but we’ll add variant copy (“Reservation modified”) so guests understand it’s the updated plan.
- Extend `enqueueBookingUpdatedSideEffects` to differentiate between “pending replan” vs. “fully confirmed” updates for analytics; ideally include event metadata to drive alerting.
