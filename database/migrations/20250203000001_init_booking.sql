-- ===========================================
--  Sajilo Reserve — clean bootstrap schema
--  WARNING: Drops and recreates the entire `public` schema
--  Postgres 13+ (Supabase compatible)
-- ===========================================

-- Be quiet about drops
SET client_min_messages TO WARNING;

-- -------------------------------------------
-- 1) Reset the schema (removes all tables, views, policies, etc.)
-- -------------------------------------------
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
COMMENT ON SCHEMA public IS 'Application schema (recreated by bootstrap script)';
GRANT USAGE, CREATE ON SCHEMA public TO PUBLIC;

-- Ensure we default to the new schema
SET search_path = public;

-- -------------------------------------------
-- 2) Extensions
-- -------------------------------------------
-- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- GiST operator classes for EXCLUDE/UUID equality (handy if you later add no-overlap constraints)
CREATE EXTENSION IF NOT EXISTS btree_gist;
-- Case-insensitive emails (optional but helpful)
CREATE EXTENSION IF NOT EXISTS citext;

-- -------------------------------------------
-- 3) Enum types (cleaner than text+check)
-- -------------------------------------------
DO $$
BEGIN
  -- seating in areas (includes terrace)
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'area_seating_type') THEN
    CREATE TYPE area_seating_type AS ENUM ('indoor','outdoor','private','bar','terrace');
  END IF;

  -- seating on tables (no terrace here; tables on terrace are 'outdoor')
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'table_seating_type') THEN
    CREATE TYPE table_seating_type AS ENUM ('indoor','outdoor','private','bar');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'seating_preference_type') THEN
    CREATE TYPE seating_preference_type AS ENUM ('any','indoor','outdoor');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_type') THEN
    CREATE TYPE booking_type AS ENUM ('lunch','dinner','drinks');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
    CREATE TYPE booking_status AS ENUM ('pending','confirmed','seated','completed','canceled','no_show','waitlisted');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'waiting_status') THEN
    CREATE TYPE waiting_status AS ENUM ('waiting','notified','converted','expired');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'loyalty_tier') THEN
    CREATE TYPE loyalty_tier AS ENUM ('bronze','silver','gold','platinum');
  END IF;
END$$;

-- -------------------------------------------
-- 4) Core tables
-- -------------------------------------------

