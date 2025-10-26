# Research: Manual Hold Allocation Fix

## Existing Patterns & Reuse

- `server/capacity/holds.ts` already mirrors every new hold into the `allocations` table using `resource_type: "hold"` and reuses `cleanupHoldArtifacts` to tear down mirrored rows.
- Supabase migrations live under `supabase/migrations/`. The consolidated schema (`20251019102432_consolidated_schema.sql`) currently defines `allocations_resource_type_check` as `{table, merge_group}`.
- A follow-up migration (`20251026104900_adjust_allocations_types.sql`) intends to drop and recreate the check constraint to include `'hold'`, but the failing runtime indicates the remote database still enforces the older constraint.
- Manual hold API (`src/app/api/staff/manual/hold/route.ts`) delegates to `createManualHold`, so fixing the database layer should unblock the entire flow without additional API changes.

## External Resources

- `docs/runbooks/allocations-assign-atomic.md` documents that holds must mirror into `allocations` with `resource_type='hold'` for telemetry and conflict detection.
- `tasks/sprint-0-foundations-safety-rails-20251026-1037/research.md` captures prior architecture decisions for adding the new resource type, including the same constraint change.

## Constraints & Risks

- Supabase policy: we can only apply migrations against the remote instance; no local Supabase for validation.
- Remote environments already store live allocation data—dropping the constraint must be idempotent and avoid data loss.
- Mirror writes are on the hot path for table assignment; lingering schema drift (constraint missing) keeps the manual hold flow broken.
- Need to ensure `types/supabase.ts` (generated client types) stays in sync once the constraint allows the new literal value.

## Open Questions (and answers if resolved)

- Q: Can we safely re-run the constraint migration if it partially executed?  
  A: Yes—the migration guards with existence checks before dropping/recreating the constraint, so it is idempotent.
- Q: Do we need an application-level fallback if the constraint is absent?  
  A: Prefer to fix the schema; fallback would silently drop the mirror and defeat observability requirements.

## Recommended Direction (with rationale)

- Apply the migration adjustment to re-create the constraint with `'hold'` allowed (create a new SQL patch if the original `20251026104900_adjust_allocations_types.sql` did not take effect remotely).
- After deployment, verify via Supabase (SQL inspection or hold creation) that the constraint accepts the new value.
- Update `verification.md` later with evidence from a successful manual hold and mirrored allocation row.
