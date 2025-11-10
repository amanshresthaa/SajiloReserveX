# Research: Component Screenshot Capture

## Requirements

- Functional:
  - Produce high-quality screenshots for at least the first 1–2 reusable UI components already implemented in the marketing landing page (`src/app/page.tsx`).
  - Store the screenshots inside the repo so they can be referenced or extended later in the `screenshots/` tree.
- Non-functional (a11y, perf, security, privacy, i18n):
  - Follow the AGENTS.md mandate for Chrome DevTools manual capture and avoid leaking Supabase/Resend secrets in output.
  - Ensure captured components respect existing responsive + accessible styles (visible focus, readable content) so screenshots match production.
  - Keep files lightweight (<1 MB each) and name consistently for future automation.

## Existing Patterns & Reuse

- `src/app/page.tsx` already composes marketing components such as `<Hero />`, `<MarketingSessionActions />`, and `<RestaurantBrowser />`, so we can reuse this page instead of scaffolding a new gallery.
- The repo already has a `screenshots/` directory (currently with an `ops/` subfolder), which implies screenshots are versioned in-repo.
- Chrome DevTools MCP is our standard tool for manual UI work; we can rely on it to capture viewport/section screenshots without new dependencies.

## External Resources

- [AGENTS.md](../../agents.md) – defines SDLC workflow, Chrome DevTools requirement, and storage expectations for evidence artifacts.

## Constraints & Risks

- `pnpm dev` runs `scripts/validate-env.ts` first; it will fail if Supabase env vars are missing. `.env.local` already contains staged values, so we must not log or expose them.
- Running the Next.js dev server is required for rendering live components; ensure the process is started/stopped cleanly to avoid orphaned ports.
- Component selection is ambiguous; assuming we start with the homepage hero + features sections unless the user clarifies otherwise. Call out this assumption.

## Open Questions (owner, due)

- Q: Are there specific components (e.g., from `components/ui`) the user wants prioritized?
  A: Not specified; proceeding with homepage hero/feature sections and ready to adjust if feedback indicates different targets.

## Recommended Direction (with rationale)

- Spin up `pnpm dev` (reusing env) and use Chrome DevTools MCP to hit `http://localhost:3000/`.
- Identify the first two above-the-fold components (Hero area and next feature module) and capture focused screenshots via DevTools' capture tool for consistency.
- Save outputs into a new `screenshots/components/` subfolder with descriptive filenames (`hero.png`, `features-grid.png`) to keep artifacts organized.
- Note capture details and manual QA evidence in `verification.md` for traceability, enabling easy extension to more components later.
