-- SAFE RESET: no DROP SCHEMA, no CREATE EXTENSION required
-- DANGER: This still DROPS all listed tables/types/domain in schema "public".
BEGIN;

-- =========================
-- Compatibility helpers (no-superuser)
-- =========================

-- UUID generator that works with or without pgcrypto/uuid-ossp.
-- Tries gen_random_uuid(), then uuid_generate_v4(), then pure-SQL fallback.
CREATE OR REPLACE FUNCTION public.app_uuid() RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v uuid;
BEGIN
  BEGIN
    SELECT gen_random_uuid() INTO v;     -- pgcrypto (if available)
    RETURN v;
  EXCEPTION WHEN undefined_function THEN
    BEGIN
      SELECT uuid_generate_v4() INTO v;  -- uuid-ossp (if available)
      RETURN v;
    EXCEPTION WHEN undefined_function THEN
      -- pure SQL fallback (valid v4 UUID)
      RETURN (
        lpad(to_hex((random()*4294967295)::bigint), 8, '0') || '-' ||
        lpad(to_hex((random()*65535)::int),          4, '0') || '-' ||
        '4' || substr(lpad(to_hex((random()*65535)::int), 4, '0'), 2) || '-' ||
        to_hex( (8 + (random()*3)::int) ) ||
        substr(lpad(to_hex((random()*65535)::int), 4, '0'), 2) || '-' ||
        lpad(to_hex((random()*4294967295)::bigint), 8, '0') ||
        lpad(to_hex((random()*65535)::int),          4, '0')
      )::uuid;
    END;
  END;
END;
$$;

-- Create a tiny compatibility version of auth.role() if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'auth' AND p.proname = 'role'
  ) THEN
    CREATE SCHEMA IF NOT EXISTS auth;

    CREATE OR REPLACE FUNCTION auth.role() RETURNS text
    LANGUAGE sql
    STABLE
    AS $fn$
      SELECT current_user::text;
    $fn$;
  END IF;
END
$$;


-- =========================
-- Tear down (no DROP SCHEMA)
-- =========================

-- Drop RLS policies first (to avoid dependency errors)
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT polname, n.nspname, c.relname
    FROM pg_policy
    JOIN pg_class c ON c.oid = pg_policy.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.polname, r.nspname, r.relname);
  END LOOP;
END
$$;

-- Disable RLS before dropping (defensive)
ALTER TABLE IF EXISTS public.restaurants            DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.restaurant_areas       DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.restaurant_tables      DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.bookings               DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reviews                DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.availability_rules     DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.waiting_list           DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.loyalty_points         DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_logs             DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.stripe_events          DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.observability_events   DISABLE ROW LEVEL SECURITY;

-- Drop tables in FK-safe order (children -> parents)
DROP TABLE IF EXISTS public.reviews              CASCADE;
DROP TABLE IF EXISTS public.bookings             CASCADE;
DROP TABLE IF EXISTS public.restaurant_tables    CASCADE;
DROP TABLE IF EXISTS public.restaurant_areas     CASCADE;
DROP TABLE IF EXISTS public.availability_rules   CASCADE;
DROP TABLE IF EXISTS public.waiting_list         CASCADE;
DROP TABLE IF EXISTS public.loyalty_points       CASCADE;
DROP TABLE IF EXISTS public.audit_logs           CASCADE;
DROP TABLE IF EXISTS public.stripe_events        CASCADE;
DROP TABLE IF EXISTS public.observability_events CASCADE;
DROP TABLE IF EXISTS public.restaurants          CASCADE;

-- Sequences
DROP SEQUENCE IF EXISTS public.audit_logs_id_seq;

-- Types & domain
DROP DOMAIN IF EXISTS public.email_address;
DROP TYPE   IF EXISTS public.waiting_status;
DROP TYPE   IF EXISTS public.loyalty_tier;
DROP TYPE   IF EXISTS public.seating_preference_type;
DROP TYPE   IF EXISTS public.booking_type;
DROP TYPE   IF EXISTS public.booking_status;

-- =========================
-- Recreate types / domain / functions
-- =========================

