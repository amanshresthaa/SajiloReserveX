---
task: stress-test-email-off-20260404
timestamp_utc: 2025-11-16T10:20:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Implementation Plan: Email-suppressed slot-fill stress test (2026-04-04)

## Objective

Drive the booking flow for White Horse Pub (Waterbeach) across all operating slots on 2026-04-04 with outbound email suppressed, using random party sizes 1–12 and enough iterations to fill ≥30% of available table inventory per slot, to exercise allocator success/failure paths.
_(Updated: running on weekday 2026-04-03 because Saturdays are closed in current DB operating hours.)_

## Success Criteria

- [ ] Email sending disabled via env flags for all runs (verified in logs/config).
- [ ] Slot coverage from first to last operating slot on 2026-04-03 (weekday, 12:00–22:00) with no unattempted slots.
- [ ] Each slot has ≥8 successful booking attempts (≈30% of 26 tables) or documented reason why capacity prevented it, with reruns for gaps.
- [ ] Artifacts saved in task folder (per-slot logs, summary) plus verification notes.

## Architecture & Components

- `scripts/run-slot-fill.ts`: generates slot list and invokes `pnpm booking:flow` with `--stress --stress-max` per slot; hard-coded restaurant slug `white-horse-pub-waterbeach`.
- `scripts/run-booking-flow.ts`: handles booking creation/polling; stress mode randomizes identity and repeats until failure or limit.
- Email suppression toggles read in server/jobs and queue worker: `LOAD_TEST_DISABLE_EMAILS` / `SUPPRESS_EMAILS`.
- Target API base: default `BOOKING_API_BASE_URL` env or explicit `--base-url`; Supabase backing store remote.

## Data Flow & API Contracts

- CLI -> POST `/api/bookings` (with restaurant slug, date, time, party, type/seating) -> inline allocator + background job -> booking/assignment records in Supabase.
- Stress loop success emits `[stress] Summary` with counts, durations, seat waste, table numbers; failure includes status + reason.

## UI/UX States

- CLI output states: confirmed, inline timeout with background invoked, failure (timeout/conflict/zone lock). No UI screens touched; focus on log outcomes.

## Edge Cases

- Slot exhaustion causing early stress failure before 8 successes; plan reruns with reduced `--stress-max` or adjusted intervals. (Observed: 12:00 slot succeeded 6 times then timed out on 7th; 12:15 and 12:30 reached 5 successes then background timeout.)
- API/base-url unavailable -> immediate failures; will bail out with diagnostics.
- Potential back-to-back overlap near service transitions (15:00/17:00 break, 22:00/23:00 close) — watch for service window validation.
- Current data has Saturday hours marked closed for White Horse (no weekly open/close); need an operating-hours override or alternate date to run 2026-04-04 successfully.

## Testing Strategy

- Dry-run single-slot sanity check if needed (e.g., one midday slot) before full span.
- Main execution: `pnpm tsx scripts/run-slot-fill.ts --date 2026-04-04 --start 12:00 --end 23:00 --interval 15 --min-party-size 1 --max-party-size 12 --stress-max 10 --log-dir tasks/stress-test-email-off-20260404-20251116-1020/artifacts --base-url <target> --pretty` with `LOAD_TEST_DISABLE_EMAILS=true SUPPRESS_EMAILS=true`.
- If any slot logs <8 successes, rerun targeted slots by adjusting start/end to that window with higher `--stress-max` until coverage achieved or documented.

## Rollout

- Feature/flags: set `LOAD_TEST_DISABLE_EMAILS=true` and `SUPPRESS_EMAILS=true` for email suppression; optionally `FEATURE_ALLOCATOR_V2_ENABLED`/profiling flags if already used (leave defaults unless needed).
- Concurrency: start with `--concurrency 1` to keep logs per slot deterministic; increase if runtime excessive while monitoring failures.
- Monitoring: watch slot log outcomes for failure reasons (hold conflicts, zone locks, timeouts).
- Kill-switch: abort script if repeated API errors or constraint violations appear; document partial runs.

## DB Change Plan (if applicable)

- No schema changes; relies on existing remote seed/allocations. If reset needed, use existing `pnpm run db:reset` workflow outside this run (not planned here).
- Rollback: none; bookings created are test data—cleanup via db reset if required post-run.
