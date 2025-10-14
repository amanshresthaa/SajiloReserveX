# Research: Fix Ops Summary Loyalty Join

## Existing Patterns & Reuse

- `server/ops/bookings.ts#getTodayBookingsSummary` currently requests `loyalty_points!left(...)` directly inside the bookings query but Supabase lacks a direct FK from `bookings` to `loyalty_points`.
- `server/ops/vips.ts#getTodayVIPs` uses the same `loyalty_points!inner(...)` join pattern, so it will hit the same failure once called.
- Other modules fetch loyalty data by querying `loyalty_points` with `customer_id` filters (see historical commits); mapping per customer is the safest approach.

## External Resources

- [PostgREST embedded resources](https://postgrest.org/en/stable/api.html#embedding) – confirms joins require declared foreign-key relationships.

## Constraints & Risks

- Supabase schema exposes `loyalty_points` linked to `customers` (via `customer_id`) and `restaurants`, but **not** directly to `bookings`.
- Need to preserve the `loyaltyTier`, `loyaltyPoints`, and marketing opt-in fields for downstream consumers.
- Additional queries must stay within acceptable performance bounds; expect tens (not hundreds) of bookings per day.

## Open Questions (and answers if resolved)

- Q: Is there an appropriate foreign key to use for PostgREST embedding?
  A: No join exists between `bookings` and `loyalty_points`; only `loyalty_point_events` references `bookings`.

## Recommended Direction (with rationale)

- Fetch bookings (and profile data) as-is, then request loyalty points in a **second query** keyed by `customer_id` + `restaurant_id` and map results back into each booking. Repeat the pattern inside the VIP helper to keep behavior consistent and avoid PostgREST join errors.
