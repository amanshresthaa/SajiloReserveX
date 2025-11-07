# Implementation Plan: Modularize Table Assignment Logic

## Objective

We will reorganize the table-assignment engine into cohesive modules so that the capacity service remains functionally identical while becoming easier to reason about and extend.

## Success Criteria

- [ ] `@/server/capacity/tables` re-exports a modular implementation without changing the public API (functions, types, `__internal` helpers).
- [ ] All relocated code compiles and linting (`pnpm lint`) passes without regressions.

## Architecture & Components

- `server/capacity/table-assignment/index.ts`: barrel exporting the new module surface; consumed by `tables.ts`.
- `.../types.ts`: type aliases/interfaces and `ManualSelectionInputError`.
- `.../booking-window.ts`: window computation + fallback helpers (`computeBookingWindow`, `computeBookingWindowWithFallback`, related resolvers).
- `.../supabase.ts`: Supabase client utilities and data loaders (`ensureClient`, `loadBooking`, `loadTablesForRestaurant`, `loadAdjacency`, etc.).
- `.../availability.ts`: capacity filters, lookahead evaluation, and availability checks (`filterAvailableTables`, `evaluateLookahead`, `isTableAvailable*`).
- `.../manual.ts`: manual selection validation/hold helpers (`evaluateManualSelection`, `createManualHold`, `getManualAssignmentContext`).
- `.../assignment.ts`: confirmation/assignment flows (`confirmHoldAssignment`, `atomicConfirmAndTransition`, `assignTableToBooking`, `unassignTableFromBooking`, `getBookingTableAssignments`).
- `.../quote.ts`: quoting pipeline (`quoteTablesForBooking`, `findSuitableTables`) plus telemetry helpers (`composePlannerConfig`, `buildSelectorFeatureFlagsTelemetry`).
- Shared helpers (serialization, time utilities) factored into `.../utils.ts` consumed across modules.

## Data Flow & API Contracts

- Callers continue to import from `@/server/capacity/tables`; new `tables.ts` re-exports from `table-assignment/index.ts`, so request/response contracts for quoting/assigning remain unchanged.
- Internal cross-module interactions use explicit function imports (e.g., `quote.ts` consumes `filterAvailableTables`, manual contexts reuse loaders and window helpers) to maintain clear dependency boundaries.

## UI/UX States

- Not applicable (server-side refactor only).

## Edge Cases

- Preserve legacy feature-flag behaviour, telemetry calls, and fallback logic during extraction.
- Maintain `__internal` helper exports for existing test suites (`computeBookingWindow`, `filterAvailableTables`, etc.).
- Guard against circular imports by grouping shared helpers in `supabase.ts` + `utils.ts` instead of cross-linking feature modules.

## Testing Strategy

- Unit: rely on existing Vitest suites that cover capacity logic (run `pnpm test --filter capacity` if needed after lint pass).
- Integration: exercise `pnpm lint` to trigger type-checking and lint rules across all touched files.
- E2E / Accessibility: not applicable.

## Rollout

- Feature flag: none required.
- Exposure: immediate; server-only refactor.
- Monitoring: existing telemetry remains active.
- Kill-switch: revert to previous commit if unforeseen runtime issues surface.
