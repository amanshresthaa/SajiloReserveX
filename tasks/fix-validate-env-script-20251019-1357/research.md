# Research: Fix build validate env script

## Existing Patterns & Reuse

- `config/env.schema.ts` centralizes the Zod schema for environment variables across environments.
- `lib/env.ts` calls the schema and throws on failure, providing typed accessors that the runtime already relies on.
- `package.json` has a `validate:env` script pointing to `tsx scripts/validate-env.ts`, but the file/directory is missing.

## External Resources

- COMPREHENSIVE_ROUTE_ANALYSIS.md references a `scripts/validate-env.ts` build-time check, implying the repo expects that script.

## Constraints & Risks

- `pnpm run build` currently fails during the `validate:env` step, blocking builds and CI.
- The validation must run in Node (non-Next) context, so the script cannot assume browser globals.
- Adding new dependencies or deviating from the established schema would create drift with runtime validation.

## Open Questions (and answers if resolved)

- Q: Should the build-time script do more than load the existing schema?
  A: No evidence of additional requirements; reusing `lib/env.ts` ensures consistency and avoids divergence.

## Recommended Direction (with rationale)

- Recreate `scripts/validate-env.ts` to import `lib/env` (or the underlying schema) and exit with a helpful message on failure. This reuses existing validation logic, keeps build-time and runtime checks aligned, and satisfies the documented expectation in `package.json` and COMPREHENSIVE_ROUTE_ANALYSIS.md.
