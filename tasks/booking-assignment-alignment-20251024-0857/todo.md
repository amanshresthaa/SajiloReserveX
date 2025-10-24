# Implementation Checklist

## Core

- [x] Review Supabase schema (`types/supabase.ts`, migrations) for reservations tables.
- [x] Inspect capacity engine (`server/capacity/*.ts`) to capture actual logic.
- [x] Draft aligned logic description referencing current tables, enums, and services.
- [x] Script `allowed_capacities` seed entries (capacities 2, 4, 7, 9 per restaurant).
- [x] Insert default zone per restaurant with idempotent UPSERT.
- [x] Generate four `table_inventory` rows per restaurant with unique table numbers and correct FKs.

## Notes

- Assumptions:
  - Auto-assignment documentation should reflect `assign_tables_atomic` usage and selector heuristics already in code.
  - One zone (`Main Dining`) per restaurant is sufficient for baseline seeds unless future requirements demand more granularity.
- Deviations:
  - No new code paths introduced; the deliverable is a refined logic doc.
  - Seeds will live alongside existing SQL artifacts (`supabase/seeds/`) so ops can run them remotely.

## Batched Questions (if any)

- None pending.
