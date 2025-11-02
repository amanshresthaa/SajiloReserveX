# Research: Fix manualConfirmHold contextVersion typing

## Requirements

- Functional: Restore successful TypeScript build by resolving the missing `contextVersion` property error when calling `bookingService.manualConfirmHold` from `BookingDetailsDialog`.
- Non-functional: Keep API contracts consistent and avoid breaking existing callers.

## Existing Patterns & Reuse

- `ConfirmHoldInput` type in `src/services/ops/bookings.ts` requires `contextVersion`.
- Other related methods (`confirmHoldAssignment`, `manualValidateSelection`, `manualHoldSelection`) accept `contextVersion` but defensively fetch it when not provided.
- `fetchContextVersion(bookingId)` helper already exists in the same module for this purpose.

## External Resources

- Internal service patterns in `src/services/ops/bookings.ts` for consistency.

## Constraints & Risks

- API endpoints for manual assignment should receive `contextVersion` to prevent stale context writes.
- Changing the type must not cause regressions in other call sites.

## Open Questions (owner, due)

- Q: Does backend strictly require `contextVersion` for manual confirm?
  A: Assumed yes based on adjacent APIs; we include it and fetch when missing to be safe.

## Recommended Direction (with rationale)

- Make `contextVersion` optional in `ConfirmHoldInput` and update `manualConfirmHold` to fetch it when missing, mirroring other methods. This aligns contracts and unblocks the build without forcing UI to plumb extra props.
