# Implementation Checklist

## Setup

- [x] Confirm env validation passes (`pnpm validate:env`)

## Core

- [x] Resolve `editScheduleParity` on server page and pass as prop
- [x] Update `MyBookingsClient` signature to accept and forward the flag
- [x] Update `EditBookingDialog` props to use the passed flag instead of `env`

## UI/UX

- [ ] Manually open `/my-bookings` and the edit dialog to confirm no runtime errors

## Tests

- [x] (Optional) Re-run `pnpm validate:env` to ensure schema untouched

## Notes

- Assumptions: Flag remains server-only; exposing boolean to client is acceptable.
- Deviations: Redirect to `/signin` blocked full dialog QA; documented in verification.

## Batched Questions (if any)

- None
