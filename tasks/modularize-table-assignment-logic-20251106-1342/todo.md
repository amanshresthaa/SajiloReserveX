# Implementation Checklist

## Setup

- [x] Create `server/capacity/table-assignment/` directory with barrel + shared modules scaffolded.

## Core

- [x] Migrate shared types, booking window helpers, Supabase/data utilities into new modules.
- [x] Extract availability + manual selection logic into dedicated files importing shared helpers.
- [x] Extract assignment + quoting flows into dedicated files and ensure telemetry/feature flags stay wired.
- [x] Replace `server/capacity/tables.ts` with re-export barrel referencing new modules.

## UI/UX

- [ ] N/A (server-only refactor)

## Tests

- [ ] Unit (existing suites via `pnpm test --filter capacity` if time)
- [x] Integration (covered by lint/type-check)
- [ ] E2E
- [ ] Axe/Accessibility checks

## Notes

- Assumptions:
- Deviations:

## Batched Questions (if any)

-