CREATE DOMAIN public.email_address AS text
  CHECK (VALUE ~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$');

CREATE TYPE public.booking_status           AS ENUM ('confirmed','cancelled','pending','pending_allocation');
CREATE TYPE public.booking_type             AS ENUM ('breakfast','lunch','dinner','drinks');
CREATE TYPE public.seating_preference_type  AS ENUM ('any','indoor','window','booth','bar','outdoor');
CREATE TYPE public.loyalty_tier             AS ENUM ('bronze','silver','gold','platinum');
CREATE TYPE public.waiting_status           AS ENUM ('waiting','notified','expired','fulfilled','cancelled');

-- Booking reference generator
CREATE OR REPLACE FUNCTION public.generate_booking_reference()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  ref   text := '';
  i     int;
BEGIN
  FOR i IN 1..10 LOOP
    ref := ref || substr(chars, 1 + floor(random() * length(chars))::int, 1);
  END LOOP;
  RETURN ref;
END;
$$;

-- Sequence
CREATE SEQUENCE public.audit_logs_id_seq START WITH 1 INCREMENT BY 1 OWNED BY NONE;

-- =========================
-- Tables (created in FK-safe order)
-- =========================

CREATE TABLE public.restaurants (
  id uuid NOT NULL DEFAULT public.app_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  timezone text NOT NULL DEFAULT 'Europe/London',
  capacity integer CHECK (capacity IS NULL OR capacity > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT restaurants_pkey PRIMARY KEY (id)
);

CREATE TABLE public.restaurant_areas (
  id uuid NOT NULL DEFAULT public.app_uuid(),
  restaurant_id uuid NOT NULL,
  name text NOT NULL,
  seating_type public.seating_preference_type NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT restaurant_areas_pkey PRIMARY KEY (id),
  CONSTRAINT restaurant_areas_restaurant_id_fkey
    FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE
);

CREATE TABLE public.restaurant_tables (
  id uuid NOT NULL DEFAULT public.app_uuid(),
  restaurant_id uuid NOT NULL,
  area_id uuid,
  label text NOT NULL,
  capacity integer NOT NULL CHECK (capacity > 0),
  seating_type public.seating_preference_type NOT NULL,
  features text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT restaurant_tables_pkey PRIMARY KEY (id),
  CONSTRAINT restaurant_tables_restaurant_id_fkey
    FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE,
  CONSTRAINT restaurant_tables_area_id_fkey
    FOREIGN KEY (area_id) REFERENCES public.restaurant_areas(id) ON DELETE SET NULL
);

CREATE TABLE public.bookings (
  id uuid NOT NULL DEFAULT public.app_uuid(),
  restaurant_id uuid NOT NULL,
  table_id uuid,
  booking_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  party_size integer NOT NULL CHECK (party_size > 0),
  booking_type public.booking_type NOT NULL DEFAULT 'dinner',
  seating_preference public.seating_preference_type NOT NULL DEFAULT 'any',
  status public.booking_status NOT NULL DEFAULT 'confirmed',
  customer_name text NOT NULL,
  customer_email public.email_address NOT NULL,
  customer_phone text NOT NULL,
  notes text,
  source text NOT NULL DEFAULT 'web',
  loyalty_points_awarded integer NOT NULL DEFAULT 0 CHECK (loyalty_points_awarded >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  reference text NOT NULL DEFAULT public.generate_booking_reference()
    UNIQUE CHECK (reference ~ '^[A-Z0-9]{10}$'),
  marketing_opt_in boolean NOT NULL DEFAULT false,
  CONSTRAINT bookings_pkey PRIMARY KEY (id),
  CONSTRAINT bookings_restaurant_id_fkey
    FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE,
  CONSTRAINT bookings_table_id_fkey
    FOREIGN KEY (table_id) REFERENCES public.restaurant_tables(id) ON DELETE SET NULL
);

-- Booking performance indexes
CREATE INDEX IF NOT EXISTS bookings_table_date_start_idx
  ON public.bookings (table_id, booking_date, start_time)
  INCLUDE (end_time, status, party_size, seating_preference, id);

CREATE INDEX IF NOT EXISTS bookings_restaurant_contact_idx
  ON public.bookings (restaurant_id, customer_email, customer_phone)
  INCLUDE (status, id, created_at);

CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT public.app_uuid(),
  restaurant_id uuid NOT NULL,
  booking_id uuid,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title text,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_restaurant_id_fkey
    FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE,
  CONSTRAINT reviews_booking_id_fkey
    FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE SET NULL
);

CREATE TABLE public.availability_rules (
  id uuid NOT NULL DEFAULT public.app_uuid(),
  restaurant_id uuid NOT NULL,
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  booking_type public.booking_type NOT NULL DEFAULT 'dinner',
  open_time time NOT NULL,
  close_time time NOT NULL,
  is_closed boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT availability_rules_pkey PRIMARY KEY (id),
  CONSTRAINT availability_rules_restaurant_id_fkey
    FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE
);

CREATE TABLE public.waiting_list (
  id uuid NOT NULL DEFAULT public.app_uuid(),
  restaurant_id uuid NOT NULL,
  booking_date date NOT NULL,
  desired_time time NOT NULL,
  party_size integer NOT NULL CHECK (party_size > 0),
  seating_preference public.seating_preference_type NOT NULL DEFAULT 'any',
  customer_name text NOT NULL,
  customer_email public.email_address NOT NULL,
  customer_phone text NOT NULL,
  notes text,
  status public.waiting_status NOT NULL DEFAULT 'waiting',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT waiting_list_pkey PRIMARY KEY (id),
  CONSTRAINT waiting_list_restaurant_id_fkey
    FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE
);

CREATE TABLE public.loyalty_points (
  id uuid NOT NULL DEFAULT public.app_uuid(),
  customer_email public.email_address NOT NULL UNIQUE,
  total_points integer NOT NULL DEFAULT 0 CHECK (total_points >= 0),
  tier public.loyalty_tier NOT NULL DEFAULT 'bronze',
  last_awarded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT loyalty_points_pkey PRIMARY KEY (id)
);

CREATE TABLE public.audit_logs (
  id bigint NOT NULL DEFAULT nextval('public.audit_logs_id_seq'::regclass),
  actor text DEFAULT 'system',
  action text NOT NULL,
  entity text NOT NULL,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id)
);

CREATE TABLE public.stripe_events (
  id uuid NOT NULL DEFAULT public.app_uuid(),
  event_id text NOT NULL UNIQUE,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  status text NOT NULL DEFAULT 'pending',
  CONSTRAINT stripe_events_pkey PRIMARY KEY (id)
);
CREATE INDEX stripe_events_received_idx ON public.stripe_events (received_at DESC);

CREATE TABLE public.observability_events (
  id uuid NOT NULL DEFAULT public.app_uuid(),
  event_type text NOT NULL,
  source text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('info','warning','error','critical')),
  context jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT observability_events_pkey PRIMARY KEY (id)
);
CREATE INDEX observability_events_type_idx
  ON public.observability_events (event_type, created_at DESC);

