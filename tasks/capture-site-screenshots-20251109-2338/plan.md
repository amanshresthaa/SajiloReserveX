# Implementation Plan: site-wide screenshots

## Objective

Capture current UI screenshots for every documented Next.js route so that design/research teams have consistent visual references.

## Success Criteria

- [ ] Every path listed in `route-map.json` has a corresponding PNG captured in this run.
- [ ] Auth-guarded routes display their in-app UI (not redirect/login) using maintainer-supplied session tokens.
- [ ] `verification.md` enumerates the covered routes, viewport, and any issues encountered.

## Architecture & Components

- `pnpm dev`: runs the Next.js server locally on `http://localhost:3000`.
- Playwright MCP server: programmatically loads each route, waits for network idle, then captures screenshots.
- Route manifest: parse `route-map.json` to drive the iteration; track guard requirements so we know which tokens to inject.

## Data Flow & API Contracts

1. Launch dev server with `.env.local` so pages resolve real data.
2. For each route, instruct Playwright MCP to `browser_navigate` to `http://localhost:3000<path>`.
3. Wait for network idle / relevant UI ready, then call `browser_take_screenshot` writing into `screenshots/<timestamp>/<slug>.png`.
4. Log success/failure in `todo.md` + final verification report.

## UI/UX States

- Loading: allow skeleton/spinner states to settle before capturing.
- Empty/error: note if any path intentionally renders empty/error content; capture as-is and flag in verification.
- Success: final screenshot should reflect the steady-state UI.

## Edge Cases

- Auth/Ops routes require injected cookies/session storage; confirm token format (e.g., `sb-access-token`, `sb-refresh-token`).
- Dynamic params (e.g., `/blog/[slug]`) share pages; capture canonical slugs already present (see `route-map` descriptions) to avoid 404s.
- Some marketing/legal pages may rely on static metadata only; still capture even if mostly text.

## Testing Strategy

- Manual verification: visually inspect each PNG quickly to ensure the content matches the intended path.
- Sanity check: re-open a couple of outputs in-browser to confirm files are not corrupted.

## Rollout

- Store outputs under `screenshots/sessions/capture-site-screenshots-20251109-2338/` to avoid clobbering prior runs.
- Share summary + file listing with stakeholders (outside scope of this run).
- No feature flags/rollout toggles required.
