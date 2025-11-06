# Research: Reservation Timeout Handling

## Requirements

- Functional: Prevent reservation wizard from failing with "signal is aborted without reason" when bookings take longer than the current frontend timeout.
- Non-functional: Maintain existing API client usage patterns and keep user messaging clear when actual timeouts occur.

## Existing Patterns & Reuse

- `reserve/shared/api/client.ts` enforces a hard timeout via an `AbortController` but does not merge with caller signals or surface friendly errors.
- Booking submission uses `useCreateReservation` which relies on this client and surfaces errors through `mapErrorToMessage`.

## External Resources

- [MDN AbortController docs](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) – clarify `abort(reason)` semantics and error propagation.

## Constraints & Risks

- Requests may legitimately take >5 seconds under load; aborting prematurely can create bookings on the server while the UI reports failure.
- Need to avoid breaking other consumers of `apiClient`, including offline mutation persistence.
- Must not leak timeout handles or event listeners when combining signals.

## Open Questions (owner, due)

- Q: Should we implement post-timeout reconciliation (e.g., polling by idempotency key)?
  A: Future enhancement; out of scope for this fix (owner: product/ops, backlog).

## Recommended Direction (with rationale)

- Merge caller-provided signals with the timeout controller so both can cancel a request safely.
- Provide structured `ApiError` objects for timeout/cancellation, giving user-friendly messages instead of raw DOMException text.
- Extend booking submission to allow longer timeouts while ignoring explicit user cancellations.
