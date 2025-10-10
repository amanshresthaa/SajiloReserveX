# Implementation Checklist

## Environment & Baseline

- [ ] Confirm `<APP_URL>` and start necessary dev servers (Next + reserve if applicable).
- [ ] Create `/reports` directory structure (before/, after/, lighthouse-\*, perf-traces/, a11y-report/).
- [ ] Capture baseline full-page screenshots for required routes at mobile/tablet/desktop.
- [ ] Run Lighthouse (mobile & desktop) baseline; export JSON+HTML.
- [ ] Collect axe report, accessibility tree findings, CSS Overview, Coverage exports.
- [ ] Record performance traces (initial load + key interaction per route); annotate LCP, long tasks, CLS events.

## Audit Synthesis

- [ ] Build `reports/issues.csv` summarizing findings (page, selector, problem, severity, proposed fix).
- [ ] Enumerate component variants (buttons, inputs, modals, etc.) and document in table.

## Tokenization & Styling Infrastructure

- [ ] Author CSS token file with spacing, typography, elevations referencing existing variables.
- [ ] Wire tokens into global styles (import points for Next + reserve app).
- [ ] Add helper utility classes or Tailwind mappings to enforce new scale.

## Remediation Pass

- [ ] Normalize headings, spacing, and layout structure on audited pages using tokens.
- [ ] Reserve media space and adjust responsive breakpoints to eliminate CLS/overflow.
- [ ] Add missing ARIA labels, associate inputs with labels, ensure focus ring visibility.
- [ ] Refine button/input/modal variants to align with documented table.

## Performance Optimization

- [ ] Address image sizing/preloading, defer non-critical scripts, and lazy-load heavy components.
- [ ] Remove unused CSS/JS (guided by Coverage) and adjust bundling where feasible.

## Validation

- [ ] Re-run Lighthouse (mobile+desktop) and compare to baseline.
- [ ] Re-run axe + accessibility checks; confirm zero critical violations.
- [ ] Re-run performance traces; ensure metrics meet targets.
- [ ] Capture after-state screenshots for all routes and viewports.

## Reporting & Wrap-up

- [ ] Update `reports/issues.csv` with status column reflecting fixes.
- [ ] Write `reports/PATCH_NOTES.md` (changes, verification summary, remaining risks).
- [ ] Document verification results in `tasks/ux-ui-audit-20251010-1827/verification.md`.
- [ ] Clean up any temporary scripts/logs and ensure instructions-ready state.

## Questions / Assumptions

- What is the canonical host/port for `<APP_URL>`? (Assume `http://localhost:3000` until confirmed.)
- Do `/browse`, `/item/:id`, `/create`, `/checkout` resolve within Next or the reserve SPA? (Investigate during baseline capture.)
