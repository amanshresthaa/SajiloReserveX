-- Grants access to every restaurant for amanshresthaaaaa@gmail.com.
-- Run against the target Supabase project (staging/prod) using a service-role connection.

-- Optional: invite the user if an auth record does not yet exist.
-- COMMENT OUT if the user already exists to avoid resending an invite.
-- select auth.invite_user_by_email('amanshresthaaaaa@gmail.com');

DO $$
DECLARE
    _user_id uuid;
BEGIN
    SELECT id INTO _user_id
    FROM auth.users
    WHERE email = lower('amanshresthaaaaa@gmail.com');

    IF _user_id IS NULL THEN
        RAISE EXCEPTION 'auth.users entry for % not found. Run auth.invite_user_by_email first.', 'amanshresthaaaaa@gmail.com';
    END IF;

    -- Ensure profile row exists and has access enabled.
    INSERT INTO public.profiles (id, email, name, phone, has_access)
    VALUES (_user_id, lower('amanshresthaaaaa@gmail.com'), 'Aman Shrestha', NULL, true)
    ON CONFLICT (id) DO UPDATE
        SET email = EXCLUDED.email,
            name = EXCLUDED.name,
            has_access = true,
            updated_at = timezone('utc', now());

    -- Grant manager-level membership to every restaurant.
    INSERT INTO public.restaurant_memberships (user_id, restaurant_id, role)
    SELECT _user_id, r.id, 'manager'
    FROM public.restaurants r
    ON CONFLICT (user_id, restaurant_id) DO UPDATE
        SET role = EXCLUDED.role;
END
$$;

-- Verification query (optional)
-- select restaurant_id, role from public.restaurant_memberships
-- where user_id = (select id from auth.users where email = 'amanshresthaaaaa@gmail.com')
-- order by restaurant_id;
