# Research: Table Assignment Business Rules Extraction

## Requirements

- Functional:
  - Document every hard/soft business rule that governs restaurant capacity and table assignment per database schema and server-side logic.
  - Trace each rule to its enforcing artifact (SQL constraint/function, TypeScript implementation, config/feature flag).
- Non-functional (a11y, perf, security, privacy, i18n):
  - Accuracy and completeness prioritized; no speculative assumptions beyond code/schema evidence.
  - Maintain traceability so reviewers can cross-check sources quickly.
  - Respect repo SDLC artifacts (plan, todo, verification).

## Existing Patterns & Reuse

- Database migrations (`supabase/migrations`) encode constraints via CHECK/UNIQUE/EXCLUDE, triggers (e.g., `sync_table_adjacency_symmetry`), and RPCs (`assign_tables_atomic_v2`, `is_table_available_v2`).
- Consolidated schema (`supabase/migrations/20251019102432_consolidated_schema.sql`, `supabase/schema.sql`) lists core table structures (`table_inventory`, `booking_table_assignments`, `allocations`, `table_holds`).
- Capacity logic in `server/capacity/*.ts` (notably `tables.ts`, `selector.ts`, `policy.ts`, `demand-profiles.ts`, `strategic-config.ts`, `scarcity.ts`) already encapsulates rule evaluation and scoring.
- Feature flag gating centralized in `server/feature-flags.ts`.
- Demand multiplier defaults stored in `config/demand-profiles.json`.

## External Resources

- None yet (scope limited to repository contents per instructions).

## Constraints & Risks

- Large SQL migrations require careful parsing to avoid missing embedded logic (functions contain nested RAISE EXCEPTION rules).
- Multiple versions of assignment RPC exist; must confirm latest migration (`20251028034500_assign_tables_atomic_v2_alias_fix.sql` and wrappers in `20251103090400_refactor_assignment_procedures.sql`) is authoritative.
- Some schema files (e.g., consolidated vs. incremental migrations) may differ; need to reconcile discrepancies (e.g., booking_table_assignments start/end columns) before documenting.
- Feature flag defaults come from environment config, but actual runtime values may vary; documentation must frame them as policy toggles rather than absolutes.

## Open Questions (owner, due)

- Q: Do any downstream consumers override policy defaults outside this repo?
  A: Out of scope—documentation will focus on repository-defined behavior only.

## Recommended Direction (with rationale)

- Inventory all relevant SQL artifacts (tables, constraints, functions, triggers) that touch allocations/holds/adjacency and extract rule statements verbatim.
- Review TypeScript modules for filtering, validation, optimization, policy constants, and feature-flag-controlled behavior; tabulate rule descriptions with references.
- Map demand/strategic configs to yield management rules.
- Summarize findings into a categorized Markdown document (`docs/table-assignment-business-rules.md`) with cross-references and rule types.
