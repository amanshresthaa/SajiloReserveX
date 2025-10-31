# Implementation Checklist

## Setup

- [x] Draft Supabase migration removing the adjacency symmetry trigger/function.

## Core

- [x] Update `loadAdjacency` to branch on `adjacency.queryUndirected`.
- [x] Strip symmetry trigger from `supabase/schema.sql` export and refresh docs.

## UI/UX

- [ ] N/A (no UI scope)

## Tests

- [x] Unit
- [ ] Integration
- [ ] E2E (critical flows)
- [ ] Axe/Accessibility checks

## Notes

- Assumptions: Integration/E2E coverage remains via existing suites; no UI changes required.
- Deviations: Directional data clean-up deferred to follow-up task (awaiting ops confirmation).

## Batched Questions (if any)

- None at this time.
