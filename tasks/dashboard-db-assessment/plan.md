# Dashboard DB Assessment — Plan

## Goal

Determine whether the existing Postgres schema/seeds already satisfy the dashboard MVP requirements and, if not, outline the minimal database changes (DDL + seeds) required to support `/dashboard` features.

## Planned Steps

1. **Schema Readiness Matrix** — Summarize how current tables/columns map to MVP data needs (list, edit, cancel, telemetry) and flag any shortcomings.
2. **Ownership & Lookup Strategy** — Decide how `/api/bookings?me=1` should resolve the logged-in user (email vs `auth_user_id`) and document required indexes / normalization fixes.
3. **Performance Hardening** — Specify indexing or materialized view changes to keep pagination/filtering under budget, referencing Postgres guidance on expression indexes.
4. **Data Integrity & Seeds** — Confirm seeds cover new requirements (upcoming/past bookings, cancelled samples) and note any adjustments (e.g., ensuring lowercase emails, optional Supabase IDs).
5. **SQL Change Set** — Draft concrete DDL/seed snippets for recommended updates (indexes, columns, RLS scaffolding) with rollback considerations.
6. **Risk & Testing Notes** — Enumerate verification steps (query explain plans, regression seeds) and residual risks for coordination with app changes.
