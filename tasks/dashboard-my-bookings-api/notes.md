# Dashboard My Bookings API — Notes

- `GET /api/bookings?me=1` now reads the Supabase session email and returns paginated results with filters for `status`, `from`, `to`, `sort`, and `restaurantId`.
- Query uses the service client and normalizes timestamps to ISO strings; pagination metadata exposes `page`, `pageSize`, `total`, and `hasNext`.
- Manual check: log in, hit `/api/bookings?me=1&page=1&pageSize=5`, and confirm response is limited to the signed-in user.
- Tests: `pnpm test` (Vitest) includes `tests/unit/my-bookings-api.test.ts` covering unauthorized and happy path flows.
