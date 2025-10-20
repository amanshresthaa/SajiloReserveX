# Implementation Checklist

## Setup

- [x] Draft Supabase migration for `booking_occasions` table + FK update
- [x] Update seed data / Supabase types to include new catalogue

## Core

- [x] Build shared occasion types & availability evaluator
- [x] Implement server catalogue loader + `/api/ops/occasions`
- [x] Update `/api/owner/restaurants/:id/service-periods` validation & payload
- [x] Refresh ops client services/hooks for new catalogue usage
- [x] Refactor schedule builder to consume catalogue + apply availability rules
- [x] Adjust shared booking config, reducer, and schema to accept dynamic keys

## UI/UX

- [x] Update ops `ServicePeriodsSection` select to render dynamic occasions
- [x] Update reservation wizard (OccasionPicker, PlanStep) to use catalogue metadata

## Tests

- [x] Unit: catalogue evaluator + schedule filtering
- [x] Integration: ops service-period route + new ops occasions endpoint
- [x] Update reservation wizard tests (unit/integration)
- [ ] Re-run (or plan) accessibility/manual QA steps

## Notes

- Assumptions: Occasion catalogue must contain every booking option reference; missing definitions intentionally hide options client-side.
- Deviations: Manual QA pending; `next build` currently blocked by missing ops pages in this environment—needs separate follow-up.

## Batched Questions (if any)

- ...
