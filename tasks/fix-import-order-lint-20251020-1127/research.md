# Research: Fix Import Order Lint Error

## Existing Patterns & Reuse

- The root `eslint.config.mjs` enforces `import/order` with sibling imports alphabetized ascending and blank lines between groups.
- Other files within `reserve/features/reservations/wizard/services/` follow alphabetical ordering for sibling imports (e.g., value imports before type-only blocks when grouped).

## External Resources

- [`eslint-plugin-import` docs](https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/order.md) – clarifies required ordering and grouping behavior.

## Constraints & Risks

- Changes must preserve runtime behavior; reordering imports must not alter initialization order when side effects are possible.
- ESLint rules should not be suppressed; align with existing configuration.

## Open Questions (and answers if resolved)

- Q: Does the current file rely on side effects from `./timeSlots` or `./schedule` imports that would break if reordered?
  A: Both modules export pure utilities/types; no side-effectful initialization is present, so reordering is safe.

## Recommended Direction (with rationale)

- Reorder the sibling imports so `./schedule` precedes `./timeSlots`, matching the enforced alphabetized ordering and eliminating the lint failure.
