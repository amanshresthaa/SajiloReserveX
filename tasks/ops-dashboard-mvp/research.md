# Research: Ops Dashboard MVP

## Phase 0 — Task Setup

- **Requirements**
  - Deliver an MVP operations dashboard available at `/ops` in the Next.js App Router application.
  - Follow the Context Engineering Framework: complete research, planning, implementation, and verification artifacts.
  - Integrate with existing Supabase auth, restaurant membership context, and booking data sources.
  - Reuse SHADCN UI primitives and existing dashboard components (`TodayBookingsCard`).
  - Provide robust access control (redirect unauthenticated users, handle membership absence gracefully).
  - Ensure timezone-aware booking summaries and accurate status buckets.
  - Maintain accessibility, mobile-first responsiveness, and Supabase best practices.
- **Stakeholders**
  - Restaurant operations staff (primary users).
  - Product & design teams overseeing the ops experience.
  - Engineering team maintaining the Supabase/Next.js stack.
  - QA team validating functionality and accessibility.
- **Assumptions**
  - Existing Supabase schema (`public.bookings`, `public.restaurant_memberships`, `public.restaurants`) is accurate and seeded for local development.
  - Auth middleware and helpers currently gate `/ops` and can be extended without major refactors.
  - `TodayBookingsCard` can accept an enriched summary payload without major UI rework.
  - Local environment provides seeded users with memberships for manual QA.
- **Success Criteria**
  - Authenticated restaurant members see the dashboard with today's bookings summary, timezone-aware scheduling, and meaningful copy.
  - Unauthenticated visitors are redirected to `/signin?redirectedFrom=/ops`; users without memberships see the invite-needed state.
  - Booking totals and cover counts match Supabase data, excluding cancelled/no-show covers.
  - Implementation documented through research, plan, todo, verification files; tests cover critical summary logic.
  - Verification confirms automated tests (lint, targeted tests) and manual QA steps, with noted follow-ups if any.

## Existing Patterns (To Document)

- `app/(ops)/ops/page.tsx` already performs Supabase session lookup, membership resolution via `fetchUserMemberships`, and renders `<TodayBookingsCard>` with a no-membership fallback message.
- `server/team/access.ts` exposes `fetchUserMemberships` and normalization helpers that return membership plus restaurant metadata; error handling follows Supabase client semantics.
- `server/ops/bookings.ts` implements `getTodayBookingsSummary`, defining status buckets (pending/cancelled/confirmed), generating totals, and mapping DB rows to card-friendly structure.
- `components/ops/dashboard/TodayBookingsCard.tsx` consumes the summary, leverages SHADCN `Card`, `Badge`, and responsive grid patterns, and maps statuses to badge variants.
- `components/ops/team/*` demonstrates ops-surface auth fallbacks, skeletons for loading states, and responsive layout conventions (stack on mobile, flex on desktop).
- `components/ui/toggle-group.tsx`, `components/ui/dialog.tsx`, and `components/ui/button.tsx` provide accessible controls for filters and detail modals—useful for dashboard interactions.
- `lib/utils/datetime.ts` provides `getDateInTimezone` using `Intl.DateTimeFormat`, ensuring consistent YYYY-MM-DD strings for Supabase queries.
- `@reserve/shared/formatting/booking` exports `formatReservationTime`, which normalizes `HH:mm` display without timezone adjustments—UI expects prelocalised times.

## External Resources

- WAI-ARIA Authoring Practices for keyboard/ARIA patterns (https://www.w3.org/WAI/ARIA/apg/patterns/) informing focus management expectations.
- MDN reference for `Intl.DateTimeFormat` timezone formatting, validating approach used in `getDateInTimezone` (https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat).
- Supabase documentation on Row Level Security confirms server-side Supabase client access patterns (https://supabase.com/docs/guides/auth/server/nextjs).

## Technical Constraints

- Next.js App Router with React Server Components: `/ops` page must remain a server component for secure data fetching; client components limited to presentational widgets.
- Supabase RLS rules require using authenticated server client (`getServerComponentSupabaseClient`) tied to the user session; service client only for background/service logic.
- Bookings table schema: `booking_date` (date) + `start_time` (time without timezone) + `status` in enum `{pending, pending_allocation, confirmed, completed, cancelled, no_show}`; cover totals must exclude cancelled/no-show statuses.
- Restaurant timezone is stored per row; fallback to UTC if absent but seeds default to `Europe/London`.
- Existing `TodayBookingsCard` expects `summary.date` formatted as `YYYY-MM-DD`; consistent formatting required for header display.
- Need to handle multi-membership accounts (choose first membership for MVP) and propagate restaurant name; future switching noted.

## Recommendations

- Keep `getTodayBookingsSummary` as the aggregation boundary: ensure Supabase query filters by `booking_date` via timezone-adjusted reference date and populate totals/covers logic with defensive defaults.
- Maintain existing server-page flow: fetch session, redirect unauthenticated users, resolve memberships, log errors with context, and pass summary + restaurant name to the card.
- Extend error handling to log Supabase errors (without leaking to user) and return invite-needed state for empty memberships.
- Note MVP trade-off (primary membership only) in planning with follow-up for restaurant switching.
- Ensure UI copy and empty/error states align with ops tone established in existing components; reuse SHADCN primitives for consistency and accessibility.
- For past-start detection, leverage `Intl.DateTimeFormat` with restaurant timezone to derive current `HH:mm` strings, keeping comparisons lightweight without additional libraries.
- Introduced `app/api/ops/bookings/[id]/status` for dashboard-only status toggles (show/no show) with Supabase membership checks.
- Calendar view will require a generalized `getBookingsSummaryForDate(restaurantId, date)` helper (likely delegating to current summary logic) plus a timezone-aware date-picker or calendar component (consider Shadcn `Calendar` or `DatePicker`) that respects RSC constraints.
