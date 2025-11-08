# Implementation Checklist

## Core Changes

- [x] Replace the bespoke `ensureAdminAccess` helper in `src/app/api/ops/restaurants/[id]/logo/route.ts` with the shared `requireAdminMembership` guard.
- [x] Ensure route-level error handling maps membership errors to the proper 4xx responses without leaking internals.

## Verification

- [x] Run `pnpm lint` (required for bug fixes per AGENTS.md) and record the outcome.

## Notes

- Assumption: `RESTAURANT_ADMIN_ROLES` (`owner`, `manager`) reflects the full list of allowed ops users.
- Deviations: None yet.
