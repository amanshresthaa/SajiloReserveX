# Implementation Plan: Ops Dashboard — Today’s Bookings

## Objective

Surface an at-a-glance view of today’s reservations on the `/ops` dashboard so front-of-house teams can monitor pending items, confirmed covers, and upcoming guests.

## Scope

- Server-side summary helper `getTodayBookingsSummary` producing counts and booking list.
- Utility for timezone-aware date formatting.
- New `/ops` page (server component) that resolves the current user, determines restaurant context, and renders the summary.
- Presentational card component showing metrics and schedule list.

## Data Flow

1. SSR page resolves Supabase session; redirects to `/signin` when absent.
2. Fetch memberships via `fetchUserMemberships`; choose primary restaurant (first membership).
3. Load summary from `getTodayBookingsSummary(restaurantId)` (timezone-aware).
4. Render `TodayBookingsCard` with metrics + list; show empty state or invite prompt.

## Access Control

- Requires authenticated Supabase user with at least one `restaurant_memberships` row.
- Uses server component so data never leaves backend until authorised.

## UI/UX

- Header with page context + supporting copy.
- Stats row: total bookings, pending, confirmed, covers.
- Schedule list with guest name, time, party size, notes snippet, status badge.
- Empty states for no bookings or no access.

## Testing & Verification

- Unit tests for timezone helper to ensure cross-region accuracy.
- Manual QA: seed bookings for today, verify counts, statuses, and cover totals.
- Regression: run `pnpm lint`, `pnpm build` (typecheck known failures documented separately).
