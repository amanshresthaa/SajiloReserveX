# Implementation Checklist

## Setup

- [x] Inspect restaurants/table schema in Supabase migrations/types
- [x] Identify existing seeding patterns for capacity/tables

## Core

- [x] Draft SQL to create tables per restaurant with sensible defaults
- [x] Ensure script prevents duplicate inserts (idempotent)
- [x] Place script in appropriate seed directory with naming convention

## Tests

- [x] Execute seed against remote Supabase (`psql supabase/seed-table-inventory.sql`)

## Notes

- Assumptions:
  - All restaurants should have a baseline of 16 tables spanning 2–8 covers.
  - Seed script can safely upsert without altering existing table statuses/notes.
- Deviations:
  - None.
- Result:
  - Remote seed run inserted or updated 128 tables (16 per restaurant across 8 restaurants).

## Batched Questions (if any)

- None
