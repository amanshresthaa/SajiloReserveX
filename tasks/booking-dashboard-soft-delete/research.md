# Research Notes

## Schema updates

- `database/database.sql` now defines `booking_versions` (append-only audit trail) and the `current_bookings` view that filters statuses to `confirmed`, `pending`, and `pending_allocation`.
- Bookings trigger `tg__bookings_write_version` inserts into `booking_versions` on every INSERT/UPDATE (and when status changes to `cancelled`), meaning the application should avoid hard deletes and rely on status transitions.
- RLS is enabled for `booking_versions`, so server-side access likely needs the service role or tenant-aware policies.

## Dashboard booking flow

- `app/(authed)/dashboard/page.tsx` renders the management UI and pulls data via `useBookings`.
- `hooks/useBookings.ts` builds `/api/bookings?me=1` queries with optional `status`, `sort`, `from`, `to`, and pagination params; default status is omitted (showing all statuses today).
- `components/dashboard/BookingsTable.tsx` exposes status filter chips for `all`, `confirmed`, `pending`, `pending_allocation`, and `cancelled`; both actions disable when `status === 'cancelled'`.
- `hooks/useCancelBooking.ts` still issues `DELETE /api/bookings/:id`, but the handler already calls `softCancelBooking` (status flip) instead of physical delete.
- `hooks/useUpdateBooking.ts` sends the dialog payload to `PUT /api/bookings/:id`; API re-selects the booking and revalidates availability.

## API surface

- `app/api/bookings/route.ts` handles the `/api/bookings?me=1` path: it authenticates, parses query params, and runs a `select` against `public.bookings` (not the new `current_bookings` view). Without a status filter, cancelled rows remain in default listings.
- Pagination uses `count: 'exact'` and orders by `start_at`. Results map into the `BookingDTO` used in the dashboard UI.
- The same file still exposes customer-facing create/search logic; relevant pieces reuse helpers in `server/bookings.ts` that already guard on `BOOKING_BLOCKING_STATUSES` (active statuses only).
- `app/api/bookings/[id]/route.ts` ensures `DELETE` calls `softCancelBooking`, logs audit entries, and re-fetches bookings for the contact.

## Types & utilities

- `types/supabase.ts` has not been refreshed: it lacks the `booking_versions` table definitions and has `Views: { [_ in never]: never; }`, so there is no typing for `current_bookings`.
- `server/bookings.ts` helper queries still read directly from `bookings` while filtering on `BOOKING_BLOCKING_STATUSES`, keeping cancelled items out of availability calculations.

## Considerations for implementation

- Default dashboard lists should likely leverage `current_bookings` (or equivalent status filtering) so cancelled rows disappear unless explicitly requested.
- TypeScript helpers that rely on Supabase typed clients will error if we introduce queries against the new view/table until we extend `types/supabase.ts`.
- Any new read of `booking_versions` must use the service client (RLS) or join on tenant id.

## Follow-up observations (user report)

- Dashboard edits now fail with HTTP 409 from `/api/bookings/[id]`, even when attempting legitimate changes; need to inspect overlap detection and table reassignment logic.
- After cancelling a booking (status = `cancelled`), the row disappears from the dashboard listing. The new product requirement is to keep cancelled bookings visible in the dashboard while still performing a soft delete at the database layer.
