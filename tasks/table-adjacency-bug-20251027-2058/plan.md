# Implementation Plan: Table adjacency enforcement bug

## Objective

We will diagnose why manual bookings raise the adjacency enforcement error so that operators understand the root cause before any code change.

## Success Criteria

- [x] Capture evidence from the running Next.js MCP runtime confirming the failure context.
- [x] Trace the server-side validation path to the specific adjacency check returning `error`.
- [x] Document remediation options for the engineering team.

## Architecture & Components

- `server/capacity/tables.ts`: `loadAdjacency`, `evaluateAdjacency`, and `buildManualChecks` drive the validation logic.
- Supabase `table_adjacencies` data provides adjacency graph edges.
- `public.assign_tables_atomic_v2` (Supabase RPC): enforces server-side adjacency; updated via migration to accept undirected edges.
  State: manual selection payload (`tableIds[]`, `requireAdjacency`) | Routing/URL state: `/ops` manual assignment view.

## Data Flow & API Contracts

Endpoint: `POST /api/staff/manual/validate`
Request:

```json
{ "bookingId": string, "tableIds": string[], "requireAdjacency": boolean }
```

Response:

```json
{ "validation": { "ok": boolean, "checks": ManualSelectionCheck[] } }
```

Errors: validation-level errors surfaced with `status: "error"` and message "Tables must be adjacent when adjacency enforcement is enabled" when graph traversal fails.

## UI/UX States

- Error: Manual assignment sidebar flags adjacency failure in validation checklist.

## Edge Cases

- Selection order where the first table lacks outgoing adjacency because it only appears as `table_b` in Supabase data.
- Multi-table merges spanning zones (already guarded earlier and returns separate message).

## Testing Strategy

- Reproduce via manual API or UI selection ordering (B, A) once fix is proposed.
- Extend server unit coverage to ensure adjacency map treats edges as undirected.

## Rollout

- Share findings via task folder; implementation TBD. If change is pursued, require Supabase data check to avoid double inserting edges.
