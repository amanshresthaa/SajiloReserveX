# Research: Lint Warning Cleanup

## Requirements

- Functional: Resolve ESLint warnings in `server/ops/table-timeline.ts` so pre-commit hooks pass.
- Non-functional (a11y, perf, security, privacy, i18n): Maintain existing behavior, keep codebase type-safe per eslint rules.

## Existing Patterns & Reuse

- File already defines helper types (e.g., `AvailabilityMap`) and uses strongly typed data models; prefer reusing them instead of `any`.

## External Resources

- [ESLint @typescript-eslint/no-explicit-any](https://typescript-eslint.io/rules/no-explicit-any/) – guidance on replacing `any` with concrete or generic types.

## Constraints & Risks

- File is shared by server logic; incorrect types could hide runtime issues. Need to ensure replacements reflect actual structures.

## Open Questions (owner, due)

- Q: Are there existing interfaces representing the data currently typed as `any`?
  A: Investigate within `server/ops` utilities during implementation.

## Recommended Direction (with rationale)

- Replace unused imports to eliminate warnings.
- Identify precise types for previously `any` variables, likely derived from surrounding data structures, to satisfy lint rules without weakening type safety.
