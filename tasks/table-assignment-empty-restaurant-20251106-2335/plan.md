# Implementation Plan: Restore auto table assignment metadata

## Objective

Ensure allocator-generated holds (inline + background auto assign) include the same metadata fields as manual holds so that `atomicConfirmAndTransition` can successfully confirm pending bookings when capacity exists.

## Success Criteria

- [ ] `quoteTablesForBooking` writes `metadata.policyVersion` and `selection.snapshot` (zoneIds, adjacency edges/hash).
- [ ] `atomicConfirmAndTransition` succeeds for booking `45a1f44c-7a2a-4bea-9838-8d60555f3a2d` without manual intervention.
- [ ] `confirm_hold_assignment_with_transition` RPC no longer throws `column reference "table_id" is ambiguous`.
- [ ] Linting passes (`pnpm lint`).

## Architecture & Components

- `server/capacity/table-assignment/quote.ts`
  - Import `hashPolicyVersion` + `computePayloadChecksum`.
  - Pre-compute `policyVersion` per quote; compute adjacency snapshot per candidate.
  - Extend hold metadata payload passed to `createTableHold`.
- Supabase migrations:
  - `20251106235900_fix_confirm_hold_transition_alias.sql` – `CREATE OR REPLACE` the RPC with proper column aliases and re-grant permissions.
  - `20251107001500_fix_confirm_hold_transition_alias_v2.sql` – removes the redundant column definition list when aliasing `assign_tables_atomic_v2` so PL/pgSQL no longer errors.
- Scripts used for verification (`scripts/manual-confirm.ts`, `scripts/run-auto-assign.ts`) stay as local debugging aids; no repository changes required.

## Data Flow & API Contracts

Endpoint: `quoteTablesForBooking` (internal service API)

Request (existing):

```ts
{
  bookingId,
  createdBy,
  holdTtlSeconds,
  ...
}
```

Response (existing) still returns hold + candidate. No external schema changes.

Metadata additions:

```json
{
  "metadata": {
    "policyVersion": "<hash>",
    "selection": {
      "tableIds": ["..."],
      "summary": { ... },
      "snapshot": {
        "zoneIds": ["..."],
        "adjacency": {
          "undirected": true,
          "edges": ["A->B","B->C"],
          "hash": "<checksum>"
        }
      }
    }
  }
}
```

## UI/UX States

No UI changes.

## Edge Cases

- Tables lacking zone IDs: fall back to candidate summaries, but validation already requires zone so failure bubbles as before.
- Plans with no adjacency edges: snapshot stores empty array; checksum still valid.
- Strict conflict disabled (current dev env): manual pre-check remains unchanged.

## Testing Strategy

- Manual script:
  1. `pnpm tsx -r tsconfig-paths/register scripts/manual-confirm.ts` for the problematic booking – should now succeed.
  2. `pnpm tsx -r tsconfig-paths/register scripts/run-auto-assign.ts` to mimic background job, ensuring booking transitions to `confirmed`.
- API smoke: Create a fresh booking via `/reserve` and verify it auto-confirms.
- Automated: `pnpm lint` to catch regressions (per repository policy).

## Rollout

- No feature flags; deploy via normal release.
- Monitoring: existing observability events (`inline_auto_assign.*`, `auto_assign.*`) will confirm success.
- Kill-switch: disable `FEATURE_AUTO_ASSIGN_ON_BOOKING` if any regression detected.
  Database RPC: `confirm_hold_assignment_with_transition`

- Adds alias `assign_tables_atomic_v2(...) AS ata(...)` when materialising temporary results.
- Returns rows via `SELECT t.table_id... FROM tmp_confirm_assignments AS t`.
- Keeps signature + permissions identical so callers remain unchanged.
