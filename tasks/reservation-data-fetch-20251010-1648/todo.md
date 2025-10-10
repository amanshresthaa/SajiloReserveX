# Implementation Checklist

## Database & Types

- [x] Add SQL migration for `booking_option` column on `restaurant_service_periods` and reservation columns on `restaurants`.
- [x] Update `types/supabase.ts` to reflect new columns.
- [x] Seed baseline operating hours and service periods with booking options.

## Server Layer

- [x] Update `server/restaurants/servicePeriods` read/write logic for `bookingOption`.
- [x] Extend owner API route schemas for the new field.
- [x] Implement `getRestaurantSchedule` helper combining operating hours + service periods.
- [x] Create public schedule API route for `/api/restaurants/[slug]/schedule`.

## Frontend (Ops)

- [x] Update service period React Query hook types to include `bookingOption`.
- [x] Add booking option select UI in `ManageRestaurantShell` and adjust payload builders.

## Frontend (Reserve)

- [x] Replace `useTimeSlots` to fetch schedule via React Query.
- [x] Update plan step form + dependent utilities to consume API response metadata.
- [x] Adjust confirmation logic to use DB-backed duration/interval settings.
- [x] Ensure fallback UI for missing slots states.

## Testing & Verification

- [x] Update/extend API route tests for service periods and new schedule endpoint.
- [x] Refresh wizard service tests to match API-driven behavior.
- [ ] Document verification steps in `verification.md` after manual QA.

## Questions/Blockers

- Determine expected default behavior when no operating hours/service periods exist (likely show “no availability”).
