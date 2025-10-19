# Implementation Plan: Grant Restaurant Access

## Objective

We will ensure `amanshresthaaaaa@gmail.com` has owner-level access to every restaurant so that the account can administer the entire portfolio without manual per-restaurant grants.

## Success Criteria

- [ ] Supabase `restaurant_memberships` table contains an `owner` membership for the target user across all existing restaurants.
- [ ] Verification query confirms membership count matches total restaurants (no missing rows, no role mismatch).

## Architecture & Components

- Supabase Postgres (remote) – source of truth for `auth.users`, `profiles`, `restaurants`, and `restaurant_memberships`.
- Task-scoped SQL script (in `tasks/grant-restaurant-access-20251019-2206/`) executed via `psql` using `SUPABASE_DB_URL`.
  State: n/a | Routing/URL state: n/a (no app code change).

## Data Flow & API Contracts

- SQL script:
  1. Lookup auth user ID by email (`auth.users`).
  2. Upsert corresponding profile (`public.profiles`).
  3. Insert/Upsert (`ON CONFLICT DO UPDATE`) owner memberships for each row in `public.restaurants`.
- No external HTTP/API contracts involved; direct database mutation.

## UI/UX States

- Not applicable (no UI changes).

## Edge Cases

- Target email missing from `auth.users` (script becomes a no-op; must report back).
- New restaurants added later would require re-running script or automation (out of scope but noted).
- Potential failure if `SUPABASE_DB_URL` missing or `psql` errors out.

## Testing Strategy

- Manual SQL verification: `SELECT` memberships count by user vs total restaurants.
- Optional logging of affected rows from `psql` command output.
- No automated tests applicable.

## Rollout

- Feature flag: none.
- Exposure: immediate for the target account in production/staging (depending on DB URL in `.env.local`).
- Monitoring: confirm with follow-up query; document outcome in `verification.md`.
