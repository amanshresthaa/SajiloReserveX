# Implementation Plan: CSRF Enforcement & Client Headers

## Objective

Ensure every state-changing `/api/*` call requires a double-submit CSRF token while keeping browser clients (Next ops UI + Vite guest SPA) functional without manual header work.

## Success Criteria

- [ ] Middleware rejects unsafe `/api/*` requests lacking a valid `X-CSRF-Token` that matches the cookie.
- [ ] GET/HEAD requests automatically receive a `sr-csrf-token` cookie with secure attributes.
- [ ] `fetchJson`, reserve API client, and bespoke fetch calls attach the header when running in the browser.
- [ ] `pnpm lint` passes.

## Architecture & Components

- **Middleware (`middleware.ts`)**: Add helpers to mint/validate CSRF tokens, reuse existing API gating logic, and ensure cookies are set for both API and non-API responses.
- **Shared helper (`lib/security/csrf.ts`)**: Expose constants + `getBrowserCsrfToken()` to avoid duplicating parsing logic across bundles.
- **HTTP helpers**: Update `lib/http/fetchJson.ts` and `reserve/shared/api/client.ts` to set the header opportunistically.
- **Direct fetch callers**: Patch `components/invite/InviteAcceptanceClient.tsx` and `OpsRejectionDashboard.tsx` to include the header via helper.

## Data Flow & API Contracts

- Browser obtains CSRF cookie from any response (page load or API GET) and echoes it via `X-CSRF-Token` on POST/PUT/PATCH/DELETE.
- Middleware compares header/cookie using constant-time comparison; failures return 403 JSON payload `{ error: { code: "CSRF_MISMATCH", message: "..." } }`.

## UI/UX States

- No visible UI changes. Errors manifest as API 403s if token missing (should not occur with updated clients).

## Edge Cases

- Browsers with disabled cookies: tokens absent ⇒ requests fail; acceptable security trade-off.
- Server-side `fetch` (no document) continues by skipping header injection; middleware only enforces on unsafe methods, so SSR GETs unaffected.
- Legacy clients hitting `/api` without header will now receive 403, which is desired.

## Testing Strategy

- Manual reasoning + lint.
- Spot-check dev tools (optional) by verifying cookie presence (deferred; no manual QA per policy since no UI change).

## Rollout

- No feature flag; security enforcement should go live immediately.
- Monitor logs for unexpected 403 spikes.
