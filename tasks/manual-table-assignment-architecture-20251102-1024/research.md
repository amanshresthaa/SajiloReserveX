# Research: Manual Table Assignment Logic

## Requirements

- Functional:
  - Staff can manually pick one or more tables for a booking, validate the selection, place a temporary hold, and confirm assignment.
  - Staff can also directly assign or unassign a single table.
- Non‑functional (a11y, perf, security, privacy, i18n):
  - AuthN/AuthZ required via Supabase; membership checked before operations.
  - Performance: validation should be quick; assignments atomic via RPC.
  - Idempotency on assignment confirmation to avoid duplicates.
  - Holds expire; no secrets in client; i18n not central to logic.

## Existing Patterns & Reuse

- Client services expose manual flows through `/api/staff/manual` endpoints: validate, hold, confirm, context (`src/services/ops/bookings.ts:560-616`).
- Capacity engine centralizes logic:
  - Manual validation, hold creation, context: `server/capacity/tables.ts:1710-2040`.
  - Holds model: `server/capacity/holds.ts` (creation, conflicts, release).
  - Assignment orchestration (Allocator v2): `server/capacity/v2/*`.
  - Direct assign/unassign APIs: `src/app/api/ops/bookings/[id]/tables/route.ts`, `[tableId]/route.ts`.

## External Resources

- Supabase RPCs: `assign_tables_atomic_v2`, `unassign_tables_atomic`, `set_hold_conflict_enforcement`.
- Feature flags: `server/feature-flags.ts` control adjacency, holds, planner pruning, etc.

## Constraints & Risks

- Allocator v2 must be enabled for hold confirmation and direct assignment via orchestrator; otherwise operations fail with repository errors.
- Race conditions around holds; strict conflicts require feature flag and DB support.
- Idempotency required to avoid duplicate assignment rows.

## Open Questions (owner, due)

- Q: What’s the expected UX when validation passes but hold creation races? A: Current code returns 409 with `HOLD_CONFLICT`; UI prompts for re-validate. (owner: eng)
- Q: Are cross-zone assignments ever allowed? A: Current policy enforces single-zone (error check). (owner: product)

## Recommended Direction (with rationale)

- Use existing manual flow: context → validate → hold → confirm.
- Keep holds short (default 180s) and release previous holds after successful re-hold.
- Enforce adjacency based on feature flags and optional override; rely on RPC for atomic commit.
