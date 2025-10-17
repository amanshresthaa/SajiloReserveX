# Implementation Checklist

## Discovery

- [x] Locate reservation capacity + table-assignment modules.
- [x] Map Supabase RPC + schema interactions.
- [x] Inventory seed + config review against business rules.

## Static Analysis

- [x] Examine merge handling + combination heuristics.
- [x] Inspect booking window math for turn-time/buffer gaps.
- [x] Review overlap/concurrency protections (TypeScript + SQL).
- [x] Audit timezone handling in service-period + assignment paths.

## Reporting

- [x] Align findings to scenario suite with repro notes.
- [x] Compile Executive Summary, Findings table, Gaps checklist, Test plan, Quick wins.

## Notes

- Assumptions: Service timezone == database timezone unless otherwise specified.
- Deviations: Auto-assign currently mocked in tests; no integration tests hitting DB concurrency paths observed.
