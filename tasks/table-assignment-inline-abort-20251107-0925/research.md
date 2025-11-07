# Research: Table Assignment Inline Abort

## Requirements

- Functional: Explain why inline auto-assignment during `POST /api/bookings` never completes and logs `[bookings][POST][inline-auto-assign] aborted`.
- Non-functional: Maintain existing booking experience (request must still finish quickly, no additional DB load), respect new tenant RLS policies.

## Existing Patterns & Reuse

- `CancellableAutoAssign` (`server/booking/auto-assign/cancellable-auto-assign.ts`) wraps inline assignment with a timeout-fed `AbortController`.
- Inline flow in `src/app/api/bookings/route.ts:758-847` imports `quoteTablesForBooking` + `atomicConfirmAndTransition` and enforces a hard-coded `inlineTimeoutMs = 4000`.
- Background retries already exist via `autoAssignAndConfirmIfPossible` (server/jobs/auto-assign.ts), so inline path is strictly opportunistic.

## External Resources

- Dev server log attached by user: `POST /api/bookings` took 19.9 s and emitted `[bookings][POST][inline-auto-assign] aborted` immediately before returning, proving timeout is hit.
- Feature flag safety logs show Supabase round-trips routinely take 1‑3 s (`GET /api/restaurants/.../schedule` ~3.5 s), indicating remote latency baseline.

## Constraints & Risks

- Inline flow currently performs at least 9 sequential Supabase calls (load booking, tables, adjacency, context bookings, holds, strategic config, demand multiplier, scarcity metrics, hold insert) before even reaching `atomicConfirmAndTransition`; each call now incurs ~0.5‑1 s network latency after RLS hardening.
- Timeout lives inside the API handler, so increasing it directly increases request time and could degrade perceived responsiveness.
- Not honoring the timeout returns bookings in `pending` status which is acceptable thanks to background job, but Ops expect inline successes when possible.

## Open Questions (owner, due)

- Q: Is there a strict SLA for the booking POST latency that prevents raising the inline timeout above 4 s? (Owner: Product/Ops)
  A: Not documented; logs already show ~20 s responses, so relaxing the timeout is acceptable short-term.

## Recommended Direction (with rationale)

- Root cause: the 4 s ceiling in `CancellableAutoAssign` is now below the worst-case latency of `quoteTablesForBooking` after the tenant RLS migration because the quoting pipeline performs many sequential network-bound steps. The controller aborts while waiting for Supabase (signals wired through `applyAbortSignal`), so assignment never finishes.
- Short-term mitigation: raise the inline timeout to cover the observed 6‑10 s quoting duration and make it configurable via env to tune later without code changes. Also log actual elapsed time for telemetry.
- Longer-term: parallelize/ cache the quoting prerequisites (tables, adjacency, strategic config) or move inline confirmation to a worker so API latency stays low while still attempting immediate confirmation.
- Instrumentation gap: previous logging only said "aborted". Added attempt-level UUIDs plus granular quote/confirm duration logs + observability events so future traces can pinpoint whether the time sink is quoting (likely) or confirmation.
- Post-migration drift: environments missing the `confirm_hold_assignment_tx` RPC were returning `PGRST202` schema-cache errors. Added an automatic fallback to the legacy assignment orchestrator so inline confirmation can still succeed while surfacing a structured warning.
