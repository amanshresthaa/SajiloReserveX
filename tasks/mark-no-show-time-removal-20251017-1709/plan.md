# Implementation Plan: Remove Effective Time From Mark No Show

## Objective

We will enable staff to mark a reservation as a no-show without specifying an effective time so that the workflow remains simple and aligned with policy.

## Success Criteria

- [ ] The mark-as-no-show flow no longer prompts for an effective time.
- [ ] Existing analytics or downstream processes continue to receive valid data when marking a no-show.

## Architecture & Components

- `BookingActionButton` (src/components/features/booking-state-machine/BookingActionButton.tsx): drop the `TimestampPicker` import, state, and JSX, keeping only the reason textarea in the dialog.
- Continue to leverage existing `ConfirmationDialog` pattern so behavior and keyboard focus management remain unchanged.

## Data Flow & API Contracts

Endpoint: POST `/ops/bookings/:id/no-show`
Request: Body stays optional; when absent the backend applies current timestamp. We will always send `{ reason?: string }` (omitting `performedAt`).
Response: Existing lifecycle payload (unchanged).
Errors: No contract change. Rely on existing error handling in `useOpsBookingStatusActions`.

## UI/UX States

- Loading: Confirmation dialog `pending` state already handled via props; untouched.
- Empty: Dialog now shows only the optional reason textarea.
- Error: Existing toast/error pathways continue to surface failures.
- Success: No additional UI; button closes via current flow.

## Edge Cases

- Offline queue: ensure we reset local reason text after confirm/cancel as before (timestamp state removal must not break cleanup).
- Keyboard shortcut `n` still opens dialog without requiring extra input.

## Testing Strategy

- Unit: N/A (component is UI heavy; rely on existing coverage).
- Integration: Smoke existing jest tests that cover booking lifecycle (update snapshots if needed).
- Accessibility: Manual DevTools MCP pass to confirm focus order & label remain valid.

## Rollout

- Feature flag: none (small UX adjustment).
- Exposure: full immediately after release.
- Monitoring: rely on existing lifecycle mutation error monitoring.
