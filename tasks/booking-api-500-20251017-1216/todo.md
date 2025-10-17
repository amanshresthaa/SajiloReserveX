# Implementation Checklist

## Setup

- [x] Draft Supabase migration to harden `create_booking_with_capacity_check` and normalize invalid restaurant timezones.
- [x] Introduce shared timezone validation helper (e.g., `ensureValidTimezone`) in server utilities.

## Core

- [x] Update restaurant create/update/detail flows to use helper and block invalid timezones.
- [x] Enhance `POST /api/bookings` error logging to capture RPC `details` for internal errors.
- [x] Regenerate RPC SQL with timezone fallback + include diagnostic details in response.

## Tests

- [x] Unit tests for timezone helper / validation.
- [ ] Adjust or add server tests covering invalid timezone rejection.
- [ ] (Optional) Integration sanity check for bookings route behaviour with mocked invalid timezone.

## Verification Prep

- Notes:
  - Pending confirmation of `sqlstate/sqlerrm` from observability after change.
  - `pnpm test:ops -- --run tests/server/restaurants/timezone.test.ts` executes broader suite and currently fails due to pre-existing UI/Chai matcher issues; timezone helper tests pass locally before suite abort.
- Deviations:
  - None yet.

## Batched Questions (if any)

- Need confirmation whether staging data currently contains invalid timezones beyond `old-crown-pub` before running migration (collect via Supabase query).
