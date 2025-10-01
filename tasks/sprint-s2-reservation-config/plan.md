# Plan — Sprint S2 Reservation Config

## 1. Goal & Acceptance Criteria

- Create `@reserve/shared/config/reservations` exporting typed reservation configuration (time windows, interval, duration, copy) with environment overrides and non-throwing validation.
- Provide resolver API returning `{ config, issues }` (or similar) so consumers can act on validation problems without crashing during import.
- Update all current hard-coded consumers (time-slot service, PlanStep hook default, ConfirmationStep duration) to source values exclusively from the new module.
- Ensure booking helpers and legacy helpers re-use the same config to avoid divergence until S4 decomposition.
- Coverage: add unit tests for config resolver (env override + validation failure reporting), adjust existing tests impacted by config changes.

## 2. Design Decisions

1. **Module Structure**
   - `reserve/shared/config/reservations.ts`
     - Define `ReservationConfigSchema` via zod (or manual validation) capturing:
       ```ts
       type ReservationConfig = {
         timezone: string;
         opening: {
           open: ReservationTime;
           close: ReservationTime;
           intervalMinutes: number;
         };
         windows: {
           weekdayLunchEnd: ReservationTime;
           weekendLunchEnd: ReservationTime;
           dinnerStart: ReservationTime;
           happyHour?: { start: ReservationTime; end: ReservationTime };
         };
         defaultDurationMinutes: number;
         copy: {
           unavailableTooltip: string;
           waitlistDescription: string; // optional future use
         };
       };
       ```
     - Export `defaultReservationConfig` (frozen constant) and `resolveReservationConfig(runtimeOverrides?)` returning `{ config, issues }`.
     - Environment overrides map to keys like `RESERVE_RESERVATION_OPEN`, `..._CLOSE`, `..._INTERVAL`, `..._DURATION`, `..._TIMEZONE`.
     - Validation collects issues (invalid format, interval <= 0, open >= close). On invalid overrides, fallback to defaults while appending warning messages.
     - Provide helper `reservationConfigResult` singleton computed at module load but without throwing; if issues exist, log warnings only in dev/test via `console.warn`.
2. **Consumer Integration**
   - `timeSlots.ts`: import `reservationConfigResult.config` as default config, expose ability to pass other config for tests. Remove internal `DEFAULT_CONFIG`; rely on config module.
   - `useTimeSlots`: default to config module; accept optional override for tests (prop remains).
   - `ConfirmationStep`: replace `EVENT_DURATION_MINUTES` with `reservationConfig.defaultDurationMinutes` (or destructured constant).
   - `bookingHelpers.serviceWindows` and legacy `components/reserve/helpers.ts`: derive window data from shared config; ensures single source until S4 refactor.
3. **Testing Strategy**
   - New tests for `resolveReservationConfig` verifying:
     - Default config matches existing values.
     - Env overrides adjust open/close/duration and record issues when invalid.
     - Logging occurs when issues present (mock `console.warn`).
   - Update existing `timeSlots` and `useTimeSlots` tests if necessary (ensure they continue to pass with config change; optionally mock config result to isolate behaviour).
   - Add regression test for ConfirmationStep ICS builder to ensure duration still 90 when default unchanged (or mutated when override set).

## 3. Implementation Steps

1. **Introduce config module**
   - Create `reservations.ts` with defaults matching current behaviour (open 12:00, close 23:00, interval 30, lunch end 15:00 weekdays / 17:00 weekends, dinner start 17:00, happy hour 15-17 weekdays, default duration 90, timezone Europe/London, tooltip text).
   - Implement helper functions:
     - `parseReservationTime(value, fallback, issues, key)` reusing shared time brand parsing.
     - `registerIssue({ key, value, reason })` to capture problems.
   - Export `ReservationConfigResult` with shape `{ config: ReservationConfig; issues: ReservationConfigIssue[] }` and instantiate `reservationConfigResult` at module level. Log warnings in dev if `issues.length > 0`.
2. **Refactor time-slot service**
   - Import config + type, remove local default, use config opening/windows/formatting (formatting can remain internal but rely on config timezone for `Intl.DateTimeFormat`).
   - Provide optional `config` parameter to `buildTimeSlots` with default `reservationConfigResult.config` so tests can supply custom config without hitting global state.
3. **Update consumers**
   - `useTimeSlots`: pass `reservationConfigResult.config` as default when no override provided.
   - `PlanStep`: no direct change besides ensuring `useTimeSlots` uses config (already done via hook).
   - `ConfirmationStep`: import config and use `defaultDurationMinutes` for ICS window and any related messaging.
   - `bookingHelpers.serviceWindows` + legacy helpers: replace hard-coded times with values derived from config; until S4, ensure functions operate on config data (e.g., compute lunch end based on weekday/weekend end times and happy hour toggles).
4. **Testing & verification**
   - Add `reserve/shared/config/__tests__/reservations.test.ts` verifying default + overrides + issue handling.
   - Adjust `timeSlots` tests if necessary to use `reservationConfigResult.config` (should remain stable).
   - Run `pnpm lint`, `pnpm test -- --runInBand`.
5. **Documentation / Notes**
   - Update `tasks/sprint-s2-reservation-config/todo.md` with tracked steps.
   - Note in `notes.md` (if needed) about dependency for S3 (PlanStep splitting) and S4 (booking util decomposition) now using config module.

## 4. Risk Mitigation

- Keep default values identical to current behaviour to avoid UI regression; add assertion in tests comparing config defaults to previously hard-coded constants.
- Ensure issue logging only in dev/test to avoid noisy prod logs; consider feature flag to escalate to monitoring later.
- When updating booking helpers, be careful to maintain API compatibility; add unit tests verifying service windows behaviour unchanged.

## 5. Open Questions / Follow-ups

- Should tooltip copy & descriptive badges come from config or remain in UI copy? For S2 scope, keep tooltip in config to satisfy “copy externalised” objective; evaluate other strings separately.
- Consider exposing `getReservationConfig()` function returning deep-cloned config for mutation safety (esp. tests). Decide during implementation.
- Document env variable names in `MIGRATION.md` once module introduced.
