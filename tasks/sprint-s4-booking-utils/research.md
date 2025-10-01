# Sprint S4 — Booking Utilities Decomposition: Research

## Task outline

- **Objective**: Decompose `reserve/shared/utils/booking.ts` so time math, formatting, and validation live in dedicated shared modules; ensure branded `ReservationTime` types propagate so UI/reducers stop passing raw strings.
- **Scope check**: Confirm S1–S3 landed (time-slot service, config externalization, PlanStep split) to avoid conflicting work, then map current helpers, consumers, and overlaps with new shared/time primitives.

## Verification that S1–S3 completed

- `reserve/features/reservations/wizard/services/timeSlots.ts` now drives slot math + availability without UI imports (✅ matches S1 deliverables).
- `reserve/shared/config/reservations.ts` provides runtime-configurable reservation settings with env overrides + issues list (aligns with S2 ACs).
- `reserve/features/reservations/wizard/ui/steps/PlanStep.tsx` delegates to `plan-step` subcomponents (`PlanStepForm`, `TimeSlotGrid`, `OccasionPicker`, etc.), each ≤120 LOC (spot-check: PlanStep root 80 LOC, PlanStepForm 111 LOC). Analytics injected via props (PlanStepForm `onTrack`) (✅ S3).

## Current `bookingHelpers` surface (reserve/shared/utils/booking.ts)

| Concern                 | Helper(s)                                                                                                    | Notes                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| Time normalization/math | `normalizeTime`, `timeToMinutes`, `slotsForRange`, `serviceWindows`, `slotsByService`, `bookingTypeFromTime` | Overlaps with `@reserve/shared/time` primitives + `timeSlots` service.                             |
| Formatting              | `formatDate`, `formatTime`, `formatSummaryDate`, `formatBookingLabel`, `formatForDateInput`                  | Uses Intl + config timezone; needed in UI + reducers.                                              |
| Validation              | `isUKPhone`, `isEmail`                                                                                       | Used by Zod schema refinements (`schemas.ts`).                                                     |
| Misc                    | `cn` passthrough, `storageKeys`                                                                              | `cn` duplication (shared lib already exports). `storageKeys` relevant to booking-flow persistence. |

## Consumer inventory

- React app (`components/reserve/booking-flow/index.tsx`) imports via alias `@/components/reserve/helpers` → `bookingHelpers` for summary formatting, booking type inference, normalization, etc.
- Wizard domain (`reserve/features/reservations/wizard/model/*`, hooks, selectors, UI steps) depends on same helpers for formatting + validation.
- Shared UI (`reserve/shared/ui/Field.tsx`) only uses `bookingHelpers.cn` to merge classes.
- Tests: `reserve/shared/utils/__tests__/booking.test.ts` ensures helper behavior.

## Existing shared primitives relevant to S4

- `@reserve/shared/time` already houses branded types (`ReservationTime`, `ReservationDate`), normalization (`normalizeTime`, `toMinutes`, `slotsForRange`), and date helpers (`createDateFromParts`). Some duplication vs `bookingHelpers` (e.g., both expose `normalizeTime`, `slotsForRange`). Need to reconcile the two sources without regressing call sites.
- `timeSlots` service consumes `@reserve/shared/time` and reservation config; once S4 refactors call sites to reuse shared/time + new formatting module, duplication between service + bookingHelpers should disappear.

## Observed gaps / risks

1. **Formatting location**: No existing `shared/formatting` namespace. Need new module to host date/time formatting with timezone awareness + booking label map.
   - Alternatives considered: keep formatting inside `shared/utils` vs new `shared/formatting`. Sprint goal explicitly calls for a dedicated module, so prefer new folder (`reserve/shared/formatting/booking.ts?`). Ensure API covers formatters currently used and maybe generalizable.
2. **Validation distribution**: No `shared/validation` directory. We must introduce one, ensuring functions are framework-agnostic and tree-shakeable. Confirm there are no other ad-hoc validators we could co-locate.
3. **`cn` usage**: Only `Field.tsx` relies on `bookingHelpers.cn`; we should swap to direct `cn` import to avoid dragging booking module once we remove helper bundling.
4. **`storageKeys`**: Must remain accessible (likely continue exporting from a booking module or dedicated constants file). Need to decide whether `storageKeys` stays in `reserve/shared/utils/booking` (reduced to storage + compatibility re-exports) or moves elsewhere. Consumers rely on default string key; consider versioning for future migrations.
5. **Type tightening**: Some call sites still pass raw strings to helpers (e.g., `bookingHelpers.normalizeTime(details.time)`). After migration they should use branded types where helpful, but forms/workflow still operate on strings. Need to strike balance: expose functions accepting `string | ReservationTime` to avoid breaking forms while ensuring typed outputs.
6. **Tests coverage adjustments**: Booking util tests currently cover time/format functions. After splitting, ensure equivalent or stronger coverage in new module-level tests + integration tests referencing `ReservationTime` brand.

## Cross-verification (multi-angle)

- **Code search (rg)** confirmed all `import .../booking` usage sites and validated no other `ReservationTime` definitions exist.
- **Manual inspection** of `time.ts`, `types.ts`, `timeSlots.ts`, and PlanStep components establishes existing patterns + potential duplication points.
- **Assumption challenge**: Confirmed `ReservationTime` brand already introduced (S1). Need to ensure S4 requirement (“introduce ReservationTime brand”) is satisfied by extending usage, not reintroducing type.
- **Potential pitfalls check**: Ensure timezone formatting uses config timezone; cross-checked existing `formatWithIntl` logic vs new shared/time to avoid regressions. Remember to honor `prefers-reduced-motion` guidelines? (Not relevant here but note to avoid removing UI affordances.)

## Open questions / items to validate during planning

1. Should we keep a thin compatibility layer (`bookingHelpers` re-export) during migration to avoid refactor churn, or remove entirely per AC? AC states “No `import .../booking` in app code,” implying final state eliminates helper import; maybe keep file exporting deprecated wrappers for external packages (unused after migration).
2. Where should booking type labels live? Currently defined inside helper module. Could move to config or formatting module; need to confirm teams expect to localize copy here.
3. Do any external consumers (beyond this repo) import `@reserve/shared/utils/booking`? Search suggests internal only, but double-check during planning to avoid breaking API promises.
