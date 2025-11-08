# Implementation Plan: Guest Edit Warning Copy

## Objective

Ensure guests editing their booking via the dialog are warned that their existing table will be released and re-assignment is subject to availability.

## Success Criteria

- [ ] Warning copy appears whenever the edit dialog is open for a booking.
- [ ] Copy matches stakeholder wording and is accessible via Alert semantics.
- [ ] No regressions to existing edit flow (form submission unaffected).

## Architecture & Components

- `components/dashboard/EditBookingDialog.tsx`: inject a `warning` alert after the header so it is read early by screen readers.
  State: no new state required; static copy tied to dialog render.

## Data Flow & API Contracts

- No backend changes; existing mutation flow untouched.

## UI/UX States

- Loading/error behaviors unchanged.
- Warning alert should always show when dialog visible, independent of validation state.

## Edge Cases

- Dialog opened without booking (should not render; current guard remains).
- Ensure alert does not conflict with destructive alerts (stacked vertically with gap).

## Testing Strategy

- Manual: open reservation edit dialog (customer dashboard) and verify warning text, focus order, and persistence during edits.
- Automated: not required for static copy.

## Rollout

- No flag; immediate change.
- Monitor support feedback for confusion reduction.
