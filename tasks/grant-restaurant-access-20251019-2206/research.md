# Research: Grant Restaurant Access

## Existing Patterns & Reuse

- `backups/supabase-backup-20251017-132504/seeds/seed.sql` contains a SQL block that resolves a Supabase auth user by email, upserts their profile, and inserts/updates `restaurant_memberships` rows with the `owner` role for **all** restaurants. This covers the exact use case.
- `server/team/access.ts` and `server/restaurants/create.ts` demonstrate how restaurant memberships are modeled (`restaurant_memberships` table with `(user_id, restaurant_id, role)` primary key) and use the service Supabase client for privileged writes.

## External Resources

- QUICK_START_SUPABASE.md – documents that `amanshresthaaaaa@gmail.com` should have owner access to all restaurants once the user exists in Supabase Auth.
- SUPABASE_ORGANIZATION_COMPLETE.md – reiterates the same expectation for the admin account.

## Constraints & Risks

- Supabase access is **remote only** per AGENTS.md; any migration/seed must run against the hosted instance.
- The SQL assumes the user already exists in `auth.users`. If the user has never signed up (no auth row), the script becomes a no-op.
- Running the SQL multiple times should be idempotent thanks to `ON CONFLICT` on `(user_id, restaurant_id)`, but we still need to ensure we target the correct account/email.

## Open Questions (and answers if resolved)

- Q: Does `amanshresthaaaaa@gmail.com` already exist in Supabase Auth?  
  A: Unknown locally; the SQL handles the absence gracefully (no memberships created). Need to confirm post-run via query.

## Recommended Direction (with rationale)

- Execute the existing SQL pattern (seed snippet) against the remote Supabase instance using the service-role client. This avoids inventing new tooling, follows established precedent, and is idempotent. Afterwards, verify memberships exist for each restaurant via Supabase query.
