# Implementation Checklist

## Setup

- [x] Inspect `src/app/api/bookings/[id]/route.ts` around unified validation block.

## Core

- [x] Correct TypeScript syntax for `Tables<"bookings">` and conditional assignment.
- [x] Ensure imports for validation helpers exist.

## UI/UX

- [x] Not applicable.

## Tests

- [x] Run `pnpm run build`.

## Notes

- Assumptions: The unified validation helpers already exist in the codebase.
- Deviations: Added error-code mapping in `server/booking/serviceFactory.ts` to align capacity results with booking types.

## Batched Questions (if any)

- None.
