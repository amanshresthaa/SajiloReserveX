# Implementation Checklist

## Setup

- [x] Create planner utilities (`server/capacity/planner/bitset.ts`) shared by tables/holds logic
- [x] Define shared type exports for tables/holds domain models

## Core

- [x] Implement Supabase hold service (`server/capacity/holds.ts`) with create/list/conflict/confirm/release/sweep helpers
- [x] Implement table service (`server/capacity/tables.ts`) including window computation, filtering, quoting, manual flows, and RPC wrappers
- [x] Ensure index exports remain correct and new modules wired up

## UI/UX

- [x] Verify `getManualAssignmentContext` returns data shape expected by Ops dashboard hooks (no UI code changes, but ensure payload completeness)

## Tests

- [x] Run targeted Vitest suites for capacity + ops manual routes
- [x] Address any failing assertions / adjust logic accordingly

## Notes

- Assumptions: Existing Supabase migrations for holds/RPC are authoritative; no new DB schema required.
- Deviations: Hold telemetry uses Supabase fetch for zone id pre-confirm; env sanitizer treats `/` as unset to keep tests happy.

## Batched Questions (if any)

- None.
