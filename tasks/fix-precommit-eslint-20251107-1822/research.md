# Research: Fix ESLint any warnings in restaurant details tests

## Requirements

- Functional: remove `@typescript-eslint/no-explicit-any` warnings blocking pre-commit by tightening types in restaurant details logic/tests.
- Non-functional: keep Supabase types accurate, avoid regressions in tests, and maintain lint/typecheck cleanliness.

## Existing Patterns & Reuse

- `DbClient` type alias in `server/restaurants/details.ts` already defines the Supabase client contract for this module.
- Generated Supabase types in `types/supabase.ts` include the `restaurants` table schema we can reference.

## External Resources

- None required; fixes rely on in-repo Supabase typings.

## Constraints & Risks

- Pre-commit enforces zero warnings, so the fix must eliminate all `any` usages rather than suppressing them.
- Updating the shared `DbClient` type must stay compatible with callers to avoid widening breaking changes.

## Open Questions (owner, due)

- None.

## Recommended Direction (with rationale)

- Re-type `DbClient` (and the test `MockClient`) to rely on the default Supabase schema generics instead of hard-coded `any`, ensuring type inference works end-to-end.
- Replace the `options.restaurant?: any` helper parameter with a typed subset of the restaurants table row to satisfy lint rules while keeping the test ergonomics.
