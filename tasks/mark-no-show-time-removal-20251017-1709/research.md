# Research: Remove Effective Time From Mark No Show

## Existing Patterns & Reuse

- `src/components/features/booking-state-machine/BookingActionButton.tsx` renders the “Mark as no show?” confirmation dialog and currently embeds a `TimestampPicker` plus optional reason field.
- `TimestampPicker` (`src/components/features/booking-state-machine/TimestampPicker.tsx`) is only referenced by `BookingActionButton`, so removing it from this flow will not impact other features.
- Lifecycle mutations funnel through `useOpsBookingStatusActions` and `ops/bookings` service layer, both already treat the `performedAt` attribute as optional and omit it from the payload when it is falsy.

## External Resources

- Internal service wrapper `src/services/ops/bookings.ts` — shows `performedAt` only gets sent when provided, implying the API defaults appropriately when omitted.

## Constraints & Risks

- Must ensure we continue passing a null/undefined `performedAt` so optimistic updates and offline queue state stay coherent.
- Removing the picker changes the dialog layout; need to keep spacing and focus order sane for accessibility.
- Verify no product requirement relies on backdating no-show events; current code suggests optional timestamp, but we should document the assumption.

## Open Questions (and answers if resolved)

- Q: Does the backend require `performedAt` for reporting accuracy?
  A: Service layer omits the field when falsy, indicating the backend already handles defaulting, so removal is safe.

## Recommended Direction (with rationale)

- Update `BookingActionButton` to drop the `TimestampPicker` UI and related state, always calling `onMarkNoShow` without a custom `performedAt`.
- Preserve the optional reason textarea to keep parity with existing workflows.
- Adjust styles/spacings as needed so the dialog remains balanced after removing the picker.
