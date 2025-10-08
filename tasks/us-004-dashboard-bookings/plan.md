# Plan — US-004 Dashboard Bookings Table

## 1. Outcomes & success criteria

- `/dashboard` remains inaccessible to anonymous users via middleware + Supabase session; add automated coverage proving redirect + happy path access for authenticated customers.
- Dashboard shows customer bookings using mobile-first cards that gracefully scale to a desktop table. Filters, pagination, loading/error/empty states behave consistently across viewports.
- Cancel flow offers confirmation dialog, optimistic UI, resilient rollback on failure, and emits analytics (`emit` + `track`) for request/success/error (extend event set if we add dialog-level events).
- Ship Vitest + Playwright coverage aligned with TDD: tests first, then implementation, per instructions.
- Honor accessibility/performance rubric (focus rings, hit targets, reduced motion, aria-live, etc.).

## 2. Architectural approach

1. **Middleware guard validation**
   - Reuse existing `middleware.ts` guard; verify redirect path + query param logic covers `/dashboard` and nested routes.
   - Add regression test (Vitest or integration) for middleware? Hard to unit test; instead, use Playwright to assert anonymous user hitting `/dashboard` gets bounced to `/signin?redirectedFrom=/dashboard`.
   - Review Supabase session refresh to ensure no extra code needed; document assumption in PR.

2. **Data prefetch & hydration**
   - Convert `app/(authed)/dashboard/page.tsx` into a server component wrapper that prefetches bookings via React Query `dehydrate` + `HydrationBoundary`. Keep an inner client component (rename current client file to `DashboardClient`?).
   - SSR should call API route rather than direct Supabase to preserve secure filtering and avoid RLS issues.
   - Ensure query key matches `useBookings` usage to prevent double fetch. Prefetch upcoming bookings (default status) using page size constant; pass initial filters to client state hook.

3. **Responsive UI (mobile cards + desktop table)**
   - Create a new `BookingsListMobile` component that renders cards per booking: show date/time, restaurant, party, status chip, action buttons stacked (Card + Flex). Visible on `<md`; hide table on small screens.
   - Retain existing `<table>` for `md+`. Wrap both in `<div>` with `aria` considerations (e.g., `role=
