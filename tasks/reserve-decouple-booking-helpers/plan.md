# Plan – decouple booking helpers

## Goal

Eliminate the SPA’s dependency on Next.js helper modules by moving booking helper utilities and enum constants into `reserve/shared`, ensuring all callers use the local implementation.

## Steps

1. **Introduce SPA-native booking enums and helpers**
   - Create `reserve/shared/config/booking.ts` exporting `BOOKING_TYPES`, `BOOKING_TYPES_UI`, `SEATING_PREFERENCES`, etc., mirroring the current Next.js definitions.
   - Replace existing imports from `@/lib/enums` with the new module.
2. **Reimplement booking helpers inside the SPA**
   - Replace the re-export in `reserve/shared/utils/booking.ts` with a full implementation (copy logic from `components/reserve/helpers.ts` and adjust imports to use the new enums).
   - Provide a small `cn` helper locally (or reuse an existing SPA utility) to avoid reaching into `@/lib/utils`.
   - Ensure TypeScript types (`BookingOption`, `BookingHelpers`) remain available.
3. **Update callers and clean up**
   - Adjust all SPA files (hooks, reducers, components) to import from the new SPA modules.
   - Remove any remaining `@/components/reserve/helpers` or `@/lib/enums` references in `reserve/`.
4. **Add coverage**
   - Write Vitest unit tests for critical helper behaviour (e.g., `bookingHelpers.bookingTypeFromTime`, `formatDate`, `normalizeTime`) using the new module.
5. **Verification**
   - Run `pnpm test`.
   - Use `rg '@/components/reserve/helpers' reserve` and `rg '@/lib/enums' reserve` to confirm no cross-app imports remain.
