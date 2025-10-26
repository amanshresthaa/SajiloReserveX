# Implementation Checklist

## Setup

- [x] Confirm existing schema context for bookings and allocations.
- [x] Review current feature flag handling in `server/feature-flags.ts`.
- [x] Inspect test fixtures structure under `tests/fixtures/`.

## Core

- [x] Implement observability and holds migrations with safe rollbacks.
- [x] Update feature flags to hard-disable legacy RPC path in production.
- [x] Create/update test fixtures for zones and bookings.

## UI/UX

- [ ] Not applicable (no UI changes).

## Tests

- [x] Add unit test covering production flag behavior.
- [x] Run relevant test suites locally.

## Notes

- Assumptions: Migrations will be executed against remote Supabase once reviewed; no local DB available for dry-run.
- Deviations: Limited Vitest execution to allocator-related suites to avoid unrelated env setup noise; full suite still requires `.env` normalization.

## Batched Questions (if any)

- _TBD_
