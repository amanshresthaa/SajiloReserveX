# Implementation Checklist

## Setup

- [x] Create task artifacts

## Core

- [x] Query Next.js MCP runtime for active errors on `/ops`
- [x] Trace `loadAdjacency` and `evaluateAdjacency` logic
- [x] Confirm selection-order sensitivity caused by directed edges
- [x] Implement undirected adjacency handling in validation
- [x] Update Supabase `assign_tables_atomic_v2` to honor undirected adjacency
- [x] Make `assign_tables_atomic_v2` idempotent when duplicate assignment rows already exist

## UI/UX

- [ ] N/A

## Tests

- [x] Add targeted regression test validating selection-order symmetry

## Notes

- Assumptions: Supabase stores each adjacency pair once (`table_a -> table_b`).
- Deviations: None.

## Batched Questions (if any)

- Should the Supabase data be mirrored in both directions or should the service enforce symmetry programmatically?
