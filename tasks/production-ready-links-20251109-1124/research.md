# Research: Production Ready Links

## Requirements

- Functional:
  - Ensure any absolute URLs that reach users (emails, invites, client config, prefetchers) never fall back to `http://localhost:3000`.
  - Use a single canonical production origin when environment variables are absent/misconfigured so outbound links remain valid.
- Non-functional (a11y, perf, security, privacy, i18n):
  - Preserve existing env validation (Zod schema) and avoid increasing bundle size on client components.
  - Continue supporting dev/test environments without breaking Vitest/Playwright setups that still rely on localhost.

## Existing Patterns & Reuse

- `config.ts` exposes `config.domainName` (currently `shipfa.st`) and is already consumed by many client/server modules for canonical URLs.
- `lib/env.ts` (`env.app.url` and BASE_URL bootstrap) and `lib/env-client.ts` (clientEnv) each hard-code `'http://localhost:3000'` as a fallback.
- `lib/owner/team/invite-links.ts` builds invitation links from `env.app.url ?? config.domainName ?? "http://localhost:3000"`.
- Server components such as `src/app/(authed)/my-bookings/page.tsx` and `src/app/(ops)/ops/(app)/customer-details/page.tsx` use helper functions that default to `http://localhost:3000` when they cannot infer the origin from headers.

## External Resources

- N/A — all requirements derive from the repository configuration and existing runtime behavior.

## Constraints & Risks

- `config.domainName` is expected to omit protocol, so any helper must normalize by adding `https://` while tolerating values that already include a scheme.
- Some scripts/tests intentionally rely on localhost — production hardening must not break those fixtures (limit the change to runtime paths only).
- `lib/env-client.ts` is a `"use client"` module; any new helper it imports must be tree-shakeable and not depend on Node-only APIs.

## Open Questions (owner, due)

- Q: Should we also update Vitest/Playwright defaults from localhost to the canonical domain? (owner: TBD)
  A: Assumed out of scope because they mimic local dev; revisit if QA requests it.

## Recommended Direction (with rationale)

- Introduce a small shared utility (e.g., `lib/site-url.ts`) that normalizes `config.domainName` into an HTTPS origin without trailing slash.
- Replace all production code fallbacks (`lib/env.ts`, `lib/env-client.ts`, invite links, request origin helpers) to use this canonical helper instead of hard-coded `http://localhost:3000`.
- Keep the helper resilient by falling back to `'https://example.com'` only if `config.domainName` is somehow empty, ensuring we never emit `localhost` links in production while still yielding deterministic behavior in development.
