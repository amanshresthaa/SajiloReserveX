# Research: site-wide screenshots

## Requirements

- Functional: generate up-to-date screenshots for every published route in the Next.js app using the Playwright MCP server; deliver images plus a manifest of paths covered.
- Non-functional: keep authentication tokens out of logs, respect existing viewport/brand standards, do not mutate Supabase data while browsing.

## Existing Patterns & Reuse

- `route-map.json` enumerates 31 routes (path, guard, source) and will act as the canonical list to screenshot.
- `pnpm dev` (per `package.json`) launches the Next.js app locally with env values from `.env.local`.
- `playwright.config.ts` already defines Chromium projects and reporters; we can reuse its base URL/viewport defaults when driving the MCP server manually.

## External Resources

- [COMPLETE_ROUTE_MAP.md](../COMPLETE_ROUTE_MAP.md) – human-readable documentation of the paths and their guard rails.

## Constraints & Risks

- Guarded routes (e.g., `/my-bookings`, `/ops`, `/checkout`) redirect unless we inject a valid session; we need maintainer-provided auth/session cookies before capturing those screens.
- Some pages depend on seeded data (catalog, booking state). We must capture whatever the environment already exposes; avoid triggering mutations (e.g., submitting forms).
- Running `pnpm dev` requires Node ≥20.11 and the existing `.env.local`; ensure no conflicting processes already bind port 3000.

## Open Questions (owner, due)

- Q: Provide session token(s) for `auth` and `admin` guarded routes? (owner: requestor, due: before Phase 3)
  A: _pending_

## Recommended Direction (with rationale)

- Use `route-map.json` to build the checklist: iterate all 31 entries so nothing is missed.
- Spin up the dev server via `pnpm dev` and keep it running while the Playwright MCP client opens each path.
- Capture screenshots via `mcp__playwright__browser_take_screenshot`, saving under `screenshots/<date>/<path>.png` (mirrors existing screenshots folder for traceability).
- Document coverage + any deviations inside `verification.md` for auditability.
