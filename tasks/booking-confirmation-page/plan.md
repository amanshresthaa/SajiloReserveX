# Plan — Booking Confirmation Page (US-003)

## Goal

Deliver a server-backed reservation confirmation page that renders structured data on the initial response, preserves hydration integrity, records analytics (including offline transitions), and is protected by Vitest + Playwright coverage (share CTA, offline alert).

## Steps

1. **Assess Loader & Data Contracts**
   - Reconfirm `app/reserve/[reservationId]/page.tsx` flow (auth redirect, `getReservation`, React Query hydration).
   - Identify missing props (JSON-LD string, venue snapshot) needed by the client component to avoid client-only derivations.
   - Define sanitization strategy for JSON-LD (escape `<` to prevent script breakouts).

2. **Enhance Server Loader**
   - Extend loader to:
     - Return 404 (notFound) on missing reservation.
     - Compute reservation JSON-LD (type `Reservation` / `FoodEstablishment`).
     - Serialize JSON-LD safely (escape `<`, `</script>`).
     - Pass serialized JSON-LD + venue metadata to client props.
   - Ensure React Query hydration still seeds `['reservation', id]`.

3. **Adapt Client Component**
   - Update `ReservationDetailClient` props to accept `structuredData` (string) and optional `venue` info.
   - Remove redundant client-side JSON-LD builder when server payload present; keep fallback for re-fetch/edge cases.
   - Ensure share payload + alerts use server-provided venue where available.
   - Double-check accessibility (focusable alerts, aria-live, button sizes, touch affordances).

4. **Vitest Coverage (Analytics & Offline)**
   - Create component tests stubbing `useReservation`, `useOnlineStatus`, `emit`, `track`, `shareReservationDetails`.
   - Validate:
     - Page emits `reservation_detail_viewed` once per reservation.
     - Offline state surfaces alert, disables share CTA, and triggers `network_offline` analytics with expected payload.
     - Share CTA emits analytics + feedback when online.
   - Confirm ICS download button respects loading state (optional stretch if time permits).

5. **Playwright Scenarios**
   - Seed booking via `/api/test/bookings`, navigate with `authedPage`.
   - Inject clipboard/share stubs (using `page.addInitScript`) so “Share details” resolves with success toast.
   - Assert offline alert appears when toggling `context.setOffline(true)` and share CTA disabled.
   - Restore online state post-assertion to avoid bleed.

6. **Regression Checks**
   - Run `pnpm test -- run` for targeted Vitest suite.
   - Run `pnpm test:e2e -- --grep` (or specific spec) for Playwright file.
   - Sanity-check type definitions if props changed.

7. **Documentation & Cleanup**
   - Update `tasks/booking-confirmation-page/todo.md` with execution checklist & completion marks.
   - Note residual risks (e.g., JSON-LD schema breadth) for hand-off.
