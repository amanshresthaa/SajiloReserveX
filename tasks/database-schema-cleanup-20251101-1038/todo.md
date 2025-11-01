# Implementation Checklist

## Setup

- [x] Complete repository inventory focusing on database artifacts.
- [x] Validate findings against multiple sources.

## Core

- [x] Map models/entities to database tables.
- [x] Identify redundant or conflicting migrations.
- [x] Highlight unused schemas, models, and tables.

## UI/UX

- [ ] N/A

## Tests

- [ ] N/A

## Notes

- Assumptions:
  - Supabase remote remains authoritative; local schema snapshots are informational only.
  - No production data will be modified during repo cleanup (analysis phase only).
- Deviations:
  - `supabase/schema.sql` still requires regeneration via Supabase CLI to capture the cleaned state.
  - Archived dump-style migrations now live under `supabase/migrations/_archive/` and should be reviewed before deletion.
  - Deprecated Supabase assets (`stripe_events`, `strategic_simulation_runs`, `capacity_selector_rejections_v1`) scheduled for removal via new migration.

## Batched Questions (if any)

- None yet.
