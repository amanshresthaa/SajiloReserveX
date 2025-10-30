# Research: Hold Conflict Enforcement

## Requirements

- Functional: Restore `pnpm run build` by fixing the TypeScript error thrown when calling the new Supabase RPC `set_hold_conflict_enforcement`.
- Non-functional (a11y, perf, security, privacy, i18n): Maintain generated Supabase typings style; no behavioural changes expected.

## Existing Patterns & Reuse

- `client.rpc` calls across the codebase rely on the generated Supabase types in `types/supabase.ts` for compile-time safety.
- Similar entries exist in the `Database["public"]["Functions"]` section for other RPC helpers such as `assign_tables_atomic` and `user_restaurants_admin`.

## External Resources

- supabase/migrations/20251029183500_hold_windows_and_availability.sql – defines the PL/pgSQL function `public.set_hold_conflict_enforcement(enabled boolean) RETURNS boolean`.

## Constraints & Risks

- Generated types must stay in sync with remote Supabase schema; manual edits risk diverging from the source unless regenerated after schema changes.
- Any mismatch in the argument shape could allow runtime errors to slip through despite compile-time success.

## Open Questions (owner, due)

- Q: Are there other new RPCs from the same migration that need to be surfaced in the generated types? (owner: codex, due before plan completion)
  A: Only `set_hold_conflict_enforcement` is used by TypeScript presently; `is_holds_strict_conflicts_enabled` is called purely inside SQL triggers so no immediate TS consumer.

## Recommended Direction (with rationale)

- Update `types/supabase.ts` so `Database["public"]["Functions"]` includes a definition for `set_hold_conflict_enforcement` with `Args: { enabled: boolean }` and `Returns: boolean`, mirroring the migration schema. This restores type alignment and allows the build to succeed.
- Add the new `table_hold_windows` table to the same file with accurate Row/Insert/Update/Relationship shapes so Supabase queries against it (e.g., `from("table_hold_windows")`) are recognized by the compiler.
- Surface the `feature_flag_overrides` table definition so feature flag override queries type-check.
