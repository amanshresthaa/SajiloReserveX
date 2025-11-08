# Research: Limit party size edits to 12

## Requirements

- Functional:
  - When editing a booking on `/my-bookings`, the party size field must reject values above 12 so users cannot save larger parties through the dashboard.
  - Validation messaging should match the rest of the reservation flow so the UX stays consistent.
  - Server-side update endpoints must enforce the same ceiling to avoid bypasses.
- Non-functional (a11y, perf, security, privacy, i18n):
  - Error copy needs to remain human-readable and announced (existing inline form message is fine if we reuse it).
  - No relaxed validation that could allow API abuse.

## Existing Patterns & Reuse

- `reserve/features/reservations/wizard/model/schemas.ts` clamps party sizes with `.max(12, 'We can accommodate up to 12 guests online.')`.
- `reserve/features/reservations/wizard/hooks/usePlanStepForm.ts` already caps increments via `Math.min(12, current + 1)`.
- `components/dashboard/EditBookingDialog.tsx` uses a zod schema but only `min(1)` (no max) and the input lacks a `max` attribute.
- `src/app/api/bookings/[id]/route.ts` (`dashboardUpdateSchema`) mirrors the same lax validation and will accept any integer.

## External Resources

- N/A (project docs already outline `/my-bookings` expectations).

## Constraints & Risks

- Need to keep client/server validation messages in sync without duplicating magic numbers.
- Changing validation could surface new errors—tests should be updated to assert the ceiling and messaging.
- UI change requires manual QA via Chrome DevTools per AGENTS.md once implemented.

## Open Questions (owner, due)

- None—limit is clearly stated as 12 elsewhere in the product copy.

## Recommended Direction (with rationale)

- Introduce a shared constant (e.g., `MAX_ONLINE_PARTY_SIZE = 12` plus the common error copy) under `lib/bookings` so both dashboard UI, API route, and wizard schemas can consume the same source of truth.
- Update `EditBookingDialog`'s zod schema and input props to enforce the ceiling and surface the shared error message.
- Update `dashboardUpdateSchema` to reuse the constant and prevent API bypasses.
- Align wizard schema/party adjuster with the constant to remove magic numbers while we are touching the party-size logic, keeping the rest of the flow unchanged.
- Extend the existing Vitest suite (`reserve/tests/unit/EditBookingDialog.test.tsx`) to cover the max validation scenario.