CREATE TABLE public.restaurants (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  slug         text NOT NULL UNIQUE,
  timezone     text NOT NULL DEFAULT 'Europe/London',
  capacity     int  CHECK (capacity IS NULL OR capacity > 0),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT restaurants_slug_format_chk CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

CREATE TABLE public.restaurant_areas (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id  uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name           text NOT NULL,
  seating_type   area_seating_type NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT restaurant_areas_unique_name_per_restaurant UNIQUE (restaurant_id, name)
);

CREATE TABLE public.restaurant_tables (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id  uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  area_id        uuid REFERENCES public.restaurant_areas(id) ON DELETE SET NULL,
  label          text NOT NULL,
  capacity       int  NOT NULL CHECK (capacity > 0),
  seating_type   table_seating_type NOT NULL,
  features       text[] NOT NULL DEFAULT '{}',
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tables_unique_label_per_restaurant UNIQUE (restaurant_id, label)
);
CREATE TABLE public.bookings (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id       uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  table_id            uuid REFERENCES public.restaurant_tables(id) ON DELETE SET NULL,
  booking_date        date NOT NULL,
  start_time          time NOT NULL,
  end_time            time NOT NULL,
  party_size          int  NOT NULL CHECK (party_size > 0),
  booking_type        booking_type NOT NULL DEFAULT 'dinner',
  seating_preference  seating_preference_type NOT NULL DEFAULT 'any',
  status              booking_status NOT NULL DEFAULT 'confirmed',
  customer_name       text   NOT NULL,
  customer_email      citext NOT NULL,
  customer_phone      text   NOT NULL,
  notes               text,
  source              text   NOT NULL DEFAULT 'web',
  loyalty_points_awarded int NOT NULL DEFAULT 0 CHECK (loyalty_points_awarded >= 0),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT booking_time_range CHECK (end_time > start_time)
);

CREATE TABLE public.waiting_list (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id       uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  booking_date        date NOT NULL,
  desired_time        time NOT NULL,
  party_size          int  NOT NULL CHECK (party_size > 0),
  seating_preference  seating_preference_type NOT NULL DEFAULT 'any',
  customer_name       text   NOT NULL,
  customer_email      citext NOT NULL,
  customer_phone      text   NOT NULL,
  notes               text,
  status              waiting_status NOT NULL DEFAULT 'waiting',
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.availability_rules (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id  uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  day_of_week    smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  booking_type   booking_type NOT NULL DEFAULT 'dinner',
  open_time      time NOT NULL,
  close_time     time NOT NULL,
  is_closed      boolean NOT NULL DEFAULT false,
  notes          text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT availability_rules_unique UNIQUE (restaurant_id, day_of_week, booking_type),
  CONSTRAINT availability_time_check CHECK (is_closed OR close_time > open_time)
);

CREATE TABLE public.reviews (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id  uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  booking_id     uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  rating         smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title          text,
  comment        text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.loyalty_points (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email   citext NOT NULL UNIQUE,
  total_points     int NOT NULL DEFAULT 0 CHECK (total_points >= 0),
  tier             loyalty_tier NOT NULL DEFAULT 'bronze',
  last_awarded_at  timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.audit_logs (
  id         bigserial PRIMARY KEY,
  actor      text DEFAULT 'system',
  action     text NOT NULL,
  entity     text NOT NULL,
  entity_id  uuid,
  metadata   jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- -------------------------------------------
-- 4b) Grants & default privileges
-- -------------------------------------------
GRANT USAGE ON SCHEMA public TO service_role, authenticated, anon;

GRANT ALL ON public.restaurants       TO service_role;
GRANT ALL ON public.restaurant_areas  TO service_role;
GRANT ALL ON public.restaurant_tables TO service_role;
GRANT ALL ON public.bookings          TO service_role;
GRANT ALL ON public.waiting_list      TO service_role;
GRANT ALL ON public.availability_rules TO service_role;
GRANT ALL ON public.reviews           TO service_role;
GRANT ALL ON public.loyalty_points    TO service_role;
GRANT ALL ON public.audit_logs        TO service_role;

GRANT SELECT ON public.restaurants       TO authenticated;
GRANT SELECT ON public.restaurant_areas  TO authenticated;
GRANT SELECT ON public.restaurant_tables TO authenticated;
GRANT SELECT ON public.availability_rules TO authenticated;

GRANT SELECT ON public.restaurants       TO anon;
GRANT SELECT ON public.restaurant_areas  TO anon;
GRANT SELECT ON public.restaurant_tables TO anon;
GRANT SELECT ON public.availability_rules TO anon;

GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
-- -------------------------------------------
-- 5) Updated-at trigger (modern EXECUTE FUNCTION)
-- -------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_restaurants_set_updated_at
BEFORE UPDATE ON public.restaurants
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_restaurant_areas_set_updated_at
BEFORE UPDATE ON public.restaurant_areas
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_restaurant_tables_set_updated_at
BEFORE UPDATE ON public.restaurant_tables
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_bookings_set_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -------------------------------------------
-- 6) Indexes
-- -------------------------------------------
CREATE INDEX bookings_restaurant_date_idx
  ON public.bookings(restaurant_id, booking_date, start_time);

CREATE INDEX bookings_email_idx
  ON public.bookings(customer_email);

CREATE INDEX waiting_list_lookup_idx
  ON public.waiting_list(restaurant_id, booking_date);

CREATE INDEX availability_rules_lookup_idx
  ON public.availability_rules(restaurant_id, day_of_week, booking_type);

-- Helpful uniques already added: (restaurant_id, name) on areas; (restaurant_id, label) on tables

-- -------------------------------------------
-- 7) Row Level Security (RLS)
-- -------------------------------------------
ALTER TABLE public.restaurants       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_areas  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waiting_list      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_points    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs        ENABLE ROW LEVEL SECURITY;

-- Public read for availability-related data
CREATE POLICY "Anon read restaurants"
  ON public.restaurants
  FOR SELECT USING (true);

CREATE POLICY "Anon read areas"
  ON public.restaurant_areas
  FOR SELECT USING (true);

CREATE POLICY "Anon read tables"
  ON public.restaurant_tables
  FOR SELECT USING (true);

CREATE POLICY "Anon read availability"
  ON public.availability_rules
  FOR SELECT USING (true);

-- Service role full control (Supabase: relies on auth.role())
CREATE POLICY "Service role manage restaurants"
  ON public.restaurants
  USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role manage areas"
  ON public.restaurant_areas
  USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role manage tables"
  ON public.restaurant_tables
  USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role manage bookings"
  ON public.bookings
  USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role manage waiting list"
  ON public.waiting_list
  USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role manage availability"
  ON public.availability_rules
  USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role manage reviews"
  ON public.reviews
  USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role manage loyalty"
  ON public.loyalty_points
  USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role manage audit"
  ON public.audit_logs
  USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- -------------------------------------------
-- 8) Seed data (idempotent)
-- -------------------------------------------

