# Research: Preview Booking Email Type Fix

## Requirements

- Functional: Restore `pnpm run build` by ensuring `scripts/preview-booking-email.ts` can access strongly typed restaurant rows (no `GenericStringError` union) when selecting fields.
- Non-functional: Preserve backward-compatible fallback when the `logo_url` column is missing in older databases; avoid widening Supabase result types or suppressing errors with `any`.

## Existing Patterns & Reuse

- `server/restaurants/select-fields.ts` centralizes the column list for restaurant queries.
- `server/restaurants/logo-url-compat.ts` already handles the missing `logo_url` column by retrying a query without that field and shimming the row, so we should keep using those helpers rather than duplicating logic.
- Other Supabase queries typically pass literal `select` strings (or `*`), which avoids the `GenericStringError` type union.

## Constraints & Risks

- The select string currently comes from `.join(', ')`, so TypeScript widens it to a generic `string` → Supabase types fall back to `GenericStringError`, causing downstream property access errors.
- We must keep the list of columns DRY; duplicating two hard-coded comma-delimited strings risks drift when columns are added or removed.
- Supabase's select-string parser is brittle; rather than trying to coerce it with template literal gymnastics, we should rely on the `.single<T>()` / `.maybeSingle<T>()` overrides that already exist in the SDK.

## Recommended Direction (with rationale)

- Keep `restaurantSelectColumns` as-is for reuse but explicitly pass `Database['public']['Tables']['restaurants']['Row']` into `.single()` / `.maybeSingle()` wherever we consume the helper so the SDK returns the correct row type regardless of the select string.
- Continue using `ensureLogoColumnOnRow` after the fallback branch so legacy databases still expose `logo_url`, but let the type annotation happen at the query boundary rather than via manual casts.
- Touch every module that consumes `restaurantSelectColumns` and reads strongly typed properties (preview script, booking emails, restaurant CRUD endpoints) so the fix is comprehensive.
