# Implementation Plan – Dashboard Bookings View

## Objectives

- Enhance `/app/dashboard/page.tsx` so authenticated users can review their reservations.
- Surface upcoming bookings prominently, with a secondary list of past reservations.
- Keep all data fetching server-side using Supabase, leveraging existing session from the dashboard layout.

## Steps

1. **Data access helper (server-side)**
   - In `app/dashboard/page.tsx`, instantiate a Supabase server client (`createServerComponentClient`) and retrieve the authenticated session.
   - If session or email is missing, render a friendly empty state (layout already redirects unauthenticated users, so this is a safeguard).
   - Query the `bookings` table filtering by `restaurant_id = DEFAULT_RESTAURANT_ID` and `customer_email = session.user.email`, ordering by booking date and start time ascending.

2. **Transform & classify bookings**
   - Map results into a typed structure that includes a computed `Date` object for the combined booking date/time.
   - Partition into `upcoming` (booking date/time >= now) and `past` (date/time < now); sort past bookings descending.
   - Derive human-readable labels (date, time, booking type) via existing `bookingHelpers` or `date-fns` utilities.

3. **UI composition**
   - Replace the placeholder UI in `app/dashboard/page.tsx` with:
     - Header containing `ButtonAccount` and a page title/subtitle.
     - An “Upcoming booking(s)” card list with status badges, date/time, party size, booking type, and reference.
     - A collapsible or secondary section for past bookings (if any) using a compact list style.
   - Use semantic markup (`<section>`, `<dl>`, etc.) and Tailwind classes aligned with existing design.
   - Provide empty states for both sections when no bookings exist (encourage user to create one via `/reserve`).

4. **Status styling utility**
   - Define a small helper inside the page component to map booking statuses to badge styles (e.g., confirmed, pending, waitlisted, cancelled).

5. **Validation & testing**
   - Ensure TypeScript passes (`pnpm typecheck`).
   - Lint reserve scope (`pnpm lint`).
   - Run unit tests if any changes touch shared utilities (`pnpm test`). (No new tests required immediately, but confirm suite still passes.)

6. **Documentation (optional)**
   - Add a brief note in README or TODO if follow-up needed (e.g., pagination, cancellations) – optional as part of this iteration.
