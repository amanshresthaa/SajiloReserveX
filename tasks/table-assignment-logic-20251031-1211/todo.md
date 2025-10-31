# Implementation Checklist

## Setup

- [x] Enumerate all table assignment related source files and migrations (TypeScript + SQL + config).

## Core

- [x] Write/execute script to regenerate `table_assignment_consolidated.json` with curated file list.
- [x] Verify JSON validity (`jq`) and spot-check key entries.

## UI/UX

- [ ] N/A

## Tests

- [ ] Unit (N/A – data packaging only)
- [ ] Integration (N/A)
- [ ] E2E (N/A)
- [ ] Axe/Accessibility checks (N/A)

## Notes

- Assumptions: Including `config/demand-profiles.json` as part of logic snapshot.
- Deviations:

## Batched Questions (if any)

-
