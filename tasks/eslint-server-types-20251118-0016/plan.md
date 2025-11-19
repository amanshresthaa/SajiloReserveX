---
task: eslint-server-types
timestamp_utc: 2025-11-18T00:16:47Z
owner: github:@assistant
reviewers: [github:@maintainers]
risk: low
flags: []
related_tickets: []
---

# Implementation Plan: Resolve ESLint warnings in server types

## Objective

Ensure server modules use well-defined types so eslint passes with zero warnings while preserving current behavior.

## Success Criteria

- [ ] `eslint --max-warnings=0` passes for touched files.
- [ ] No regressions to manual session or occasions catalog logic.

## Architecture & Components

- `server/capacity/manual-session.ts`: tighten Supabase client typing, define typed helpers for version patches and hold rows, replace `Record<string, any>` with specific shapes.
- `server/occasions/catalog.ts`: type Supabase clients and caught errors without `any`.

## Data Flow & API Contracts

- Supabase interactions remain the same; only TypeScript types/guards updated to reflect existing DB schema (`manual_assignment_sessions`, `table_holds`, `booking_occasions`).

## UI/UX States

- N/A (server-only change).

## Edge Cases

- Ensure hold status/expiry handling stays accurate when replacing `any` casts.
- Avoid narrowing that could throw new runtime errors.

## Testing Strategy

- Run eslint to confirm warnings resolved.
- Spot-check TypeScript build if necessary (tsc) for new type coverage.

## Rollout

- No flags needed; direct commit once lint passes.

## DB Change Plan (if applicable)

- N/A (no schema changes).
