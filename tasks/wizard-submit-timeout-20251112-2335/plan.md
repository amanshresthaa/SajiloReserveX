---
task: wizard-submit-timeout
timestamp_utc: 2025-11-12T23:35:00Z
owner: github:@assistant
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Implementation Plan: Wizard timeout resilience

## Objective

When `POST /api/bookings` takes longer than the client timeout, keep the wizard in a pending state, attempt to recover the booking via the guest lookup endpoint, and only surface an error if recovery fails. Preserve idempotency for retries and keep analytics consistent.

## Success Criteria

- [ ] TIMEOUT errors trigger a recovery flow that polls `GET /api/bookings?email&phone&restaurantId` up to a small cap and hydration succeeds when the booking exists.
- [ ] If a booking is recovered, the wizard proceeds exactly as if the POST returned normally (booking list + analytics event + redirect countdown).
- [ ] If recovery fails, the wizard shows a targeted error/alert telling guests to check their inbox before retrying, and the mutation can be reattempted safely without duplicate bookings.
- [ ] Vitest coverage for the recovery matcher logic and idempotency handling.

## Architecture & Components

- **Wizard timeout recovery helper:** New module under `reserve/features/reservations/wizard/lib/timeoutRecovery.ts` encapsulating polling/matching logic so it can be unit tested.
- **Lookup API wrapper:** Small client in `reserve/features/reservations/wizard/api/fetchBookingsByContact.ts` using `apiClient.get` and `reservationListAdapter`.
- **useCreateReservation:** Adjust idempotency key lifecycle so TIMEOUT errors retain the existing key while other outcomes clear it.
- **useReservationWizard:** Wire TIMEOUT detection, trigger the recovery helper, update analytics/emit flows, manage plan alerts/error states, and convert recovered reservations via `reservationToApiBooking`.
- **Copy updates:** Add clear user-facing copy for pending and unrecovered states.

## Data Flow & Matching

1. Wizard submits draft → `useCreateReservation` stores generated idempotency key.
2. If `apiClient` throws `code: 'TIMEOUT'`, `useReservationWizard` keeps step 4 pending, logs event, and calls recovery helper with draft contact info.
3. Recovery helper fetches guest bookings, filters for `restaurantId`, `bookingDate`, normalized `startTime`, `partySize`, and normalized `email/phone`, optionally ensuring recent `createdAt`.
4. On match, wizard reuses converted bookings to call `actions.applyConfirmation`; on miss, wizard resets to previous step with targeted alert.

## Edge Cases

- Guests without phone/email (should not occur in customer mode) → skip recovery and show existing error.
- Lookup returns multiple matches (e.g., guest has another booking same day). Matching logic must pick the exact time slot to avoid false positives.
- Recovery attempts hitting rate limits → stop early and show fallback error.

## Testing Strategy

- Unit tests for `recoverBookingAfterTimeout`/`findMatchingReservation` to validate matching criteria and retry cadence.
- Extend existing wizard tests (or add new ones) to ensure TIMEOUT triggers recovery path (mock fetcher) and that unrecovered TIMEOUT surfaces the new error message.
- Manual sanity via `pnpm test reserve` subset covering new specs.

## Rollout

- Pure frontend change; no feature flag toggle required.
- Manual QA notes: simulate TIMEOUT by mocking `apiClient.post` rejection and verify recovery/resilience messages; verify analytics events fire (through mocked trackers in tests).
