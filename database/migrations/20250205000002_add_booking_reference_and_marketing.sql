-- Adds booking reference identifiers and marketing opt-in flag.
-- Ensures existing bookings get backfilled references.

-- Helper function to generate a 10 character mixed alphanumeric reference.
CREATE OR REPLACE FUNCTION public.generate_booking_reference(reference_length integer DEFAULT 10)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  chars CONSTANT text := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  chars_count integer := length(chars);
  result text := '';
  idx integer;
  final_length integer := COALESCE(NULLIF(reference_length, 0), 10);
BEGIN
  FOR idx IN 1..final_length LOOP
    result := result || substr(chars, 1 + floor(random() * chars_count)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS reference text,
  ADD COLUMN IF NOT EXISTS marketing_opt_in boolean NOT NULL DEFAULT false;

-- Backfill reference codes for any existing rows lacking one.
UPDATE public.bookings
SET reference = public.generate_booking_reference()
WHERE reference IS NULL OR length(reference) = 0;

ALTER TABLE public.bookings
  ALTER COLUMN reference SET NOT NULL,
  ALTER COLUMN reference SET DEFAULT public.generate_booking_reference();

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_reference_unique UNIQUE (reference),
  ADD CONSTRAINT bookings_reference_format_chk CHECK (reference ~ '^[A-Z0-9]{10}$');

COMMENT ON COLUMN public.bookings.reference IS '10 character mixed alphanumeric booking reference displayed to guests.';
COMMENT ON COLUMN public.bookings.marketing_opt_in IS 'True when the guest opted into marketing communications during reservation.';
