# Plan — Sprint S1 Time-Slot Service

## 1. Goal & Success Criteria

- Deliver backlog item S1: introduce a dedicated time-slot domain service and hook powering the reservation wizard PlanStep.
- After implementation, PlanStep must obtain slot data strictly via the new `useTimeSlots` hook (no inline generation helpers).
- Service layer must be pure/deterministic, reusable by reducers/actions later in the sprint, and covered by boundary-focused unit tests (weekday vs weekend, happy hour, DST).

## 2. Architectural Decisions

1. **Module layout**
   - `reserve/shared/time/index.ts` (barrel): exports foundational primitives used across app.
   - `reserve/shared/time/time.ts` (new): `toMinutes`, `fromMinutes`, `clampMinutes`, `minutesBetween`, `createMinutesRange`, `slotsForRange`.
   - `reserve/shared/time/date.ts`: helpers for creating zoned dates (London), parsing `YYYY-MM-DD`, DST-safe constructors.
   - Future S4 will relocate formatting/validation; keep this module focused on time math only.
   - Expose `LONDON_TIME_ZONE = 'Europe/London'` constant for consistent usage.
2. **Wizard service**
   - `reserve/features/reservations/wizard/services/timeSlots.ts`:
     - Pure functions, no React imports: `deriveTimeSlotConfig`, `buildTimeSlots`, `inferServiceAvailability`, `resolveDefaultService`.
     - Accepts an explicit configuration object `{ open, close, intervalMinutes, windows }` to decouple from forthcoming config module (S2). Provide deterministic defaults matching current values for now.
     - Output structure:
       ```ts
       export type TimeSlotDescriptor = {
         value: ReservationTime;
         display: string;
         label: 'Lunch' | 'Dinner' | 'Happy Hour' | 'Drinks only';
         availability: ServiceAvailability;
         disabled: boolean;
       };
       ```
     - `ServiceAvailability` mirrors existing labels + enablement map to support occasion toggles.
3. **React hook**
   - `useTimeSlots({ date, desiredBookingType, config })` in same module or sibling `useTimeSlots.ts` (React-specific file to keep pure functions tree-shakable).
   - Hook memoizes results via `useMemo` and uses `useRef` to avoid regenerating arrays when inputs unchanged.
   - Hook returns tuple `{ slots, serviceAvailability, select(time) }` or simply `slots` + `getAvailability` depending on PlanStep integration needs. Keep API minimal but future-proof for reducers.
4. **Type branding**
   - Introduce `type ReservationTime = Brand<string, 'ReservationTime'>` within `shared/time` to prevent passing random strings. Provide casting helper `asReservationTime` validated by regex.
5. **Testing strategy**
   - Unit tests colocated with modules (`reserve/shared/time/__tests__`, `reserve/features/reservations/wizard/services/__tests__`). Use Vitest.
   - For React hook, use React Testing Library’s `renderHook`.
   - Use deterministic timezone by mocking `Intl.DateTimeFormat` or `Date` to London; consider using `@sinonjs/fake-timers` (verify if already in deps) or manual overrides.

## 3. Implementation Steps

1. **Scaffold shared time utilities**
   - Create directory + base exports.
   - Port/centralize logic from `bookingHelpers` (ensure no behavioral changes) and document TODO for S4 to remove duplication.
   - Provide typed helpers for `ReservationDate`/`ReservationTime` parsing.
2. **Author wizard time-slot service (pure functions)**
   - Define configuration interface and defaults (mirroring current `RESERVATION_CONFIG` + `bookingHelpers.serviceWindows`).
   - Implement helpers:
     - `getServiceWindows(date, config)` returning lunch/dinner/drinks/happyHour.
     - `buildTimeSlots(date, config)` returns array with label + display + raw time values; uses shared time primitives + booking formatters for display (temporarily).
     - `getServiceAvailability(date, time, config)` replicates existing logic but pure.
     - `resolveDefaultBookingOption(date, time, config)` for hooking/resuse.
3. **Implement `useTimeSlots` hook**
   - Accept props `{ date, activeTime, config, formatTimeFn }` (inject formatting to avoid hooking to bookingHelpers directly; default uses existing formatter until S4).
   - `useMemo` to compute `slots` once per date/config; inside map, attach `disabled` based on availability + desired booking type.
   - Return object with `slots`, `availabilityMap` (for toggle state), and helper `select(time)` returning derived booking option for PlanStep to apply.
4. **Refactor PlanStep to consume new hook**
   - Remove local helper functions + `RESERVATION_CONFIG`; import from new service/hook.
   - Replace `useMemo(generateTimeSlots)` with hook call; adjust slot rendering to use descriptors directly.
   - Ensure `serviceAvailability` for toggle group derives from hook output (avoid recomputing per render).
   - Keep analytics + form wiring intact; ensure types align with `ReservationTime` (cast where necessary until forms updated).
5. **Testing & validation**
   - Add unit tests for shared time primitives: `toMinutes/fromMinutes`, `slotsForRange`, DST transitions (e.g., 2025-03-30, 2025-10-26).
   - Add service tests for `getServiceAvailability` and `buildTimeSlots` covering weekend vs weekday, happy hour, outside hours, missing date.
   - Hook tests verifying memoization and derived disabled flags (simulate date change, ensure stable references).
   - Run `pnpm lint`, `pnpm test`.
6. **Documentation & migration note**
   - Update `tasks/sprint-s1-time-slot-service/todo.md` (if needed) or `MIGRATION.md` with new exports and temporary duplication with booking helpers.
   - Prepare for S2 by noting config injection adjustments.

## 4. Verification Plan

- Static checks: `pnpm lint`, `pnpm typecheck` (if time permits) focusing on modules touched.
- Unit tests: new suites + existing store tests.
- Manual review: verify PlanStep UI locally (optional) or ensure Storybook stories exist for quick comparison (S3 will handle splitting but ensure slot grid still renders with new data).
- Review analytics/haptics unaffected (no direct change yet).

## 5. Open Questions / Items to Revisit

- Confirm whether to place formatting helpers in shared/time or keep temporary dependency on `bookingHelpers.formatTime`. Proposed to inject function via hook props to avoid coupling.
- Determine best home for configuration defaults before S2 lands — possibly temporary `wizard/services/timeSlotConfig.ts` re-export.
- Decide if `ReservationTime` brand should be introduced now or deferred to S4 to avoid touching schema validations; lean toward introducing now with helper `toReservationTime` returning branded type post-validation.

## 6. Risk Mitigation Notes

- Keep PlanStep refactor limited to data sourcing; avoid structural UI changes reserved for S3.
- Document temporary duplication so S4 can remove `bookingHelpers` overlap without guesswork.
- For DST tests, compare counts + first/last slots across transition dates to catch off-by-one errors.
