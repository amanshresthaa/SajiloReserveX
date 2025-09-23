# Plan – Booking Flow Layout Redesign (Updated)

1. **Stop Sticky Overlap**
   - Introduce dynamic padding on `<main>` based on measured sticky height using `ResizeObserver` + callback from `StickyProgress`.
   - Ensure safe-area inset added; fallback to generous padding if observer unavailable.

2. **Scaffold shadcn/ui Primitives**
   - Create `components/ui/{button,input,label,textarea,checkbox,card,alert-dialog}.tsx` using official shadcn patterns and existing `cn` helper.
   - Include theming extensions (variants, forwardRefs) to match design tokens.

3. **Migrate Booking Flow to shadcn Components**
   - Update Plan/Details/Review/Confirmation steps, sticky progress, alert dialog, and helper form to consume new shadcn primitives.
   - Remove legacy `components/reserve/ui-primitives.tsx` after references cleared.

4. **Revise Alert Dialog UX**
   - Swap custom dialog for shadcn `AlertDialog` with accessible focus handling and consistent styling.

5. **Verify & Cleanup**
   - Run `pnpm lint`.
   - Manually inspect diffs for sticky logic, confirm no references to old primitives remain.
   - Note consent default implications in final summary.
