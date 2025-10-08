# Research — US-004 Dashboard Bookings Table

## Task framing

- Objective: deliver an authenticated `/dashboard` experience showing the customer’s bookings with responsive UI, cancellation workflow, analytics, and automated test coverage.
- Scope clarification from user: any authenticated customer can access `/dashboard`; no additional role gating provided yet; need to inspect Supabase migration `20251006170446_remote_schema.sql` and adjust if required; design + analytics schema not specified.
- Constraints: follow mobile-first, TDD, accessibility/performance rules, and prefer shadcn/ui components.

## Existing authentication & middleware patterns

- `middleware.ts` (project root) already instantiates a Supabase SSR client via `getMiddlewareSupabaseClient(req, res)` and refreshes `session` on every request. It guards `/dashboard` and `/profile` by redirecting anonymous users to `/signin` with `redirectedFrom` query param. This matches the task’s guard requirement but only enforces presence of a session—not role-specific checks. Need to confirm any additional logic (e.g., for stale tokens) or extend if requirements evolve.
- Middleware also adds deprecation headers to unversioned `/api` routes. When extending auth, ensure we preserve this behavior (the early return for `/api/`).
- `server/supabase.ts` exposes helpers: `getMiddlewareSupabaseClient`, service client (no session persistence), and route/server component variants. Reuse these for any new server-side logic to stay consistent.

## Supabase data access & security posture

- `app/api/bookings/route.ts` implements `GET /api/bookings?me=1` to list bookings for the authenticated user. It authenticates via `supabase.auth.getUser()` and returns `401` if unauthenticated. Data fetching uses the **service role client** (`getServiceSupabaseClient`) to bypass RLS, but filters bookings by `customer_email = user.email`. Pagination and status filtering (`upcoming`, `past`, `cancelled`, `all`) already exist; align frontend query generation with this contract.
- `app/api/bookings/[id]/route.ts` handles dashboard-specific updates and cancellations. The `DELETE` handler verifies the current user owns the booking and calls `softCancelBooking`, logging audit events and invoking side-effect jobs. Errors map to friendly codes (`CUTOFF_PASSED`, etc.).
- Supabase migration `20251006170446_remote_schema.sql` defines numerous policies mostly for restaurant staff/service role; there is **no explicit customer-facing policy** letting authenticated users read/write their own bookings. Current endpoints therefore rely on the service-role client for read/write while enforcing ownership in application code. If we add any direct Supabase client usage on the dashboard, we must either keep using the API routes or add policies carefully.
- Need to confirm whether `softCancelBooking` enforces any status cutoff. It likely updates `status = 'cancelled'` while preserving historical data. Optimistic UI must align with whichever final status the backend returns after cancellation.

## Frontend data hooks & state management

- `hooks/useBookings.ts` assembles query-string filters consistent with the API schema: adds `me=1`, supports pagination, status filters (`'all' | 'upcoming' | 'past' | 'cancelled'`), and sorts. It uses React Query (TanStack) with `keepPreviousData` for smooth pagination and provides typed `BookingDTO`, `BookingsPage`, and error handling via `fetchJson`.
- `hooks/useBookingsTableState.ts` manages the dashboard table filters and pagination: resets pagination when status changes, clamps page numbers, and derives API filters (e.g., sets `from`/`to` dates for upcoming/past). There are Vitest unit tests covering behavior.
- `hooks/useCancelBooking.ts` encapsulates cancellation flow with optimistic updates: cancels outstanding queries, updates cached booking lists and detail view, emits analytics (`emit` + `track`) for request/success/error, and invalidates queries on settle. Error codes are surfaced to the dialog.
- Other hooks (`useUpdateBooking`) manage editing; not in current task but indicates pattern for mutation instrumentation and toast usage.

## Dashboard UI components (current state)

- `app/(authed)/dashboard/page.tsx` is a client component wiring hooks to UI. It tracks `dashboard_viewed`, maintains edit/cancel dialog state, and renders `<BookingsTable />` plus dialogs.
- `components/dashboard/BookingsTable.tsx` renders a desktop-style table (Shadcn table semantics in plain `<table>`). It handles loading skeleton, empty state, pagination, and uses `BookingsHeader`, `BookingRow`, `EmptyState`, `Pagination`. Mobile fallback currently relies on horizontal scroll via `overflow-x-auto`; there is **no dedicated mobile card layout** yet, so we may need to introduce responsive card components per requirement.
- `BookingRow.tsx` renders each row with Edit/Cancel buttons, disabling them for cancelled/past bookings. It uses `StatusChip` for status display. Evaluate whether actions remain accessible on small screens.
- `StatusFilterGroup.tsx` builds button group filters, leveraging Shadcn `Button` variants. Already keyboard-accessible (`role="group"`, `aria-pressed` toggles). Need to ensure focus visibility and target sizing meet mobile guidelines.
- `EmptyState.tsx` tracks impressions via `emit(analyticsEvent)` when visible and offers CTA to start a booking.
- `Pagination.tsx` surfaces result counts and previous/next controls with disabled states; ensures `aria-live` updates.
- No dedicated skeleton for mobile cards exists yet; skeleton rows mimic desktop layout.

