# Research: Ops Bookings Management

## Existing Patterns

- `app/(ops)/ops/(app)/layout.tsx` wraps all Ops routes in `OpsAppShell`, which provides sidebar navigation and a header with the "New walk-in booking" call-to-action.
- The sidebar itself (`components/ops/AppSidebar.tsx`) defines the Ops IA; items highlight via custom `matcher`s and currently collapse `/ops/bookings/new` under a single "Walk-in booking" link.
- Server-side Ops pages (`app/(ops)/ops/(app)/page.tsx`, `app/(ops)/ops/(app)/bookings/new/page.tsx`) fetch memberships via `fetchUserMemberships` and redirect unauthenticated users with Next.js server helpers.
- Customer-facing "My bookings" (`app/(authed)/my-bookings/page.tsx` + `MyBookingsClient`) uses React Query with `useBookings`, `useBookingsTableState`, `BookingsTable`, `EditBookingDialog`, and `CancelBookingDialog` for CRUD-like interactions.
- REST endpoints today:
  - `/api/bookings` (+ `/api/bookings/[id]`) power customer CRUD, enforcing ownership by email.
  - `/api/ops/bookings` (POST) creates staff-entered walk-ins; `/api/ops/bookings/[id]/status` patches status (completed/no_show) with membership checks.
- Ops dashboard summary data comes from `server/ops/bookings.ts` and renders via `TodayBookingsCard`, which already uses the status PATCH endpoint.

## External Resources

- No new third-party APIs identified; reuse existing Supabase access helpers (`getRouteHandlerSupabaseClient`, `getServiceSupabaseClient`).
- Adhere to SHADCN/UI components already in use for bookings tables/dialogs.

## Technical Constraints

- Must enforce restaurant membership for every Ops action (list, update, cancel) using `fetchUserMemberships` / `requireMembershipForRestaurant`.
- Ops layout distinguishes between `/ops/bookings/new` and other routes for header copy and CTA visibility; new page must integrate cleanly.
- `BookingsTable` expects `BookingDTO` plus pagination metadata; operations listing API must emit compatible fields (including `restaurantName`).
- Customer mutations hit `/api/bookings/:id`, which reject non-owners—Ops flow needs separate endpoints/mutations.
- React Query already configured globally; new hooks should register distinct query keys to avoid clashing with customer caches.

## Open Questions

- Should Ops users filter across all restaurants they belong to or focus on a single selection (e.g., primary membership, dropdown selector)?
- Do Ops edits cover only time/party/notes or full contact details? (Current dialog edits a limited subset.)
- How should deletion behave—hard delete, soft cancel, or status transitions (e.g., reuse `softCancelBooking` but attribute to staff)?

## Recommendations

- Introduce `/ops/bookings` route that mirrors "My bookings" UX, seeded with the staff member's primary restaurant and optional switcher when multiple.
- Build an Ops-specific React Query hook (e.g., `useOpsBookings`) consuming a new `GET /api/ops/bookings` with pagination, status filters, optional restaurant filter, and membership enforcement.
- Provide Ops-specific mutations (`useOpsUpdateBooking`, `useOpsCancelBooking`) targeting new `/api/ops/bookings/:id` handlers that bypass customer ownership checks but validate membership; reuse existing `updateBookingRecord` / `softCancelBooking` helpers and audit logging paths.
- Update `OpsAppShell` + `AppSidebar` to surface the new "Manage bookings" nav item while keeping quick access to "New walk-in".
- Extend `BookingsTable` via lightweight wrapper if Ops needs extra columns (e.g., guest contact); otherwise reuse directly to speed delivery.
