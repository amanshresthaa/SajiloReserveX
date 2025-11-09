# Implementation Plan: Fix calendar-mask API type mismatch

## Objective

We will enable calendar-mask route to satisfy Next.js route handler typing so builds succeed consistently.

## Success Criteria

- [ ] Next.js build completes without type errors.
- [ ] Route handler continues to return the correct data/error shapes.

## Architecture & Components

- `/src/app/api/restaurants/[slug]/calendar-mask/route.ts`: align handler signature with Next.js 16 route typing (`params` promise) and reuse the shared slug-resolution helper pattern.
  State: server-side only | URL state: n/a.

## Data Flow & API Contracts

Endpoint: GET /api/restaurants/[slug]/calendar-mask  
Request: `{ slug: string }` via dynamic segment supplied asynchronously (`Promise`).  
Response: `{ error: string }` on failure or `CalendarMask` data on success.  
Errors: standard JSON error response.

## UI/UX States

- API route only (no UI states affected).

## Edge Cases

- Missing slug param should still return error gracefully.
- Unexpected slug types (arrays/empty strings) should be handled defensively exactly as before.

## Testing Strategy

- Run `pnpm run lint` (includes type checking) to prove handler signature works.
- Run `pnpm run build` to mirror CI and ensure validator script no longer fails.

## Rollout

- No feature flag; immediate once merged.
- Monitor build pipeline for regressions.
