# Implementation Checklist

## Setup

- [x] Update manual selection helpers/validators
- [x] Extend staff manual API payload/response schemas
- [x] Add manual context endpoint for floor plan bootstrap

## Core

- [x] Implement hold flow (release/replace + metadata echo)
- [x] Implement live validation & summary shaping
- [x] Implement confirm flow using RPC v2 + cleanup
- [x] Wire realtime/polling refresh for holds + allocations

## UI/UX

- [x] Create `TableFloorPlan` component with accessible selection
- [x] Integrate floor plan & badges into `BookingDetailsDialog`
- [x] Add selection meter + action buttons (Hold/Validate/Assign/Clear)
- [x] Surface hold ownership + countdown and conflict toasts

## Tests

- [ ] Unit tests for manual selection + response mappers
- [x] API route tests (hold/validate/confirm/context)
- [ ] Property + concurrency tests for overlap prevention
- [ ] Playwright manual assign scenarios
- [ ] Axe/accessibility regression for booking dialog

## Docs & Alerts

- [ ] Document new alert thresholds in `docs/ops/alerts.md`
- [ ] Author allocator runbook `docs/runbooks/allocator.md`
- [ ] Update task verification.md with QA evidence

## Notes

- Assumptions: Reuse `table_inventory.position` for floor plan layout; Supabase realtime available in target env.
- Deviations: n/a

## Batched Questions (if any)

- None yet
