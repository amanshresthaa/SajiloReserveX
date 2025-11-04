# Research: Auto-Assign Loop Runner

## Requirements

- Functional:
  - Loop-run `scripts/ops-auto-assign-ultra-fast.ts` for a target restaurant/date until all pending bookings have table assignments.
  - Remote-only DB connectivity; no local Supabase.
  - Adaptive tuning between iterations based on failures/perf.
- Non-functional (a11y, perf, security, privacy, i18n):
  - N/A UI; CLI script. Performance: keep iterations under a few seconds each.
  - Security: use service key/remote DB URL from env; do not log secrets.

## Existing Patterns & Reuse

- `scripts/ops-auto-assign-ultra-fast.ts` produces a JSON report and prints failure breakdown.
- DB access patterns via `pg` and `SUPABASE_DB_URL` already used in repo scripts.
- Feature flags sourced from env via `lib/env.ts` and used by capacity/selector pipeline.

## External Resources

- Supabase remote-only: see `REMOTE_ONLY_SETUP.md` (psql + CLI).

## Constraints & Risks

- The ultra-fast script has fixed concurrency in-code; cannot be tuned externally without code changes.
- Reasons in report are summarized; per-booking IDs are truncated in output (first 8 chars), so stuck detection relies on DB queries.

## Open Questions (owner, due)

- Q: Should we include confirmed-without-assignments in "unassigned"?  
  A: For now, we target pending bookings only (aligns with underlying script); can extend if needed. (owner: eng)

## Recommended Direction (with rationale)

- Implement a TypeScript loop runner that:
  - Verifies remote Supabase URL.
  - Spawns the ultra-fast script; parses output + latest JSON report.
  - Queries the DB (remote) for remaining unassigned (pending, no booking_table_assignments).
  - Applies environment feature flags dynamically based on failure patterns and performance.
  - Detects stuck iterations and prints remediation guidance.
