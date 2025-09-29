# Dashboard Empty State — Notes

- New analytics helper (`lib/analytics/emit.ts`) uses `navigator.sendBeacon` when available and logs in development.
- `EmptyState` component emits `dashboard_empty_state_viewed` once per mount and renders CTA using button styling.
- `BookingsTable` consumes `EmptyState`, so visiting `/dashboard` without bookings should show the message and record the analytic event (check browser console in dev).
- Build continues to pass (`npm run build`).
