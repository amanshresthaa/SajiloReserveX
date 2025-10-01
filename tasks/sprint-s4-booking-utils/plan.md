# Sprint S4 — Booking Utilities Decomposition: Plan

## Goal

Eliminate the monolithic `bookingHelpers` export by migrating time math, formatting, and validation into dedicated shared modules that align with the new reservation config + time primitives. Ensure consumers adopt the new APIs and benefit from `ReservationTime`/`ReservationDate` branded types.

## Constraints & invariants

- Public behaviour (formatting, validation, inferred booking type) must remain unchanged for end users.
- Accessibility/performance rules still apply (no UI regressions; honour focus/keyboard rules).
- Keep API-compatible exports for `storageKeys` (persisted localStorage data must continue to load).
- TypeScript should flag accidental use of raw time strings where branded types are required.
- No lingering imports from `@reserve/shared/utils/booking` in application code once refactor completes.

## High-level approach

1. **Assess compatibility needs**: Verify no third-party packages import `@reserve/shared/utils/booking`. If purely internal, we can shrink the module to a guard/export shim without maintaining the old helper API. Confirm with repository-wide search (already partially done but re-run before deleting functionality).

2. **Design new module structure**:
   - `reserve/shared/time`: Already contains primitives. Extend as necessary (e.g., expose `timeToMinutes` alias or rename to avoid duplication).
   - `reserve/shared/formatting`: Create folder with `booking.ts` containing `formatDate`, `formatSummaryDate`, `formatTime`, `formatBookingLabel`, `formatForDateInput`. Inject timezone from reservation config to avoid hidden coupling.
   - `reserve/shared/validation`: Create `contact.ts` (phone/email validators). Consider co-locating regex constants for reusability.
   - Optionally introduce `reserve/shared/booking/constants.ts` (or similar) for label maps + storage keys if they don't fit in formatting/validation.

3. **Migrate implementations**:
   - Move logic from `bookingHelpers` to the new modules, adapting to existing `@reserve/shared/time` functions where possible (e.g., use `normalizeTime`, `slotsForRange`, `createDateFromParts`).
   - Replace imperative `Date` increments in `slotsForRange` with `shared/time` helpers to avoid duplicate DST logic.
   - Use `ReservationTime` inputs/outputs where appropriate; accept `string | ReservationTime` for ergonomics but normalize internally.

4. **Update consumers & enforce new imports**:
   - Replace `bookingHelpers` usage in wizard reducers, selectors, hooks, UI steps, and booking flow with specific imports from new modules.
   - Update `Field.tsx` to import `cn` directly from `@shared/lib/cn`.
   - Audit any remaining `booking.ts` imports using `rg` to guarantee clean removal.

5. **Refactor storage + compatibility layer**:
   - Keep `storageKeys` export alive (either move to `reserve/shared/booking/storage.ts` or leave in `booking.ts` with deprecation notice).
   - Provide a minimal `booking.ts` file that re-exports only `storageKeys` (and possibly helper aliases if external code still expects them). Optionally throw at runtime if deprecated helpers are accessed (guard) — pending confirm no external consumers.

6. **Introduce/extend types**:
   - Ensure new helpers return `ReservationTime` where appropriate (e.g., normalization). Add conversion helpers if missing (e.g., `toReservationDate` already exists).
   - Update schema refinements to use new validation functions without pulling entire helper object.

7. **Testing & verification**:
   - Move existing unit tests to new module-level tests (`shared/formatting/__tests__/booking.test.ts`, `shared/validation/__tests__/contact.test.ts`, `shared/time` already covered).
   - Add coverage for `bookingTypeFromTime` relocation (likely into time services or new module) to capture weekend/happy-hour scenarios.
   - Update any integration tests referencing `bookingHelpers`.

8. **Static checks & cleanup**:
   - Run `pnpm test --filter reserve/shared/time` (or equivalent) and lint to ensure no breakage.
   - Run `rg '@reserve/shared/utils/booking'` to confirm only `storageKeys` (if retained) remain.

## Alternative considerations & safeguards

- **Option A**: Keep `bookingHelpers` exporting named functions that proxy to new modules, easing incremental migration. Risk: violates sprint AC (“No import .../booking”). Dismissed but keep fallback plan if unexpected external dependency surfaces.
- **Option B**: Co-locate service-window logic within `timeSlots` only. Counterargument: Reducers/selectors still need `bookingTypeFromTime`; best to expose from a new `shared/time/reservations.ts` helper to avoid duplicating service-window math.
- **Storage key stability**: If we move `storageKeys`, ensure path update doesn’t break bundler alias `@/components/reserve/helpers`. Consider re-exporting storage from `components/reserve/helpers` to avoid app-layer churn.

## Detailed task breakdown

1. Reconfirm repository import graph for `@reserve/shared/utils/booking` (search + check external entry points).
2. Create `reserve/shared/formatting/booking.ts` and move formatting functions; ensure they rely on reservation config/timezone.
3. Create `reserve/shared/validation/contact.ts` for phone/email validators; export aggregated `contactValidators` if helpful.
4. Extend `reserve/shared/time` to expose any missing primitives (e.g., rename `toMinutes` alias `minutesBetween`, ensure no duplication).
5. Factor service-window + booking-type inference into `reserve/shared/time/reservations.ts` (or reuse existing `timeSlots` service) to keep reducers independent from UI.
6. Replace call sites across repo with new imports, adjusting types and ensuring `ReservationTime` usage.
7. Slim down `reserve/shared/utils/booking.ts` to retain only storage constants + (optionally) `BookingOption` types, re-exporting where necessary.
8. Update tests + add new coverage for modules and type guards.
9. Run lint/test suites; verify `rg` ensures no stale imports.

## Potential pitfalls & mitigations

- **Timezone drift**: Ensure new formatting module still reads timezone from `reservationConfigResult.config` (needs memoized Intl formatter similar to existing logic). Add unit tests covering timezone override scenario.
- **Type regression**: When replacing helper imports, watch for implicit `any` or mismatched branded types. Use TypeScript build to confirm.
- **Dead re-exports**: If `components/reserve/helpers.ts` simply re-exports shared helper(s), update to re-export new modules or remove file to avoid confusion.
- **DST edge cases**: `slotsForRange` using `Date` could shift with DST. Validate new implementation replicates existing behaviour (maybe keep using `Date` but via `createDateFromParts`). Add tests around DST boundaries if time permits.

## Verification plan

- Unit tests for formatting + validation modules.
- TypeScript compile (`pnpm lint` or `pnpm tsc --noEmit`) to ensure type safety.
- Manual audit via `rg` to confirm no forbidden imports.
- If possible, run existing wizard tests (`pnpm test --filter reserve/features/reservations`) to catch regression.

## Outstanding questions for implementation phase

- Should `BookingOption` type migrate to a shared file (e.g., from config) to avoid circular deps? Currently defined via `BOOKING_TYPES_UI`. Need to ensure new structure doesn't reintroduce UI dependency.
- Where should booking-label copy ultimately live (config vs formatting)? For now, plan keeps mapping inside formatting module but consider future localization.
