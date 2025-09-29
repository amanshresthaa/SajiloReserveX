# Dashboard Empty State — Plan

## Goal

Satisfy Story C2 by extracting a reusable dashboard empty state component that emits the `dashboard_empty_state_viewed` analytics event and integrates with the bookings table.

## Steps

1. **Analytics Helper**
   - Add `lib/analytics/emit.ts` with an `emit` function that posts events to `/api/events` (if implemented) or logs to console in development. Accept event name and optional payload.

2. **Empty State Component**
   - Create `components/dashboard/EmptyState.tsx` rendering friendly message, CTA link to `/reserve`, and invoking analytics emission on mount (use `useEffect` + ref guard to avoid duplicates).
   - Accept props for title/description/cta label if needed (default to current messaging).

3. **Bookings Table Integration**
   - Replace inline empty state markup with `EmptyState` component and ensure analytics fires only once per table view when empty.

4. **Docs**
   - Update task TODO and notes with manual verification (check devtools console/log for analytics event).

## Verification

- Manual: Visit `/dashboard` with no bookings; confirm empty state UI and one analytics emission.
- `npm run build` to ensure lint/type safety.
