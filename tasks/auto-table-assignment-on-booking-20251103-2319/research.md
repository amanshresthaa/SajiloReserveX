# Research: Auto table assignment on booking completion

## Requirements

- Functional:
  - After a guest completes the booking flow, the system should automatically assign a table.
  - Guest should have no interaction with table selection; they only receive a confirmed email once a table has been assigned.
- Non‑functional (a11y, perf, security, privacy, i18n):
  - Keep API latency reasonable; avoid blocking for long allocator calls.
  - Idempotent and concurrency-safe assignments.
  - No guest PII leaks; emails already sanitize content.

## Existing Patterns & Reuse

- Capacity & allocator pipeline: `server/capacity/tables.ts` (quote/confirm), `assign_tables_atomic_v2` RPC.
- Status transitions: RPC `apply_booking_state_transition`.
- Emails: `server/emails/bookings.ts` chooses subject/body based on status; `sendBookingConfirmationEmail` renders “ticket” when status is confirmed.
- Side-effects: `server/jobs/booking-side-effects.ts` sends “request received” email on create.

## External Resources

- Internal repo docs: COMPLETE_ROUTE_MAP.md, capacity README, schema functions for assignments.

## Constraints & Risks

- Serverless background work may be killed post-response. Implement best-effort with short retries and cutoff before service start.
- Holds/assignments collide with other operations; rely on advisory locks + idempotency.
- Avoid sending “request received” email if auto-assign is enabled (per product requirement).

## Open Questions (owner, due)

- Should we ever send a fallback “request received” email when auto-assign fails? (Owner: PM)
- Tune retry policy and cutoff window before service start? (Owner: Eng)

## Recommended Direction (with rationale)

- Add a feature flag to enable auto-assign at booking creation.
- Fire-and-forget a job to quote/confirm, then flip status to confirmed and send the confirmed email.
- Suppress the initial “request received” email while the flag is on to ensure guest only gets the confirmed email.
