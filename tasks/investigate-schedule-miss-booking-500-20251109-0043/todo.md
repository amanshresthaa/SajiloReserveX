# Implementation Checklist

## Setup

- [ ] Locate schedule API handler and booking POST handler; map data sources.

## Investigation

- [ ] Reproduce `schedule.fetch.miss` events and inspect logs.
- [ ] Trace Supabase queries for schedules/booking to confirm restaurant slug requirement.

## Fix

- [ ] Apply code/data changes to ensure schedules load and booking POST doesn't 500 when restaurant missing.
- [ ] Update error handling/logging to be descriptive.

## Verification

- [ ] Run `pnpm run dev` or targeted script to confirm schedule fetch success and booking submission works.
- [ ] Run `pnpm run lint` if code changes were made.

## Notes

- Assumptions: dev env uses Supabase remote dataset; slug should exist.
- Deviations: none yet.
