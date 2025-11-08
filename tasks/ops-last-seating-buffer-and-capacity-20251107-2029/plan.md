# Implementation Plan: Ops last seating buffer min + remove capacity field

## Objective

Allow ops users to set the last seating buffer to any value ≥ 15 minutes (no linkage to default duration) and remove the capacity input from the shared restaurant settings form/dialog.

## Success Criteria

- [ ] Form validation + helper text allow buffer values 15–300 with no dependency on default duration.
- [ ] Default/fallback buffer value in the settings UI uses 15 minutes.
- [ ] Capacity input is no longer rendered or submitted by `RestaurantDetailsForm`, `RestaurantProfileSection`, or `EditRestaurantDialog`.
- [ ] eslint passes after changes.

## Architecture & Components

- `components/ops/restaurants/RestaurantDetailsForm.tsx`
  - Update types, state mapping, sanitizer, validation, helper text, and JSX to drop capacity and relax buffer rule.
- `components/features/restaurant-settings/RestaurantProfileSection.tsx`
  - Remove capacity from `EMPTY_VALUES`, from `initialValues`, and from the mutation payload; update default buffer fallback to 15.
- `components/ops/restaurants/EditRestaurantDialog.tsx`
  - Align with new form prop shape by omitting capacity.

## Data Flow & API Contracts

- API still accepts capacity values, but this flow will stop sending them.
- Last seating buffer validation remains 15–300 on the server; only client logic changes.

## UI/UX States

- Capacity field disappears from the form grid.
- Buffer helper text states “must be between 15 and 300 minutes” (or similar) without referencing reservation duration.

## Edge Cases

- Ensure submitting unchanged data still works when capacity is omitted (server should ignore absent field).
- Validate that the buffer field handles blank/invalid inputs gracefully per new rule.

## Testing Strategy

- `pnpm lint`.
- Manual UI verification deferred (server-only change) but note in verification doc.

## Rollout

- No feature flag; release via standard deployment.
