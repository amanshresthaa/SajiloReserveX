# Implementation Plan: Supabase Token & Manual QA

## Objective

Enable local QA to access protected Ops routes by provisioning an authenticated Supabase session for `amanshresthaaaaa@gmail.com`, then execute Chrome DevTools MCP manual testing on target flows.

## Success Criteria

- [ ] Supabase MCP server configured in `.vscode/mcp.json` and reachable via MCP tooling.
- [ ] Auth token/session generated (or validated) for `amanshresthaaaaa@gmail.com` without exposing secrets.
- [ ] Chrome DevTools MCP session run against the authenticated Ops experience with console/network/a11y notes captured in `verification.md`.

## Architecture & Components

- `@supabase/mcp-server-supabase`: MCP server providing Supabase management/auth operations (requires PAT via `SUPABASE_ACCESS_TOKEN` or CLI flag).
- Test Auth helper: `/api/test/playwright-session` (server route) for bootstrapping sessions if MCP auth tooling cannot deliver login tokens directly.
- Local Next.js dev server (`pnpm run dev`) serving the Ops dashboard; may run on port 3001+ depending on availability.
- Chrome DevTools MCP client: connect to the running app for manual QA (console, network, Lighthouse, device emulation).

State: Auth cookies stored in browser session (Chromium instance launched by Chrome DevTools MCP).  
Routing/URL state: Primary routes `/signin`, `/ops`, `/ops/dashboard/*`, optionally `/my-bookings` for regression check.

## Data Flow & API Contracts

1. Obtain Supabase PAT (manual step) and expose to MCP via `SUPABASE_ACCESS_TOKEN` env var.
2. Launch Supabase MCP server (`npx mcp-server-supabase --project-ref <ref>`), use its tools to inspect/create auth context or verify the QA user.
3. If token retrieval unsupported, call `/api/test/playwright-session` (POST) with `{ email, password, profile }` to generate Supabase session cookies. Requires `x-test-route-key` header when `TEST_ROUTE_API_KEY` is set.
4. Apply resulting cookies/token inside Chrome DevTools MCP (via normal login flow or by hitting the test route within the browser context) and navigate to target Ops routes.

Endpoint: POST `/api/test/playwright-session`  
Request: `{ email: string, password: string, profile: { role?: 'manager' | ... } }`  
Response: `{ user, profile, restaurantMembership, clientRequestId }` with auth cookies in response headers.  
Errors: `400` invalid payload, `403` missing test key, `500` Supabase errors.

## UI/UX States

- Loading: Ops dashboard skeletons; ensure no regressions.
- Empty: Heatmap/summary empty-state should be noted if data absent.
- Error: Observe toast/error panel when auth missing; confirm redirect to `/signin` handled gracefully.
- Success: Authenticated landing on `/ops` with charts populated; verify navigation to sub-tabs.

## Edge Cases

- Supabase PAT not available → block on maintainers, document in notes.
- Test route locked by `TEST_ROUTE_API_KEY` → ensure header forwarded, otherwise session bootstrap fails.
- Chrome DevTools MCP requiring valid session cookies; if magic link flow fails, use test API fallback.
- Ports already in use (e.g., 3000) → capture chosen alternative port for QA steps.

## Testing Strategy

- Manual: Chrome DevTools MCP for responsiveness, console, network, accessibility checklist.
- Integration: Validate `/api/test/playwright-session` locally via curl/fetch to confirm 200 response.
- No automated unit tests added (non-code change); record manual verification evidence.

## Rollout

- Feature flag: none.
- Exposure: local-only.
- Monitoring: capture QA artefacts in `verification.md` and call out any regressions for follow-up tickets.
