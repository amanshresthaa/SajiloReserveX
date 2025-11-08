# Implementation Checklist

## Core

- [x] Update `DbClient` type alias in `server/restaurants/details.ts` to remove the `any` generic and rely on generated schema defaults.
- [x] Re-type the restaurant mock client helper in `tests/server/restaurants/details.test.ts` (no `any`), reusing existing Supabase types.

## Tests

- [x] Run `pnpm exec eslint tests/server/restaurants/details.test.ts` to confirm ESLint warnings are gone.

## Notes

- Assumptions: No runtime behavior change required; typings are internal-only.
- Deviations: None.
