# Plan

1. Fix `reserve/features/reservations/wizard/model/reducer.ts` and `schemas.ts` import ordering so `@reserve/shared/utils/booking` precedes `@shared/config/booking`.
2. Adjust `reserve/shared/utils/booking.ts`:
   - Promote `@shared/config/booking` import ahead of `@shared/lib/cn` per lint rule.
   - Convert type-only dependencies to `import type` and remove unused `BookingType`.
3. Re-run `npm run build` to ensure lint passes and no additional issues surface.
