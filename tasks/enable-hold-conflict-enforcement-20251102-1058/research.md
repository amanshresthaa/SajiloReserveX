# Research: Enable Strict Hold Conflict Enforcement Everywhere (E1-S1)

## Requirements

- Functional:
  - Always enforce strict hold conflict checks across all hold and assignment paths.
  - Call `set_hold_conflict_enforcement(true)` at service start; self‑check and fail fast if not honored.
  - Direct assign/unassign API paths must reject when a conflicting hold exists for the table(s) and window.
- Non‑functional (a11y, perf, security, privacy, i18n):
  - Low latency for conflict checks; avoid N+1 queries.
  - No sensitive data leaked in error responses (IDs ok, no PII).

## Existing Patterns & Reuse

- `server/capacity/holds.ts` already calls `set_hold_conflict_enforcement` via `configureHoldStrictConflictSession()` in hold operations and `findHoldConflicts()`.
- DB migration `supabase/migrations/20251029183500_hold_windows_and_availability.sql` creates `table_hold_windows` with an EXCLUDE constraint on `[start, end)` using GiST and provides `set_hold_conflict_enforcement(enabled boolean)` + `is_holds_strict_conflicts_enabled()`.
- Manual validation path uses `findHoldConflicts` during selection evaluation.
- Direct assign path: `src/app/api/ops/bookings/[id]/tables/route.ts` and `server/capacity/tables.ts:assignTableToBooking` do not pre‑check holds.
- Supabase client factory `server/supabase.ts` centralizes a singleton service client.

## External Resources

- Postgres `tstzrange` half‑open `[)` overlapping: used in migration for windows.

## Constraints & Risks

- Supabase session GUC requires per‑connection initialization; singleton client helps but SSG/edge contexts may create additional clients.
- Feature flag `holds.strict_conflicts.enabled` drives behavior; need safe fallback when function/table not available (code already has 42P01 fallbacks).
- Direct assign path must avoid race between pre‑check and RPC commit; still okay because DB overlap constraints remain authoritative.

## Open Questions (owner, due)

- Should `getServiceSupabaseClient()` always set enforcement on creation? (BE1, before implementation) – Proposed: yes, with one‑time self‑check + health log.
- What is the exact failure mode for “fail fast if not honored”? Throw at boot or first operation? (BE1) – Proposed: first capacity op throws 503 with actionable message.

## Recommended Direction (with rationale)

- Add startup enforcement hook in `server/supabase.ts:getServiceSupabaseClient()` that calls `set_hold_conflict_enforcement(true)` once and validates by reading the GUC via `current_setting(...)` wrapper (or a lightweight `SELECT set_hold_conflict_enforcement(true)` expecting true back). If mismatch, set a sticky in‑memory flag to fail subsequent capacity ops fast.
- Update direct assign route to call `findHoldConflicts` before `assignTableToBooking` (defense in depth; DB still final arbiter). Return canonical `HOLD_CONFLICT` with details (tables, window, blocking hold ids).
- Keep legacy fallbacks (when table/function missing) but log a warning; still block if conflicts found via legacy path.
