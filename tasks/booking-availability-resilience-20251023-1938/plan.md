# Implementation Plan: Booking Availability Resilience

## Objective

We will enable guests (create + edit) and operators to interact with a single, resilient availability surface so that invalid slots never appear selectable, far-future calendars behave honestly, offline attempts are retried automatically, and every booking view reflects edits within one second.

## Success Criteria

- [ ] Edit dialog renders the same disabled-day/slot logic as the wizard; normal clicking cannot trigger server-side `closed/no slots/past time` errors (`BOOKING_IN_PAST` only reachable via manual overrides).
- [ ] Far-future months with no schedule data render as disabled with “Schedule not loaded yet—scroll to load month” tooltip; failed fetches show inline retry without full wizard reset.
- [ ] Wizard submissions queue offline, auto-retry on reconnect, and drafts expire after ~6h with a refresh prompt; no silent data loss when connection drops mid-flow.
- [ ] Post-edit, `useReservation`, bookings lists, and cached slot data show updated times within 1s via invalidation/refetch; optimistic patch (if applied) never leaves stale state after rollback.
- [ ] Telemetry counters (`schedule.fetch.miss`, `selection.blocked.closed`, `mutation.retry.offline`, `wizard.reset.triggered`) emit under the new logic, and Playwright coverage exercises closed/far-future/offline cases.

## Architecture & Components

- `reserve/shared/schedule/availability.ts` (new): expose pure helpers (`getDisabledDays`, `getTimeSlots`, `isDateUnavailable`, `isPastOrClosing`, `hasCapacity`) that wrap existing `ReservationSchedule` + `TimeSlotDescriptor` semantics. Accepts DTOs from `useTimeSlots` or server responses so both flows share rule evaluation.
- `ScheduleAwareTimestampPicker` (new, likely `src/components/features/booking-state-machine/ScheduleAwareTimestampPicker.tsx`): compose `Calendar24Field` + `TimeSlotGrid`, inject adapter helpers, reuse wizard copy/i18n keys, surface tooltips for closed/no-slots/unknown. Accepts props for `restaurantSlug`, `restaurantId`, `timezone`, `selectedDate`, mutation hooks, etc.
- `src/components/features/booking-state-machine/TimestampPicker.tsx`: deprecate current generic picker by exporting the new schedule-aware component (behind `edit.schedule-parity` flag) while keeping the old UI available for fallback/test toggles.
- `components/dashboard/EditBookingDialog.tsx`: swap to `ScheduleAwareTimestampPicker`, load schedule metadata via adapter (fallback to default slug/timezone or fetch slug by `restaurantId` if available), align copy with wizard, handle capacity/past-time messaging.
- `reserve/features/reservations/wizard/hooks/usePlanStepForm.ts`: extend unavailable reasons to include `unknown`, treat missing schedule as disabled, add `onViewChange` prefetch (visible + adjacent months), surface retry UI, update tests under `__tests__`.
- `reserve/shared/ui/calendar.tsx`: forward new props (`getDisabledReason`, tooltip renderer) to Shadcn calendar to support “schedule not loaded” messaging consistently.
- Query providers (`src/app/providers.tsx`, `components/reserve/booking-flow/index.tsx`): configure TanStack Query persistence (`persistQueryClient`, IndexedDB storage) and set `networkMode: 'offlineFirst'` for reservation mutations; centralise onlineManager / focusManager wiring.
- Offline queue/draft management: extend or generalise `src/contexts/booking-offline-queue.tsx` for customer wizard mutations, add wizard-specific provider (e.g., `reserve/features/reservations/wizard/offline/BookingQueueProvider.tsx`) storing drafts with TTL metadata in IndexedDB/localStorage.
- `hooks/useUpdateBooking.ts`: broaden invalidations via predicate to hit reservation detail (`reservationKeys.detail`), bookings lists (including filtered keys), and schedule queries (`scheduleQueryKey` for venue/date); optionally emit optimistic update event bus.
- `src/app/reserve/[reservationId]/ReservationDetailClient.tsx`: subscribe to mutation success events or enable `refetchOnWindowFocus: true` with manual `queryClient.subscribe` to ensure 1s refresh; surface spinner while refetching.
- Instrumentation: add `emit` hooks in adapter (schedule misses), selection blockers, offline retry handler, and wizard reset path. Ensure analytics dependencies (`WizardDependenciesProvider`) swallow new events cleanly.

