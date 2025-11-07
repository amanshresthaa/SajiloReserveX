# Research: Remove Drinks Occasion from Booking Flow

## Requirements

- Functional: Booking wizard must not offer the `drinks` occasion for any restaurant; schedule endpoint should never return it.
- Non-functional (a11y, perf, security, privacy, i18n): Change must keep schedule payload consistent; no perf impact; DB updates must be auditable and reversible.

## Existing Patterns & Reuse

- Supabase `booking_occasions` catalog controls global availability flags for each occasion (`key`, `label`, `is_active`).
- `restaurant_service_periods` rows map restaurants/day parts to `booking_option` values; these need to align with valid occasions.
- Prior task folders document remote-only Supabase operations and use of the Supabase CLI as described in `SUPABASE_SCHEMA_EXPORT_GUIDE.md`.

## External Resources

- [Supabase Remote CLI](https://supabase.com/docs/guides/cli/local-development) – reference for running `supabase db remote psql` safely.

## Constraints & Risks

- Supabase operations must be remote; never run locally per AGENTS.md.
- Updating live data requires careful scoping (e.g., filter by restaurant or occasion) to avoid breaking other flows.
- Need to confirm whether `drinks` is referenced globally or per-restaurant before altering data.
- Any change should be reversible (capture previous values before updates).

## Open Questions (owner, due)

- Q: Is `drinks` still needed for any hidden/legacy restaurant? (Owner: TBD, Due: before update)
  A: Pending confirmation via Supabase queries; assume "no" unless results say otherwise, but document if rows found.

## Recommended Direction (with rationale)

- Query Supabase remotely to inspect `booking_occasions` and `restaurant_service_periods` (per provided SQL) to find any remaining `drinks` references. This directly targets the backend root cause.
- If `booking_occasions.is_active` is still `true` for the `drinks` key, set it to `false`. This prevents the schedule endpoint from emitting it globally.
- Additionally, inspect `restaurant_service_periods.booking_option` for `drinks`; if present, update to an appropriate active option (likely `dining` or `default`) or delete the rows, aligning with business rules.
- Record commands, results, and updates in `todo.md` and `verification.md` for traceability.
