# Research: quoteTablesForBooking Parallelism

## Requirement

Reduce allocator latency by parallelizing independent Supabase reads inside `quoteTablesForBooking`, specifically restaurant timezone lookup, table inventory, strategic config, demand multiplier, context bookings, and holds.

## Observations

- Previously we awaited each fetch sequentially, adding multiple request/response cycles (~100–200 ms each under load).
- Context bookings and active holds were fetched back-to-back even though they can be requested simultaneously.
- Demand multiplier and strategic config calls could run while we fetch tables/adjacency.

## Direction

- Kick off `loadRestaurantTimezone`, `loadTablesForRestaurant`, `loadStrategicConfig`, and `resolveDemandMultiplier` immediately after reading the booking.
- For time-pruning/hold-aware paths, request context bookings and holds via `Promise.all` and retain existing error handling.
- Continue to await adjacency after tables resolve (dependency) but avoid blocking other tasks.
