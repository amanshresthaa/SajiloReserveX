# Research: Sprint 2 — Consistency, UX Gating, and Perf Minimums

## Requirements

- Functional:
  - Freeze adjacency/zone semantics in hold summary; confirm must verify exact match.
  - Add sweeper to remove orphaned/expired holds; confirm path must release holds robustly.
  - Add metrics for manual validate/hold/confirm outcomes with dimensions.
  - Narrow context queries for performance and add DB indexes.
  - UI should gate on STALE_CONTEXT with one-click refresh.
- Non-functional (a11y, perf, security, privacy, i18n):
  - Perf: P95 context load < target on staging seed; reduce query fanout and scanned rows.
  - A11y: Ensure banner/controls are keyboard reachable and communicated via screen readers.
  - Security: No privilege escalation; tenant scoping respected.

## Existing Patterns & Reuse

- Holds service and metadata in `server/capacity/holds.ts` and `server/capacity/tables.ts` already persist selection summary and policyVersion.
- Context versioning and serverNow are returned by `getManualAssignmentContext`.
- Telemetry scaffold exists in `server/capacity/telemetry.ts`.
- A basic hold sweeper exists in `server/jobs/capacity-holds.ts` and `sweepExpiredHolds` in holds service.

## External Resources

- Postgres indexing guidelines for range overlap and composite keys — to guide safe index choices without requiring new extensions.

## Constraints & Risks

- Avoid reliance on PG extensions not present in managed Supabase (e.g., btree_gist) unless confirmed available.
- Manual routes run in Next API; avoid heavy DB work there. Prefer server utilities to compute policy context.
- Backward compatibility: UI uses services that auto-fetch contextVersion; ensure errors surface codes.

## Open Questions (owner, due)

- Q: Exact adjacency snapshot format desired? (edges vs. hash)
  A: Persist normalized edge list and a hash for strict equality; flexible for future.
- Q: Scheduler integration for sweeper (cron/Inngest)?
  A: Provide job function; scheduling configured out-of-band (DevOps) — document in verification.

## Recommended Direction (with rationale)

- Persist `selection.snapshot` with `zoneIds` and normalized `adjacencyEdges` plus `undirected` flag and `hash`.
- On confirm, recompute and compare; if mismatch, return `POLICY_CHANGED` with fields.
- Add metrics emitters in telemetry; call them in manual routes for ok/fail with dims.
- Narrow context bookings to ±X minutes around window (flagged) and add indexes to reduce IO.
- UI: add STALE_CONTEXT banner with refresh button wired to context refetch.
