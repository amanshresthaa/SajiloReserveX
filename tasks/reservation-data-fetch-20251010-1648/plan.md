# Implementation Plan: Database-Driven Reservation Slots

## Objective

Enable both the public `/reserve` booking flow and the restaurant management interface to read and write reservation schedule data from Supabase instead of relying on static configuration.

## Success Criteria

- [ ] Booking wizard time-slot suggestions and availability labels load from Supabase-backed API responses.
- [ ] Manage Restaurant page reads/writes service periods including booking option metadata persisted in Supabase.
- [ ] Operating-hours/service-period updates affect customer-facing availability after refresh.
- [ ] Automated tests cover new schedule API and updated front-end logic.

## Architecture

### Data Model Changes

- Extend `restaurant_service_periods` with a `booking_option` enum (`lunch` | `dinner` | `drinks`).
- Augment `restaurants` table with `reservation_interval_minutes` and `reservation_default_duration_minutes` to replace hard-coded config values.
- Seed baseline operating hours and service periods so environments have data.

### Server Logic

- Create `getRestaurantSchedule` helper that combines restaurant details, operating hours (weekly + overrides), and service periods to compute slot descriptors for a given date.
- Add public API route (`/api/restaurants/[slug]/schedule`) that validates input, calls the helper with service-role Supabase client, and returns normalized payload for clients.
- Update owner API (`/service-periods`) to read/write new columns and validation.

## Component Breakdown

- **Database**: SQL migration altering `restaurant_service_periods` and `restaurants` tables; seed updates.
- **Server utilities**: New `server/restaurants/schedule.ts`; adjustments to existing `servicePeriods` helpers.
- **API layer**: New public route; update owner route schemas/types.
- **Reserve app**: Replace static `useTimeSlots` implementation with React Query hook calling `/schedule`; adjust reducers/helpers using duration/interval from API.
- **Ops manage UI**: Add booking option selector for each service period; update local state and payload builders.

## Data Flow

1. Customer selects restaurant/date; `/reserve/r/[slug]` hydrates `BookingWizard` with restaurant id.
2. `usePlanStepForm` invokes updated `useTimeSlots` which hits `/api/restaurants/[slug]/schedule?date=YYYY-MM-DD`.
3. API resolves restaurant, pulls schedule via `getRestaurantSchedule`, returns slots + metadata.
4. Wizard updates availability UI and selection defaults based on response.
5. Ops manage UI submits updated service periods to `/api/owner/restaurants/{id}/service-periods` including booking options; server persists to Supabase.

## API Contracts

### GET `/api/restaurants/[slug]/schedule?date=YYYY-MM-DD`

Response:

```json
{
  "restaurantId": "uuid",
  "date": "2025-05-08",
  "timezone": "Europe/London",
  "intervalMinutes": 15,
  "defaultDurationMinutes": 90,
  "slots": [
    {
      "value": "17:00",
      "display": "5:00 PM",
      "label": "Dinner",
      "defaultBookingOption": "dinner",
      "availability": { "services": {"lunch": "disabled", ...}, "labels": {...} },
      "disabled": false
    }
  ],
  "availability": {
    "services": {"lunch": "enabled", ...},
    "labels": {"happyHour": false, ...}
  }
}
```

- When closed/unconfigured: `slots` is empty with explanatory message.

### PUT `/api/owner/restaurants/{id}/service-periods`

Payload includes `bookingOption` (enum) per period.

## UI/UX Considerations

- Add SHADCN `Select` for booking option in Manage UI; ensure keyboard/focus states.
- Display helper text clarifying booking options align with customer wizard labels.
- Customer wizard should handle “no slots” gracefully with inline message.

## Testing Strategy

- Unit tests for `getRestaurantSchedule` covering weekly hours, overrides, service period mapping, closure cases.
- Update reserve `useTimeSlots` tests to mock API responses (React Query + MSW or manual fetch mock).
- Adjust existing service period route tests for new schema.
- Consider Playwright smoke to ensure slot rendering (time permitting).

## Edge Cases

- Restaurant lacks operating hours/service periods → respond with empty slots and status message.
- Overrides marking day closed → ensure API returns no slots but flagged status.
- Overlapping service periods → rely on existing validation preventing overlaps.
- Timezone offsets when date crosses DST; ensure schedule helper uses timezone-aware calculations.

## Rollout Plan

- Apply SQL migration and seed updates locally; ensure TypeScript types align.
- Deploy backend changes first (migration + API) followed by front-end updates.
- Monitor logging for schedule API to verify adoption.
