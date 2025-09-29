# Dashboard My Bookings API — Research

## Task Outline & Subtasks

- Inspect existing `/api/bookings` handler to understand current logic and identify where to branch for `?me=1`.
- Review supporting server utilities (`fetchBookingsForContact`, Supabase clients) and database structure to ensure pagination/filtering requirements are feasible.
- Capture requirements from Story B2: authenticate via Supabase session, filter by status/date, support pagination & sorting, return DTO with restaurant name, and add unit tests covering success & edge cases.

## Findings

- Current `GET` handler expects `email`, `phone`, and optional `restaurantId`. It uses `getRouteHandlerSupabaseClient()` (cookie-based session) and `fetchBookingsForContact` to query bookings for a specific restaurant, returning raw rows.
- No handling yet for authenticated “my bookings” flow; we need to branch when `searchParams.get('me') === '1'` and derive the email from the Supabase session (`session.user.email`). No `auth_user_id` linkage is populated yet, so email matching remains primary.
- Existing server utility `fetchBookingsForContact` expects both email & phone; for `me=1`, we can either call a new server function or write a direct query that joins `bookings` with `restaurants` and filters by `customer_email` (normalized). Given new indexes (`bookings_customer_email_start_idx`, etc.), direct SQL via Supabase RPC/select is viable.
- Database seeds provide diverse bookings with varying statuses, ensuring test coverage for upcoming/past entries once filtered.
- Need to return DTO per sprint contract:
  ```ts
  type BookingDTO = {
    id: string;
    restaurantName: string;
    partySize: number;
    startIso: string;
    endIso: string;
    status: 'pending' | 'pending_allocation' | 'confirmed' | 'cancelled';
    notes?: string | null;
  };
  ```
  plus `PageResp` metadata.
- Supabase JS client supports `select().eq().order().range()` combos; for page/limit we can map `page`/`pageSize` to `from` and `to` indexes.
- Sorting requirement is `start_time` asc/desc. We should default to `start_at` descending for history or ascending for upcoming? Sprint brief says default upcoming first; for `?me=1` we can default `sort=asc`.
- For filters: `status`, `from`, `to`; these should translate to `eq`, `gte`, `lte` on `status` and `start_at` or `booking_date`. Using `start_at` ensures timezone accuracy.
- Unit tests should live under `app/api/bookings/__tests__/get.me.test.ts` or similar using Vitest + `createRouteHandlerClient` mocks? Current repo lacks API tests; we’ll create `app/api/bookings/__tests__/my-bookings.test.ts` using `vitest` + `msw` or stubbed Supabase client? Might need to write tests at the level of the handler function using `createRouteHandlerSupabaseClient` mocked.

## Considerations & Risks

- Need to guard unauthorized access: if session missing, return 401; if session email undefined, 400 or treat as 401.
- Ensure query sanitizes input: `page`, `pageSize`, `status`, `sort`, `from`, `to`. Use `zod` schema to parse/validate.
- `page` should be 1-indexed per requirement; compute offset `(page-1)*pageSize`. Provide `total` via separate `count` query — Supabase `select('*', { count: 'exact', head: true })` can provide counts without retrieving data.
- When `customer_email` stored lowercase, use `session.user.email?.toLowerCase()` to match. For seeds missing email, handle gracefully.
- Need to join restaurant to fetch name; `bookings` table has `restaurant_id`. Supabase `.select('id,start_at,end_at,party_size,status,notes,restaurants(name)')` works if we configure `supabase.from('bookings').select('id, start_at, end_at, party_size, status, notes, restaurants(name)')`.
- RLS: since API uses service key or route handler client with auth session, ensure proper policy or override. Currently, route handler uses anon key with user session; bookings table RLS allows tenant read via `public.tenant_permitted(restaurant_id)`; since customers are not tenants, we rely on service role? Need to confirm: for `GET` we use `getRouteHandlerSupabaseClient()` which authenticates with anon key + session. Without matching tenant claims, RLS might block query. Since existing GET fetch works by reading service data, we might still have permission because policy check might fail? Need to test or consider using service client for this branch but filter by email to avoid leaking data. Possibly use service client but ensure we only fetch bookings for that email (server enforced). We'll note risk.

## Open Questions

- Confirm RLS requirements for selecting bookings via service client vs route handler client. If route handler lacks permission, we may switch to service client while maintaining email filtering server-side.
