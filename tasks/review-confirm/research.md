# Research: Review & Confirm

## Current flow
- `components/reserve/steps/ReviewStep.tsx` summarizes the booking, lists each detail in a definition list, and surfaces `state.error` (set by the submission handler) within the card. It exposes two sticky actions: "Edit details" (goes back to step 1) and "Confirm booking" (disabled + animated while submitting).
- The submission logic lives in `components/reserve/booking-flow/index.tsx` (`handleConfirm`). Key behaviours:
  - Normalizes time via `bookingHelpers.normalizeTime`; aborts with an inline error if no time selected.
  - Builds payload for `POST /api/bookings` (or `PUT` when editing) including `restaurantId`, `date`, `party`, `bookingType` (auto-inferred for non-drinks), `seating`, contact details, notes, and marketing opt-in.
  - Handles three server outcomes: `202` waitlist -> `SET_CONFIRMATION` with `waitlisted`, non-2xx -> surfaces message via `SET_ERROR`, success -> tracks analytics and stores confirmed booking.
  - Calls `track("booking_created", …)` for mixpanel/Segment-style analytics, including waitlist + allocation flags.
- When confirmation payload is set, the reducer transitions to step 4 and resets `submitting`. Waitlist scenarios propagate `allocationPending` flags.

## Server-side alignment
- `/app/api/bookings/route.ts` orchestrates Supabase inserts, table allocation (`findAvailableTable`), loyalty program lookups, analytics logs, and email triggers. Critical server responses: `202` for waitlist/manual allocation, `409` for conflicts, `500` for supabase errors. The client must interpret these codes (current logic treats any non-OK as inline error).
- Update path (`PUT /app/api/bookings/[id]`) reuses much of the same logic, including re-running table allocation and logging audit events (`buildBookingAuditSnapshot`, `logAuditEvent`). Both endpoints rely on `client_request_id` to dedupe, so front-end should ideally provide one if we expect idempotency across retries (currently not exposed).

## Accessibility + feedback
- `ReviewStep` ensures summary text is descriptive and uses uppercase helper labels for clarity. Error box is role-neutral but visually distinct; we may need to add `role="alert"` + `aria-live` for screen readers per `agents.md` MUST (“Use polite aria-live for toasts/inline validation”).
- Actions feed into sticky footer which maintains focusable buttons at all times. Need to ensure pressing Enter on the form triggers confirmation (currently summary isn’t a form, so we rely entirely on button click).

## Verification
1. Inspected `ReviewStep.tsx` for UI structure and `onActionsChange` output.
2. Walked through `handleConfirm` to understand state transitions, network calls, and error handling.
3. Cross-referenced API route logic to confirm response shapes and status codes the UI must handle.

## Risks & gaps
- No retry/backoff: if the fetch fails (network error), we surface error but keep `submitting` false; repeated clicks may duplicate bookings because server idempotency relies on `client_request_id` (currently generated server-side). Consider sending a deterministic request id per submission.
- Server auto-infers booking type for non-drinks; client also infers in PlanStep. Divergence could cause confusion if helpers drift.
- Handling of partial failures (e.g., email send fails but booking succeeds) currently only logs analytics; should confirm how user is notified.
- Need to ensure we handle manual allocation flows gracefully (clear messaging, follow-up actions).
