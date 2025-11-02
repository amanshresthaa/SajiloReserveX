# Implementation Plan: Standard Error Taxonomy (E4-S1)

## Objective

Adopt consistent canonical error codes and shape across manual and ops routes with actionable details.

## Success Criteria

- [ ] Canonical codes emitted for all manual flows and ops assigns.
- [ ] UI panel shows specific conflict details; no generic error.

## Architecture & Components

- Shared mapper util: translate `AssignTablesRpcError` + holds errors → canonical shape.
- Routes patched: `src/app/api/staff/manual/*/route.ts`, ops assign routes.
- FE: manual assignment components display details.

## Data Flow & API Contracts

- Error JSON: `{ code, message, details: { tables, windows, blockingBookingIds } }` when applicable.

## Testing Strategy

- Unit: mapper utility coverage.
- Integration: verify codes in network panel per scenario.
