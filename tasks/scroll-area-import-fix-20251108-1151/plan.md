# Implementation Plan: Scroll Area Import Fix

## Objective

Provide the missing `ScrollArea` primitive so pages like the ops capacity timeline can render and the Next.js build completes.

## Success Criteria

- [ ] `components/ui/scroll-area.tsx` exists and exports the expected components (`ScrollArea`, `ScrollBar`, `ScrollAreaCorner`).
- [ ] `pnpm run lint` passes.
- [ ] `pnpm run build` completes without the previous module-not-found error.

## Architecture & Components

- `components/ui/scroll-area.tsx`: wraps `@radix-ui/react-scroll-area` exports with Tailwind styles consistent with other Shadcn primitives. No additional state management required.

## Data Flow & API Contracts

- No network/data contracts affected. Component receives `ScrollAreaProps` and passes children through.

## UI/UX States

- Scrollbar hover/active styles handled by Shadcn defaults; no app-specific states needed.

## Edge Cases

- Component must gracefully handle both vertical and horizontal scrolling.
- Should forward refs and className overrides.

## Testing Strategy

- Rely on existing lint/build plus manual smoke (not a direct UI change but component is used in timeline). Future UI QA can occur when the page is exercised.

## Rollout

- No feature flag. Once merged, component is globally available and build should succeed.
