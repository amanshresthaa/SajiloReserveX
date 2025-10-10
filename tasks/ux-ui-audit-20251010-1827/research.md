# Phase 0: Initial Notes

## Requirements

- Perform end-to-end UX/UI audit across key routes (`/`, `/browse`, `/item/:id`, `/create`, `/checkout`).
- Produce before/after artifacts (screenshots, reports) and remediation patches.
- Address spacing, hierarchy, accessibility, and performance inconsistencies.

## Success Criteria

- Capture all requested baseline and post-fix assets under `/reports`.
- Lift Lighthouse Mobile scores to ≥90 Performance, ≥95 Accessibility, ≥95 Best Practices.
- Achieve LCP ≤2.5s, CLS ≤0.10, INP ≤200ms on critical pages with no critical axe violations.
- Maintain brand consistency while introducing a tokenized spacing/color/typography system.

# Research: UX/UI Audit & Remediation

## Existing Patterns

- Global design tokens already live in `app/globals.css` and Tailwind extensions (`tailwind.config.js`) with CSS custom properties for color, spacing, radii, and shadows. These are referenced via Tailwind tokens such as `bg-primary`, `text-foreground`, and custom spacing keys (`screen-margin`, `card-padding`).
- Shadcn-based primitives exist under `components/ui/*` (e.g., `components/ui/button.tsx`, `components/ui/card.tsx`) using `class-variance-authority` for variants. There is no single source of truth listing current variants.
- Page layouts (`app/layout.tsx`, `components/LayoutClient.tsx`) already include accessibility affordances (skip link, `focus-visible` styling) and global font setup (`--font-sajilo`).
- Operational dashboards rely on composable shells such as `components/ops/manage/ManageRestaurantShell.tsx`, which structure content with cards, toolbars, and forms using utility classes. Spacing stacks are mostly ad-hoc (`gap-3`, `gap-6`, `px-6`, `py-10`), suggesting opportunity to standardize.
- Two runtime surfaces exist: the Next.js app under `app/` and the Vite-powered reservation wizard under `reserve/`. Shared styling flows through Tailwind and CSS variables, but the wizard likely bundles its own CSS.

## External Resources

- WAI-ARIA Authoring Practices (per AGENTS.md) for keyboard and focus expectations.
- Lighthouse documentation for interpreting Performance/Accessibility/Best Practice scores.
- Chrome DevTools guides for CSS Overview, Coverage, and Performance tracing (aligns with requested tooling).
- Tailwind CSS v4 docs for tokenization and theme extensions.

## Technical Constraints

- The project targets Next.js 15 (`package.json`) with React 19.2; concurrent features and Server Components are enabled, so any client-only fix must respect `use client` boundaries.
- Tailwind tokens rely on CSS custom properties defined in `:root`; introducing a dedicated token file must not break existing variable consumers (e.g., `--color-primary`) and should export within CSS to avoid runtime JS dependencies.
- Reports must be persisted under `/reports` without disturbing existing artifacts; ensure directories are git-ignored if large.
- MCP/Chrome DevTools workflow is mandatory: we must collect baseline screenshots, Lighthouse, axe, and performance artifacts through the provided interface.
- Need to confirm the correct `<APP_URL>` (likely `http://localhost:3000`) and ensure both Next and Vite apps are built/served when auditing cross-route flows.

## Open Questions

- Do `/browse`, `/item/:id`, `/create`, and `/checkout` map to Next.js routes or the `reserve` SPA? Routing structure needs confirmation once the app is running.
- Are there brand guidelines beyond the existing CSS variables (e.g., typography scale beyond what Tailwind extends)? If not, token naming will need to align with current palette.
- Should the new token file live as a pure CSS module (e.g., `app/(styles)/tokens.css`) or generated via PostCSS for reuse in both Next & Vite builds?
- What baseline analytics (Plausible) or auth scripts must remain untouched while minimizing render-blocking behavior?

## Observations & Initial Findings

- `app/globals.css` contains extensive comments and tokens but lacks derived utility classes (e.g., spacing scale classes) that ensure consistent gaps/padding. Existing components mix `gap-3`, `gap-4`, `gap-6`, `px-8`, etc., without alignment to a 4/8-pt scale.
- There is no centralized documentation of component variants; we must mine existing JSX to map the permutations (buttons, inputs, cards, modals).
- Accessibility helpers (skip link, focus-visible styling) exist, yet we must verify each key route exposes correct heading hierarchy and focus order.
- Performance-critical assets (images, fonts) require evaluation—no obvious preloads or `next/image` usage observed yet.

## Recommended Approach

1. **Environment Prep**: Run the Next.js dev server (and the reservation wizard if needed) to obtain a live target at `<APP_URL>`. Validate the base path for each required route.
2. **Baseline Capture**: Use Chrome DevTools MCP to:
   - Set viewports (390×844, 834×1112, 1440×900) and capture full-page screenshots into `reports/before/`.
   - Execute Lighthouse (mobile & desktop), exporting HTML/JSON under `reports/lighthouse-before/`.
   - Run CSS Overview, Coverage, axe, and Performance traces; archive outputs in dedicated subdirectories (`reports/css-overview`, `reports/perf-traces`, `reports/a11y-report`).
3. **Audit & Synthesis**: From DevTools data, compile `reports/issues.csv` enumerating spacing, hierarchy, component variance, accessibility, and performance issues. Cross-reference with code to identify reusable components and minimal-change fixes.
4. **Design Tokens**: Introduce a lightweight CSS token file (likely under `app/styles/tokens.css` or similar) exporting spacing, typography, and elevation tokens that wrap existing `:root` variables, ensuring compatibility with both Next and Vite builds.
5. **Remediation Iterations**: Tackle issues in priority order—normalize headings, standardize gaps, enforce consistent component variants, patch accessibility labels, and eliminate layout shifts (e.g., reserve media aspect-ratio).
6. **Optimization Work**: Address performance findings (image dimension hints, preloads, code-splitting, CSS pruning). Remove unused dependencies cautiously, verifying tree-shaking and bundle stats (e.g., via `next build --analyze` or Vite visualizer if needed).
7. **Validation Loop**: Re-run Lighthouse, axe, and Performance traces post-fix, capture “after” screenshots, and compute deltas versus baseline.
8. **Documentation**: Summarize applied changes and open risks in `reports/PATCH_NOTES.md`, ensuring compliance with acceptance criteria.

## Next Steps

- Confirm running environment for `<APP_URL>` and whether both Next and reserve apps need simultaneous execution.
- Inventory current spacing values used across representative pages to inform the 4/8-pt scale mapping before refactoring.
- Prepare automation snippets/scripts (if allowed) to streamline repeated DevTools captures via MCP.
