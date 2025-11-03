# Research: Auto Table Assignment

## Requirements

- Functional:
  - Auto-assign tables using existing manual logic right after booking creation.
  - Customer UI shows no table visuals.
  - Confirmation step: show confirmed if assigned, pending otherwise.
- Non-functional:
  - Safe, idempotent attempts; do not block booking creation or emails.
  - No secrets in code; use service client utilities.

## Existing Patterns & Reuse

- Manual assignment route uses + (src/app/api/ops/bookings/[id]/tables/route.ts).
- Ranking logic exists in .
- Side-effects on booking creation live in .

## External Resources

- N/A

## Constraints & Risks

- Booking creation RPC sets status 'confirmed' today; we will infer pending from lack of assignments in UI.
- Avoid exposing table IDs publicly; only return boolean status.

## Open Questions (owner, due)

- Should status be flipped to pending_allocation on failure? (maintainer, later)

## Recommended Direction (with rationale)

- Implement in server layer, using then .
- Hook it in booking-created side effects (non-blocking).
- Add GET returning .
- Update confirmation hook to fetch status; display pending until assigned.
