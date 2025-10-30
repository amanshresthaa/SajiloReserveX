# Implementation Checklist

- [ ] Validate remote/table state via Supabase MCP or maintainer confirmation (blocked: missing SUPABASE_ACCESS_TOKEN for MCP)
- [x] Draft idempotent SQL migration for table + schema reload

## Core

- [x] Add migration under `supabase/migrations/` with DO block and `NOTIFY pgrst`
- [x] Run `pnpm test:ops --run tests/server/featureFlags.overrides.test.ts`
- [x] Document results in `verification.md`

## UI/UX

- [ ] N/A (no UI impact)

## Tests

- [ ] Unit
- [ ] Integration
- [ ] E2E (critical flows)
- [ ] Axe/Accessibility checks

## Notes

- Assumptions: PostgREST schema cache needs explicit reload; table definition should match 20251029165000 migration.
- Deviations: Will not modify existing migration; new follow-up migration handles cache refresh + safety checks. Remote verification pending access token.

## Batched Questions (if any)

- Do we have Supabase MCP credentials available to confirm remote state? (blocking if not)
