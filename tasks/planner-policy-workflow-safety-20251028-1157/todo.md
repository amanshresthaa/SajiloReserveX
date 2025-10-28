# Implementation Checklist

## Setup

- [x] Extend env schema / feature flags with adjacency threshold and planner limits

## Core

- [x] Resolve adjacency per party size across manual selection, quoting, auto-assign, and planner
- [x] Thread selector limit flags into planner invocations and diagnostics payload
- [x] Ensure manual hold swaps create new holds before releasing the prior hold

## UI/UX

- [ ] N/A (no UI surface changes)

## Tests

- [x] Unit
- [x] Integration (targeted capacity suites)
- [ ] E2E (critical flows)
- [ ] Axe/Accessibility checks

## Notes

- Assumptions: selector caps remain within safe clamps (≤500 plans/slack, ≤5000 evaluations)
- Deviations: E2E suites still blocked by upstream repo failures; manual verification limited to unit/integration coverage

## Batched Questions (if any)

-
