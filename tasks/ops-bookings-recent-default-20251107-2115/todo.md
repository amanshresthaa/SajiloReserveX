# Implementation Checklist

## Core

- [x] Update `DEFAULT_FILTER` in `OpsBookingsClient` to `'recent'`.
- [x] Confirm no other files hardcode `'upcoming'` as the default for Ops bookings. _(searched repo for other `DEFAULT_FILTER` definitions + "filter \= 'upcoming'"; none tied to defaults)_

## Tests

- [x] Run `pnpm lint` (or faster equivalent) to ensure no lint/type errors.
- [ ] Attempt manual QA on `/ops/bookings` (document if blocked by auth).

## Notes

- None yet.
