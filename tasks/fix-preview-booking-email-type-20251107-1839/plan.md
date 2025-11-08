# Implementation Plan: Preview Booking Email Type Fix

## Objective

Prevent the Supabase select helper from producing `GenericStringError` types so the preview email script (and any other callers) remain type-safe and the Next.js build succeeds.

## Success Criteria

- [x] `pnpm run build` passes without the `GenericStringError` TypeScript error.
- [x] Supabase select helper keeps logo column compatibility behavior unchanged.

## Architecture & Components

- `scripts/preview-booking-email.ts` and other restaurant email/API modules now call `.maybeSingle<RestaurantRow>()`/`.single<RestaurantRow>()` so Supabase returns strongly typed data even though the select string is dynamic. Each call site still uses `restaurantSelectColumns` and `ensureLogoColumnOnRow` for compatibility.
- `server/emails/bookings.ts`, `server/restaurants/{create,update,details}.ts`, and `src/app/api/ops/restaurants/[id]/route.ts` share the same pattern so they stop inheriting the erroneous `GenericStringError` union.

## Data Flow & API Contracts

- Supabase `select()` continues to request the same columns. Passing the expected `RestaurantRow` type to `.maybeSingle()`/`.single()` ensures the response retains the explicit schema without relying on the select parser.

## Edge Cases

- The helper still needs to support retrying without `logo_url` on legacy databases. We'll keep the `includeLogo` flag semantics exactly the same.

## Testing Strategy

- Run `pnpm run lint` (covers TypeScript + ESLint) to ensure typing/linting pass.
- Run `pnpm run build` to prove the failing scenario is resolved.

## Rollout

- No feature flags; change is local to the script and any other helper consumers.