INSERT INTO public.restaurants (id, name, slug, timezone, capacity)
VALUES ('f6c2f62d-0b6c-4dfd-b0ec-2d1c7a509a68', 'Sajilo Reserve Flagship', 'flagship', 'Europe/London', 120)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.restaurant_areas (id, restaurant_id, name, seating_type)
VALUES
  ('15f79ad8-5d57-46d5-9f3a-3b4f249e8973', 'f6c2f62d-0b6c-4dfd-b0ec-2d1c7a509a68', 'Main Dining',  'indoor'),
  ('0d1bb076-9f73-4a38-b2c1-8dc1f86a4e64', 'f6c2f62d-0b6c-4dfd-b0ec-2d1c7a509a68', 'Terrace',      'outdoor'),
  ('871a9fc1-1cd7-4f78-9e72-4fcbb40c5f74', 'f6c2f62d-0b6c-4dfd-b0ec-2d1c7a509a68', 'Private Lounge','private')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.restaurant_tables (id, restaurant_id, area_id, label, capacity, seating_type, features)
VALUES
  ('9df2307b-d0e4-4335-9f91-8047d7aa18c6', 'f6c2f62d-0b6c-4dfd-b0ec-2d1c7a509a68', '15f79ad8-5d57-46d5-9f3a-3b4f249e8973', 'T1',         2, 'indoor',  '{window}'),
  ('3e3fda5a-41cf-4e7f-9a7d-5a3dd5f39167', 'f6c2f62d-0b6c-4dfd-b0ec-2d1c7a509a68', '15f79ad8-5d57-46d5-9f3a-3b4f249e8973', 'T2',         4, 'indoor',  '{booth}'),
  ('836e577f-6f42-41dd-a962-44389cfe2a79', 'f6c2f62d-0b6c-4dfd-b0ec-2d1c7a509a68', '0d1bb076-9f73-4a38-b2c1-8dc1f86a4e64', 'Terrace-1',  4, 'outdoor', '{heater,covered}'),
  ('1bad7ee7-bff8-4c90-b6f6-7dfafd596d35', 'f6c2f62d-0b6c-4dfd-b0ec-2d1c7a509a68', '871a9fc1-1cd7-4f78-9e72-4fcbb40c5f74', 'Private-1',  8, 'private', '{av,privacy}')
ON CONFLICT (id) DO NOTHING;

-- Default opening windows (lunch & dinner) for each weekday
DO $$
DECLARE
  dow int;
BEGIN
  FOR dow IN 0..6 LOOP
    INSERT INTO public.availability_rules (restaurant_id, day_of_week, booking_type, open_time, close_time, is_closed, notes)
    VALUES ('f6c2f62d-0b6c-4dfd-b0ec-2d1c7a509a68', dow, 'lunch',  TIME '11:30', TIME '15:30', false, 'Standard lunch service')
    ON CONFLICT (restaurant_id, day_of_week, booking_type) DO NOTHING;

    INSERT INTO public.availability_rules (restaurant_id, day_of_week, booking_type, open_time, close_time, is_closed, notes)
    VALUES ('f6c2f62d-0b6c-4dfd-b0ec-2d1c7a509a68', dow, 'dinner', TIME '17:30',
            CASE WHEN dow IN (5,6) THEN TIME '23:30' ELSE TIME '22:30' END,
            false, 'Standard dinner service')
    ON CONFLICT (restaurant_id, day_of_week, booking_type) DO NOTHING;
  END LOOP;
END $$;

-- -------------------------------------------
-- 9) (Optional) future: prevent overlapping bookings per table
--    Uncomment to enforce no overlaps regardless of status.
--    Requires btree_gist (enabled above).
-- -------------------------------------------
-- ALTER TABLE public.bookings
--   ADD COLUMN IF NOT EXISTS booking_span tsrange
--     GENERATED ALWAYS AS (
--       tsrange(booking_date::timestamp + start_time,
--               booking_date::timestamp + end_time, '[)')
--     ) STORED;
-- ALTER TABLE public.bookings
--   ADD CONSTRAINT bookings_no_overlap_per_table
--   EXCLUDE USING gist (table_id WITH =, booking_span WITH &&);

-- Done.
