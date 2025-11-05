# Research: Fix confirmed email not sent after table assignment

## Requirements

- Functional:
  - Status transition must succeed when confirming a booking to `confirmed`.
  - Guests should receive the confirmed “ticket” email once status flips to `confirmed`.
- Non-functional:
  - Remote-only DB change via migration.
  - No impact on other booking lifecycle paths.

## Existing Patterns & Reuse

- Status transitions centralized in DB function `public.apply_booking_state_transition(...)`.
- Confirmation email is sent from API/job after transition (auto-assign path) or can be sent ad-hoc.

## External Resources

- Supabase CLI and psql for remote migration execution.

## Constraints & Risks

- Remote DB had prior migrations not present locally; `supabase db push` mismatched migration history.
- Using direct SQL apply is acceptable for a small `CREATE OR REPLACE FUNCTION` hotfix; migration file kept in repo for traceability.

## Open Questions

- None for this hotfix.

## Recommended Direction (with rationale)

- Qualify ambiguous reference in the function: `public.bookings.status` vs OUT param `status`.
- Apply function replacement remotely; verify transition and history insert; send one-off confirmation email for the affected booking.
