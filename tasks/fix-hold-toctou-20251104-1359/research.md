# Research: Fix hold TOCTOU, error handling, and atomicity

## Requirements

- Functional:
  - Eliminate TOCTOU in table hold creation and quoting flows.
  - Ensure hold creation is atomic (no orphaned `table_holds` without members).
  - Preserve conflict detection semantics and telemetry.
- Non-functional (a11y, perf, security, privacy, i18n):
  - Improve robustness under concurrency; avoid degraded “legacy fallback” mode.
  - Keep behavior behind existing feature flags where applicable.

## Existing Patterns & Reuse

- DB enforcement:
  - `table_hold_windows_no_overlap` EXCLUDE constraint prevents overlapping holds per table.
  - Triggers `sync_table_hold_windows`/`update_table_hold_windows` maintain `table_hold_windows` and shadow `allocations`.
- Feature flags:
  - `isHoldStrictConflictsEnabled()` toggles strict behavior.
  - `set_hold_conflict_enforcement(enabled)` exists but is not guaranteed cross-transaction with pooled connections.
- RPCs available for assignments but not for hold creation (no `create_table_hold_atomic`).

## External Resources

- PostgREST nested writes: atomic parent+child inserts in one request (transactional on the server side).

## Constraints & Risks

- No local Supabase migrations in this project (remote only). We cannot add a new RPC now.
- Session GUC via RPC is transaction-local; follow-up requests may not reuse the same DB session.

## Open Questions (owner, due)

- Q: Should we entirely remove pre-checks when strict conflicts are enabled?
  A: We retained them in manual validation, but skipped them in quoting loop to reduce race; DB remains the source of truth. (eng, now)

## Recommended Direction (with rationale)

- Use a single nested insert to create the hold and its members atomically to eliminate orphan risk and TOCTOU.
- Rely on DB EXCLUDE constraint for concurrency correctness; translate `exclusion_violation` to `HoldConflictError`.
- Tighten `findHoldConflicts` error handling: only fallback to legacy when the view is missing; otherwise escalate.
- In the quoting loop, skip pre-check when strict conflicts are enabled; let DB decide and handle errors.
