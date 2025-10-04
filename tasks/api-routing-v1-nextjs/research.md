# Research: API Routing Architecture for Next.js App Router

Date: 2025-10-04

## Goal

Adopt versioned, hierarchical, RESTful routes with `/api/v1/...` across this Next.js repository while preserving behavior and tests. Provide deprecation for old unversioned routes, add shared pagination/error utilities, and document via OpenAPI and docs.

## Findings

- Framework: Next.js (App Router). Evidence:
  - `next.config.js`, `app/` directory, and API route handlers under `app/api/**/route.ts`.
  - No Express/Fastify server found; `server/` directory contains domain logic (Supabase, bookings, customers, etc.).

- Existing API routes (non-versioned):
  - `app/api/events/route.ts` → `GET`, `POST`
  - `app/api/lead/route.ts` → `POST`
  - `app/api/profile/route.ts` → `GET`, `PUT`
  - `app/api/profile/image/route.ts` → `POST`
  - `app/api/stripe/create-checkout/route.ts` → `POST`
  - `app/api/stripe/create-portal/route.ts` → `POST`
  - `app/api/bookings/route.ts` → `GET` (contact/my bookings), `POST` (create booking)
  - Test helpers (guarded by envs):
    - `app/api/test/bookings/route.ts` → `POST`
    - `app/api/test/leads/route.ts` → `DELETE`
    - `app/api/test/reservations/[reservationId]/confirmation/route.ts` → `GET`
    - `app/api/test/playwright-session/route.ts` → `POST`

- Tests reference these paths directly and import handlers by path:
  - Playwright e2e hits `/api/lead`, `/api/test/*`.
  - Unit tests import from `@/app/api/events/route` and `@/app/api/bookings/route` etc.

- Pagination patterns:
  - `bookings` uses `page` + `pageSize` (with `zod` validation and caps), `sort` param is `asc|desc`.
  - The repo does not have a shared parse utility for list params.

- Error shape:
  - Common JSON `{ error: string }`, sometimes with `{ error, details }`. No central helper.

- Middleware:
  - `middleware.ts` protects `/dashboard` and `/profile` with Supabase auth. No API-level middleware.

## Constraints / Implications

- We must preserve existing non-versioned routes for tests and consumers. Best approach: add versioned wrappers under `app/api/v1/*` that re-export existing handlers. Then add a middleware to attach a `Deprecation: true` header to unversioned `/api/*` (excluding `/api/v*/*`).
- Avoid moving existing route files to minimize churn and avoid breaking direct test imports.
- Add shared utilities for future usage without refactoring domain logic now.
- Provide docs and a minimal `openapi.yaml` matching current implemented endpoints.

## Risks / Unknowns

- Middleware response header behavior must be validated to ensure headers propagate on API responses.
- If any routes depend on path-based behavior beyond simple prefix, the naive `/api/` → `/api/v1/` successor Link header may not always map perfectly. (No such cases observed.)
- Tests may import from old paths; we will not change those imports.

## Decision

- Implement `app/api/v1/**/route.ts` wrappers that re-export functions from the existing route modules.
- Add API middleware logic to set `Deprecation` and `Sunset` headers for unversioned `/api/*` requests, and a `Link: </api/v1/...>; rel="successor-version"` header. Respect `ROUTE_COMPAT_WINDOW_DAYS` (default 30).
- Add utilities `lib/api/list-params.ts` and `lib/api/errors.ts` for uniform parsing/error responses (adopted gradually).
- Document the new structure in `docs/routes.md` and ship a minimal `openapi.yaml` covering the main endpoints.
