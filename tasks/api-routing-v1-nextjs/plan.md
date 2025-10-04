# Plan: Versioned API Routing for Next.js

## Objectives

- Add versioned routes under `/api/v1/*` while preserving existing behavior.
- Keep existing `/api/*` routes operational, mark as deprecated via headers.
- Provide shared list param and error helpers for future consistency.
- Add minimal OpenAPI spec and docs.

## Approach

1. Versioned wrappers
   - Create `app/api/v1/.../route.ts` files for each existing endpoint.
   - Each wrapper re-exports the corresponding handler functions (GET/POST/etc.) from current modules (e.g., `export { GET, POST } from '../../events/route';`).
   - This minimizes churn and keeps unit test imports stable.

2. Deprecation headers via middleware
   - Extend `middleware.ts` to intercept `/api/:path*`.
   - For unversioned `/api/*` that are not `/api/v[0-9]+/*`, set headers:
     - `Deprecation: true`
     - `Sunset: <ISO-8601 date>` computed from `process.env.ROUTE_COMPAT_WINDOW_DAYS` (default 30 days)
     - `Link: </api/v1/<path>>; rel="successor-version"`
   - Ensure dashboard/profile auth logic is preserved and only applies to those paths.

3. Shared utilities
   - Add `lib/api/list-params.ts` with `parseListParamsFromUrl(url: URL)` supporting:
     - page (default 1), limit (default 50, max 100), offset (auto if absent), sortBy, order (asc|desc), q, filter, fields, include, expand.
     - Also map compatibility keys like `pageSize` → `limit`.
   - Add `lib/api/errors.ts` to standardize error shape `{ error: { code, message, details? } }`.

4. OpenAPI + docs
   - Create `openapi.yaml` covering main endpoints under `/api/v1/`.
   - Add `docs/routes.md` explaining conventions, route map, and deprecation approach.

5. Tests
   - Add a unit test to import a v1 handler (e.g., `/api/v1/events`) and verify it responds, demonstrating alias works.

## Out of Scope (for now)

- Refactoring existing handlers to use the new utils everywhere (would require broad edits and test updates).
- Deep authz tiers per path; existing logic remains, with groundwork in docs/utilities.

## TODOs

- [ ] Create `app/api/v1/*` wrappers
- [ ] Update middleware for deprecation headers
- [ ] Add `lib/api/list-params.ts` and `lib/api/errors.ts`
- [ ] Add `docs/routes.md`
- [ ] Add `openapi.yaml`
- [ ] Add `reserve/tests/unit/api-v1-alias.test.ts`
