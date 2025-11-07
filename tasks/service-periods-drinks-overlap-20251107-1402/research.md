# Research: Allow Drinks Service Period Overlaps

## Requirements

- Functional:
  - The PUT `/api/owner/restaurants/[id]/service-periods` route must accept payloads where a service period named “Drinks” overlaps other periods on the same day (or all days).
  - Existing validation that prevents overlaps for other period names must remain unchanged.
  - API responses and downstream consumers should not require schema changes; only validation logic changes.
- Non-functional (a11y, perf, security, privacy, i18n):
  - Keep validation fast (runs on every save).
  - Maintain current error messaging for non-Drinks overlaps.
  - No DB schema changes (remote Supabase only per policy, but not needed here).

## Existing Patterns & Reuse

- `server/restaurants/servicePeriods.ts` contains `validateServicePeriod` and the overlap guard inside `updateServicePeriods`. The overlap check currently sorts per-day periods and throws when any `prev.endTime > current.startTime`.
- API route `src/app/api/owner/restaurants/[id]/service-periods/route.ts` delegates to the server helper; UI hooks rely on server-side validation, so changing the helper is sufficient.

## External Resources

- (none needed; domain rule provided in ticket)

## Constraints & Risks

- Need to preserve deterministic behavior for custom period names (could be localized).
- Comparing `name` should be case-insensitive and robust to whitespace, matching how `validateServicePeriod` trims names.
- Allowing Drinks-only overlaps must not accidentally allow other combinations due to sorting or mutation order.

## Open Questions (owner, due)

- Q: Are there other special-case period names besides “Drinks” (e.g., “Bar”)?  
  A: Not specified; assume only “Drinks” for now but code defensively with case-insensitive comparison.

## Recommended Direction (with rationale)

- Introduce a helper (e.g., `canOverlapWithOthers(period)` or `isDrinksPeriod(period)`) that identifies the special-case name after trimming/lowercasing.
- During the overlap check loop, skip the error when either `prev` or `current` is the Drinks period; keep default behavior otherwise.
- Add unit coverage for overlap validation paths to prevent regressions and document the new rule.
