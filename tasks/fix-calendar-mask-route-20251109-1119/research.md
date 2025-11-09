# Research: Fix calendar-mask API type mismatch

## Requirements

- Functional: the `/api/restaurants/[slug]/calendar-mask` GET handler must remain behaviorally identical while compiling under Next.js 16 route typing.
- Non-functional (a11y, perf, security, privacy, i18n): API response contracts stay stable; logging/error responses continue to avoid leaking sensitive data; no perf changes anticipated.

## Existing Patterns & Reuse

- Other restaurant API routes (e.g., `src/app/api/restaurants/[slug]/schedule/route.ts`) already wrap the new Next.js 16 contract where `context.params` is a `Promise`, using a `resolveSlug` helper that awaits the promise before validating the slug.
- Most API handlers in `/src/app/api/**/[param]/route.ts` define their context type as `{ params: Promise<{ ... }> }`, so aligning with that convention keeps typing consistent for tests/mocks.

## External Resources

- [Next.js Route Handlers — Params as Promise](https://nextjs.org/docs/app/building-your-application/routing/route-handlers#parameters) — documents the recent change where `params` is now `Promise`-based, which triggers the current type error.

## Constraints & Risks

- Must not change the JSON schema returned to clients; only the handler signature/slug parsing should change.
- Need to keep `resolveSlug` behavior (trim whitespace, array safety) because tests may rely on it even if Next currently supplies a string.
- Update must also keep server logging intact for observability.

## Open Questions (owner, due)

- Q: Are there tests covering this route that need updates?  
  A: None exist currently; behavior validated via TypeScript + build.

## Recommended Direction (with rationale)

- Mirror the schedule route pattern: type `params` as a promise, await it up front, then pass the extracted slug into the existing validation helper (or tweak helper signature). This directly satisfies Next.js type expectations and reduces maintenance by following established repo patterns.
