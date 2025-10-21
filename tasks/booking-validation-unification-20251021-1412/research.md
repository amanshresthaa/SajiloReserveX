# Research: Booking Validation Unification

## Existing Patterns & Reuse

- `src/app/api/bookings/route.ts` (customer `/reserve` flow) already composes the desired validation stack:
  - Fetches schedule via `getRestaurantSchedule` to learn closures, service periods, and timezone.
  - Calls `assertBookingWithinOperatingWindow` (from `server/bookings/timeValidation.ts`) to block closed days, breaks, and outside-hours slots.
  - Applies `assertBookingNotInPast` gated by `env.featureFlags.bookingPastTimeBlocking`.
  - Delegates capacity enforcement to `createBookingWithCapacityCheck` (`server/capacity/transaction.ts`) which inserts within a single Supabase RPC/transaction.
  - Emits observability events and produces consistent error handling already covered by `src/app/api/bookings/route.test.ts`.
- Dashboard update helper `handleDashboardUpdate` (`src/app/api/bookings/[id]/route.ts:120-219`) only validates past-time (flagged) and immediately calls `updateBookingRecord`; no schedule or capacity guard.
- Ops edit handler (`src/app/api/ops/bookings/[id]/route.ts:70-210`) mirrors dashboard shortcut and lacks operating-hours/capacity validation; overrides limited to past-time via query param.
- Ops walk-in create (`src/app/api/ops/bookings/route.ts:399-620`) calls `validateBookingWindow` (policy-derived) rather than live schedule, potentially ignoring custom closures and capacity.
- `server/restaurants/schedule.ts` centralises schedule assembly (closures, intervals, available occasions) already consumed by the `/reserve` wizard (`reserve/features/reservations/wizard/services`).
- `server/capacity` module provides transactional helpers (`createBookingWithCapacityCheck`, `validateBookingWindow`) plus policy primitives (`ServiceNotFoundError`, `ServiceOverrunError`) that can be reused inside the new validator.
- Existing DTOs (`BookingRecord`, `CreateBookingParams`) live in `server/bookings.ts` / `server/capacity/types.ts` and should inform the new shared `BookingInput`/`BookingValidationResponse` contracts.
- Prior past-time revisions (`server/bookings/pastTimeValidation.ts`, task `tasks/prevent-past-bookings-20251015-1323`) include override semantics, observability logging, and grace periods we must honour.

## External Resources

- `tasks/booking-crud-audit-20251021-1339/research.md` – detailed gap analysis between `/reserve` and dashboard/Ops paths.
- `server/capacity/README.md` – documents capacity transaction behaviour, error semantics, and retry expectations.
- `COMPREHENSIVE_ROUTE_ANALYSIS.md` & `documentation/API_INTEGRATION_GUIDE.md` – describe current API contracts/error payloads for `/api/bookings*` endpoints.
- `tasks/prevent-past-bookings-20251015-1323/*` – prior rollout notes for past-time blocking; use to confirm override handling and telemetry expectations.

## Constraints & Risks

- **Feature flags**: Must respect `env.featureFlags.bookingPastTimeBlocking` and introduce new `env.featureFlags.bookingValidation.unified` (naming to verify in code) for staged rollout.
- **Ops overrides**: Staff routes allow `allow_past` query param today; the unified layer must require explicit capability (`booking.override` or role gate) plus capture `override_reason`.
- **Capacity race**: Validator must re-check capacity inside the final transaction (`createBookingWithCapacityCheck` or equivalent) to avoid TOCTOU. Need to confirm update path also supports capacity RPC (currently only insert path).
- **Downtime risk**: Refactoring multiple routes simultaneously demands incremental toggles; ensure shadow mode before enforcing errors on dashboards.
- **Timezone drift**: Dashboards use `datetime-local` inputs which assume browser TZ; server validator must convert to restaurant TZ reliably (consult `lib/utils/datetime.ts` for helpers).
- **Error contract**: Clients currently expect heterogeneous responses (422, 400, custom strings). Introducing typed errors requires compatibility layer and feature-flagged rollout.
- **Audit/logging**: Overrides and validation failures must emit observability events and persist audit trail without leaking sensitive info.

## Open Questions (and answers if resolved)

- Q: Do dashboard (`/api/bookings/[id]`) updates today bypass operating-hours and capacity checks?
  A: Yes – `handleDashboardUpdate` only calls `assertBookingNotInPast` (feature-flag gated) and `updateBookingRecord`; no schedule or capacity enforcement (confirmed in `src/app/api/bookings/[id]/route.ts:115-205`).
- Q: How do Ops walk-in creations validate service windows?
  A: They call `validateBookingWindow` (policy-based) which ignores real-time closures and does not check Supabase capacity; they still bypass schedule-level closures (`isClosed`) and may overbook.
- Q: Is there an existing audit mechanism for overrides?
  A: Ops flows log observability events for past-time overrides but do not persist override reasons/codes to bookings; we must extend booking audit trail (likely `logAuditEvent` metadata) and maybe new DB fields (verify schema).
- Q: Can `createBookingWithCapacityCheck` handle updates?
  A: No direct update equivalent exists today; updates call `updateBookingRecord`. Supabase RPC `create_booking_with_capacity_check` only inserts (no update path), so we likely need a new transactional update helper/RPC to avoid TOCTOU.
- Q: Where should override audit metadata live?
  A: `logAuditEvent` (`server/bookings.ts:251`) writes into `audit_logs`; existing update paths already attach `buildBookingAuditSnapshot`. We can extend metadata with `override_codes`, `override_reason`, and actor info without schema changes (JSON column).

## Recommended Direction (with rationale)

- Encapsulate all validation (schedule closure, operating hours, past-time, capacity, overrides) in `BookingValidationService`.
- Use dependency injection for schedule repo, capacity service, time provider, and logger so unit tests can isolate components.
- Introduce mapper translating internal error codes (`OperatingHoursError`, `PastBookingError`, capacity errors) into the unified `BookingError` contract.
- Refactor each endpoint to call `validate*` methods first; gate new behaviour behind `env.featureFlags.bookingValidation.unified` so legacy paths stay intact during shadowing.
- Add optional preflight endpoint returning `BookingValidationResponse` for client side (dashboards/wizard) to surface unified messaging and disabled states.
- Expand telemetry: emit `booking.validation_failed` with structured details and `booking.override_applied` when overrides occur, feeding existing observability pipeline.
