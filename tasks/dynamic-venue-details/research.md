# Research: Dynamic venue details for booking emails

## Current behaviour

- Booking emails (`server/emails/bookings.ts`) rely on `DEFAULT_VENUE` from `lib/venue.ts` for name, address, phone, email, policy, timezone.
- `DEFAULT_VENUE` is populated from environment variables with hardcoded fallbacks (e.g., “SajiloReserveX Test Kitchen”).
- Booking records include `restaurant_id`; however, `server/emails/bookings.ts` never looks up per-restaurant info.

## Database schema

- `public.restaurants` currently stores only `id`, `name`, `slug`, `timezone`, `capacity`, timestamps (see `supabase/migrations/20241006000001_initial_schema.sql`).
- No columns for address/contact/policy exist, so we cannot pull rich venue details per tenant yet.

## Goal

- Fetch restaurant data from the database when composing booking emails, so the venue name (and ideally contact details) are tenant-specific instead of hard coded.
- Requires extending the `restaurants` table with additional contact columns, updating Supabase types, and wiring lookup logic in the email sender with graceful fallbacks to existing defaults.
