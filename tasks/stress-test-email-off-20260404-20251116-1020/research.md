---
task: stress-test-email-off-20260404
timestamp_utc: 2025-11-16T10:20:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Research: Email-suppressed stress test for 2026-04-04

## Requirements

- Functional: run slot-filling stress passes on White Horse Pub (Waterbeach) for 2026-04-04 from opening through closing with email dispatch suppressed; use random party sizes 1–12; achieve at least ~30% of available inventory filled in every slot; exercise success/failure paths.
- Non-functional: avoid sending any outbound email; keep load high enough to validate allocator + booking flow; capture logs/artifacts for traceability.

## Existing Patterns & Reuse

- `scripts/run-slot-fill.ts` drives `pnpm booking:flow` across generated slots with random party sizes (default 1–12) and stress loops per slot; hard-coded slug `white-horse-pub-waterbeach` and accepts date/start/end/interval/concurrency/log-dir overrides.
- `scripts/run-booking-flow.ts` handles booking creation + polling; supports `--stress --stress-max` to run repeated bookings until failure/limit and randomizes identity when stress is on.
- Email suppression toggles: `LOAD_TEST_DISABLE_EMAILS=true` or `SUPPRESS_EMAILS=true` are honored in booking side-effects and email worker (`server/jobs/booking-side-effects.ts`, `scripts/queues/email-worker.ts`).
- White Horse config (Saturday, per `WHITE_HORSE_CONFIG.md`): opening 12:00, closing 23:00 via drinks service; lunch 12:00–15:00, dinner 17:00–22:00. Inventory: 26 tables (~122 covers) across 3 zones. **Actual DB hours differ**: `restaurant_operating_hours` weekly rows show Saturday (day 6) closed/null hours.

## External Resources

- None required beyond repo scripts/env; all Supabase/HTTP calls stay within configured environments.

## Constraints & Risks

- Supabase is remote-only; must not run local migrations/seeds beyond approved scripts.
- Base URL must point at a live booking API (default `http://localhost:3000` unless overridden); failure to have server running will abort runs.
- Stress loops stop on first failure; may not reach target fill if capacity is insufficient—need to monitor and possibly rerun with adjusted slots/intervals.
- Current DB configuration reports restaurant closed on Saturdays (no weekly hours, no date override), so 2026-04-04 requests return 400 unless we add an override or choose a weekday.
- Timezone: slots interpreted literally in local server time; ensure 2026-04-04 (Saturday) aligns with desired window (12:00–23:00).

## Open Questions (owner, due)

- Should we target a non-local base URL (staging/prod) or keep localhost? (assume existing default unless provided)
- Do we need pre/post `pnpm run db:stress-test` validation, or is slot-fill-only acceptable? (will proceed with slot-fill focus unless told otherwise)

## Recommended Direction (with rationale)

- Use `scripts/run-slot-fill.ts` for 15-minute slots from 12:00 through 23:00 on 2026-04-04 with `--stress-max` tuned to hit ≥30% table coverage (set to ≥10 to exceed 8-table threshold) and random party sizes 1–12.
- Export `LOAD_TEST_DISABLE_EMAILS=true SUPPRESS_EMAILS=true` during execution to guarantee no outbound emails.
- Point `--log-dir` to the task artifacts folder and run sequentially (or low concurrency) to keep logs readable; escalate only if coverage gaps emerge.
- Review results and, if failures stop early, rerun targeted slots to ensure each slot hits desired fill percentage.
