# Implementation Checklist

## Setup

- [x] Create task folder + research/plan stubs.

## Core

- [x] Enumerate exact file list for Plan/Details/Review/Confirmation frontend (components, types, hooks) and bake into generation command.
- [x] Generate `context/wizard-steps-consolidated.json` via Node script using deterministic ordering.
- [x] Update `context/README.md` with regeneration instructions referencing the new artifact.

## UI/UX

- [ ] N/A – documentation artifact only.

## Tests

- [x] Validate JSON structure via `jq 'keys' context/wizard-steps-consolidated.json`.
- [x] Spot-check a couple entries to ensure contents look correct.

## Notes

- Assumptions:
  - Limiting scope to production source files; stories/tests excluded unless requested.
- Deviations:
  - None.

## Batched Questions (if any)

- None.
