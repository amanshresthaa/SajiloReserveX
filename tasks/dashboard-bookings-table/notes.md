# Dashboard Bookings Table — Notes

- `/dashboard` now renders `BookingsTable`, sourcing data via `useBookings` (React Query) against `/api/bookings?me=1`.
- Status filter buttons reset pagination to page 1; pagination keeps previous data for smoother transitions.
- Loading: skeleton rows (5) maintain layout; error: destructive alert with retry; empty: CTA linking to `/reserve`.
- Manual test: sign in, visit `/dashboard`; exercise status filters and paginate. Verify pagination summary and disabled buttons when at bounds.
