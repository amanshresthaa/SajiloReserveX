# Research: Booking Availability Resilience

## Existing Patterns & Reuse

- Wizard availability stack already centralises schedule logic in `reserve/features/reservations/wizard/services/useTimeSlots.ts` and `timeSlots.ts`, yielding `TimeSlotDescriptor` objects with `disabled`, `availability.labels`, and booking option defaults that the create flow trusts. Reusing these types for edit ensures parity for `isDateUnavailable`, past-time guards, and capacity checks.
- UI building blocks exist: `Calendar24Field` couples `Calendar` from `@shared/ui/calendar`, exposes `isDateUnavailable`, `onMonthChange`, interval-aware `<input type="time">`, and displays wizard copy for closed/no-slot states; `TimeSlotGrid` renders slot groups with accessibility-friendly buttons. Composing these instead of the generic `TimestampPicker` should give edit flow identical affordances.
- `usePlanStepForm.ts` maintains unavailable-date metadata via `useUnavailableDateTracking` (prefetching month schedules) and `deriveUnavailableReason`. Current reasons only handle `'closed' | 'no-slots'`, which we can extend to `unknown` to cover far-future/no-data states while reusing the same map-and-tooltip infrastructure.
- Query infrastructure is consistent: both `src/app/providers.tsx` and `components/reserve/booking-flow/index.tsx` spin up `QueryClient` instances with gentle defaults. Extending these providers with TanStack Query v5 offline/persist primitives keeps configuration centralised instead of sprinkling persistence logic per hook.
- Offline queue precedent already exists in `src/contexts/booking-offline-queue.tsx`, which wraps mutations, checks `useOnlineStatus`, and flushes on reconnect. We can adapt the shape (enqueue/dequeue/flush) or even generalise it for customer flows rather than inventing a new queue.
- Post-edit refresh pathways: `hooks/useUpdateBooking.ts` currently only invalidates `queryKeys.bookings.all`. Reservation detail relies on `useReservation` (`reservationKeys.detail`) with `refetchOnWindowFocus: false`. Slot-level data for the wizard lives under `scheduleQueryKey(slug,date)`. These keys need to be part of the invalidation fan-out after edits to guarantee consistency.

## External Resources

- TanStack Query React v5 docs on [`networkMode: 'offlineFirst'`](https://tanstack.com/query/latest/docs/framework/react/guides/offline) and [`persistQueryClient`](https://tanstack.com/query/latest/docs/framework/react/plugins/persistQueryClient) — confirm API shapes and storage adapters for offline retry queues and draft persistence.
- React Day Picker disabled-day & tooltip patterns (https://react-day-picker.js.org/) to ensure our calendar props for “schedule not loaded” tooltips align with component expectations.
- MDN guidance on IndexedDB vs `localStorage` for TTL data (https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) so the draft storage choice meets resilience requirements without blocking the main thread.

## Constraints & Risks

- Shared availability adapter must avoid duplicating React Query hooks. Pulling helpers out of `useTimeSlots` should still honour memoisation and not trigger double fetches for the wizard. We need a lightweight façade (pure functions reusing existing DTOs) rather than rewiring the hook from scratch.
- Edit dialog currently passes ISO strings into `TimestampPicker`. Replacing it with schedule-aware components introduces a dependency on restaurant context (slug, timezone, capacity rules). We have to ensure the edit flow can resolve those inputs (possibly via additional props or queries) without regressing current freedom to edit bookings lacking schedule metadata.
- `Calendar24Field` was designed for wizard layout (two-column). Using it in dashboards might require responsive tweaks or prop gates. We must validate in devtools that the composed `ScheduleAwareTimestampPicker` keeps accessible labels, keyboard traps, and focus management intact.
- Extending unavailable reasons to include “unknown/no data” impacts tests under `reserve/features/reservations/wizard/ui/steps/plan-step/__tests__`. We need to expand fixtures to keep existing behaviour passing.
- Offline queue/persistence will touch global providers. TanStack’s persistence requires stable storage (likely IndexedDB); we must guard SSR and avoid crashing older browsers lacking IndexedDB (fallback to noop persister).
- Auto-invalidating related queries risks thundering-herd refetches if we indiscriminately wipe caches. Need predicate-based invalidation (matching reservation id, bookings list filters, schedule keys for affected date) to minimise over-fetching.

## Open Questions (and answers if resolved)

- Q: How will the edit flow know which restaurant slug/date to feed the shared adapter?  
  A: Booking DTO currently exposes `restaurantId` but not slug; we’ll confirm if `/api/bookings/:id` response (see `src/app/api/bookings/[id]/route.ts`) includes slug-equivalent metadata, or whether we need an additional lookup before implementation.
- Q: Should wizard drafts live in IndexedDB or `localStorage`?  
  A: Pending decision — IndexedDB is more resilient for larger payloads and aligns with TanStack’s default persister; however, `localStorage` is simpler for TTL purge. Research leaned towards IndexedDB via `@tanstack/query-persist-client-core` with TTL checks at hydration.
- Q: Do we already record schedule fetch misses or selection blocks in analytics?  
  A: No `schedule.fetch.miss` events exist today (checked via `rg 'schedule.fetch'`). We’ll add new `emit` calls once the adapter surfaces those conditions.

## Recommended Direction (with rationale)

- **Shared adapter**: Introduce `reserve/shared/schedule/availability.ts` exporting pure helpers (`getDisabledDays`, `getTimeSlots`, `isPastOrClosing`, `hasCapacity`) that wrap the existing `ReservationSchedule` + `TimeSlotDescriptor` logic. They can accept schedule DTOs (fetched via existing `useTimeSlots` or server data) so edit/create flows share rule evaluation without duplicating fetch logic.
- **Schedule-aware picker**: Build `ScheduleAwareTimestampPicker` that composes `Calendar24Field` + `TimeSlotGrid`, parameterised by adapter helpers and wired to wizard copy (reuse strings and i18n keys). Gate rollout behind `edit.schedule-parity` feature flag and re-export from `TimestampPicker.tsx` so existing imports transition smoothly.
- **Far-future safeguards**: Extend unavailable reasons to include `unknown`, treat missing schedule responses as disabled dates (with tooltip message), and trigger month-level prefetch via `onViewChange` to fetch visible + adjacent months. Display skeleton states and in-place retry when requests fail.
- **Offline resilience**: Centralise wizard mutations and use TanStack Query’s `networkMode: 'offlineFirst'`, coupled with a persisted query client + queue manager (inspired by `BookingOfflineQueueProvider`). Store drafts with `expiresAt` TTL (≈6h), clearing stale entries on mount and prompting users to refresh availability.
- **Cache invalidation & live refresh**: Expand `useUpdateBooking` success handler to invalidate reservation detail, bookings list, and relevant schedule queries; optionally patch cache optimistically. Subscribe detail view to focus/refetch or mutation-driven event bus to reflect edits within 1s.
- **QA & instrumentation**: Plan new Playwright coverage for closed slots, far-future disabled dates, offline submit/retry, and post-edit consistency. Add `emit` counters (`schedule.fetch.miss`, `selection.blocked.closed`, `mutation.retry.offline`, `wizard.reset.triggered`) at the decision points surfaced above to quantify reductions in flaky edits.
