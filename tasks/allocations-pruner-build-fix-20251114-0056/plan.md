---
task: allocations-pruner-build-fix
timestamp_utc: 2025-11-14T00:56:00Z
owner: github:@assistant
reviewers: [github:@maintainers]
risk: low
flags: []
related_tickets: []
---

# Implementation Plan: allocations pruner build failure

## Objective

We will restore a successful `pnpm run build` by adding missing Supabase RPC typings for `prune_allocations_history`, allowing the allocations pruning job to compile.

## Success Criteria

- [ ] `pnpm run build` completes without TypeScript errors.
- [ ] `typescript` definitions expose the RPC name and payload shape for `prune_allocations_history` (cutoff + limit parameters).

## Architecture & Components

- `types/supabase.ts`: Extend the `Functions` map within the `public` schema with a `prune_allocations_history` entry describing args/returns (likely rows deleted count or void) and ensure it is part of the exported RPC name union so `client.rpc` accepts it.
- `server/jobs/allocations-pruner.ts`: No runtime change expected; the file will simply consume the updated types.

## Data Flow & API Contracts

Endpoint: RPC `prune_allocations_history`
Request: `{ p_cutoff: string (ISO timestamptz), p_limit: number }`
Response: `number | null` (Supabase returns `data` numeric for affected rows). We'll type-check from schema or fallback to `number`.
Errors: Standard Supabase error object (already handled).

## UI/UX States

- N/A (build-only fix).

## Edge Cases

- If the RPC definition differs in naming/arguments, ensure typings match actual signature to avoid runtime mismatch.
- Keep optional arguments typed as `unknown?` per existing pattern if the schema file does not specify them explicitly.

## Testing Strategy

- Run `pnpm run build` locally to cover TypeScript compile step.
- No additional unit tests necessary because change is type-only.

## Rollout

- No feature flag. Once merged, build pipeline should pass automatically.
- Monitoring: rely on CI build status.

## DB Change Plan (if applicable)

- No DB schema changes.
