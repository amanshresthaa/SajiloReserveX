# Research: Fix Service Periods ESLint

## Requirements

- Functional: unblock pre-commit by eliminating the `no-useless-escape` errors in `servicePeriods.test.ts` and the `no-explicit-any` warning in `servicePeriods.ts`.
- Non-functional (a11y, perf, security, privacy, i18n): keep tests readable, preserve TypeScript safety, no change to runtime behavior.

## Existing Patterns & Reuse

- `server/restaurants/servicePeriods.ts` already exports a typed `SupabaseClient` alias; adjust its generics instead of redefining anything.
- Regex assertions in the tests already use literal syntax, so we can simply unescape the embedded quotes.

## External Resources

- [ESLint `no-useless-escape`](https://eslint.org/docs/latest/rules/no-useless-escape) – confirms that escaping double quotes inside regex literals is unnecessary.
- [ESLint `@typescript-eslint/no-explicit-any`](https://typescript-eslint.io/rules/no-explicit-any/) – recommends replacing `any` with the specific schema type (`Database['public']`).

## Constraints & Risks

- Changing the Supabase client type must remain compatible with existing callers; `Database['public']` already matches the schema in other modules.
- Regex change must keep the test expectation string identical.

## Open Questions (owner, due)

- None at this time.

## Recommended Direction (with rationale)

- Update the test regex literal to remove the superfluous `\"` escapes; the pattern still matches the same substring but satisfies ESLint.
- Replace the `any` generic parameter in the `DbClient` alias with `Database['public']`, which is the typed schema used across the repo. This preserves type safety and resolves the lint warning.
