# Research: Align Service Periods with Kitchen & Operating Hours

## Requirements

- Functional:
  - Enforce that lunch/dinner booking occasions are only available while the kitchen is open.
  - Drinks booking occasion must span the restaurant's opening hours for each day (open → close).
  - Provide an editing experience in the Service Periods section that reflects weekly kitchen schedules similar to the sample for "The White Horse" (multiple windows per day, e.g., lunch 12-3, dinner 5-10) without hardcoding restaurant-specific data.
  - Persist updated schedules through the existing `/api/owner/restaurants/[id]/service-periods` endpoint.
- Non-functional:
  - Keep UX intuitive (table-like layout for per-day kitchen windows is acceptable).
  - Maintain accessibility and existing styling conventions.
  - Ensure validation prevents impossible states (e.g., lunch start outside kitchen hours, dinner overlapping lunch, lunch for closed days, etc.).

## Existing Patterns & Reuse

- `OperatingHoursSection` already renders a weekly schedule table with per-day open/close + closed toggle.
- `ServicePeriodsSection` currently manages arbitrary periods via dynamic list; includes validation helper, `normalizeTime`, `DAY_OPTIONS`, etc.
- Server-side `updateServicePeriods` already enforces overlaps (with Drinks exception), so frontend just needs to produce valid sets.
- Hooks: `useOpsServicePeriods`, `useOpsUpdateServicePeriods`, `useOpsOperatingHours`, `useOpsOccasions` (existing) can be composed for combined UI state.

## External Resources

- White Horse sample hours (provided by user) for reference of desired behavior.

## Constraints & Risks

- Need to keep `service period` API contract unchanged; backend still expects array of rows.
- Occasions list may include more than lunch/dinner/drinks (e.g., Christmas events). We must avoid breaking custom occasions.
- Restaurants might have different booking options; design must remain flexible enough (maybe default focus on lunch/dinner/drinks but not block others?).
- Additional network calls (operating hours) could affect load time; handle combined loading states.

## Open Questions (owner, due)

- Q: Should other custom booking occasions still be editable? (Assume yes but demote to advanced mode?)
  A: Pending stakeholder confirmation; plan assumes core focus on lunch/dinner/drinks with ability to add custom rows if needed.

## Recommended Direction (with rationale)

- Rework `ServicePeriodsSection` into a per-day table view similar to operating hours:
  - Fetch weekly operating hours to determine min/max bounds and auto-fill drinks periods.
  - Provide structured inputs for lunch and dinner windows (one or two windows per day) with toggle to enable/disable each meal for a day.
  - Auto-generate drinks periods from open→close windows; hide manual editing for drinks.
- On save, translate structured day config into API payload (drinks + lunch/dinner rows per day) while preserving IDs when possible.
- Keep fallback/advanced list editing for custom occasions (if necessary) behind expandable panel to avoid regression.
- Update validation logic to enforce: lunch/dinner windows subset of operating hours, lunch before dinner, etc.
- Extend/unit test mapping helpers to avoid regressions.
