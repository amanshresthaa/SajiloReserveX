# Implementation Plan: Reservation Timeout Handling

## Objective

Allow reservation submissions to complete even during longer server processing and replace the cryptic "signal is aborted without reason" error with actionable messaging.

## Success Criteria

- [ ] Booking wizard no longer surfaces "signal is aborted without reason" when the server takes longer than the current timeout.
- [ ] Timeout-induced failures display a clear, user-friendly message.
- [ ] User-initiated cancellations do not trigger error toasts or analytics failure events.

## Architecture & Components

- `reserve/shared/api/client.ts`: extend request helper to combine abort signals, support per-request timeout overrides, and normalize timeout/cancel errors.
- `reserve/features/reservations/wizard/api/useCreateReservation.ts`: opt into extended timeout for submissions and suppress analytics for cancellation errors.
- `reserve/features/reservations/wizard/hooks/useReservationWizard.ts`: skip error handling when cancellation errors bubble up.

## Data Flow & API Contracts

- Booking submissions still POST to `/api/bookings`. The client must wait up to the extended timeout before treating the request as failed.
- When timeouts occur, the request should reject with an `ApiError` `{ code: 'TIMEOUT', message: 'Request timed out. Please try again.' }`.

## UI/UX States

- Wizard continues to show loading until completion or timeout; on timeout, display friendly message; on cancellation, silently reset loading state.

## Edge Cases

- Upstream `AbortSignal` already aborted before request begins.
- Browsers without `AbortSignal.prototype.reason` should still map to friendly message.
- Ensure no regression for other API calls consuming the client.

## Testing Strategy

- Unit coverage not required; rely on existing tests plus manual verification by simulating aborted/cancelled requests.
- Run `pnpm lint`.
- Manual QA: trigger booking submissions under longer latency to confirm friendly messaging (document in `verification.md`).

## Rollout

- No feature flag.
- Monitor analytics `wizard_submit_failed` volume for reductions in cancellation noise.
