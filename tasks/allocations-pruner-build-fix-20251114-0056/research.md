---
task: allocations-pruner-build-fix
timestamp_utc: 2025-11-14T00:56:00Z
owner: github:@assistant
reviewers: [github:@maintainers]
risk: low
flags: []
related_tickets: []
---

# Research: allocations pruner build failure

## Requirements

- Functional:
  - Allow `server/jobs/allocations-pruner.ts` to call the Supabase RPC `prune_allocations_history` without TypeScript errors so `pnpm run build` succeeds.
  - Ensure Supabase generated types stay in sync with available RPC functions so future calls fail fast when schema drifts.
- Non-functional (a11y, perf, security, privacy, i18n):
  - No runtime behavior changes; only type safety updates.
  - Keep generated type file tree-shake friendly; avoid importing new runtime deps.

## Existing Patterns & Reuse

- Supabase client helpers rely on `types/supabase.ts` for the union of RPC names. The same file includes function signatures for each RPC (e.g., `allocations_overlap`).
- Other recent build fixes (e.g., `tasks/evaluate-adjacency-build-fix-20251113-2340`) simply extend the generated RPC type list, so we can reuse that pattern by re-running the schema export or editing the generated types in place.

## External Resources

- [Supabase RPC Type Safety docs](https://supabase.com/docs/reference/javascript/rpc) — confirms we can declare RPC type definitions so `rpc("name")` is strongly typed.

## Constraints & Risks

- The Supabase schema file apparently already defines the `prune_allocations_history` function (needs confirmation). If it does not exist, adding it to the generated types would mask an actual missing migration.
- Manual edits to generated files risk divergence; need to note the change in `todo.md` so future regeneration preserves it.

## Open Questions (owner, due)

- Q: Does `supabase/schema.sql` include `prune_allocations_history`? (owner: github:@assistant, due: before implementation) — Yes; see `supabase/schema.sql` lines 2701-2745.

## Recommended Direction (with rationale)

- Find or confirm the RPC definition inside `supabase/schema.sql` or migrations; if present, update `types/supabase.ts` so the `Database["public"]["Functions"]` section includes the function entry and ensure the RPC-name union contains `"prune_allocations_history"`. This mirrors how other RPCs are typed and immediately unblocks builds.
- If not found, document and coordinate with DB owners, but expectation is the RPC exists and only the generated types missed it.
