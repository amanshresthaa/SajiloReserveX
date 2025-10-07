## Mission

Restore a clean build by addressing the lint failures reported during `pnpm run build`, keeping existing testing patterns intact.

## Implementation Plan

1. **Normalise import ordering in wizard tests**
   - Reorder value imports so fixtures from `@/tests/fixtures/wizard` precede feature imports per the alias sort rules.
   - Ensure type-only imports (e.g., `import type …`) sit in their own block separated by a blank line where required (notably in `Calendar24Field.test.tsx`).
2. **Replace short-circuit expressions in `BookingWizard.plan-review.test.tsx`**
   - Swap `planForm && …` and similar patterns for guarded `if` statements inside `act` to satisfy `@typescript-eslint/no-unused-expressions`.
   - Keep user interactions wrapped with `act` and `userEvent` to maintain asynchronous semantics.
3. **Update Vitest mock typing in `my-bookings-api.test.ts`**
   - Introduce a type-only import for the bookings module and pass it to `vi.importActual` instead of using the banned `typeof import()` inline type annotation.
4. **Verification**
   - Run `pnpm run lint` (or the narrower script if available) to confirm ESLint passes.
   - If lint is clean, re-run `pnpm run build` to confirm the bundled build no longer fails at linting.
