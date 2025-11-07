# Implementation Plan: Align Service Periods with Kitchen Schedule

## Objective

Provide an intuitive Service Periods editor where lunch/dinner availability strictly follows kitchen operating windows while drinks automatically span general opening hours.

## Success Criteria

- [ ] Service Periods UI displays per-day kitchen windows (lunch/dinner) plus non-editable drinks hours derived from operating hours.
- [ ] Validation prevents lunch/dinner times outside operating hours or inverted windows.
- [ ] Saving converts the structured state into the existing service-period payloads (one drinks row per open day, plus configured lunch/dinner rows) and persists successfully.
- [ ] Existing custom occasions remain possible via an “Advanced” editor (if needed) or via fallback.

## Architecture & Components

- `ServicePeriodsSection.tsx`
  - Replace list-based editor with per-day table(s).
  - Add hook calls to `useOpsOperatingHours` to fetch weekly open/close for reference.
  - Introduce helper utilities for mapping between API rows and UI structure, enforcing conversions both directions.
  - Provide optional advanced editor for non-core occasions if required (toggled view).
- `server/restaurants/servicePeriods.ts`
  - No change expected (server already enforces overlaps & names), but ensure new client logic respects constraints.
- New helper modules? (e.g., `servicePeriodsMapping.ts`) for parity + testing.

## Data Flow & API Contracts

1. Fetch service periods + operating hours + occasions.
2. Normalize into `DayConfig[]` with fields: `dayOfWeek`, `drinksOpen`, `drinksClose`, `lunch`, `dinner`, `custom[]`.
3. UI edits mutate DayConfig.
4. On save, flatten DayConfig into API payload, merging previously persisted IDs when names match.

## UI/UX States

- Loading skeleton while either service periods or operating hours are loading.
- Table per day showing:
  - Operating hours (read-only) + drinks hours (derived).
  - Editable fields for lunch/dinner windows with enable toggles.
- Validation errors inline per field.
- Advanced optional list for custom periods (if necessary).
- Action buttons: Add block (if advanced), reset, save.

## Edge Cases

- Restaurant closed on a day → disable lunch/dinner inputs and mark drinks as N/A.
- Operating hours open but no lunch/dinner configured → no corresponding service periods.
- Input spanning midnight (not supported yet) → validate and block.
- Occasions catalog missing lunch/dinner/drinks keys → display warning and skip auto-generation.

## Testing Strategy

- Unit tests for new mapper utility (e.g., `mapServicePeriodsToDayConfig`, `buildServicePeriodsPayload`).
- Vitest component-level tests (if feasible) to ensure validation prevents outside-of-hours entries.
- Manual QA focusing on Service Periods UI: enabling/disabling lunch/dinner, verifying drinks auto values, ensuring advanced editor still works.

## Rollout

- No feature flag initially; scope to Ops UI.
- Monitor API errors for `/service-periods` after deploy.
- Provide fallback instructions in task notes.
