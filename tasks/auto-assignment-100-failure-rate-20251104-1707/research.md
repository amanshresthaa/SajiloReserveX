# Research: Auto-Assignment 100% Failure Rate

Date: 2024-11-04
Restaurant: Prince of Wales Pub (Bromham)
Target Date: 2025-11-10 (Monday)

## Requirements

- Functional:
  - Auto-assign tables for 100 generated bookings on 2025-11-10
  - Accept holds and confirm assignments where possible
- Non-functional (a11y, perf, security, privacy, i18n):
  - Performance: < 1s per booking expected; total < ~2 mins for 100
  - Reliability: >= 70-90% success for realistic party sizes/time windows
  - Security: Supabase remote only; no secrets in source; env-driven flags
  - Observability: clear logs/diagnostics explaining rejections

## Existing Patterns & Reuse

- server/capacity/tables.ts — core assignment pipeline (quoteTablesForBooking)
- server/capacity/selector.ts — plan generation/scoring
- server/feature-flags.ts — feature-flag toggles (time pruning, lookahead)
- scripts/ops-auto-assign-\*.ts — batch runners
- scripts/generate-smart-bookings.ts — realistic test data generator
- scripts/generate-smart-seed-sql.ts — seed SQL generator

## External Resources

- Supabase PostgreSQL (remote) — data source for bookings/tables/holds
- Luxon — time window computations
- Next.js — framework (not directly involved in allocator logic)

## Constraints & Risks

- Supabase: remote only (AGENTS.md); never run local migrations/seeds for this project
- Feature flag overrides from DB may be unavailable (fetch failures → defaults)
- Missing scarcity data triggers heuristic fallbacks (benign but noisy)
- Potential algorithmic regressions in time pruning / lookahead

## Open Questions (owner, due)

- Q: Is time pruning erroneously marking all tables busy? (owner: eng)
  A: To be verified via instrumentation and by toggling pruning off
- Q: Does lookahead block all plans due to threshold/weights? (owner: eng)
  A: Verify with logging and by disabling lookahead
- Q: Are DB queries slow or N+1 causing 35s/booking? (owner: eng)
  A: Wrap queries in timers; check logs

## Recommended Direction (with rationale)

1. Instrument critical stages to surface candidate counts and rejection reasons (low risk, high value).
2. Add env-driven debug toggles to forcibly disable time pruning and lookahead to bisect root cause quickly.
3. Create a minimal, deterministic single-booking test script that prints diagnostics.
4. Profile DB calls and planner enumeration to identify hotspots causing 35s latency.
5. Once culprit confirmed, implement targeted fix (likely in time-based filtering or busy map generation) and add regression tests.

---

## Evidence Summary (from investigation)

- 0% success across 100 realistic bookings (party size distribution 2–8, within service windows)
- 35,300 ms per booking on average; total ~15 minutes
- SQL validation confirms suitable tables exist and no holds/assignments conflict
- 14 failures correctly flagged for lunch overrun (service validation OK)
- Console spam: scarcity fallback + feature flag override fetch failures
- Strong suspicion on: filterTimeAvailableTables(), buildBusyMaps(), lookahead evaluation
