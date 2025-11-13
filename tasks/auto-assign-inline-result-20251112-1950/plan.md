---
task: auto-assign-inline-result
timestamp_utc: 2025-11-12T19:50:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: [planner_efficiency]
related_tickets: []
---

# Implementation Plan: Inline Job Result Sharing

## Objective

Persist the inline auto-assign planner output on the booking record and have the background job read it so we can skip redundant planner work when inline already determined the outcome and prevent duplicate confirmation emails.

## Success Criteria

- [ ] `bookings.auto_assign_last_result` exists, is populated on every inline planner invocation, and records timestamp, outcome, reason, strategy, and whether the email was already sent.
- [ ] Background job reads the persisted inline result, shortens its retry budget for deterministic failures (e.g. no capacity) and logs that decision via the existing observability events.
- [ ] Job skips re-sending confirmation emails when `auto_assign_last_result.emailSent` is true for the inline attempt.

## Architecture & Components

- **Schema**: Add `auto_assign_last_result jsonb` column to `bookings`, update Supabase schema/types, and expose it through `updateBookingRecord` payloads so both inline flow and potential future writers can persist to it.
- **Inline flow (`src/app/api/bookings/route.ts`)**: Compose a shared result object after each planner call (`quote` success/failure/abort) and write it to the booking. Include metadata like `trigger`, `attemptId`, `durationMs`, `alternates`, `strategy`, `reason`, and `emailSent`. Ensure updates happen even on `AbortError` or other exceptions.
- **Background job (`server/jobs/auto-assign.ts`)**: After loading the booking, parse the persisted result; if the inline attempt is recent and indicates a deterministic `NO_CAPACITY`-style failure, reduce `maxAttempts` (e.g., to 2) and annotate the job log. When the booking is already `confirmed`, avoid resending the email if the inline result already recorded `emailSent`.

## Edge Cases

- Inline `quoteTablesForBooking` may abort without an explicit rejection reason; still persist a generic failure entry (`reason: 'AbortError'` or `'QUOTE_ERROR'`) so the job can detect an inline attempt happened.
- Some bookings might have older inline results in the column; treat those as stale by ignoring anything older than 5 minutes.
- When the job decides to lower `maxAttempts`, ensure the `auto_assign.summary` event reflects the reduced cap.

## Testing Strategy

- Unit test for the helper that interprets `auto_assign_last_result` and decides whether to reduce retries or skip email.
- Manual dev test: trigger inline auto-assign to fail (e.g., by booking a busy slot) and verify the job's `auto_assign.quote` events include context about the inline failure and the new field is written to Supabase.
