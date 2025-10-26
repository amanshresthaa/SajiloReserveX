# Implementation Checklist

## Setup

- [x] Create task docs; review existing picker→form data flow.

## Core

- [ ] Add `handleStartChange` in `EditBookingDialog` that wraps `setValue` with `shouldValidate` before delegating to RHF field.
- [ ] Ensure selecting a time clears errors by invoking `clearErrors` or `trigger` as needed.
- [ ] Confirm existing date-change reset behaviour still works.

## UI/UX

- [ ] Manual QA (pending auth) to verify error clears immediately after selecting a valid time.

## Tests

- [x] Extend tests to assert `setValue` emits ISO and errors clear (e.g., integration or enhanced unit test).
- [x] Run `npm run typecheck` and targeted vitest suite.

## Notes

- Assumptions: Picker continues emitting ISO strings; RHF revalidation triggered via `setValue`.
- Deviations: Manual QA blocked until credentials supplied; relying on automated assertions meanwhile.

## Batched Questions (if any)

- TBD
