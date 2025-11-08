# Implementation Checklist

## Setup

- [x] Capture requirements/plan in task folder.

## Core Fix

- [x] Annotate the relevant Supabase queries (`scripts/preview-booking-email.ts`, `server/emails/bookings.ts`, `server/restaurants/{create,update,details}.ts`, `src/app/api/ops/restaurants/[id]/route.ts`) with `.single<RestaurantRow>()` / `.maybeSingle<RestaurantRow>()` so TypeScript knows the row shape.
- [x] Continue running logo fallback shims by piping results through `ensureLogoColumnOnRow` after the typed fetches.

## Verification

- [x] Run `pnpm run lint`.
- [x] Run `pnpm run build`.
- [x] Update `verification.md` with the results.
