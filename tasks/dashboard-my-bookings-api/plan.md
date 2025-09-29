# Dashboard My Bookings API — Plan

## Goal

Extend `GET /api/bookings` to support `?me=1` for authenticated users, returning paginated/filtered booking data for the session email alongside restaurant names and enforcing ownership.

## Steps

1. **Query Parsing & Branching**
   - Update current `GET` handler to parse additional query params via `zod`: `me`, `page`, `pageSize`, `status`, `from`, `to`, `sort`.
   - When `me=1`, bypass existing email/phone validation, fetch Supabase session via `supabase.auth.getSession()`. If no session/email, return 401.
   - Normalize email to lowercase.

2. **Data Fetch Implementation**
   - Use service client (or ensure route handler client has access) to query `bookings` joined with `restaurants` filtered by `customer_email = sessionEmail`.
   - Apply optional filters: `status` equality; `from`/`to` mapped to `gte/lt` on `start_at` or `booking_date` (use `start_at` for timezone correctness).
   - Implement pagination using `page` (default 1) and `pageSize` (default 10, max 50). Compute offset and limit.
   - Sort by `start_at` asc/desc based on `sort` (default `asc`).
   - Fetch total count via `count('exact')`; map results to DTO including `restaurant.name`.

3. **Response Shape**
   - Return `{ items: BookingDTO[], pageInfo: { page, pageSize, total, hasNext } }` (use count to compute `hasNext`).
   - Ensure dates return ISO strings (use `start_at.toISOString()`).

4. **Unit Tests**
   - Create Vitest suite (e.g., `app/api/bookings/__tests__/my-bookings.test.ts`) mocking Supabase clients to simulate data.
   - Cover cases: no session (401), empty result, filtering by status, date range, pagination (page 2). Use `vi.mock` on `@/server/supabase` to return stub client; stub `from().select()` chain.

5. **Documentation / Notes**
   - Update task notes with manual test instructions (call endpoint via fetch when logged in) and mention reliance on service client.

## Verification

- Run targeted Vitest tests.
- Optionally hit endpoint locally after login to confirm JSON structure.
