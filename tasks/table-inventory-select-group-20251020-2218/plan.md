# Implementation Plan: Fix Table Inventory Select Usage

## Objective

We will enable operators to load the Tables page without runtime errors so that table inventory management works reliably.

## Success Criteria

- [ ] The Tables page renders without runtime errors related to `SelectLabel` usage.
- [ ] Select dropdowns function as expected in the table inventory UI.

## Architecture & Components

- `src/components/features/tables/TableInventoryClient.tsx`: adjust the zone select field to import `SelectGroup` and wrap the `SelectLabel` usage so it is rendered within the required Radix context.
- No other components or utilities need modification; reuse existing select primitives.

## Data Flow & API Contracts

Endpoint: N/A (UI-only change)
Request: N/A
Response: N/A
Errors: N/A

## UI/UX States

- Loading: unchanged; relies on existing suspense states.
- Empty: when no zones exist, select remains disabled and helper text explains the action.
- Error: existing toast/error handling untouched.
- Success: dropdown renders list of zone options without runtime errors.

## Edge Cases

- Guard the zero-zone case so it no longer throws at runtime and ensure the user still sees guidance via helper text.

## Testing Strategy

- Unit: not applicable; no logic change suitable for unit coverage.
- Integration: rely on existing table inventory flows; smoke manual test ensures no regression.
- E2E: not required for this hotfix.
- Accessibility: confirm select remains focusable when enabled and helper text remains readable.

## Rollout

- Feature flag: none — immediate fix.
- Exposure: deploy with standard release.
- Monitoring: rely on runtime error logging for regressions.
