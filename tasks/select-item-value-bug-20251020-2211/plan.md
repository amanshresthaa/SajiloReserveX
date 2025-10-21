# Implementation Plan: Select Item Missing Value

## Objective

Prevent the table inventory interface from crashing when no zones exist by ensuring the Zone select never renders empty-value options and instead communicates the empty state while keeping the required-zone contract intact.

## Success Criteria

- [ ] `/ops/tables` loads without runtime errors even when `summary.zones` is empty.
- [ ] Users see clear guidance to configure zones before adding tables, and the select remains usable once zones exist.

## Architecture & Components

- `src/components/features/tables/TableInventoryClient.tsx`: adjust zone select default value, disabled state, and empty rendering.
- `components/ui/select` remains unchanged; we simply use it correctly.

## Data Flow & API Contracts

- Form submission continues to post `{ zoneId: string }` when a real option is picked.
- When no zones are present the select is disabled and no `zoneId` is sent (server already rejects missing zone).

## UI/UX States

- Normal: Select lists all available zones with the existing placeholder.
- Empty: Select is disabled with helper copy ("Add a zone to assign tables") and dropdown body shows non-interactive notice.
- Error: Existing form validation still warns about missing zone once options exist.

## Edge Cases

- Editing a table whose stored `zoneId` is absent from `zoneOptions` should fall back to placeholder without crashing.
- Live updates (e.g., zones fetched later) should re-enable the select automatically because we derive state from `zoneOptions`.

## Testing Strategy

- Manual QA on `/ops/tables`: load with zero zones, verify no console error, message displayed, select disabled; load with zones to confirm normal behavior.
- Regression: quick smoke of table creation with real zone to confirm value submission unaffected.

## Rollout

- Feature flag: none.
- Exposure: immediate once merged.
- Monitoring: keep an eye on Sentry/console logs for `Select.Item` value assertions.
