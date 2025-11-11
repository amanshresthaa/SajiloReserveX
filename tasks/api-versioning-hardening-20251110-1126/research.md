# Research: Client API Version Alignment

## Requirements

- Functional: ensure guest-facing clients (Next UI + reserve SPA) consume the versioned `/api/v1/*` endpoints so middleware deprecation headers can be honored and future version bumps are manageable.
- Non-functional: minimize churn by touching only runtime code; retain existing `/api/*` tests and ops-only endpoints that lack v1 mirrors.

## Existing Patterns & Reuse

- Reserve SPA base URL defaults to `/api`, configured via `reserve/shared/config/env.ts` and mirrored in `lib/env.ts`.
- Guest flows (profile hooks, analytics emitter, booking confirmation page, shared restaurant fetcher) call `/api/...` directly.
- `/api/v1` routes already exist for bookings, profile, events, restaurants, etc., so clients can switch with no backend changes.

## Constraints & Risks

- Ops-only routes (`/api/ops`, `/api/team`, etc.) do not have versioned mirrors; must avoid altering those references.
- Tests that reference `/api/...` should continue targeting the exact route under test, otherwise coverage breaks.

## Recommended Direction

1. Switch shared env defaults (`lib/env.ts`, `reserve/shared/config/env.ts`) to `/api/v1` and log a dev warning if falling back.
2. Update guest-facing utility calls (`lib/analytics/emit.ts`, `lib/restaurants/api.ts`, `hooks/useProfile.ts`, `src/app/(guest-public)/thank-you/page.tsx`) to point at `/api/v1/*` equivalents.
3. Adjust any affected unit tests (e.g., reserve profile update test) to expect the new path.
4. Lint to confirm no unused imports or ts errors.
