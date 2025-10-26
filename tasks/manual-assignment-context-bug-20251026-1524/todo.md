# Implementation Checklist

## Setup

- [x] Review existing manual context fetching logic
- [x] Confirm supabase schema cache usage

## Core

- [ ] Fix service window lookup when start timestamp mismatches service schedule
- [x] Resolve table holds cache miss or ensure table populated
- [x] Update error handling to provide actionable feedback

## UI/UX

- [ ] Verify manual assignment UI renders context data
- [ ] Validate loading/empty/error states after backend fix
- [ ] Ensure a11y cues remain intact

## Tests

- [x] Unit adjustments for capacity/tables helpers
- [x] Integration test for context API route
- [ ] E2E manual run through manual assignment flow
- [ ] Axe/Accessibility checks (existing coverage)

## Notes

- Assumptions:
- Deviations:

## Batched Questions (if any)

- ...
