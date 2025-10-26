# Implementation Checklist

## Setup

- [x] Review existing staff manual confirm flow
- [x] Identify required Supabase permissions or access patterns (✅ research)

## Core

- [x] Add Supabase migration granting SELECT on `table_holds` / `table_hold_members` to `authenticated`
- [ ] Validate confirm and delete handlers can read hold rows locally (dev server)
- [ ] Ensure logging/error handling remains informative (no changes needed)

## UI/UX

- [ ] Confirm manual confirm flow surfaces errors appropriately
- [ ] Verify no UI changes required (document if none)
- [ ] Ensure A11y considerations remain intact

## Tests

- [ ] Unit / integration tests for confirm handler
- [ ] Update mocks/fixtures if needed
- [ ] Evaluate E2E coverage for manual confirm flow (manual QA)
- [ ] Accessibility checks (if UI impacted)

## Notes

- Assumptions:
- Deviations:

## Batched Questions (if any)

- None yet
