# Research: CSRF Hardening & SPA Header Alignment

## Requirements

- Functional:
  - Prevent cross-site request forgery on all state-changing `/api/*` routes without breaking existing clients (ops UI, guest SPA, invite flow).
  - Ensure browser clients automatically send the anti-CSRF signal so UX is unaffected.
- Non-functional:
  - Token generation must be secure, unique per browser, and scoped to the current origin.
  - Implementation must work in both Next middleware (Edge runtime) and browser bundles (Next + Vite) without Node-only APIs.

## Existing Patterns & Reuse

- `middleware.ts` already centralizes `/api` handling (versioning, blocking test endpoints); ideal insertion point for CSRF checks/cookie issuance.
- Frontend fetch helpers:
  - Ops/Next clients rely on `lib/http/fetchJson.ts`.
  - Guest SPA uses `reserve/shared/api/client.ts`.
  - A few UI components (`InviteAcceptanceClient`, `OpsRejectionDashboard`) call `fetch` manually.
- No shared CSRF helper exists; introduce one under `lib/security` so both apps can consume constants/logic.

## External Resources

- OWASP CSRF guidance (consulted via `curl https://owasp.org/www-community/attacks/csrf`) reminding about double-submit cookie approach and strict SameSite cookies.
- PostgreSQL docs not directly needed for this fix (covered in earlier analysis).

## Constraints & Risks

- Middleware runs on the Edge runtime ⇒ avoid Node-specific modules like `crypto.randomBytes`; must use Web Crypto APIs.
- Server-side calls to `/api` (e.g., React Server Components prefetching data) should continue working; thus validation should apply only to unsafe HTTP methods.
- Clients without JavaScript (or tests) still need tokens; issuing cookies on every response ensures coverage.
- Need to avoid breaking SSR/test environments where `document` is undefined; browser-only helpers must guard accordingly.

## Open Questions (owner, due)

- Q: Do any automated tests perform state-changing `/api` calls without going through browser helpers? (owner: codex, due: during implementation).
  - A: Manual search showed only a couple of bespoke fetches; updating those plus shared helpers should cover remaining cases.

## Recommended Direction (with rationale)

1. **Double-submit cookie**: Middleware mints a `sr-csrf-token` cookie (non-HttpOnly, SameSite=Strict) on first request and validates that any unsafe `/api` request includes a matching `X-CSRF-Token` header.
2. **Shared helper**: Create `lib/security/csrf.ts` exporting cookie/header names and a `getBrowserCsrfToken()` utility so browser code can easily read the token.
3. **Client updates**: Enhance `fetchJson`, `reserve` API client, and any standalone `fetch` usages to automatically attach `X-CSRF-Token` when running in the browser.
4. **Verification**: Run `pnpm lint` to satisfy repo policy; no visual UI changes, so manual DevTools QA is not required.
