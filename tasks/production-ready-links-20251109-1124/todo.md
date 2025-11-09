# Implementation Checklist

## Setup

- [x] Add shared helper (e.g., `lib/site-url.ts`) that normalizes `config.domainName` into an HTTPS origin.

## Core

- [x] Replace localhost fallback in `lib/env.ts` with the canonical helper (BASE_URL bootstrap + `env.app.url` getter).
- [x] Update `lib/env-client.ts` to use the helper for `clientEnv.app.siteUrl`.
- [x] Ensure invite links (`lib/owner/team/invite-links.ts`) and server-side origin resolvers reference the canonical helper instead of hard-coded localhost.

## Tests & Verification

- [x] Run `pnpm lint` to satisfy the lint-verification requirement.
- [ ] Update `tasks/production-ready-links-20251109-1124/verification.md` with lint results once complete.
