# Implementation Checklist

## Setup

- [x] Confirm Supabase PAT availability (`SUPABASE_ACCESS_TOKEN`) without echoing value — currently unset; requires maintainer-provided PAT
- [x] Register Supabase MCP server in `.vscode/mcp.json`
- [x] Capture `TEST_ROUTE_API_KEY` requirement for test endpoints — not set locally, so test APIs open in dev

## Core

- [x] Start scoped Next.js dev server on open port (localhost:3105)
- [x] Bootstrap Supabase session for `amanshresthaaaaa@gmail.com` (via `/api/test/playwright-session` in Chrome context)
- [x] Document session acquisition steps in task notes

## UI/UX

- [x] Run Chrome DevTools MCP session (console/network log review)
- [x] Verify `/ops` dashboard renders for authenticated user
- [x] Test responsive layouts (mobile/tablet/desktop) and key interactions

## Tests

- [x] Validate `/api/test/playwright-session` returns 200 (curl or fetch)
- [x] Record manual QA findings in `verification.md`

## Notes

- Assumptions:
  - Local test API left ungated (no `TEST_ROUTE_API_KEY`)
- Deviations:
  - Supabase PAT not available locally; pending external provisioning before MCP server can authenticate
  - Dev server running on port 3105 during QA session
  - Auth session seeded via `/api/test/playwright-session` fetch executed inside Chrome DevTools MCP page

## Batched Questions (if any)

- [ ] How to obtain Supabase PAT (pending maintainer response)?
