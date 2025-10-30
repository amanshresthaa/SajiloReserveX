# Implementation Plan: Feature Flag Overrides

## Objective

Ensure the Supabase REST API recognises the `public.feature_flag_overrides` table so server-side feature flag overrides load (and log) cleanly in all environments.

## Success Criteria

- [ ] Newly added migration completes without errors on remote Supabase and emits `NOTIFY pgrst, 'reload schema'`.
- [ ] Local `pnpm test:ops --run tests/server/featureFlags.overrides.test.ts` succeeds, confirming continued fallback handling.
- [ ] Manual Supabase check (via MCP query or maintainer confirmation) shows overrides table rows readable with no schema cache error.

## Architecture & Components

- Supabase migrations: add an idempotent DO block to (a) create the `feature_flag_overrides` table if still missing, (b) reapply grants, and (c) send `NOTIFY pgrst, 'reload schema'`.
- No application code changes expected; rely on existing `server/feature-flags-overrides.ts` fetch/caching logic.

## Data Flow & API Contracts

- Operation: Supabase REST query `.from("feature_flag_overrides").select("flag, value").eq("environment", scope)`.
- Post-migration: PostgREST schema cache reload ensures the endpoint exposes the table immediately after deployment.

## UI/UX States

- No UI changes; relies on server logs and feature evaluations.

## Edge Cases

- Remote environment missing table entirely → migration should create it before issuing the schema reload.
- Table exists but constraint missing → migration should ensure unique constraint + grants present without duplicating objects.
- Running migration multiple times → script must be idempotent (guards around table/constraint/grants and harmless `NOTIFY`).

## Testing Strategy

- Unit: rely on existing Vitest coverage for override fallbacks (`tests/server/featureFlags.overrides.test.ts`).
- Integration: (post-deploy) run a Supabase MCP query selecting from the table to confirm visibility.
- E2E: Not applicable for this back-end patch.
- Accessibility: Not applicable.

## Rollout

- Feature flag: not applicable.
- Exposure: apply migration to development/staging first, observe logs, then production.
- Monitoring: Tail supabase logs or application console for `[feature-flags][overrides]` warnings.
- Kill-switch: Revert migration or temporarily disable remote overrides (env defaults already safe) if unexpected behaviour occurs.
