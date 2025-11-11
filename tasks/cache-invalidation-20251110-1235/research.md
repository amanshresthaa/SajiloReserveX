# Research: Availability Cache Invalidation

## Requirement

Ensure server mutations that affect availability (create/update/cancel bookings) actually wait for the Redis invalidation to complete so stale caches don’t linger under load.

## Findings

- `softCancelBooking`, `updateBookingRecord`, and `insertBookingRecord` call `invalidateAvailabilitySnapshot` via `void`, meaning the promise isn’t awaited.
- Under heavy load the async invalidation can be dropped if the request finishes or throws afterward, causing stale data for the next customer view.

## Direction

- Await invalidation calls in these codepaths; they already run in async functions so nothing else needs to change.
- No batching needed; the invalidation is cheap and IO-bound.
