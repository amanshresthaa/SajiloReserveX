# Research: Plan Step Prefetch

## Requirements

- Functional:
  - Prefetch reservation schedules as soon as the Plan step becomes active so weekend closures are known before users open the calendar.
  - Prevent interaction with dates that are still loading so users never click a day whose availability is unknown.
- Non-functional (a11y, perf, security, privacy, i18n):
  - Keep using the existing `usePlanStepForm`/React Query infrastructure so caching and analytics continue to work.
  - Avoid blocking the UI for long periods—prefetch calls must stay asynchronous and respect abort signals.
  - Preserve accessible focus management in `Calendar24Field` (no custom DOM work that would break SR reading).

## Existing Patterns & Reuse

- `usePlanStepForm` (`reserve/features/reservations/wizard/hooks/usePlanStepForm.ts`) already exposes `prefetchVisibleMonth`, `loadingDates`, and `unavailableDates`—we should extend this hook rather than layering new fetch helpers.
- `Calendar24Field` (`reserve/features/reservations/wizard/ui/steps/plan-step/components/Calendar24Field.tsx`) already receives `loadingDates` but currently ignores them inside the disabling logic, which is the visual gap we need to close.
- React Query schedule fetchers live in `reserve/features/reservations/wizard/services/schedule.ts`; no new network client is required.

## External Resources

- Product note from user request “Booking Calendar Fix - Plan Step Prefetch Solution” (2025-11-08) describing the desired UX: disabled weekends immediately on entry and prefetch before interaction.

## Constraints & Risks

- Prefetch currently fans out into ~30 single-date requests; marking all of those dates as “disabled while loading” might block clicks for ~200–400 ms. Need to confirm UX is acceptable and keep the loading indicator so users understand why dates are blocked.
- Any new effect that triggers eager prefetching must honor abort controllers; otherwise we risk duplicate in-flight requests when the restaurant slug changes.
- Tests rely on deterministic DOM order—changing disabled logic means updating snapshots/expectations.

## Open Questions (owner, due)

- Should we also add a batch endpoint per the product note? Assumption: **not for this task**—we’ll rely on the established per-date query path to stay aligned with the current backend.

## Recommended Direction (with rationale)

- Reuse `prefetchVisibleMonth` inside `usePlanStepForm` and explicitly fire it when the hook mounts to guarantee schedule fetches start before any calendar interaction.
- Treat entries in `loadingDates` as disabled inside `Calendar24Field` so prefetched days appear greyed out immediately; the map already shrinks as results arrive, so we get seamless transitions without extra state.
- Extend the existing component/unit tests to assert the new behavior (initial prefetch invocation + disabled loading days) to guard against regressions.
