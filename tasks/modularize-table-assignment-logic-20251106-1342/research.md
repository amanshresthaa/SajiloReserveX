# Research: Modularize Table Assignment Logic

## Requirements

- Functional: Restructure the existing table-assignment code so that quoting, confirmation, manual selection, and availability helpers live in cohesive modules that encapsulate their responsibility while keeping the current public API (`@/server/capacity/tables`) stable.
- Non-functional (a11y, perf, security, privacy, i18n): Preserve current runtime behaviour and performance characteristics; avoid breaking telemetry/observability hooks; ensure Supabase access is untouched and secrets remain via existing env usage.

## Existing Patterns & Reuse

- `server/capacity/tables.ts` contains ~4.5K LOC covering booking window math, Supabase data access, manual selection, hold confirmation, quoting, and availability (`assignTableToBooking`, `quoteTablesForBooking`, etc.) all in one file, leading to low cohesion.
- `server/capacity/engine/public-api.ts` (lines 1-45) already acts as a façade that re-exports table-assignment operations, hinting at a planned modular engine surface we can leverage.
- `server/capacity/v2/*` provides orchestrator/repository abstractions already split into focused files; mirroring that layout for tables logic will align with existing patterns.

## External Resources

- None required so far; no upstream specs referenced beyond repo guidance.

## Constraints & Risks

- High coupling inside `tables.ts` (shared helpers like `loadBooking`, `computeBookingWindow`, `ensureClient`) means careless splits could introduce circular imports or duplicated logic.
- Many imports across the repo (`server/jobs/auto-assign.ts`, `src/app/api/bookings/route.ts`, Vitest suites) target `'@/server/capacity/tables'`; we must keep that module’s surface and type exports intact to avoid widespread refactors.
- Telemetry (`recordObservabilityEvent`, `emitSelectorQuote`, etc.) and feature flag checks are interwoven with business logic; moving code must preserve side-effect ordering.

## Open Questions (owner, due)

- Q: Are there any legacy consumers that import deep internal helpers from `tables.ts` that would need new export paths? (Owner: agent, due: design phase.)  
  A: Need to inventory during planning; initial `rg` search only surfaced public functions.

## Recommended Direction (with rationale)

- Create a `server/capacity/table-assignment/` module tree that groups responsibilities (e.g., `types.ts`, `booking-window.ts`, `data-access.ts`, `quote.ts`, `manual.ts`, `assignment.ts`, `availability.ts`, `utils.ts`) and expose them via a new index barrel.
- Replace `tables.ts` with a thin re-export barrel to maintain the existing import path while keeping implementation inside the new directory, honoring separation of concerns and encapsulation.
- Factor shared helpers (Supabase client wrapper, serialization, time utilities) into dedicated utility modules to minimize coupling and make future changes/localized fixes simpler.
