# Research: Manual Hold Multi-Seat Selection

## Existing Patterns & Reuse

- `src/components/features/dashboard/BookingDetailsDialog.tsx` drives the manual assignment UX. It auto-triggers a hold by mutating `bookingService.manualHoldSelection` 250 ms after every table toggle.
- `bookingService.manualHoldSelection` (`src/services/ops/bookings.ts:541-575`) is a thin wrapper over `fetchJson`; any non-2xx response throws an `HttpError`.
- The API handler `src/app/api/staff/manual/hold/route.ts` calls `createManualHold` and returns **409 + VALIDATION_FAILED** whenever the computed validation has `ok === false`. The response body currently exposes `validation` and `summary`, but no `details` payload for the error helper to surface.
- Manual validation without creating a hold is already supported via `src/app/api/staff/manual/validate/route.ts`, which always returns 200 with the validation summary/checks. The dialog already has a “Validate” button wired to this endpoint.

## External Resources

- Internal spec in `appendix.md` (manual assignment section) reiterates that staff should be able to combine multiple tables; conflicts should be surfaced inline rather than blocking the flow.
- `lib/http/errors.ts` documents how `normalizeError` exposes `code` and `details` on `HttpError`.

## Constraints & Risks

- We must keep existing hold semantics: a hold should only be created when validation passes; when it fails we still need to show check details so staff know why.
- UI must avoid regressions for genuine conflicts (e.g. overlapping holds). We can’t swallow those errors silently.
- Any API shape change needs to preserve backwards compatibility for other potential consumers (currently only the booking dialog uses it, but safer to keep existing fields).
- React Query’s mutation still treats handled 409s as failures, so we should reset or otherwise ensure the UI doesn’t look “stuck” in an error state.

## Open Questions (and answers if resolved)

- Q: Can we reuse the validation result returned by the 409 response instead of issuing a second `/validate` request?
  A: Yes—if the handler includes the payload inside `details`, `HttpError.details` will surface it and we can feed it straight into state.
- Q: Do we need auto-hold attempts when validation fails?
  A: No; showing the validation checks inline is enough. We’ll keep the selection state so staff can add more tables until validation passes, at which point the next hold attempt will succeed.

## Recommended Direction (with rationale)

- Adjust the hold API’s 409 response to include a `details` object that carries `validation` (and optionally `summary`). This lets the existing error helper surface structured data.
- Update the booking dialog’s hold mutation error handler: detect `HttpError` with `status === 409` and `code === "VALIDATION_FAILED"`, set the returned validation result in state, clear `lastHoldKey`, and skip the destructive toast. Other errors still bubble to the toast.
- Optionally log or trace handled validation failures to aid debugging without confusing staff in the UI.
