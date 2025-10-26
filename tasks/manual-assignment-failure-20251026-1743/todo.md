# Implementation Checklist

## Setup

- [x] Draft Supabase migration to `CREATE OR REPLACE` `assign_tables_atomic_v2` with qualified aliases.
- [x] Load env via service client script for verification.

## Core

- [x] Update manual confirm API response shape to include `message`.
- [x] Run service-client script to invoke `assign_tables_atomic_v2` (ensure success) and `confirmHoldAssignment`.
- [x] Exercise auto-assign helper with same restaurant/date to confirm no skips due to SQL errors.

## UI/UX

- [ ] Validate manual confirm toast messaging after API change (DevTools MCP).

## Tests

- [x] Add regression script/test to cover RPC alias fix (skip if validated manually with service client).
- [x] Run targeted Vitest/Node checks relevant to capacity module.

## Notes

- Assumptions: Remote Supabase updated via migration before UI testing.
- Deviations: TBD.

## Batched Questions (if any)

- ...
