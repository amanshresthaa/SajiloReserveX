-- Concurrent index creation for booking conflict detection and duplicate prevention.
-- Supabase migration runner wraps each file in a transaction, so `CREATE INDEX CONCURRENTLY`
-- cannot be used here. Run the companion script `scripts/db/booking-indexes-concurrent.sql`
-- manually if zero-downtime builds are required in production environments.

-- Ensure fast overlap detection by table/date/time while covering fields used in allocation queries.
CREATE INDEX IF NOT EXISTS bookings_table_date_start_idx
  ON public.bookings (table_id, booking_date, start_time)
  INCLUDE (end_time, status, party_size, seating_preference, id);

-- Accelerate duplicate detection when matching diner contact details within a restaurant.
CREATE INDEX IF NOT EXISTS bookings_restaurant_contact_idx
  ON public.bookings (restaurant_id, customer_email, customer_phone)
  INCLUDE (status, id, created_at);
