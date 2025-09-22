# Plan

## Goal
Ensure the database schema (or seed SQL) guarantees the default restaurant UUID `f6c2f62d-0b6c-4dfd-b0ec-2d1c7a509a68` exists so that booking creation no longer violates the `customers_restaurant_id_fkey` constraint when the API falls back to `getDefaultRestaurantId()`.

## Steps
1. Update `database/migrations/index.sql` to seed the default restaurant row (id, name, slug, timezone, capacity) using an idempotent `INSERT ... ON CONFLICT DO NOTHING` pattern so the migration remains re-runnable.
2. (Optional but recommended) Seed a basic restaurant area and table to mirror existing patterns (only if the app requires tables; otherwise skip to keep change minimal).
3. Verify the SQL syntax and idempotency by re-running or parsing the section, and outline any follow-up questions if the environment needs additional seed entities (e.g., marketing defaults).

## Validation
- Ensure the new SQL runs safely multiple times without errors (use `ON CONFLICT DO NOTHING` or `WHERE NOT EXISTS`).
- Confirm there are no unintended side-effects on production data (use deterministic UUIDs).
- After change, creating a booking with the default ID should succeed (manual verification outside SQL scope).
