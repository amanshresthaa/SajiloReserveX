---
task: dashboard-recreation
timestamp_utc: 2025-11-17T12:13:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Implementation Plan: Dashboard Recreation

## Objective

We will rebuild the `/dashboard` page experience to match the current localhost implementation while aligning with repository patterns and accessibility/performance expectations.

## Success Criteria

- [ ] Dashboard provides the same auth/profile/booking data while delivering a refreshed, responsive layout.
- [ ] Booking stats, next booking highlight, and a small bookings preview render correctly with loading/error/empty states.
- [ ] Navigation/actions (book now, manage bookings/profile, support) function without runtime errors.
- [ ] Accessibility and performance budgets meet repository standards.

## Architecture & Components

- Server component keeps Supabase auth guard and profile hydration; hydrates React Query bookings state (prefetch + dehydrate).
- Client component renders dashboard shell using Shadcn `Card`, `Button`, `Badge`, `Avatar`, and `StatusChip`.
- New/updated sections: hero welcome card (with profile completeness and actions), stat tiles, next-booking highlight with status chip, quick actions/support, and bookings preview list (reusing `useBookings` patterns and small list rendering from `MyBookingsClient`).

## Data Flow & API Contracts

- Supabase auth → redirect to `/signin` with redirected-from on missing user.
- Profile data from `getOrCreateProfile`; personalization helpers derive display name, profile completion, contact info.
- Bookings fetched via `useBookings` + `useBookingsTableState` (page size 5); prefetch/hydrate for SSR parity.
- Errors surface with friendly cards; loading uses Skeletons.

## UI/UX States

- Loading: skeleton tiles/highlight during bookings fetch.
- Empty: guidance and CTAs when no bookings are returned.
- Error: clear message with path to My bookings/support.
- Success: stats + next booking + preview list rendered.

## Edge Cases

- Missing profile fields → fallback badges/messages.
- No bookings → empty highlight + guidance + CTA.
- Date parsing failures → safe labels.

## Testing Strategy

- Unit/integration: update/add tests around new client component rendering and data states if feasible (reuse patterns from `tests/ops/clients.test.tsx`).
- Manual: verify dashboard loading/success/empty/error states, navigation, keyboard focus, and responsive layout.

## Rollout

- No feature flag noted; ship as default experience once parity achieved.

## DB Change Plan (if applicable)

- No DB schema changes expected; if discovered, follow remote-only Supabase guidance.
