# Implementation Plan: Grant Restaurant Access

## Objective

We will enable amanshresthaaaaa@gmail.com to access all restaurants in Supabase so that they have full operational visibility.

## Success Criteria

- [ ] Account exists (or is updated) in `auth.users` and `public.profiles`.
- [ ] Membership records created for every row in `public.restaurants`.
- [ ] Script is idempotent (safe to rerun without duplicate memberships).

## Architecture & Components

- Single SQL script executed via Supabase SQL editor or `psql`.
- Arranged as CTEs: upsert user → upsert profile → insert memberships using `INSERT ... SELECT ... ON CONFLICT DO NOTHING`.

## Data Flow & API Contracts

Endpoint: N/A
Request: N/A
Response: N/A
Errors: FK violations.

## UI/UX States

- Not applicable.

## Edge Cases

- Email must be lowercase to satisfy constraints.
- Duplicates must be handled idempotently.
- `auth.users` requires hashed password if created manually; use `auth.withdraw_invite` or rely on magic link? We'll set account as invited (no password) by leaving `encrypted_password` null and setting `email_confirmed_at`.

## Testing Strategy

- Dry-run SQL on local or staging DB (wrap in transaction and rollback).
- Post-execution check: `SELECT * FROM public.restaurant_memberships WHERE user_id = ...`.

## Rollout

- Provide script plus command snippets; maintainer executes on staging/production.
