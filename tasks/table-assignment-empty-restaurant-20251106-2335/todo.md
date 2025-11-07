# Implementation Checklist

## Setup

- [x] Capture failure context using `scripts/debug-selector.ts` / `scripts/manual-confirm.ts`.
- [x] Document root cause + plan in task folder.

## Core

- [x] Update `quoteTablesForBooking` to compute `policyVersion` once per quote.
- [x] Build adjacency snapshot + zone list for each winning plan using the already-loaded adjacency map.
- [x] Persist policy hash + snapshot inside hold metadata passed to `createTableHold`.
- [x] Create Supabase migration to alias `confirm_hold_assignment_with_transition` column references (temp table + return query) and re-grant permissions.

## Tests

- [x] `pnpm lint`.
- [x] Manual confirm harness (scripts/tmp/manual-confirm.ts) on booking `68dc2c89-c0e6-4d0d-89b4-2aa8318d2610`.
- [x] Background auto-assign replay (`scripts/tmp/run-auto-assign.ts`) on seeded pending booking `e6343aab-380f-409d-9c62-61e353b0441e`.

## Notes

- Assumptions:
  - Existing holds expire quickly, so no data backfill required.
- Deviations:
  - Manual confirmation / auto-assign end-to-end tests remain pending until the new Supabase function body is deployed.
