# Research: Supabase Token & Chrome DevTools Manual QA

## Existing Patterns & Reuse

- `tests/global-setup.ts` provisions authenticated sessions by POSTing to `/api/test/playwright-session` with a QA account, showing how to bootstrap Supabase auth programmatically.
- `src/app/api/test/playwright-session/route.ts` handles the session bootstrap: it ensures the user exists, upserts profile data, and signs in via Supabase to set auth cookies.
- `server/test-api.ts` exposes helpers (`guardTestRoute`, `testRouteHeaders`) that gate test routes behind `TEST_ROUTE_API_KEY` when configured.
- MCP clients already configured: `.vscode/mcp.json` registers `chrome-devtools` (for manual QA) and `shadcn`. Package.json also ships `@supabase/mcp-server-supabase`, enabling an MCP transport for Supabase management APIs once wired up.

## External Resources

- Supabase MCP server CLI documentation (via `node_modules/@supabase/mcp-server-supabase/dist/transports/stdio.js`) – expects a Personal Access Token (`SUPABASE_ACCESS_TOKEN` or `--access-token`) and optional `--project-ref`.
- Next.js dev docs for running local server and using Chrome DevTools against it.

## Constraints & Risks

- Supabase MCP server requires a Supabase Personal Access Token (PAT); `.env.local` does not define `SUPABASE_ACCESS_TOKEN`, so the PAT must be supplied out-of-band.
- Test API routes rely on `env.featureFlags.enableTestApi` or `NODE_ENV !== 'production'`; if `TEST_ROUTE_API_KEY` is set we must send the header for the session bootstrap.
- Manual QA needs a running local Next.js server. Starting/stopping the dev server within the CLI session must be carefully managed to avoid orphaned processes.
- Handling secrets (PAT, service role key) must avoid leaking values to logs or final reports.

## Open Questions (and answers if resolved)

- Q: Where do we obtain the Supabase PAT required by the MCP server?  
  A: Not stored in repo; must request from project maintainers or generate via Supabase dashboard.
- Q: Do we already have the test-route API key?  
  A: TBD – check `.env.local` manually without echoing the value; requirement noted in plan.
- Q: Which routes need manual QA during this session?  
  A: Primary focus is `/ops` dashboard flows post-auth; confirm in plan.

## Recommended Direction (with rationale)

- Configure `.vscode/mcp.json` to register the Supabase MCP server (`npx mcp-server-supabase`) so CLI tooling can authenticate to Supabase once a PAT is provided.
- Use the Supabase MCP server to trigger generation/retrieval of a login mechanism (or to inspect auth metadata) for `amanshresthaaaaa@gmail.com`, falling back to the existing `/api/test/playwright-session` helper if direct token issuance is not supported.
- Start a scoped Next.js dev server on an available port, bootstrap an authenticated session using the generated credentials, and run Chrome DevTools MCP for manual UX/UI verification (console, network, accessibility, responsiveness).
- Document token handling steps and QA findings in `todo.md` and `verification.md` to maintain traceability per AGENTS.md.
