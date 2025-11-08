# Implementation Checklist

## Setup

- [x] Inspect lint output and relevant types in `server/ops/table-timeline.ts`.

## Core

- [x] Remove or use unused imports/aliases (e.g., `AvailabilityMap`).
- [x] Replace `any` annotations with accurate types or generics.

## Tests

- [x] Run ESLint.
- [ ] Run targeted unit tests if applicable.

## Notes

- Assumptions: Existing types within the file are sufficient to express the current `any` shapes.
- Deviations: None yet.
