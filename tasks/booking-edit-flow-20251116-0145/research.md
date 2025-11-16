---
task: booking-edit-flow
timestamp_utc: 2025-11-16T01:45:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Research: Booking edit flow alignment

## Requirements

- Functional: make the booking edit flow behave logically like creation—attempt to confirm immediately when possible, fall back to pending only when a table cannot be assigned, and send exactly one email per outcome (confirmation vs modification requested).
- Non-functional: keep current templates/branding, preserve observability events, respect suppress flags (`SUPPRESS_EMAILS`, `LOAD_TEST_DISABLE_EMAILS`), avoid regressions to ops/staff flows.

## Existing Patterns & Reuse

- Creation (POST /api/bookings) performs an inline auto-assign attempt, then enqueues side-effects and a background auto-assign job if needed.
- Edit (PUT /api/bookings/[id]) currently queues auto-assign as a background job (`autoAssignAndConfirmIfPossible` with reason `modification`) and sends the “modification requested” email when status goes pending; confirmation is only sent when the job succeeds.
- Side-effects and email dispatch live in `server/jobs/booking-side-effects.ts`; email templates in `server/emails/bookings.ts`.

## External Resources

- None beyond repository code.

## Constraints & Risks

- Must not double-send modification emails or confirmations.
- Inline work during edit must keep request latency acceptable; may need timeout guards.
- Background job should still run for retry logic if inline fails or times out.

## Open Questions (owner, due)

- Should edit attempts always try inline auto-assign like creation, or only when specific feature flag is on?
- Should we reuse the “modification” email variant for immediate confirmations after edit, or standard confirmation?

## Recommended Direction (with rationale)

- Mirror creation’s control flow: add an inline auto-assign attempt during edit (bounded timeout), record results, and let side-effects handle email dispatch so there’s a single sender per outcome. Keep background job as fallback for pending states. This reduces perceived inconsistency and shortens time-to-confirm when capacity is available.
