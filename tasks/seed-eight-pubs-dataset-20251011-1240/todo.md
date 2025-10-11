# Implementation Checklist

## Preparation

- [x] Snapshot prior seed structure and identify update points.
- [x] Map provided pub tuples and metadata into SQL CTE.
- [x] Determine booking counts for past/today/future buckets.

## Script Changes

- [x] Replace restaurant insert with provided IDs and reservation settings.
- [x] Populate operating hours and service periods for all pubs.
- [x] Generate deterministic customer dataset sized for booking load.
- [x] Implement booking generation achieving 100 past, 40 today, ≥110 future bookings.
- [x] Ensure booking metadata (status, references, details) aligns with conventions.
- [x] Update customer profile aggregation where necessary.

## Validation

- [x] Add commented sanity-check query for bucket counts.
- [ ] Execute seed script + query on remote (pending credentials/approval).
- [x] Update documentation references describing new dataset.
