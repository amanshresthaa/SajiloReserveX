# Implementation Plan: Ops logo upload role guard

## Objective

Ensure restaurant logos can be uploaded by any restaurant admin (owner or manager) inside the ops portal without requiring a nonexistent `admin` role, while preserving existing validation and storage behavior.

## Success Criteria

- [ ] POST `/api/ops/restaurants/:id/logo` succeeds for users with `owner` or `manager` memberships.
- [ ] The route still rejects requests from users with no membership or a non-admin role with a 403.
- [ ] No changes to bucket behavior, upload limits, or response payloads/regressions are introduced.

## Architecture & Components

- `src/app/api/ops/restaurants/[id]/logo/route.ts`
  - Replace custom `ensureAdminAccess` helper with a call to `requireAdminMembership` from `server/team/access`.
  - Continue using `getRouteHandlerSupabaseClient` for auth and `getServiceSupabaseClient` for storage/bucket management.

## Data Flow & API Contracts

- Endpoint: `POST /api/ops/restaurants/:id/logo`
  - Request: multipart form data with `file` field.
  - Response: `{ path, url, cacheKey }` unchanged.
  - Errors: Keep existing JSON shape; map membership errors to `FORBIDDEN` responses.

## UI/UX States

- UI already shows toast/error messages propagated from the API; no UI change required. Ensure server error strings remain user-friendly.

## Edge Cases

- Missing membership rows should still log and return 403.
- Unauthorized roles (`host`, `server`, etc.) must still be blocked.
- Unexpected Supabase failures continue to surface 500 errors.

## Testing Strategy

- Static analysis: `pnpm lint` (repository requirement for bug fixes).
- Spot-check TypeScript build through linting path (route file is type-checked via `tsconfig`).
- Manual QA: N/A (no UI change, server logic only). Document reasoning in `verification.md`.

## Rollout

- No flags required. Deploy via existing pipeline. Monitor ops dashboard for successful logo uploads post-merge.