## Dialogs, cancellation, and analytics

- `components/dashboard/CancelBookingDialog.tsx` uses Shadcn `Dialog` with accessible headings, descriptive copy, and buttons labelled “Keep booking” / “Cancel booking.” It surfaces server-side errors mapped from `HttpError.code` (`FORBIDDEN`, `CUTOFF_PASSED`, etc.).
- Optimistic cancellation flows through `useCancelBooking`, which also emits analytics via both `emit` (batched events pipeline) and `track` (plausible). Ensure any new analytics events are added to `lib/analytics.ts` enum.
- `EditBookingDialog` exists with validation/test coverage; while not part of current deliverables, reuse patterns for instrumentation and toast messaging.
- Frontend analytics rely on `lib/analytics.ts` (`track`) and `lib/analytics/emit.ts` queue. `track` only fires in browsers with `window.plausible`. When adding new events (e.g., `dashboard_cancel_confirm`), update type definitions and ensure props sanitized.

## Testing baseline

- Vitest suite already covers `CancelBookingDialog`, `EditBookingDialog`, `useBookingsTableState`, and analytics emitters. There is **no direct Vitest coverage for `BookingsTable` or `DashboardPage`**.
- Playwright E2E directory has auth flow tests in `tests/e2e/profile/auth-session.spec.ts` (feature-flagged via env). No dashboard-specific scenario yet—need to add one per task requirement.
- React Query hooks rely on integration tests elsewhere; ensure new tests mock fetch responses or use MSW if needed. Existing tests often mock hooks (`vi.mock('@/hooks/useCancelBooking')`) to isolate behavior.

## Accessibility, responsiveness, and performance considerations

- UI components leverage shadcn primitives (`button`, `dialog`, `alert`, `skeleton`). Continue using these for consistency and to satisfy accessibility defaults.
- Current table uses horizontal scrolling on small screens—consider introducing a card layout for `<md` while keeping table for larger breakpoints to satisfy “mobile cards + desktop table” requirement.
- Ensure focus management for dialogs (`Dialog` handles trap/return) and that action buttons remain ≥44px on mobile (add padding if needed).
- Analytics and toast libraries (`react-hot-toast`) already in use; ensure cancellations trigger polite `aria-live` regions (toast container) and inline errors use `role="alert"`.
- For performance, React Query `keepPreviousData` prevents refetch flicker. Pagination component indicates loading state (`isLoading ? '(updating...)'`). Continue to avoid unnecessary re-renders (memoized formatters).
- Skeleton rows currently rendered unconditionally when loading; if we add cards, replicate skeleton states via `Skeleton` components.

## Outstanding questions & potential risks

- Design spec for mobile cards not defined—need confirmation whether cards should mirror table columns or condense information. Could derive structure from existing marketing cards or reservation detail components.
- Analytics schema for cancellation beyond existing events is unspecified. Determine if additional events (dialog open/close, confirm) are needed.
- Supabase policies do not currently allow authenticated users to query bookings directly; continue routing through Next.js API or update RLS policies carefully if requirements change.
- Need to confirm if `/dashboard` should prefetch data serverside (currently client-only). Evaluate SSR vs CSR for performance and SEO.
- Playwright credentials/test data unspecified. Possibly need to seed bookings via Supabase fixtures or intercept API calls in test.
- Middleware guard already exists; verify whether additional checks (e.g., session refresh, redirect to onboarding) are required. Ensure guard coexists with existing `/profile` gating.

## Verification notes

- Cross-referenced middleware/session logic in `middleware.ts` and `server/supabase.ts` to ensure authenticity check pipeline is understood.
- Reviewed backend routes (`app/api/bookings*`) and Supabase migration to confirm data access semantics and security assumptions.
- Inspected frontend hooks/components (`hooks/useBookings*`, `components/dashboard/*`) alongside Vitest tests to verify current behavior and identify missing mobile layout.
- Confirmed analytics enums and emit pipeline for event instrumentation.
- Validated test coverage gaps by listing relevant Vitest and Playwright specs; none currently cover dashboard table end-to-end.

## Next steps

- Await clarifications (if any) on mobile design and analytics requirements.
- Use this research to craft implementation plan focusing on responsive layout, cancellation UX, guard validation, and comprehensive testing (unit + Playwright).
