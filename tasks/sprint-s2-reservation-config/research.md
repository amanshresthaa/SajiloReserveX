# Research — Sprint S2 Reservation Config

## 1. Task Outline & Breakdown

- **Target backlog item**: S2 — externalise reservation configuration to `@reserve/shared/config/reservations` with env-driven overrides and typed runtime validation that does not throw during module import.
- **Initial subtasks considered**:
  - Catalogue all hard-coded reservation window values (open/close times, intervals, durations, labels, copy) across UI, services, and utilities.
  - Inspect existing configuration & runtime patterns to align new module behaviour (non-throwing validation, env fallbacks, typed exports).
  - Identify consumers that must switch to the new module (time-slot service, Confirmation step, booking helpers, legacy helpers, tests).
  - Define shape of the configuration object (time windows per service, default duration, copy strings, feature toggles) and how env overrides map in.
- **Challenge & refine**:
  1. **Duplication assessment** — differentiate between canonical logic (e.g., `bookingHelpers.serviceWindows`) vs transitional defaults in the new S1 service to avoid introducing conflicting sources.
  2. **Validation strategy** — determine whether we need a `Result` style return or lazily evaluated getter to meet “no throw on import” requirement while still surfacing errors early.
  3. **Env surface** — explore existing env keys to avoid collision and ensure naming consistency (`RESERVE_RESERVATION_*`).
  4. **Downstream update plan** — list all modules impacted so S3/S4 can consume the config without churn (PlanStep, ConfirmationStep, booking utils, tests).

## 2. Current State & Code Survey

- **Time-slot derivation** (`reserve/features/reservations/wizard/services/timeSlots.ts`):
  - Embeds default config values (`open: 12:00`, `close: 23:00`, `intervalMinutes: 30`, weekend vs weekday windows) and local formatter backed by `Intl.DateTimeFormat`. (`timeSlots.ts:66-88`)
  - Accepts optional overrides but config is internal; consumers (PlanStep) currently use defaults via `useTimeSlots` without passing config.
- **Booking helpers** (`reserve/shared/utils/booking.ts`):
  - Duplicates service windows + slot logic using same literals (e.g., lunch end at 15:00 weekdays / 17:00 weekends, close 23:00, interval 30). (`booking.ts:57-105`)
  - Also hosts formatting and validation functions that will move in S4; config extraction must keep these helpers in sync during transition.
- **ConfirmationStep** (`reserve/features/reservations/wizard/ui/steps/ConfirmationStep.tsx`):
  - Hard codes `EVENT_DURATION_MINUTES = 90` for ICS end-time, plus string copy in feedback messages. (`ConfirmationStep.tsx:17`) Duration should move into shared config.
- **Legacy helper duplicates** (`components/reserve/helpers.ts`):
  - Mirror of booking helper logic; indicates old surface area also depends on the same constants. (`helpers.ts:78-123`)
- **Runtime/env patterns**:
  - `reserve/shared/config/runtime.ts` provides typed `readString/Boolean/Number` with fallback support. (`runtime.ts:1-79`)
  - `reserve/shared/config/env.ts` demonstrates zod parsing but _throws_ during import on failure—contrary to S2 requirement to avoid throws. Need alternative approach (e.g., return object with `ok` flag + issues array, log warnings in dev).
  - `reserve/shared/config/venue.ts` reads env variables with graceful fallbacks and exports both constants and resolver function. (`venue.ts:1-63`)

## 3. Verification Techniques Used

- `rg` to locate literals (`23:00`, `intervalMinutes`, `Happy hour`) confirming duplication hotspots across modules.
- `sed` / `nl` to inspect specific file segments with line numbers for referencing in planning.
- Examined config infrastructure via targeted `sed` on `env.ts`, `runtime.ts`, and `venue.ts` to understand existing patterns and environment handling.

## 4. Dependencies & Constraints

- **Consumers requiring updates**: `timeSlots` (S1 module), PlanStep (already using hook but needs config injection), ConfirmationStep (duration/copy), booking helpers + legacy helpers, possibly tests/fixtures referencing constants.
- **Testing expectations**: new config should be easily stubbed in tests; prefer exported factory or `resolveReservationConfig()` returning typed data plus metadata for validation errors.
- **Non-throw requirement**: module must not throw on invalid env; consider returning a structure `{ config, issues }` and logging warnings conditionally, aligning with runtime’s behaviour.
- **Timezones**: Both helpers currently assume `Europe/London`. Config module should expose timezone + allow override through env.
- **Copy & messaging**: PlanStep uses tooltip string `'Not available for the selected time.'`; ConfirmationStep uses static copy. Need to decide if these belong in config or separate dictionary—flag for planning.

## 5. Risks, Unknowns, Alternative Angles

- **Risk: Divergent windows** — Without consolidating booking helper + new config simultaneously, duplication may persist. Need migration path or re-export from config into helpers.
- **Risk: Env overload** — Introducing numerous env keys may complicate deployment; plan minimal key set (e.g., `RESERVE_RESERVATION_OPEN`, `..._CLOSE`, `..._INTERVAL`, `..._DURATION`).
- **Unknown**: Whether other features (e.g., waitlist, promotions) rely on hidden constants; requires additional grep for `Happy hour` or `kitchen closed` labels.
- **Alternative**: Instead of static module, expose `loadReservationConfig(runtime: Runtime)` function to allow DI/testing, storing result in context or service container.

## 6. Next Steps Toward Planning

- Define schema for reservation config (times, interval, default duration, text labels, feature toggles) and map env overrides with validation ranges.
- Decide result type (e.g., `ReservationConfigResult` with `issues` array) consistent with “no throw” requirement; document logging strategy.
- Outline consumer update order: create config module → update timeSlots to accept config (default via resolver) → adjust ConfirmationStep & booking helpers → wire tests.
- Prepare plan to deprecate duplicated constants by re-exporting from config inside helpers until S4 refactor completes.