-- =========================
-- Row Level Security (RLS)
-- =========================

ALTER TABLE public.restaurants            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_areas       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_tables      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_rules     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waiting_list           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_points         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_events          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.observability_events   ENABLE ROW LEVEL SECURITY;

-- Service role policies (full access)
CREATE POLICY "Service role full access restaurants"
  ON public.restaurants
  USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role full access restaurant_areas"
  ON public.restaurant_areas
  USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role full access restaurant_tables"
  ON public.restaurant_tables
  USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role full access bookings"
  ON public.bookings
  USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role full access reviews"
  ON public.reviews
  USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role full access availability_rules"
  ON public.availability_rules
  USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role full access waiting_list"
  ON public.waiting_list
  USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role full access loyalty_points"
  ON public.loyalty_points
  USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role full access audit_logs"
  ON public.audit_logs
  USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role full access stripe_events"
  ON public.stripe_events
  USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role full access observability_events"
  ON public.observability_events
  USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Public read policies for frontend discovery
CREATE POLICY "Public read restaurants"
  ON public.restaurants FOR SELECT USING (true);

CREATE POLICY "Public read restaurant_areas"
  ON public.restaurant_areas FOR SELECT USING (true);

CREATE POLICY "Public read restaurant_tables"
  ON public.restaurant_tables FOR SELECT USING (true);

CREATE POLICY "Public read availability_rules"
  ON public.availability_rules FOR SELECT USING (true);

-- =========================
-- Sample Data (for development)
-- =========================

