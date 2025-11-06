# Implementation Checklist

## Setup

- [x] Confirm current Supabase schema for loyalty tables.

## Core

- [x] Update loyalty balance retrieval to use `restaurant_id` + `total_points`.
- [x] Align upsert payload with existing columns and conflict target.
- [x] Adjust event logging payload to legacy column names (`points_change`, `event_type`, etc.).

## Tests

- [x] Run linting per repo standards.

## Notes

- Assumptions: Single active loyalty program per restaurant; reuse `program.restaurant_id` for writes.
- Deviations: No schema migrations introduced; program-centric design deferred.
