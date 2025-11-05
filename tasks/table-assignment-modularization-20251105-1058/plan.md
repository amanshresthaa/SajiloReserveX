# Implementation Plan: Table Assignment Modularization

## Objective

We will modularize the table assignment algorithm to improve readability, testability, and extensibility.

## Success Criteria

- [ ] Single-responsibility services with clear interfaces
- [ ] Unit tests for core assignment strategies
- [ ] No behavior regression in existing flows

## Architecture & Components

- <AssignmentEngine> (new): cohesive facade for table assignment
  - public-api.ts: thin delegation to legacy `tables.ts`
  - index.ts: exported engine surface
- Future extraction modules (planned):
  - window.ts: compute booking window + fallback
  - filter.ts: time/capacity filters for availability
  - busy.ts: busy maps + conflict extraction
  - lookahead.ts: future booking penalties / scoring

## Data Flow & API Contracts

Endpoint: Internal engine used by API routes
Request: { partySize, timeWindow, preferences, tables, reservations }
Response: { assignedTableIds, reasonCodes }
Errors: { code, message }

## UI/UX States

- N/A (internal), ensure surfaces reflect assignment results

## Edge Cases

- Overlapping reservations
- No available tables
- Split seating disabled/enabled

## Testing Strategy

- Unit: strategies, constraint evaluation
- Integration: end-to-end assignment for sample layouts
- Accessibility: N/A

## Rollout

- Feature flag: table_assignment_engine_v2 (placeholder; no flag change in this step)
- Exposure: 0% → 100% after verification
- Monitoring: logs of assignment outcomes
- Kill-switch: revert to v1 engine
