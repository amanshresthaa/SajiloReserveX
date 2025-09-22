-- Migration to add support for drinks booking type and indoor seating preference.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'booking_type' AND e.enumlabel = 'drinks'
  ) THEN
    EXECUTE 'ALTER TYPE public.booking_type ADD VALUE ''drinks''';
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'seating_preference_type' AND e.enumlabel = 'indoor'
  ) THEN
    EXECUTE 'ALTER TYPE public.seating_preference_type ADD VALUE ''indoor''';
  END IF;
END
$$;
