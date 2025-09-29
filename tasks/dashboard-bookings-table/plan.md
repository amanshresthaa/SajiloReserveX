# Dashboard Bookings Table — Plan

## Goal

Implement Story C1 by adding the React Query-powered bookings list UI on `/dashboard`, including table scaffold, status chips, skeletons, error handling, and pagination.

## Steps

1. **Hook Implementation**
   - Create `hooks/useBookings.ts` exposing typed hook with filters (`status`, `page`, `pageSize`, `sort`, `from`, `to`).
   - Build query string with `me=1`, use `fetchJson`, and share keys via `queryKeys.bookings.list`.

2. **UI Components**
   - Add `components/dashboard/StatusChip.tsx` using shadcn `Badge` with color map + accessible labels.
   - Add `components/dashboard/Pagination.tsx` rendering Prev/Next controls, disabled states, and range summary.
   - Add `components/dashboard/BookingsTable.tsx` to render table given data, loading/error states, skeleton rows, empty state, and action column placeholder.

3. **Dashboard Integration**
   - Update `app/(authed)/dashboard/page.tsx` to a client-oriented view that manages filters + pagination state, calls `useBookings`, and composes table component.
   - Wire in status filter (e.g., segmented buttons) and pass handlers to reset pagination when filters change.

4. **Polish & Docs**
   - Ensure accessibility (table semantics, aria-live for error/skeleton message, focusable controls).
   - Document manual verification steps in task notes.

## Verification

- Manual smoke: visit `/dashboard` signed in, verify loading skeleton, table data, pagination buttons, and empty state.
- No automated tests required for UI at this stage; rely on hook correctness via manual QA.
