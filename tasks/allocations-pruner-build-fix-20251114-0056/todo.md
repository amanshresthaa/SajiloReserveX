---
task: allocations-pruner-build-fix
timestamp_utc: 2025-11-14T00:56:00Z
owner: github:@assistant
reviewers: [github:@maintainers]
risk: low
flags: []
related_tickets: []
---

# Implementation Checklist

## Setup

- [x] Confirm `prune_allocations_history` exists in `supabase/schema.sql` or migrations for reference.

## Core

- [x] Extend `types/supabase.ts` (`public.Functions`) with the missing RPC signature.
- [x] Ensure the RPC union type (used by `client.rpc`) includes `"prune_allocations_history"`.
- [x] Normalize archived/deleted result parsing in `server/jobs/allocations-pruner.ts` so it prefers the typed `_count` fields but still tolerates legacy keys without type errors.

## Tests

- [x] `pnpm run build`.

## Notes

- Assumptions:
  - RPC already lives in the database; only generated types lagged behind.
- Deviations:
  - Manual edit of generated file noted so future regeneration preserves the RPC entry.
  - Added `"notice"` to `ObservabilitySeverity` since multiple jobs already emit that level.

## Batched Questions

- None currently.
