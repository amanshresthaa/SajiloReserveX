# Implementation Plan: Edit Start Field Sync

## Objective

Ensure selecting a time in the edit booking dialog synchronizes with `react-hook-form`, clearing validation errors when the user chooses a valid slot.

## Success Criteria

- [ ] Selecting a new time removes the “Select a start time” error if the value is valid.
- [ ] The form’s `start` field stores a full ISO timestamp after any valid selection.

## Architecture & Components

- `EditBookingDialog.tsx`: introduce a dedicated handler that calls `setValue('start', iso, { shouldDirty: true, shouldTouch: true, shouldValidate: true })` (and possibly `clearErrors`) before delegating to `field.onChange`. Reuse this handler for picker `onChange`.
- Optionally log or assert the received value during development; final code should avoid stray console statements.

## Data Flow & API Contracts

- No backend/API changes. Frontend ensures the ISO flows from picker → RHF → derived end-time computation without stale errors.

## UI/UX States

- Error banner disappears immediately after a valid time selection.
- Date/time display continues to reflect current selection; disabling remains accurate.

## Edge Cases

- Date change still clears time and marks the field invalid (existing behaviour).
- Rapid reselection of times should not create flicker or residual errors.

## Testing Strategy

- Strengthen unit tests: simulate a form with the picker to confirm errors clear when `setValue` uses `shouldValidate`.
- Run `npm run typecheck` and relevant vitest suites.
- Manual QA via MCP once authenticated access is available.

## Rollout

- No feature flag. Document verification results in task folder; await manual confirmation when credentials provided.
