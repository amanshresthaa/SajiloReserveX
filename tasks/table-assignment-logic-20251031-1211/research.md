# Research: Table Assignment Logic

## Requirements

- Functional: Generate a refreshed `table_assignment_consolidated.json` that contains the full source of every file participating in the table assignment pipeline (application services and supporting Supabase migrations/config).
- Non-functional (a11y, perf, security, privacy, i18n): Output must remain valid JSON, UTF-8/ASCII, and avoid leaking secrets.

## Existing Patterns & Reuse

- A prior artifact already exists at `table_assignment_consolidated.json` (30 entries) bundling core allocator files and late-October migrations.
- Table assignment execution centers around `server/capacity/tables.ts`, which delegates to the v2 allocator (`server/capacity/v2/*`), selector/planner utilities, telemetry, strategic config, demand profiles, and scarcity scoring helpers.
- Supabase stored procedures (`assign_tables_atomic_v2`, related cleanup/hold migrations) underpin persistence for assignment commits.

## External Resources

- None required so far; all logic resides within the repository.

## Constraints & Risks

- Risk of omitting newer dependencies (e.g., strategic config/demand profile helpers, newer migrations) leading to incomplete snapshot.
- JSON file will be large; must ensure tooling writes atomically and preserves formatting.

## Open Questions (owner, due)

- Q: Should demand profile configuration files (e.g., `config/demand-profiles.json`) be included alongside TypeScript logic?  
  A: Default to including repository-managed config since allocator code consumes it when computing demand multipliers.

## Recommended Direction (with rationale)

- Reuse the existing JSON artifact as a template but regenerate with an explicit curated list that expands to include strategic config/demand/scarcity helpers and all migrations touching table assignment/holds. This ensures consumers have a single, self-contained snapshot of the allocator stack.
