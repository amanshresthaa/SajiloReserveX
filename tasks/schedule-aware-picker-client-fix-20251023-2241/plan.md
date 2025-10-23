# Implementation Plan: Schedule-Aware Timestamp Picker Client Directive Fix

## Objective

We will enable the booking scheduler UI to build successfully by aligning component directives.

## Success Criteria

- [x] `pnpm run build` completes without directive-related errors
- [ ] Schedule-aware timestamp picker behaves correctly in client contexts

## Architecture & Components

- `ScheduleAwareTimestampPicker`: ensure client directive placement
  State: client components only | Routing/URL state: unchanged

## Data Flow & API Contracts

No API changes expected.

## UI/UX States

No UI state changes expected; ensure existing states still function.

## Edge Cases

- Verify component remains server-safe if exported where not needed

## Testing Strategy

- Unit: existing coverage
- Integration: manual smoke via OPS UI if feasible
- E2E: not in scope
- Accessibility: confirm no regression from directive change

## Rollout

- Feature flag: not required
- Exposure: standard release
- Monitoring: rely on existing booking telemetry
