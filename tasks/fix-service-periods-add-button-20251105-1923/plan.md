# Implementation Plan: Add Multiple Service Periods

## Objective

Enable ops users to add multiple service periods per restaurant from /ops/restaurant-settings.

## Success Criteria

- [ ] Add button visible when list has ≥ 1 rows
- [ ] Existing validation and save flow unaffected

## Architecture & Components

- `ServicePeriodsSection`: add a footer action button calling `addPeriod` when not disabled.

## Data Flow & API Contracts

No changes. Continue using `PUT /api/owner/restaurants/[id]/service-periods` with array payload.

## UI/UX States

- Empty: keep current empty-state Add button.
- Non-empty: show Add button in footer alongside Reset/Save.

## Edge Cases

- Occasion catalog empty: Add disabled until loaded (preserves current guard).
- Overlap/time validation: unchanged; still enforced client and server-side.

## Testing Strategy

- Unit/manual: verify button presence and adding additional rows.
- E2E (smoke): section renders (existing test). Optional follow-up to extend.
- Accessibility: Button focusable, labeled, keyboard-activatable.

## Rollout

- No flags required; low-risk UI enhancement.
