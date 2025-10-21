# Implementation Checklist

## Setup

- [x] Confirm all references to `/api/ops/metrics/selector` and `observability_events`.
- [x] Decide whether to return stub data or delete the endpoint.

## Core

- [x] Update/remove API handler to stop Supabase queries.
- [x] Adjust client components to match the new contract.
- [x] Remove obsolete utilities/tests.

## UI/UX

- [x] Ensure Ops dashboards handle the absence of metrics gracefully.
- [x] Verify no loading/error spinners linger.
- [x] Maintain a11y semantics if UI skeleton changes.

## Tests

- [x] Update related unit/integration tests.
- [ ] Run `pnpm vitest run tests/server/capacity/selector.scoring.test.ts`.
- [ ] Run targeted app tests if available.
- [ ] Conduct manual sanity check in Ops UI.

## Notes

- Assumptions:
- Deviations:

## Batched Questions (if any)

- ...
