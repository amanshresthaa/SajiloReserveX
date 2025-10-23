# Implementation Plan: Improve Reserve Booking Flow Prompt

## Objective

We will craft a repo-specific analysis prompt covering the /reserve booking create flow so that downstream reviewers receive comprehensive, actionable guidance aligned with actual architecture and data schemas.

## Success Criteria

- [ ] Prompt references concrete repo artifacts and data models.
- [ ] Prompt organizes requirements into clear, structured sections.

## Architecture & Components

- Source flow: `src/app/reserve/r/[slug]/page.tsx` → `components/reserve/booking-flow` (Next.js App Router). Booking wizard UI in `reserve/features/reservations/wizard`.
- Backend: `/api/bookings` route orchestrates validation, capacity engine, loyalty, audit, queueing.
- Data: Supabase `public.bookings` plus related tables (`customers`, `booking_table_assignments`, `booking_state_history`, etc.).

## Data Flow & API Contracts

- Schedule API: `GET /api/restaurants/[slug]/schedule` → `ReservationSchedule`.
- Booking Create API: `POST /api/bookings` expects body matching `bookingSchema`; returns booking payload + confirmation token + related bookings.
- React Query keys (`scheduleQueryKey`, `reservationKeys`) orchestrate caching.

## UI/UX States

- Wizard steps: Plan (date/time/party/notes), Details (contact, preferences), Review, Confirmation.
- Offline banner + sticky footer actions; handles loading, error, duplicate booking, offline states.

## Edge Cases

- Rate limit responses (429), past-time validation errors, capacity conflicts, duplicate idempotent submissions, offline mode disables actions, loyalty award failures.

## Testing Strategy

- Manual review of prompt content for accuracy.

## Rollout

- Provide prompt to requester.
