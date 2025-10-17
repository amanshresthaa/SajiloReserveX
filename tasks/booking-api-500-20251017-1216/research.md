# Research: Booking API 500 Error

## Existing Patterns & Reuse

- `src/app/api/bookings/route.ts` handles guest bookings and now delegates creation to `createBookingWithCapacityCheck` (`server/capacity/transaction.ts`) before sending confirmation/loyalty side effects.
- The RPC `public.create_booking_with_capacity_check` (`supabase/migrations/20251016092100_add_capacity_check_rpc.sql`) orchestrates idempotency, capacity validation, and inserts directly into `bookings`, returning structured error codes (`CAPACITY_EXCEEDED`, `BOOKING_CONFLICT`, `INTERNAL_ERROR`).
- Admin / ops booking flows (`src/app/api/ops/bookings/route.ts`, `server/ops/bookings.ts`) already include fallback helpers such as `resolveTimezone` that coerce missing / blank timezones to safe defaults.

## External Resources

- PostgreSQL docs on `make_timestamptz` and `pg_timezone_names` — needed to validate or coerce restaurant timezones server-side.
- IANA timezone database list (exposed via `Intl.supportedValuesOf('timeZone')` in Node 20) for validating user-provided timezones in application layer.

## Constraints & Risks

- Supabase RPC currently trusts `restaurants.timezone`; if invalid (empty, misspelled, annotated like `"Europe/London (BST)"`), `make_timestamptz` raises `invalid time zone` (`SQLSTATE 22023`), which the RPC swallows into `INTERNAL_ERROR`, propagating as 500 to customers.
- Admin tooling (`server/restaurants/details.ts`, `server/restaurants/update.ts`) only trims timezone strings; no guard ensures IANA compliance, so bad values can persist in production data.
- Existing bookings trigger `bookings_set_instants` (also uses `make_timestamptz`), so we must ensure any fix keeps triggers consistent with RPC behaviour.
- Need to avoid migrations that break prior seeds/tests; change must be additive and backward compatible.

## Open Questions (and answers if resolved)

- Q: What SQL error surfaces when RPC returns `INTERNAL_ERROR` for affected venue?
  A: Pending confirmation from logs; add observability to capture `sqlstate/sqlerrm` from RPC response to verify hypothesis.
- Q: Do any other code paths rely on raw `restaurants.timezone` without validation?
  A: Yes — multiple modules (emails, availability, ops dashboards) pull timezone directly; they should fall back gracefully but still benefit from validation helpers.

## Recommended Direction (with rationale)

- Harden the RPC: validate `v_timezone` against `pg_timezone_names` and fall back to `'UTC'` (or site default) before calling `make_timestamptz`; include `sqlstate/sqlerrm` in `details` so API can surface context for diagnostics.
- Add app-layer validation for restaurant timezones (shared helper leveraging `Intl.supportedValuesOf('timeZone')` where available) in create/update flows to prevent future bad data.
- Extend API error handling to log `bookingResult.details` when `error === 'INTERNAL_ERROR'` and attach a stable customer-facing message + support code instead of generic 500, improving triage while we roll out DB fix.
