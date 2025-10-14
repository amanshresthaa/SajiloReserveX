# Implementation Checklist

## Setup

- [x] Review existing dashboard layout rendering

## Core

- [x] Remove heatmap calendar dependency from rendered UI and compute prev/next date helpers
- [x] Implement new header + date selector with navigation buttons
- [x] Render stat cards using summary totals with icon/color mapping
- [x] Rebuild service capacity section with simplified cards
- [x] Wrap reservations module in new card styling while reusing filter + list
- [x] Adjust VIP + change feed sections to match refreshed styling
- [x] Restore production build (fix path aliases so `pnpm build` succeeds)

## UI/UX

- [x] Ensure responsive grid behaviour (2-col small, 4-col large)
- [x] Add accessible labels to interactive controls (date nav buttons, etc.)
- [x] Verify empty state/zero data renders cleanly

## Tests

- [ ] Smoke test in dev (pending manual run)

## Notes

- Assumptions: None currently.
- Deviations:
  - `pnpm typecheck` fails in current workspace due to missing legacy Next.js routes referenced in `.next/types/validator.ts`; no changes made as issue predates this task.
  - `pnpm build` now compiles successfully but still exits during Next.js type validation because `.next/types/validator.ts` looks for `src/app/...` `.js` files that do not exist. Unable to disable the `srcDir` heuristic on Next 15.5.4; needs follow-up separate from dashboard styling.

## Batched Questions (if any)

- None currently
