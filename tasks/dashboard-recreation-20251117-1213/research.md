---
task: dashboard-recreation
timestamp_utc: 2025-11-17T12:13:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Research: Dashboard Recreation

## Requirements

- Functional: Recreate the `/dashboard` experience from scratch to match the current localhost page, ensuring navigation, data rendering, and interactions remain intact.
- Non-functional (a11y, perf, security, privacy, i18n): Maintain existing accessibility semantics, keyboard support, and performance budgets; no secrets in code; keep data handling consistent with current patterns.

## Existing Patterns & Reuse

- Guest dashboard (`src/app/(guest-account)/dashboard/page.tsx`) uses auth-guarded server component with Supabase, profile hydration, and a `PageShell` layout with `InfoCard` building blocks.
- Client-side overview (`DashboardOverviewClient`) relies on `useBookingsTableState` + `useBookings` to fetch bookings (default page size 5), compute highlight, and expose stats; uses Shadcn `Card`, `Button`, `Badge`, `Skeleton`, and `StatusChip` for UI.
- Helpers for personalization live in `../_lib/personalization` and bookings prefetch in `../_lib/bookings-prefetch`.
- Related components (`components/dashboard/*` and `MyBookingsClient`) show patterns for booking spotlight, insights, and table/list rendering that we can reuse.

## External Resources

- None yet; design will stay within existing component library (Shadcn + local patterns).

## Constraints & Risks

- Must follow Shadcn-first component usage and accessibility baselines.
- Data is user-specific via Supabase; need to avoid leaking/mis-handling profile or booking data.
- React Query hydration state must stay consistent between server/client for bookings prefetch.

## Open Questions (owner, due)

- Q: Are there specific new requirements beyond recreating the existing dashboard UI/UX? (owner: github:@amankumarshrestha, due: asap)
- Q: Should dashboard emphasize bookings table preview or keep lightweight stats-only summary? (owner: github:@amankumarshrestha, due: asap)

## Recommended Direction (with rationale)

- Rebuild the `/dashboard` page using the same data contracts (Supabase auth, profile, bookings prefetch) but restructure the UI with Shadcn cards/stat tiles and a richer bookings preview, following patterns from `MyBookingsClient` to ensure accessibility, responsiveness, and reuse.
