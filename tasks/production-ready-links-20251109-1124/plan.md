# Implementation Plan: Production Ready Links

## Objective

Ensure all runtime code (client + server) defaults to the canonical production origin instead of `http://localhost`, so any generated links (emails, invites, API prefetches) remain production-ready even if env vars are missing or sanitized.

## Success Criteria

- [ ] Introduce a single canonical helper that returns an HTTPS origin derived from `config.domainName`.
- [ ] `lib/env.ts`, `lib/env-client.ts`, invite links, and booking prefetched pages no longer contain `localhost` fallbacks.
- [ ] `pnpm lint` succeeds.

## Architecture & Components

- `lib/site-url.ts` (new): exports `getCanonicalSiteUrl()` returning `https://<domain>` with trailing slash trimmed and a safe fallback (e.g., `https://example.com`).
- `lib/env.ts`: import the helper to seed `BASE_URL` and `env.app.url` defaults.
- `lib/env-client.ts`: import the helper for `clientEnv.app.siteUrl`.
- `lib/owner/team/invite-links.ts`: rely on `env.app.url ?? getCanonicalSiteUrl()` instead of hard-coded localhost.
- `src/app/(authed)/my-bookings/page.tsx` & `src/app/(ops)/ops/(app)/customer-details/page.tsx`: update origin resolver fallback to canonical helper (keep header inference logic unchanged).

State: none; URLs derived from config/env only.

## Data Flow & API Contracts

- No API shape changes; internal consumers simply receive fully qualified HTTPS URLs.
- `env` parsing continues to rely on existing Zod schemas; helper is only invoked when env values are absent.

## UI/UX States

- No user-visible components change; behavior change is limited to generated links.

## Edge Cases

- `config.domainName` may already include `https://`; helper should detect and avoid double-prefixing.
- Domain could include trailing `/`; helper should strip it so string concatenation behaves as before.
- If `config.domainName` is accidentally blank, fall back to a deterministic placeholder (not localhost) to maintain prod readiness.

## Testing Strategy

- Static analysis via `pnpm lint`.
- Spot-check TypeScript compilation implicitly via lint (eslint uses TS config).
- Manual review of affected files to ensure no other localhost literals remain outside tests.

## Rollout

- No feature flags needed. Once merged, deploy normally; no runtime toggle.
