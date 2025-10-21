# Implementation Checklist

## Setup

- [x] Confirm existing uses of `TimestampPicker` and required props.

## Core

- [x] Enhance `TimestampPicker` to accept error/help text for form integration.
- [x] Replace start/end `datetime-local` inputs in `components/dashboard/EditBookingDialog.tsx` with `TimestampPicker` instances.
- [x] Wire timezone/initial values to pickers and ensure ISO strings propagate to mutations.

## UI/UX

- [ ] Verify dialog renders the Shadcn calendar + time controls aligned with design tokens.
- [ ] Ensure keyboard navigation, focus, and validation messaging remain accessible.

## Tests

- [x] Run `pnpm run build`.

## Notes

- Assumptions: Restaurant timezone is obtainable from booking data or defaults.
- Deviations:
  - Booking DTOs lack explicit timezone; picker currently falls back to browser locale.

## Batched Questions (if any)

- None.
