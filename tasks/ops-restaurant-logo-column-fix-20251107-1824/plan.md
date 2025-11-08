# Implementation Plan: Ops restaurant logo column fix

## Objective

Keep Ops/Owner restaurant flows, booking emails, and CLI previews functional even when the Supabase environment has not yet applied the `logo_url` column migration, while still supporting the field when it exists.

## Success Criteria

- [ ] `/api/ops/restaurants/[id]` serves restaurant details (role + schedule settings) without Postgres `42703` errors.
- [ ] `pnpm run lint` succeeds to prove the refactor keeps type/lint safety.

## Architecture & Components

- `server/restaurants/logo-url-compat.ts`: new helper exports error detection + row patching utility and logs fallbacks.
- `server/restaurants/select-fields.ts`: canonical select column builder shared by service modules, API routes, and emails.
- `server/restaurants/{create,update,list,details}.ts` + `src/app/api/ops/restaurants/[id]/route.ts`: wrap Supabase calls with retry logic that re-issues the same query/update without `logo_url` when necessary.
- `server/emails/bookings.ts` & `scripts/preview-booking-email.ts`: reuse the helper so email previews remain resilient.

State: purely server-side; no URL state changes.

## Data Flow & API Contracts

- REST endpoints keep the same response shape (`logoUrl` optional); when the column is missing we coerce it to `null` and log `[logo_url][compat]` warnings.
- No schema/API contract changes are required, so clients remain untouched.

## UI/UX States

- No UI modifications. Ops UI simply stops seeing 500s and continues to show existing fields (logo falls back to `null`).

## Edge Cases

- Supabase error other than `42703` should continue surfacing as before.
- Inserts/updates that attempt to set `logoUrl` while the column is absent must drop the field in the retry payload to succeed.
- Lists and aggregate queries must default `logo_url` to `null` so downstream mapping code does not crash on `undefined`.

## Testing Strategy

- Lint: `pnpm run lint` (covers type + ESLint regressions).
- Runtime sanity: rely on local dev server hitting Supabase with missing column; verifying no 500s once fix is in.

## Rollout

- No feature flag—change is backwards compatible and can ship immediately.
- Monitoring: watch for `[logo_url][compat]` warnings to confirm environments needing migration.
- Kill-switch: revert commit if unexpected perf regressions are observed.
