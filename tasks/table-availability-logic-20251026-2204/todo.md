# Implementation Checklist

## Setup

- [x] Capture Supabase + UI root cause in `research.md`
- [x] Create forward-only Supabase migration redefining `refresh_table_status`

## Core

- [x] Ensure allocations triggers invoke the refreshed function (`refresh_table_status`)
- [ ] Coordinate remote rollout plan (staging → production) once migration is merged

## UI/UX

- [ ] Chrome DevTools MCP run: confirm tables flip back to `available` outside allocation window (blocked pending staging creds)

## Tests

- [ ] `pnpm test:ops` _(blocked: existing failures in `manualAssignmentContext` expectation and env validation)_
- [ ] Document remote SQL verification plan (psql sanity query)

## Notes

- Assumptions:
  - Supabase migrations remain forward-only; remote execution handled separately.
  - Existing ops dashboards rely solely on `table_inventory.status`.
- Deviations:
  - No local Supabase instance available; verification will rely on remote QA once credentials provided.

## Batched Questions (if any)

- None right now.
