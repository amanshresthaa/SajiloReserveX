# Research – decouple booking helpers

- `reserve/shared/utils/booking.ts` simply re-exports `bookingHelpers`, `storageKeys`, and related types from the Next.js app (`@/components/reserve/helpers`).
- Those helpers depend on `@/lib/utils` (Tailwind merge helper) and `@/lib/enums` from the Next.js codebase (`components/reserve/helpers.ts:1-4`).
- Because the SPA bundles through Vite, reaching into the Next.js project couples the build to Node-oriented modules and shared env (`process.env`) assumptions.
- We should migrate the helper implementation into the SPA (`reserve/shared`) and provide local equivalents for any utility (`cn`, enums) to keep the dependency tree inside Vite-friendly code.
