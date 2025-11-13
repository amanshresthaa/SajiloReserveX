---
task: auto-assign-inline-result
timestamp_utc: 2025-11-12T19:50:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: [planner_efficiency]
related_tickets: []
---

# Research: Share Inline Auto-Assign Results with the Background Job

## Requirements

- Capture the planner output from the inline `quoteTablesForBooking` attempt and persist it onto the `bookings` row so the background job can decide whether to re-run another full search.
- Avoid duplicating customer communication: if inline auto-assign succeeded and already sent the confirmation email, the job should detect that and skip re-sending.
- When a recent inline failure indicates deterministic reasons (e.g. no capacity), shorten the job's retry budget so jobs abandon hopeless bookings faster and spend less CPU.
- Keep observability intact: new persistence should not reduce the fidelity of `auto_assign.quote`/`auto_assign.summary` events emitted earlier.

## Existing Patterns & Reuse

- Inline auto-assign is orchestrated inside `src/app/api/bookings/route.ts`: it wraps `quoteTablesForBooking` with `CancellableAutoAssign`, records observability events (`inline_auto_assign.quote_result`, `.no_hold`, `.confirm_succeeded`), and sends guest emails on success.
- Background job `autoAssignAndConfirmIfPossible` already loops through planner attempts, emits `auto_assign.quote` for each call, and tracks outcomes via `auto_assign.summary`. This job can use the shared `auto_assign_last_result` blob to tune its retries.
- There is already a booking column `auto_assign_idempotency_key` and instrumentation hooking into `recordObservabilityEvent`. Adding another JSON column follows the same pattern and can be updated through `updateBookingRecord` helper.
- The new planner telemetry helper we introduced (`server/capacity/planner-telemetry.ts`) can also be reused if we need to log when the job decides to bypass the first attempt.

## External Resources

- Internal docs (this sprint) highlight desired success metrics: reduce job planner calls by ≥50% and bring inline p95 below 2s. Sharing inline failure data is the first step.

## Constraints & Risks

- New booking JSON data must be concise to avoid blowing up `bookings` row size; keep only the fields the job needs: timestamp, success flag, reason, strategy knobs, email flag, and trigger label.
- Supabase policy forbids local migrations/seeds; all DDL changes must be scripted via `supabase/migrations/*.sql` and verified remotely.
- The job should still behave correctly when the new column is `null` (e.g., legacy bookings) or stale (older than a few minutes).
- We must ensure updates to `auto_assign_last_result` happen even when inline quote fails due to an `AbortError`, so the job can still learn from the attempt.

## Open Questions (owner, due)

- Should the job consider inline failures older than X minutes? (We will use a bounded window, e.g. 5m, and document it in the plan.)
- Do we need to store the inline `attemptId` so the job can link logs? (We'll include it for richer context and possible troubleshooting later.)

## Recommended Direction (with rationale)

1. Add a `auto_assign_last_result jsonb` column to `bookings` via a migration and surface it in the Supabase TypeScript schema plus helper types so updates are strongly typed.
2. Inline flow will update the column whenever the planner runs, recording whether it had a hold, the failure reason, duration, strategy details, and whether the confirmation email sent (useful to prevent duplicate emails).
3. The background job will read the column, and if the inline result is recent and indicates an obvious failure, it will shorten `maxAttempts` (or skip the first attempt) and annotate logs and summary context accordingly. The job will also skip sending emails if inline already succeeded and recorded that fact.
