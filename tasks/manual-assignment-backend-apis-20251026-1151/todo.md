# Implementation Checklist

## Setup

- [x] Confirm env feature flag cleanup scope (remove `FEATURE_ASSIGN_ATOMIC*` usage, no new env vars needed)
- [x] Draft legacy RPC cleanup migration name + numbering (coordinate with Supabase scripts)

## Core

- [x] Implement manual selection service (rule evaluation, summary shaping) under `server/capacity`
- [x] Extend `server/capacity/holds.ts` with hold lookup/release helpers for replacements
- [x] Build `/api/staff/manual/validate` route leveraging new service + structured responses
- [x] Build `/api/staff/manual/hold` route (reuse validation, TTL handling, hold persistence, telemetry)
- [x] Build `/api/staff/manual/confirm` route (RPC v2 confirm + error mapping)
- [x] Remove legacy `assign_table_to_booking` fallback + feature flag helpers from allocator
- [x] Add Supabase migration to drop legacy assign RPC + adjust grants/types if required
- [x] Update env schema + feature flag exports to match removal

## UI/UX

- [x] Backend only — ensure responses include `message`/`code` strings the UI can surface

## Tests

- [x] Add unit tests for manual selection rules & hold replacement logic
- [x] Add integration-style tests for new manual API handlers (auth, error envelopes)
- [x] Add concurrency tests (parallel confirm/hold) ensuring conflicts surface as structured errors
- [x] Update existing allocator tests (assignTablesAtomic/unassign) to reflect v2-only path
- [x] Accessibility not applicable (document in verification)

## Notes

- Assumptions: adjacency graph data is symmetric or we’ll build undirected edges from both columns.
- Deviations: TBD.

## Batched Questions (if any)

- ...
