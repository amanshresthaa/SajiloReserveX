---
task: wizard-submit-timeout
timestamp_utc: 2025-11-12T23:35:00Z
owner: github:@assistant
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Research: Wizard submission TIMEOUT at /reserve/thank-you

## Requirements

- Functional:
  - Prevent the customer-facing booking wizard from failing outright when the `POST /api/bookings` submission takes longer than 30s and the client aborts with `ApiError(code: "TIMEOUT")`. (Event trace shared by user: `wizard_submit_failed` on route `/reserve/thank-you`, status 408.)
  - Ensure we do not create duplicate bookings if guests retry after a timeout; ideally reuse the same server-side attempt if it eventually succeeds.
  - Surface a clear UX state so guests know the booking may still succeed even though the initial response timed out.
- Non-functional:
  - Solution must reuse existing server APIs (no local Supabase access per policy) and respect accessibility/analytics requirements.
  - Avoid introducing new blocking calls that could further extend the submission lifecycle.

## Existing Patterns & Reuse

- `useCreateReservation` (`reserve/features/reservations/wizard/api/useCreateReservation.ts:16-95`) already sends an `Idempotency-Key` header and tracks failures via `track('wizard_submit_failed', payload)` whenever `apiClient` throws.
- `apiClient` (`reserve/shared/api/client.ts:1-120`) returns `{ code: 'TIMEOUT', status: 408 }` after `timeoutMs`; the wizard currently treats this the same as any other error.
- `POST /api/bookings` (`src/app/api/bookings/route.ts:383-1152`) upserts customers, writes bookings, and runs inline auto-assign. Even if the HTTP client disconnects, the handler continues and may create the booking.
- There is already a public guest lookup endpoint (`GET /api/bookings?email=...&phone=...`) in the same route (`src/app/api/bookings/route.ts:1-352`). It uses `fetchBookingsForContact` and returns the caller's active bookings; we can reuse it to verify whether a timed-out submission completed server-side.
- Reservation adapters (`reserve/entities/reservation/adapter.ts`) convert API payloads to the wizard's `Reservation` shape, and `reservationToApiBooking` (`reserve/features/reservations/wizard/model/transformers.ts`) converts them back into the reducer-friendly format.

## External Resources

- AGENTS root policy (manual QA, SDLC sequencing).
- Upstash rate-limit client (`server/security/rate-limit.ts`). Although not yet confirmed as the culprit, network hiccups here could contribute to slow POSTs; worth keeping in mind when instrumenting.

## Constraints & Risks

- Matching a recovered booking purely by contact info could collide with an older reservation for the same guest. Need tighter matching (restaurant/date/time/party/email/phone) and possibly recency bounds.
- The lookup endpoint itself is rate limited (20/min/IP). Recovery logic must cap retries and exit quickly to avoid 429s.
- We must keep the existing analytics semantics (continue emitting `booking_created` when a booking eventually succeeds) to avoid skewing dashboards.
- Holding onto the same idempotency key during retries is important to prevent duplicates, but we must still reset it after a definitive failure to avoid blocking valid subsequent attempts.

## Open Questions (owner, due)

- Should we show an explicit toast/banner on the wizard when we fall back to lookup mode? (owner: github:@assistant, due before implementation)
- Do we need additional backend instrumentation to confirm whether rate limiting or capacity planner is the long pole? (owner: github:@assistant, due post-MVP once telemetry is reviewed)

## Recommended Direction (with rationale)

1. **Differentiate TIMEOUTs in the wizard:** Detect `ApiError.code === 'TIMEOUT'` inside `useReservationWizard.handleConfirm`. Keep the confirmation step in its pending state instead of bouncing the user back immediately, and log a dedicated analytics/emit event for observability.
2. **Attempt recovery via guest lookup:** Introduce a small helper (e.g., `recoverBookingAfterTimeout`) that invokes `GET /api/bookings?email=...&phone=...&restaurantId=...`, reuses `reservationListAdapter`, and polls up to N times (short, e.g., 3 attempts) for a matching booking (date/time/party/email/phone). If found, treat it as a success: hydrate wizard state with the recovered booking, send the normal `booking_created` analytics event, and skip showing an error to the guest.
3. **Preserve idempotency on transient failures:** Only clear `idempotencyKeyRef` in `useCreateReservation` when we know the request definitively completed or failed (non-timeout). This lets a manual retry reuse the same key if recovery fails but the server might still complete shortly afterward.
4. **Fallback UX:** If the lookup never finds a booking, surface a specific error message instructing the guest to check their email before retrying, and log an analytics event so we can monitor how often we fail to recover. This keeps users informed without hiding the failure.

This approach contains the fix entirely within the frontend, reuses existing APIs/adapters, avoids new migrations, and minimizes risk of duplicate bookings while improving UX during brief server hiccups.
