# Research: Edge Cases — Invalid Inputs and DST Handling

## Requirements

- Functional:
  - Make time window normalization predictable for demand profiles.
  - Ensure windowsOverlap behaves consistently across DST transitions.
- Non-functional (a11y, perf, security, privacy, i18n):
  - No performance regressions in hot paths (overlap checks are frequent).
  - Deterministic behavior across time zones and DST boundaries.

## Existing Patterns & Reuse

- Demand profiles normalize windows via `normalizeWindow(start?, end?)` in `server/capacity/demand-profiles.ts:49`.
- Overlap detection via `windowsOverlap` in `server/capacity/tables.ts:710`, with custom DST heuristics.
- Luxon is used throughout for time handling.

## External Resources

- Luxon docs (DateTime, zone/dst behavior) – guides DST correctness.
- Common interval semantics: half-open `[start, end)` to avoid double-counting boundaries.

## Constraints & Risks

- Fallback demand rules are keyed by day-of-week; cross-midnight windows create ambiguity across days.
- DST non-existent/repeated local times can produce subtle boundary cases.
- Overlap checks are performance sensitive; avoid heavy allocations.

## Open Questions (owner, due)

- Q: Should demand-profile windows support cross-midnight?  
  A: For now, no. Treat `end <= start` as same-day remainder with a warning. If cross-midnight is needed, define two rules.

## Recommended Direction (with rationale)

- Normalize windows with explicit semantics:
  - Missing `start` → 00:00; missing `end` → 24:00.
  - If both provided and `end <= start`, treat as `[start, 24:00)` and emit a warning (avoid implicit 24h or wraparound across days).
- Simplify DST handling in `windowsOverlap`:
  - Keep half-open intersection in UTC.
  - Remove fragile special-casing (e.g., 01:xx mapping, boundary-touch override).
  - Coerce non-existent local times forward minute-by-minute to next valid instant (already implemented) and rely on standard intersection.
