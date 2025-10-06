# Plan: Dynamic venue details in booking emails

1. Extend database schema:
   - Add contact columns (`contact_email`, `contact_phone`, `address`, `booking_policy`) to `public.restaurants` via migration.
   - Backfill existing rows with current default values so production keeps working.
2. Update generated Supabase types (`types/supabase.ts`) to reflect new fields.
3. Enhance `server/emails/bookings.ts`:
   - Fetch venue details (`getServiceSupabaseClient`) using `booking.restaurant_id`.
   - Fall back to `DEFAULT_VENUE` when lookup fails or fields are null.
   - Pass dynamic venue data through summary/html/text generation and replace remaining hard-coded references.
4. Run typecheck (acknowledging pre-existing failures) and document verification guidance.