INSERT INTO public.restaurants (id, name, slug, timezone, capacity)
VALUES ('f6c2f62d-0b6c-4dfd-b0ec-2d1c7a509a68', 'Sajilo Restaurant', 'sajilo-restaurant', 'Europe/London', 100)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.restaurant_areas (id, restaurant_id, name, seating_type) VALUES
  ('d89f4b2a-5e3c-4f7a-8b91-1d2e3f4a5b6c', 'f6c2f62d-0b6c-4dfd-b0ec-2d1c7a509a68', 'Main Dining', 'indoor'),
  ('e73a2f1d-9c8b-4e5f-a2d7-6f8e9d1c2b3a', 'f6c2f62d-0b6c-4dfd-b0ec-2d1c7a509a68', 'Window Seating', 'window'),
  ('b4e7c9d2-1f3a-4c6b-8e5d-2a7f9c1e4b8d', 'f6c2f62d-0b6c-4dfd-b0ec-2d1c7a509a68', 'Outdoor Terrace', 'outdoor'),
  ('a8c3e6f1-4d7b-4f9e-b2c5-7e9a1d4f6c8b', 'f6c2f62d-0b6c-4dfd-b0ec-2d1c7a509a68', 'Private Booth', 'booth')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.restaurant_tables (id, restaurant_id, area_id, label, capacity, seating_type, features) VALUES
  ('11111111-1111-4111-8111-111111111001', 'f6c2f62d-0b6c-4dfd-b0ec-2d1c7a509a68', 'd89f4b2a-5e3c-4f7a-8b91-1d2e3f4a5b6c', 'Table 1', 4, 'indoor',  '{}'),
  ('11111111-1111-4111-8111-111111111002', 'f6c2f62d-0b6c-4dfd-b0ec-2d1c7a509a68', 'd89f4b2a-5e3c-4f7a-8b91-1d2e3f4a5b6c', 'Table 2', 4, 'indoor',  '{}'),
  ('11111111-1111-4111-8111-111111111003', 'f6c2f62d-0b6c-4dfd-b0ec-2d1c7a509a68', 'd89f4b2a-5e3c-4f7a-8b91-1d2e3f4a5b6c', 'Table 3', 2, 'indoor',  '{}'),
  ('11111111-1111-4111-8111-111111111004', 'f6c2f62d-0b6c-4dfd-b0ec-2d1c7a509a68', 'd89f4b2a-5e3c-4f7a-8b91-1d2e3f4a5b6c', 'Table 4', 2, 'indoor',  '{}'),
  ('11111111-1111-4111-8111-111111111005', 'f6c2f62d-0b6c-4dfd-b0ec-2d1c7a509a68', 'd89f4b2a-5e3c-4f7a-8b91-1d2e3f4a5b6c', 'Table 5', 6, 'indoor',  '{}'),
  ('11111111-1111-4111-8111-111111111006', 'f6c2f62d-0b6c-4dfd-b0ec-2d1c7a509a68', 'd89f4b2a-5e3c-4f7a-8b91-1d2e3f4a5b6c', 'Table 6', 8, 'indoor',  '{}'),
  ('22222222-2222-4222-8222-222222222007', 'f6c2f62d-0b6c-4dfd-b0ec-2d1c7a509a68', 'e73a2f1d-9c8b-4e5f-a2d7-6f8e9d1c2b3a', 'Window 1', 2, 'window', '{"city view"}'),
  ('22222222-2222-4222-8222-222222222008', 'f6c2f62d-0b6c-4dfd-b0ec-2d1c7a509a68', 'e73a2f1d-9c8b-4e5f-a2d7-6f8e9d1c2b3a', 'Window 2', 2, 'window', '{"city view"}'),
  ('22222222-2222-4222-8222-222222222009', 'f6c2f62d-0b6c-4dfd-b0ec-2d1c7a509a68', 'e73a2f1d-9c8b-4e5f-a2d7-6f8e9d1c2b3a', 'Window 3', 4, 'window', '{"city view"}'),
  ('33333333-3333-4333-8333-333333333010', 'f6c2f62d-0b6c-4dfd-b0ec-2d1c7a509a68', 'b4e7c9d2-1f3a-4c6b-8e5d-2a7f9c1e4b8d', 'Terrace 1', 4, 'outdoor', '{"heater","umbrella"}'),
  ('33333333-3333-4333-8333-333333333011', 'f6c2f62d-0b6c-4dfd-b0ec-2d1c7a509a68', 'b4e7c9d2-1f3a-4c6b-8e5d-2a7f9c1e4b8d', 'Terrace 2', 4, 'outdoor', '{"heater","umbrella"}'),
  ('33333333-3333-4333-8333-333333333012', 'f6c2f62d-0b6c-4dfd-b0ec-2d1c7a509a68', 'b4e7c9d2-1f3a-4c6b-8e5d-2a7f9c1e4b8d', 'Terrace 3', 6, 'outdoor', '{"heater","umbrella","large table"}'),
  ('44444444-4444-4444-8444-444444444013', 'f6c2f62d-0b6c-4dfd-b0ec-2d1c7a509a68', 'a8c3e6f1-4d7b-4f9e-b2c5-7e9a1d4f6c8b', 'Booth 1',   4, 'booth',   '{"private","quiet"}'),
  ('44444444-4444-4444-8444-444444444014', 'f6c2f62d-0b6c-4dfd-b0ec-2d1c7a509a68', 'a8c3e6f1-4d7b-4f9e-b2c5-7e9a1d4f6c8b', 'Booth 2',   6, 'booth',   '{"private","quiet","large booth"}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.availability_rules (restaurant_id, day_of_week, booking_type, open_time, close_time, is_closed, notes) VALUES
  ('f6c2f62d-0b6c-4dfd-b0ec-2d1c7a509a68', 1, 'lunch',  '12:00', '15:00', false, 'Monday lunch service'),
  ('f6c2f62d-0b6c-4dfd-b0ec-2d1c7a509a68', 1, 'dinner', '17:00', '22:00', false, 'Monday dinner service'),
  ('f6c2f62d-0b6c-4dfd-b0ec-2d1c7a509a68', 1, 'drinks', '15:00', '22:30', false, 'Monday drinks service'),
  ('f6c2f62d-0b6c-4dfd-b0ec-2d1c7a509a68', 2, 'lunch',  '12:00', '15:00', false, 'Tuesday lunch service'),
  ('f6c2f62d-0b6c-4dfd-b0ec-2d1c7a509a68', 2, 'dinner', '17:00', '22:00', false, 'Tuesday dinner service'),
  ('f6c2f62d-0b6c-4dfd-b0ec-2d1c7a509a68', 2, 'drinks', '15:00', '22:30', false, 'Tuesday drinks service'),
  ('f6c2f62d-0b6c-4dfd-b0ec-2d1c7a509a68', 3, 'lunch',  '12:00', '15:00', false, 'Wednesday lunch service'),
  ('f6c2f62d-0b6c-4dfd-b0ec-2d1c7a509a68', 3, 'dinner', '17:00', '22:00', false, 'Wednesday dinner service'),
  ('f6c2f62d-0b6c-4dfd-b0ec-2d1c7a509a68', 3, 'drinks', '15:00', '22:30', false, 'Wednesday drinks service'),
  ('f6c2f62d-0b6c-4dfd-b0ec-2d1c7a509a68', 4, 'lunch',  '12:00', '15:00', false, 'Thursday lunch service'),
  ('f6c2f62d-0b6c-4dfd-b0ec-2d1c7a509a68', 4, 'dinner', '17:00', '22:00', false, 'Thursday dinner service'),
  ('f6c2f62d-0b6c-4dfd-b0ec-2d1c7a509a68', 4, 'drinks', '15:00', '22:30', false, 'Thursday drinks service'),
  ('f6c2f62d-0b6c-4dfd-b0ec-2d1c7a509a68', 5, 'lunch',  '12:00', '15:00', false, 'Friday lunch service'),
  ('f6c2f62d-0b6c-4dfd-b0ec-2d1c7a509a68', 5, 'dinner', '17:00', '23:00', false, 'Friday dinner service'),
  ('f6c2f62d-0b6c-4dfd-b0ec-2d1c7a509a68', 5, 'drinks', '15:00', '23:00', false, 'Friday drinks service'),
  ('f6c2f62d-0b6c-4dfd-b0ec-2d1c7a509a68', 6, 'lunch',  '12:00', '15:00', false, 'Saturday lunch service'),
  ('f6c2f62d-0b6c-4dfd-b0ec-2d1c7a509a68', 6, 'dinner', '17:00', '23:00', false, 'Saturday dinner service'),
  ('f6c2f62d-0b6c-4dfd-b0ec-2d1c7a509a68', 6, 'drinks', '15:00', '23:00', false, 'Saturday drinks service'),
  ('f6c2f62d-0b6c-4dfd-b0ec-2d1c7a509a68', 0, 'lunch',  '12:00', '15:00', false, 'Sunday lunch service'),
  ('f6c2f62d-0b6c-4dfd-b0ec-2d1c7a509a68', 0, 'dinner', '17:00', '22:00', false, 'Sunday dinner service'),
  ('f6c2f62d-0b6c-4dfd-b0ec-2d1c7a509a68', 0, 'drinks', '15:00', '22:30', false, 'Sunday drinks service')
ON CONFLICT DO NOTHING;

COMMIT;

GRANT USAGE ON SCHEMA public TO service_role, authenticated, anon;

GRANT ALL ON ALL TABLES IN SCHEMA public       TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public    TO anon;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role, authenticated;
