# Implementation Checklist

## Setup

- [x] Locate schedule API handler and booking POST handler; map data sources.

## Investigation

- [x] Reproduce `schedule.fetch.miss` events and inspect logs.
- [x] Trace Supabase queries for schedules/booking to confirm restaurant slug requirement.

## Fix

- [x] Apply code/data changes to ensure schedules load and booking POST doesn't 500 when restaurant missing.
- [x] Update error handling/logging to be descriptive.
- [x] Thread calendar mask API + SSR prop from booking pages into the wizard flow.
- [x] Ensure plan-step state uses the mask without regressing existing schedule prefetching.

## Verification

- [ ] Run `pnpm run dev` or targeted script to confirm schedule fetch success and booking submission works.
- [x] Run focused vitest suites for the calendar mask route and PlanStepForm masking behavior.
- [x] Run `pnpm run lint` if code changes were made.

## Notes

- Assumptions: dev env uses Supabase remote dataset; slug should exist.
- Deviations: none yet.
