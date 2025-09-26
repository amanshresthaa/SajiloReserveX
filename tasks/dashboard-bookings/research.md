# Research Notes – Dashboard Bookings

## Existing dashboard structure

- `/app/dashboard/layout.tsx` is a server component that enforces authentication via Supabase; redirects to `config.auth.loginUrl` if no session.
- `/app/dashboard/page.tsx` is currently a simple server component that renders `ButtonAccount` and placeholder content. This is the entry point we can extend to show a bookings overview.
- Additional nested directories exist under `/app/dashboard/*`, but the root dashboard page is minimal and designed for customization.

## Data sources

- Bookings are stored in the Supabase `bookings` table (see `types/supabase.ts`). Relevant fields include `booking_date`, `start_time`, `booking_type`, `status`, `restaurant_id`, `reference`, etc.
- Helper in `server/bookings.ts` (`fetchBookingsForContact`) requires both email and phone. For dashboard we can query Supabase directly using `customer_email` since authenticated session contains the user's email; phone number may not be available on the auth profile.
- `DEFAULT_RESTAURANT_ID` is defined in `@/lib/venue` and used throughout the booking flow; we should filter bookings to this restaurant to avoid cross-tenant leakage.
- Booking status enums live in `@/lib/enums` (e.g., `booking_status`).

## Formatting utilities

- `@/components/reserve/helpers` exposes `bookingHelpers.formatBookingLabel` and date/time utilities already used in the reservation flow. We can reuse these helpers to keep formatting consistent.
- `date-fns` is available in the dependency tree for precise date formatting if needed.

## UX considerations

- We should surface upcoming bookings (future date/time) prominently, and allow the user to see past bookings as history.
- Display key details per booking: date, time, party size, booking type label, status, reference, optionally seating preference and notes.
- Handle empty states gracefully (“No bookings yet” message) and ensure the UI remains responsive on mobile.
- Because the page is server-rendered, data fetching should happen via `createServerComponentClient` using request cookies (mirroring the layout logic).

## Security & performance

- Ensure Supabase query filters by both `customer_email` (session) and `restaurant_id` to avoid exposing other users' bookings.
- Limit results (e.g., default order by date/time) to prevent overly large payloads. We can fetch all matching rows and partition in memory; dataset expected to be small per user.
- Avoid client-side fetch to leverage server-side rendering and keep API keys secure.
