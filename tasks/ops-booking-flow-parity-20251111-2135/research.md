# Research: Ops Booking Flow Parity

## Requirements

- Functional:
  - Align the `/ops/bookings/new` walk-in wizard with the customer-facing booking flow so it shares the same step transitions (Plan → Details → Review → Confirmation) and downstream status updates.
  - Keep email and phone optional in the ops Details step but ensure pending and confirmation emails follow the same workflow as customer bookings.
  - When staff leaves the email blank, automatically use the restaurant’s contact email so the notification still fires; otherwise send to the guest-provided email.
  - Ensure booking lifecycle is `pending` → `confirmed` (after table assignment) just like customer flow, so ops creations show up as “awaiting confirmation” until seated/assigned.
  - Emails should always reach the restaurant even when guests do not provide contact info (per “send on behalf of guest”).
- Non-functional:
  - Reuse the existing wizard/booking infrastructure; avoid duplicating validation/business logic.
  - Maintain accessibility (wizard already follows shared components) and keep ops auth guard intact.
  - Preserve data integrity and avoid regressing booking history/analytics, especially customer identity linking.

## Existing Patterns & Reuse

- `BookingFlowPage` (`components/reserve/booking-flow/index.tsx`) already powers both customer and ops flows via `mode="ops"`.
- `useCreateReservation` (customer) and `useCreateOpsReservation` (ops) share adapters but ops currently talks to `/api/ops/bookings`.
- The ops API route (`src/app/api/ops/bookings/route.ts`) orchestrates walk-in bookings; it enqueues the same `enqueueBookingCreatedSideEffects` job used elsewhere.
- Email dispatch is centralized in `server/jobs/booking-side-effects.ts` which defers to `sendBookingConfirmationEmail` for both pending + confirmed states.

## External Resources

- [COMPREHENSIVE_ROUTE_ANALYSIS.md](COMPREHENSIVE_ROUTE_ANALYSIS.md#L1273) documents the ops booking pipeline and confirms `/api/ops/bookings` inserts with `status="confirmed"` today.
- `server/emails/bookings.ts` describes how confirmation/pending emails are rendered and sent via Resend.

## Constraints & Risks

- Customer identity (`customers` table) is keyed off synthetic fallback emails/phones; changing those blindly could merge unrelated guest histories.
- Ops staff expect immediate visibility inside `/ops/bookings`; statuses flipping to `pending` must not hide new records (UI already supports pending states but worth re-verifying filters).
- Emailing the restaurant when no guest email exists must not expose placeholder addresses externally.
- Any changes in the API require updating Vitest coverage (`tests/server/ops/bookings-route.test.ts`).

## Open Questions (owner, due)

- Q: Should phone numbers also default to the restaurant contact line when absent? (Assumption: not required—only email fallback requested.)
  A: Assumed requirement covers email only; phone remains optional and blank unless explicitly provided. (Owner: dev, Due: before implementation sign-off.)
- Q: Should restaurant receive a copy even when guest email is provided?
  A: Not specified; we’ll keep existing behavior (send to guest, fall back to restaurant only when guest email is missing) and document the assumption.

## Recommended Direction (with rationale)

- Keep the shared wizard UI but modify the server-side ops booking creation path:
  1. Fetch the restaurant’s contact email (and optionally phone) when building the walk-in payload.
  2. Store bookings with `status="pending"` (instead of `confirmed`) so they traverse the same pending → confirmed lifecycle and reuse the email cadence already wired into `enqueueBookingCreatedSideEffects`.
  3. When ops staff omit email, substitute the restaurant contact email for the booking record (so confirmation/pending notices still send) but continue using the synthetic fallback identity for the `customers` table to avoid merging guest histories.
  4. Keep phone optional without fallback beyond the existing dummy `000-` identifier so we don’t expose restaurant numbers as guest contact info unless explicitly provided.
  5. Extend the API + unified validation path to pass the restaurant contact info so both legacy + unified modes behave consistently.
- Update the server tests to assert the new pending status and fallback logic, ensuring we don’t regress rate limiting/idempotency coverage.