## Data Flow & API Contracts

- Schedule fetch remains `GET /restaurants/{slug}/schedule?date=YYYY-MM-DD` (existing). New adapter should not alter the wire contract; instead, it normalises `ReservationSchedule` for consumers. Need to confirm availability of slug for edit flow (if absent, plan to request slug via `/api/restaurants?search=` or extend booking detail response).
- Booking edit continues to call `PUT /api/bookings/:id` with `startIso`, `endIso`, `partySize`, `notes`. We will ensure mutation opts into `networkMode: 'offlineFirst'` and queue offline attempts using persisted query client.
- Wizard create uses existing `/bookings` endpoint; persistence layer stores mutation + draft payloads locally and replays when online.
- Analytics events travel through `/api/events` via `emit`. New counters should use snake-case names agreed with analytics team (documented in telemetry).
- Feature flag distribution: add `FEATURE_EDIT_SCHEDULE_PARITY` (env + runtime) exposed via `env.featureFlags` or a new UI-centric flag provider; gating ensures safe rollout (10% → 100%).

## UI/UX States

- Loading: Calendar shows skeleton shimmer for month grid while schedule fetch in-flight; time grid either greyed with spinner or placeholder copy “Loading availability…”.
- Empty/closed: reuse wizard messages (“We’re closed on this date…” / “All reservation times are taken…”). For far-future/no-data, show tooltip “Schedule not loaded yet—scroll to load month” with disabled styling.
- Error: Inline alert on calendar/time grid when fetch fails (`Retry` button, retaining existing selection). Offline state triggers banner in wizard (already present) plus queued submission toast once back online.
- Success: Slot selection updates summary, occasions, and ensures selected slot stays visible. After edit submit success, show toast and close dialog per current behaviour.
- Offline: Buttons disabled but show queued state indicator; wizard submission surfaces “We’ll retry automatically when you’re back online”.

## Edge Cases

- Bookings without restaurant slug/timezone (legacy data). Fallback to `DEFAULT_VENUE` config and document assumption; if slug missing, degrade gracefully (show warning, allow manual ISO entry).
- Schedules with zero slots but not marked `isClosed`: adapter must still detect `!slots.some(!disabled)` and treat as `no-slots`.
- Far-future fetch returning 404/empty: treat as `unknown`, disable date, and mark for retry once month comes into range.
- Offline during mutation flush: ensure queue retries respect idempotency keys and do not double-submit editing (especially with `bookingId`).
- Draft TTL expiration while wizard open: prompt user, clear draft, refetch schedule, and maintain A11y focus.
- Query invalidation predicate must avoid nuking unrelated caches (e.g., other restaurants). Filter by reservation id/restaurant id/time window.

## Testing Strategy

- Unit: Cover adapter helpers (disabled-day logic, capacity, past/closing), plan-step unavailable reason expansion, offline queue store, draft TTL clearing.
- Integration: React Testing Library specs for `ScheduleAwareTimestampPicker` (states: loading, closed, unknown, capacity full), `EditBookingDialog` (flag on/off), `usePlanStepForm` month prefetch fallback.
- E2E (Playwright): matrix create/edit × closed day/hour × capacity full × far-future, plus offline → reconnect submission. Include screenshot diffs for disabled states.
- Accessibility: axe scans on wizard Plan step + edit dialog; keyboard traversal over calendar/time grid (ensure focus vs. tooltip interplay).
- Performance: Profile calendar month change to ensure prefetch doesn’t block main thread; monitor offline queue flush for jank.

## Rollout

- Feature flag: Introduce `FEATURE_EDIT_SCHEDULE_PARITY` (`edit.schedule-parity`) default false. Rollout 10% canary via env flag, collect telemetry for 48h before 100%.
- Exposure: Start with internal dogfood (ops accounts), monitor analytics counters & server 4xx rates. Enable wizard offline queue globally once stability confirmed.
- Monitoring: Dashboard alerts on `schedule.fetch.miss` spike, `mutation.retry.offline` volumes, and reduction of server `BOOKING_IN_PAST` errors. Add Sentry breadcrumb when drafts expire unexpectedly.
