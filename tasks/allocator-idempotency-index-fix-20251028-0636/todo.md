# Implementation Checklist

## Setup

- [x] Confirm existing constraints and their purpose
- [x] Draft migration strategy

## Core

- [x] Implement migration to drop/alter offending index
- [x] Update server logic (if needed) to maintain idempotency semantics _(no code changes required)_

## UI/UX

- [ ] N/A

## Tests

- [x] Unit _(targeted vitest suites: manualConfirm, assignTablesAtomic, autoAssignTables)_
- [x] Integration _(covered within targeted suites)_
- [ ] E2E (critical flows)
- [ ] Axe/Accessibility checks

## Notes

- Assumptions:
- Deviations:
  - Skipped E2E/accessibility (no UI surface impacted).

## Batched Questions (if any)

- ...
