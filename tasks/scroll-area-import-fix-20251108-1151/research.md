# Research: Scroll Area Import Fix

## Requirements

- Functional: Restore build by providing the missing `ScrollArea` component referenced by `TableTimelineClient`.
- Non-functional (a11y, perf, security, privacy, i18n): Match existing Shadcn primitives for consistent styling and keyboard/scroll behavior; avoid regressions in server/client bundles.

## Existing Patterns & Reuse

- `components/ui` already houses other Shadcn-based primitives (e.g., `tooltip.tsx`, `skeleton.tsx`).
- No `scroll-area` implementation exists under `components/ui`, but Shadcn's standard `scroll-area.tsx` can be adapted.

## External Resources

- [Shadcn Scroll Area](https://ui.shadcn.com/docs/components/scroll-area) – canonical implementation to ensure parity and accessibility.

## Constraints & Risks

- Component must work in both client/server contexts and rely on `@radix-ui/react-scroll-area` dependency, which must already exist; if missing we might need to add it.
- Need to ensure CSS utility classes align with Tailwind config and don't trigger lint violations.

## Open Questions (owner, due)

- None at this time.

## Recommended Direction (with rationale)

- Implement `components/ui/scroll-area.tsx` by copying the Shadcn reference component, ensuring it exports both `ScrollArea` and `ScrollBar`/`ScrollAreaCorner` as in the docs. This matches established UI patterns and satisfies the missing module.
