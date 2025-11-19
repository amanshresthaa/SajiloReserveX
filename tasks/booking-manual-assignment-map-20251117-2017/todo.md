---
task: booking-manual-assignment-map
timestamp_utc: 2025-11-17T20:17:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Implementation Checklist

## Setup

- [x] Create root `manual-assignment-map.json` as the single source for booking manual assignment mapping.
- [x] Remove/replace `docs/manual-assignment-map.json` to avoid duplication.

## Core

- [x] Populate backend/API entries (validate/hold/confirm routes, engine/public API, manual-session).
- [x] Populate core logic + data access entries (`table-assignment/manual.ts`, `supabase` loaders, policy/adjacency helpers).
- [x] Populate frontend usage entries (booking service, hooks, BookingDetailsDialog UI flow).

## UI/UX

- [x] N/A (documentation-only); ensure descriptions are clear and concise.

## Tests

- [x] Validate JSON with `jq`.
- [x] Type check (`pnpm -s tsc --noEmit`).

## Notes

- Assumptions: Root-level JSON is acceptable as canonical; no other docs reference the old path.
- Deviations: Skipping feature flags/UI work because change is documentation-only.

## Batched Questions

- ...
