# Research: Remove Merge Table Feature

## Existing Patterns & Reuse

- `server/ops/tables.ts` and `src/services/ops/tables.ts` both expose `deriveMergeEligible` and attach a `mergeEligible` flag to table rows; this flag is consumed across Ops APIs and UI.
- Capacity engine modules (`server/capacity/tables.ts`, `server/capacity/selector.ts`, `server/capacity/telemetry.ts`) promote merge plans, annotate merge types, and persist merge metadata via RPCs (`assign_tables_atomic`, `unassign_tables_atomic` in `supabase/migrations/20251019102432_consolidated_schema.sql`).
- Ops dashboards (`src/components/features/dashboard/BookingsList.tsx`, `src/components/features/dashboard/BookingDetailsDialog.tsx`, `src/components/features/tables/TableInventoryClient.tsx`) surface merge badges, summary labels, and adjacency copy geared toward merges.
- `src/utils/ops/table-merges.ts` contains helper logic for deducing merge group labels in the UI.
- Supabase schema introduces merge scaffolding: tables (`merge_groups`, `merge_group_members`, `merge_rules`), triggers (`merge_group_members_validate_*`), and the `merge_group_id` column plus FK on `booking_table_assignments` (`supabase/migrations/20251019102432_consolidated_schema.sql`). Seeds and generated types (`types/supabase.ts`) mirror these artifacts.
- Feature flag plumbing exposes `FEATURE_MERGE_PERSISTENCE` (`config/env.schema.ts`, `lib/env.ts`), though no other flags gate the logic.

## External Resources

- `supabase/migrations/20251019102432_consolidated_schema.sql` – canonical definition for merge tables, triggers, RPCs, and policies.
- `supabase/seed.sql` – truncation scripts reference merge tables.
- `types/supabase.ts` – generated typings that must track schema removals.

## Constraints & Risks

- Dropping `merge_group_id` and merge tables requires updating/rewriting `assign_tables_atomic`/`unassign_tables_atomic` SQL to avoid referencing removed tables while preserving current behaviour (single-table assignments).
- Existing data referencing merge groups will be hard-dropped; ensure migrations drop dependent constraints first to avoid failures.
- Removing `mergeEligible` affects selector scoring, adjacency UI, telemetry, and tests; need to ensure fallbacks (single-table assignment) still produce sensible plans and diagnostics.
- Ops dashboard copy and analytics rely on merge terminology; ensure UI remains coherent without merge-specific badges and metrics.
- Tests around merge flows (capacity selector, auto-assign, metrics) will fail unless rewritten to single-table expectations.

## Open Questions (and answers if resolved)

- Q: Can we retire adjacency management entirely?
  A: Adjacent tables may still matter for floor management; plan to keep adjacency CRUD but scrub merge-specific messaging.
- Q: Should observability payloads retain merge metadata keys?
  A: Removing keys aligns with feature removal; downstream consumers expect optional fields, so omitting is safe.

## Recommended Direction (with rationale)

- Introduce a Supabase migration that drops merge tables, triggers, policies, and `merge_group_id` column, while simplifying `assign_tables_atomic`/`unassign_tables_atomic` implementations to single-table semantics. Keeps history intact instead of editing prior migrations.
- Regenerate/remove schema artefacts: update `types/supabase.ts`, `supabase/seed.sql`, and any SQL helpers referencing merge objects.
- Strip merge-specific logic from server code: remove `deriveMergeEligible`, simplify capacity selector/auto-assignment to single-table planning, and adjust telemetry payloads.
- Update Ops APIs/services (`src/services/ops/tables.ts`, API routes) and UI components to drop merge indicators/badges, keeping adjacency UX but with neutral wording.
- Remove feature flag plumbing (`FEATURE_MERGE_PERSISTENCE`) and dependent env exports.
- Rewrite or delete merge-focused unit/integration tests, ensuring remaining capacity tests validate single-table flows and still pass.
