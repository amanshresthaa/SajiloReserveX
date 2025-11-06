# Research: Loyalty Points Schema Mismatch

## Requirements

- Functional: Restore loyalty award flow so bookings API can record loyalty points without runtime errors.
- Non-functional (a11y, perf, security, privacy, i18n): Maintain existing performance and data integrity expectations for Supabase interactions; no schema changes applied locally (remote only per policy).

## Existing Patterns & Reuse

- `server/ops/loyalty.ts` already queries `loyalty_points` using `restaurant_id` + `total_points`; reuse these columns.
- `loyalty_point_events` table currently stores `points_change`, `event_type`, and `schema_version` as per `supabase/schema.sql`.
- Booking insert/update paths follow `server/bookings.ts` with loyalty award triggered in `src/app/api/bookings/route.ts`.

## External Resources

- [supabase/schema.sql](../../supabase/schema.sql) – authoritative snapshot of deployed schema (no `balance`/`program_id` columns on `loyalty_points`).

## Constraints & Risks

- Cannot modify remote database from local fix; must align application code with existing schema.
- Other components (Ops dashboards) consume `total_points` and `tier`; changes must preserve their expectations.
- Ensure analytics/telemetry that depend on loyalty awards remain consistent after adjustments.

## Open Questions (owner, due)

- Q: Do we eventually need richer loyalty schema (program-based)?
  A: Out of scope; follow-up task if product requires it (owner: product, post-fix).

## Recommended Direction (with rationale)

- Update `server/loyalty.ts` to read/write existing columns: use `restaurant_id` uniqueness, `total_points` for balance, and legacy event shape (`points_change`, `event_type`, `schema_version`, `metadata`, `created_at`).
- Keep tier calculation logic intact; reuse `LOYAUTY_SCHEMA_VERSION` for event `schema_version` field.
- Record event `event_type` using same semantic strings currently emitted (`booking.confirmed` vs `booking.adjustment`).
