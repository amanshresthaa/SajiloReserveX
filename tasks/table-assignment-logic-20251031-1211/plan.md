# Implementation Plan: Table Assignment Logic

## Objective

We will regenerate a comprehensive `table_assignment_consolidated.json` bundling every table-assignment-related source/migration/config file so stakeholders can review the full allocator stack in one artifact.

## Success Criteria

- [ ] JSON includes all relevant TypeScript modules (tables service, v2 allocator, selector/planner, telemetry, strategic config, demand/scarcity helpers).
- [ ] JSON includes Supabase migrations and configs directly impacting table assignment (assign/unassign procedures, holds, booking assignment tables).
- [ ] File validates as JSON (e.g., `jq` parse) and timestamp is current.

## Architecture & Components

- `server/capacity/tables.ts` orchestrator plus dependent modules (`selector.ts`, `planner/bitset.ts`, `telemetry.ts`, `strategic-config.ts`, `demand-profiles.ts`, `scarcity.ts`, `strategic-maintenance.ts`).
- Allocator v2 core (`server/capacity/v2/*.ts`).
- Supporting migrations under `supabase/migrations` touching assign/unassign tables & holds.
- Config asset `config/demand-profiles.json`.

## Data Flow & API Contracts

- N/A (artifact generation task).

## UI/UX States

- Not applicable (non-UI task).

## Edge Cases

- Ensure paths without direct imports but still required (e.g., config JSON) are explicitly listed.
- Avoid duplicate entries or missing newline handling that could break JSON encoding.

## Testing Strategy

- Validate final JSON via `jq` parse.
- Optionally spot-check a few entries (e.g., `tables.ts`, representative migration) to ensure full file contents captured.

## Rollout

- Replace root `table_assignment_consolidated.json`; no additional rollout needed.
