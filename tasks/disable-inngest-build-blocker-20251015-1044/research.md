# Research: Disable Inngest Build Blocker

## Existing Patterns & Reuse

- `src/app/api/inngest/route.ts` currently throws at module load when `INNGEST_SIGNING_KEY` is missing and `NODE_ENV === "production"`.
- Other webhook routes (e.g., Mailgun) respond with HTTP errors when misconfigured rather than throwing during import.

## External Resources

- [Inngest Next.js handler docs](https://www.inngest.com/docs/deploy/nextjs) – `serve()` returns standard route handlers and can be conditionally initialized.

## Constraints & Risks

- Build process runs with `NODE_ENV=production` causing the current guard to throw even in local builds without key.
- We must avoid exposing sensitive configuration details while keeping security expectations clear.
- Disabling the route should not break tree-shaken imports or queue initialization when feature enabled later.

## Open Questions (and answers if resolved)

- Q: Do other modules assume `serve()` is always invoked?
  A: No references beyond this file; safe to guard locally.

## Recommended Direction (with rationale)

- The build blocker highlighted our lack of queue usage; given side-effects already support synchronous execution, removing the Inngest route and client entirely is the simplest path. We now process emails/analytics inline and respond with clear JSON when the route is unavailable.
