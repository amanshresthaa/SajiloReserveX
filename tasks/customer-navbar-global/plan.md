# Customer Navbar Global Rollout — Plan

## Objectives

- Render `CustomerNavbar` on every page (public, authenticated, owner) without per-page imports.
- Ensure the navbar stays visible while scrolling (`position: sticky`) and maintains proper layering.
- Avoid duplicate renders and regressions across existing headers/layouts.

## Approach

1. **Global Injection Point**
   - Import `CustomerNavbar` in `components/LayoutClient.tsx` and render it before `{children}`.
   - Confirm this client component already wraps all routes via `app/layout.tsx`.
   - Remove now-redundant import/use in `app/page.tsx`.
2. **Sticky Styling**
   - Update the outer wrapper in `CustomerNavbar` to add `sticky top-0 z-50` (bump from `z-40` to avoid overlap with page content and upcoming sheets/dialogs).
   - Verify existing background/backdrop classes still ensure legibility when sticking.
3. **Spacing Adjustments**
   - Because additional hosts (e.g., `my-bookings` layout, profile layout) already have top headers, visually confirm stacking order. Add margin-top on main containers if needed to avoid elements hiding beneath the sticky bar.
4. **Testing/Verification**
   - Run targeted Vitest tests (`CustomerNavbar`, `MyBookingsClient.analytics`) since they rely on navbar exports.
   - Build project (`pnpm run build`) to ensure type safety and linting remain clean.

## Open Questions

- The root layout already exposes a skip link; evaluate whether keeping both skip links is acceptable (likely fine for now but note for future cleanup).
- If owner routes require a different navbar eventually, we may need conditional rendering; current instruction is to show it everywhere.
