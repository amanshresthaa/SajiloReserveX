# Dashboard React Query — Notes

- Provider now lives in `app/providers.tsx`; wrap client components under `AppProviders` for access to React Query hooks.
- Devtools render only when `NODE_ENV !== 'production'` and appear bottom-left.
- Use `fetchJson` for API calls; it throws `HttpError` with `{ message, status, code }` and normalizes non-JSON responses.
- Booking-related query keys available via `queryKeys.bookings.list(params)` and `.detail(id)`.
- Tests executed with `pnpm test` (Vitest) to validate the helper.
