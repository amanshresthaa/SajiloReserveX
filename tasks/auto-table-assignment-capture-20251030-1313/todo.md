# Implementation Checklist

## Setup

- [x] Add telemetry helper/type for selector decision capture

## Core

- [x] Wire capture flag through `autoAssignTablesForDate`/`autoAssignTables`
- [x] Extend Ops API + client service to accept `captureDecisions`
- [x] Include captured decisions in response when requested

## UI/UX

- [ ] (n/a) — document manual usage

## Tests

- [x] Unit (auto assign capture behaviour)
- [ ] Integration (manual curl documented)
- [ ] E2E
- [ ] Axe/Accessibility checks

## Notes

- Assumptions:
- Deviations:

## Batched Questions (if any)

- ...
