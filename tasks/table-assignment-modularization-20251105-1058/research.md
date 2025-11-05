# Research: Table Assignment Modularization

## Requirements

- Functional:
- Preserve existing behavior and API responses for assignment flows (auto and manual)
- Introduce a cohesive, testable engine facade to decouple API routes from legacy module
- Create a foundation to migrate algorithmic pieces into smaller modules without breaking callers
- Non-functional (a11y, perf, security, privacy, i18n):
- No UI impact; no a11y changes
- No perf regressions; zero network/DB logic changes in this step
- No secrets added; use existing Supabase clients

## Existing Patterns & Reuse

- Core logic resides in `server/capacity/tables.ts` (monolithic ~110KB)
- Planner/selector and scoring live in `server/capacity/selector.ts` and `server/capacity/v2/*`
- API routes call functions from `@/server/capacity/tables` directly
- Types and helpers (policy, holds, scarcity, time windows) are already modular

## External Resources

- Internal docs: TABLE_COMBINATIONS_README.md (feature overview)
- PRODUCTION_READY_CHECKLIST.md (guardrails/flags)

## Constraints & Risks

- `selector.ts` imports `Table` type from `tables.ts`; moving the type would be breaking
- Many routes import `@/server/capacity/tables`; must preserve API and signatures
- Avoid touching DB/rpc logic; keep supabase calls intact
- Large file changes risk merge conflicts; keep initial step additive

## Open Questions (owner, due)

- Q: ...
  A: ...

## Recommended Direction (with rationale)

- Step 1 (this change): Introduce `server/capacity/engine/*` with a public API wrapper
  - `engine/public-api.ts` exposes: `quoteTables`, `confirmHold`, `getManualContext`, `validateManualSelection`, `holdManualSelection`
  - Update staff API routes to depend on the engine; behavior preserved (thin delegation)
- Step 2 (next): Extract algorithmic units from `tables.ts` into engine modules
  - `engine/window.ts`: time window calculation + fallback
  - `engine/filter.ts`: availability/time filter
  - `engine/busy.ts`: busy maps, conflict extraction
  - `engine/lookahead.ts`: future-booking penalties + plan re-scoring
- Step 3 (later): Point `tables.ts` internals to the engine modules and re-export types to avoid ripples
- Benefits: cleaner seams for testing, safer iteration, easier strategy swaps
