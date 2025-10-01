# Reserve Dashboard & Wizard Modularization — Migration Guide

## Overview

- Dashboard view now composes dedicated molecules (`BookingsHeader`, `StatusFilterGroup`, `BookingRow`) driven by the shared `useBookingsTableState` hook.
- Wizard steps (Plan, Details, Review, Confirmation) delegate orchestration to controller hooks while UI files render shadcn-themed primitives.
- Shared inputs (`Input`, `Textarea`, `Checkbox`, `Form` primitives) adopt shadcn token classes and propagate through both Next.js and SPA bundles via re-exports.

## Required Changes When Adopting

1. **Imports**
   - Replace direct state handling in dashboard pages with `useBookingsTableState` from `@/hooks/useBookingsTableState`.
   - Use `BookingsHeader`, `BookingRow`, and `StatusFilterGroup` from `@/components/dashboard` instead of ad-hoc JSX.
   - Consume wizard steps via their exported props (controllers handle analytics and action registration).

2. **Styling Tokens**
   - Ensure new components rely on shadcn color tokens (`bg-card`, `text-foreground`, etc.).
   - Custom accents use CSS variables via inline styles (see `StatusChip`). Add matching token values in Tailwind config if theme colours change.

3. **Utilities & Helpers**
   - Prefer `@reserve/shared/formatting/booking` for date/time formatting and `@reserve/shared/time` for normalisation logic. Legacy `bookingHelpers` is deprecated.

## Testing Strategy

- Run `pnpm lint` and `pnpm typecheck`. (Known failures remain in legacy unit tests; track items in `reserve/tests/*` for follow-up.)
- Execute Vitest suites touching wizard selectors and dashboard components (`pnpm test -- <pattern>`).
- Smoke test booking flows:
  1. Create or edit reservations via dashboard; verify chips & filters update without reload.
  2. Step through wizard end-to-end (Plan → Confirmation); validate action bar updates per step.
- Optional: add Storybook stories for `BookingsHeader`, `BookingRow`, and each wizard step to ease visual regression.

## Rollout Checklist

- [ ] Update local imports to new molecules/hooks.
- [ ] Remove direct store mutations inside step components (controllers handle them).
- [ ] Verify custom themes incorporate accent variables used by `StatusChip` if overriding Tailwind palette.
- [ ] Capture new screenshots for design review (dashboard table + wizard steps) after styling changes.
