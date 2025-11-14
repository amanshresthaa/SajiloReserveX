---
task: capacity-pitfalls
timestamp_utc: 2025-11-13T20:15:00Z
owner: github:@codex-ai
reviewers:
  - github:@maintainers
risk: high
flags: []
related_tickets: []
---

# Implementation Checklist

## Setup

- [ ] Create Supabase migration covering constraint/index + confirmation table + RPC update.
- [ ] Wire new adjacency mode flag in env schema + feature flags.

## Core

- [ ] Update server feature-flag helpers + selectors/manual flows to respect adjacency mode.
- [ ] Extend confirmHoldAssignment path with cached-result lookup + Supabase queries.
- [ ] Update Supabase types for new table.

## UI/UX

- [ ] Ensure manual confirm API surfaces cached response identically to live run (no extra states).

## Tests

- [ ] Add/adjust Vitest coverage for adjacency mode + confirm idempotency.
- [ ] Run targeted capacity test suite (`pnpm test --filter capacity`).

## Notes

- Assumptions: adjacency mode is global flag for now; per-venue overrides deferred.
- Deviations: not addressing DST/time-window or small-party-on-big-table budgets in this pass (documented for follow-up).
