# Research: Route Inventory Review

## Requirements

- Functional:
  - Surface every customer-facing page and API route so the user can decide which to keep.
  - Launch the application locally and authenticate with the provided test credentials to manually inspect each route on demand.
- Non-functional:
  - Avoid modifying application data beyond what is required to sign in.
  - Keep the dev server logs clean (no unhandled errors) to ensure reliable verification.

## Existing Patterns & Reuse

- Next.js App Router already structures public/ops/auth routes under `src/app`.
- A legacy page exists at `src/pages/dashboard.tsx`; include it in the review list in case it is still reachable via the hybrid router.
- The `reserve` Vite app has its own router defined in `reserve/app/routes.tsx`; treat it as a separate surface if the user needs SPA-specific cleanup.

## External Resources

- `README` / `ROUTE_*` docs in repo contain historical route maps; reference if discrepancies appear.

## Constraints & Risks

- Signing in with production-like credentials may mutate remote data if the dev server still targets real Supabase endpoints—verify env configuration first.
- Opening “all” routes is time-consuming; prioritize a deterministic traversal order so the user can checkpoint progress.

## Open Questions (owner, due)

- Q: Do we need to inspect the `reserve/` SPA as well? (owner: us, due: before manual browsing)
  A: Awaiting user confirmation; default to Next.js routes unless asked.

## Recommended Direction (with rationale)

- Launch the dev server, authenticate with the provided email/password, and work through the generated route list from root downward. This ensures we respect actual runtime behavior before the user deletes anything.
