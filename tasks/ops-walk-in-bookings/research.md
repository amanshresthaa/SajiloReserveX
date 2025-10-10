# Research: Ops Walk-In Booking Flow

## Existing Patterns

- Customer bookings use the Reserve booking wizard (`components/reserve/booking-flow`) which renders `BookingWizard` from `reserve/features/reservations/wizard/ui`.
- The wizard orchestrates four steps (Plan, Details, Review, Confirmation) with state managed by `useReservationWizard`/`useWizardStore`.
- Submissions ultimately hit the REST endpoint `POST /api/bookings` via the hook `useCreateReservation` (Reserve app) which posts payload `{ restaurantId, date, time, party, bookingType, seating, notes, name, email, phone, marketingOptIn }`.
- Server-side creation (`app/api/bookings/route.ts`) requires email & phone (zod schema) and sets `source: "api"`, `status: "confirmed"`, and builds audit trail + loyalty and notifications.
- Bookings table has `source` (defaults to `web` in `insertBookingRecord`) and `details` JSON column already surfaced in ops dashboard (rendered raw in `TodayBookingsCard` detail dialog).
- Staff access is managed via `fetchUserMemberships` / `requireMembershipForRestaurant` utilities (`server/team/access.ts`). Existing ops APIs (`/api/ops/bookings/[id]/status`) reuse these checks.

## External Resources / Constraints

- No current ops UI for creating reservations; dashboard (`app/(ops)/ops`) is read-only.
- Reserve wizard enforces email/phone with `detailsFormSchema` and returns non-empty strings. Making them optional requires schema changes plus draft transformer adjustments.
- Notifications & loyalty side effects run through `enqueueBookingCreatedSideEffects`; these should still execute if email is missing (mail should simply skip). Need to confirm downstream tolerates null email/phone.

## Technical Constraints & Edge Cases

- Server `bookingSchema` (public API) requires email/phone → loosening this must not regress customer flow. Best handled by adding a separate ops endpoint with relaxed rules.
- Reserve wizard currently hard-codes POST `/bookings` via `useCreateReservation`; need a mode/config to call new ops endpoint and to allow optional contacts.
- Booking creation needs to mark source as “Created by System” → can map to `source = 'system'` and/or embed metadata in `details`.
- Staff should choose which restaurant when they belong to multiple; we can default to first membership but UI should let them pick (maybe via wizard initial details or wrapper control).
- Email optional but if provided we must trigger confirmation email (existing flow uses email presence to send). Ensure details JSON or flags convey this.
- Ensure new ops route enforces authentication + membership (no anonymous creation).
- Reuse existing analytics/UX but avoid customer-only behaviours (terms checkbox text still OK?).

## Open Questions / Assumptions

- Assume staff create bookings for today (walk-in) but allow arbitrary date/time per requirement (“similar to customer flow”).
- “Created by System” can be represented via `source = 'system'` and surfaced in UI as badge/label in ops dashboard (currently shows JSON). Need to decide display location (list row, details panel?).
- Assume no separate loyalty handling; rely on existing automation.
