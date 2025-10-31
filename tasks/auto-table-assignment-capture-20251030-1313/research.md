# Research: Auto Table Assignment Capture

## Requirements

- Functional:
  - Provide a way to capture or export the per-booking decision process when running automatic table assignment so ops and product teams can inspect why bookings were assigned or skipped.
  - Keep current auto-assignment behaviour intact; capture should be additive/opt-in.
- Non-functional (a11y, perf, security, privacy, i18n):
  - Avoid material performance regressions in the auto-assignment loop (currently tight for ops UI responsiveness).
  - Respect existing data sanitisation rules (emails/names redacted) when exposing diagnostics.
  - Keep storage/transport of captured data compliant with existing privacy posture (no raw PII).

## Existing Patterns & Reuse

- Auto assignment entry point is `autoAssignTablesForDate` (`server/capacity/tables.ts:2549`), invoked by Ops API `POST /api/ops/dashboard/assign-tables` (`src/app/api/ops/dashboard/assign-tables/route.ts:4`).
- Each booking run currently emits detailed telemetry via `emitSelectorDecision`, including candidates, skip reason, timing, flags (`server/capacity/telemetry.ts:60` onwards); payload is already sanitised and written both to console and `observability_events`.
- Telemetry persistence uses `recordObservabilityEvent`, inserting into Supabase `observability_events` with context JSON (`server/observability.ts:6`).
- Frontend today consumes only aggregated result counts (`src/hooks/ops/useOpsTableAssignments.ts:58`); extending the API response must stay backward compatible or behind a flag.
- Planner diagnostics and timing helpers (`composePlannerConfig`, `buildTiming`) already return structured snapshots we can reuse (`server/capacity/tables.ts:552` & `server/capacity/tables.ts:577`).

## External Resources

- None yet; requirements appear internal. (Supabase observability views defined in `supabase/migrations/20251029170500_capacity_observability_views.sql:47` if we need downstream reporting.)

## Constraints & Risks

- Capturing every decision inline could inflate the API payload; need guardrails (debug flag, pagination, or limit to current run).
- Risk of duplicating sensitive context if we bypass existing sanitisation; safest to reuse the object passed to `emitSelectorDecision`.
- Potential race/consistency issues if we rely solely on `observability_events` reads during the same request (write latency, eventual consistency).
- Must not introduce blocking Supabase round trips inside the booking loop beyond what already exists (latency budget ~sub-second).

## Open Questions (owner, due)

- Q: Should capture be returned inline with the API response, persisted for later retrieval, or both? (Owner: Product/Ops, Due: before design sign-off)
  A: ...
- Q: Do we need capture in production by default, or only when a debug flag / query param is provided? (Owner: Eng Lead, Due: before implementation)
  A: ...
- Q: What retention/visibility requirements apply if we persist detailed diagnostics (PII expectations)? (Owner: Security, Due: pre-release)
  A: ...

## Recommended Direction (with rationale)

- Introduce an opt-in capture mode (e.g., request flag) that collects the already-sanitised `SelectorDecisionEvent` payloads alongside the existing `AutoAssignResult`, avoiding extra Supabase reads.
- Reuse the data assembled just before calling `emitSelectorDecision` so we do not recompute planners/diagnostics; wrap in a lightweight collector shared inside `autoAssignTablesForDate`.
- Continue emitting telemetry to observability for parity; capture mode simply returns the same payload for direct inspection, satisfying the requirement with minimal new surface area.
