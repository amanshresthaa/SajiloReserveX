BEGIN;

-- Ensure the admin user exists in auth
WITH admin_user AS (
  SELECT id
  FROM auth.users
  WHERE email = 'amanshresthaaaaa@gmail.com'
  LIMIT 1
),
upserted_profile AS (
  INSERT INTO public.profiles (
    id,
    email,
    name,
    created_at,
    updated_at
  )
  SELECT
    id,
    'amanshresthaaaaa@gmail.com',
    'Aman Kumar Shrestha',
    now(),
    now()
  FROM admin_user
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    updated_at = now()
  RETURNING id
)
INSERT INTO public.restaurant_memberships (
  user_id,
  restaurant_id,
  role,
  created_at
)
SELECT
  upserted_profile.id,
  restaurants.id,
  'owner',
  now()
FROM upserted_profile
CROSS JOIN public.restaurants
ON CONFLICT (user_id, restaurant_id) DO UPDATE
SET
  role = EXCLUDED.role;

COMMIT;
