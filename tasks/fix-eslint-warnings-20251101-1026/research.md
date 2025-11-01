# Research: Fix ESLint Warnings

## Requirements

- Functional: Resolve existing ESLint warnings blocking pre-commit.
- Non-functional (a11y, perf, security, privacy, i18n): No direct impact; ensure changes keep existing behaviour intact.

## Existing Patterns & Reuse

- Use TypeScript's type system to avoid unused variables and `any` usage.
- Follow existing repository lint configuration (`@typescript-eslint/no-unused-vars`, `@typescript-eslint/no-explicit-any`).

## External Resources

- [ESLint no-unused-vars rule](https://eslint.org/docs/latest/rules/no-unused-vars) – guidance on handling unused bindings.
- [TypeScript any type docs](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#any) – rationale for avoiding `any`.

## Constraints & Risks

- Ensure removals do not break downstream usage or intended future functionality.
- Avoid introducing breaking changes to data contracts.

## Open Questions (owner, due)

- None at this time.

## Recommended Direction (with rationale)

- Remove or repurpose unused variables to satisfy lint rules without altering behaviour.
- Tighten typing to replace `any` with the correct domain type in Supabase repository logic.
