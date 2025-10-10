# Implementation Plan: UX/UI Audit & Remediation

## Objective

Deliver a consistent, accessible, and performant UX across the primary customer flows (`/`, `/browse`, `/item/:id`, `/create`, `/checkout`) by standardizing visual hierarchy, spacing, and component usage, while capturing exhaustive before/after evidence and meeting the defined Lighthouse and Web Vitals targets.

## Success Criteria

- [ ] Baseline and post-remediation artifacts saved under `/reports` (screenshots, Lighthouse, axe, performance traces, issues.csv, PATCH_NOTES.md).
- [ ] Mobile Lighthouse ≥ 90 Performance / ≥ 95 Accessibility / ≥ 95 Best Practices on audited routes.
- [ ] LCP ≤ 2.5s, CLS ≤ 0.10, INP ≤ 200 ms observed in recorded traces.
- [ ] Zero critical axe violations and fully keyboard-operable flows.
- [ ] New CSS token file adopted by updated components/pages without regressing brand palette or breaking existing layouts.

## Architecture

### Styling & Tokens

- Create `app/styles/tokens.css` (or similar) exporting CSS custom properties for spacing (4/8-pt scale), typography ramp, elevations, and semantic colors, mapped back to existing `:root` variables from `app/globals.css`.
- Import the token file in `app/layout.tsx` (or via `globals.css`) to ensure availability across Server Components and the `reserve` app (verify if additional import is required in `reserve/main.tsx`).
- Introduce utility classes (e.g., `.stack-sm`, `.stack-md`, `.section-shell`) or Tailwind plugin config referencing the tokens to avoid hard-coded `gap`/`padding`.

### Component Updates

- Normalize headings and spacing in key shared components (`components/Header.tsx`, `components/Footer.tsx`, marketing blocks) to align with the new scale.
- Audit shadcn primitives for variant sprawl; document in a generated table (likely via a script that inspects `buttonVariants`, etc.) and refactor usages where variants deviate.
- Add ARIA and focus adjustments within reusable components (modals, forms, navigation) based on identified accessibility issues.

### Performance Enhancements

- Ensure hero and listing images leverage `next/image` with explicit `width`/`height` and `priority` where appropriate; add `loading="lazy"` & `fetchpriority` hints.
- Defer or lazy-load non-critical bundles (e.g., Crisp chat, testimonials carousel) via dynamic imports.
- Introduce `<link rel="preload">` for critical fonts or use Next.js font optimization if feasible.
- Identify and remove unused CSS via Tailwind config adjustments or component cleanup (guided by CSS Coverage data).

## Component Breakdown

- **Global Layout (`app/layout.tsx`, `components/LayoutClient.tsx`)**: Import tokens, review skip link placement, ensure consistent container padding.
- **Landing Page (`app/page.tsx`)**: Align hero spacing, restructure sections with tokens, reserve media space, verify call-to-action button variants and accessibility.
- **Browse / Item / Checkout Flows**: Once routes confirmed, update list/grid spacing, card sizing, modals, and forms to use tokens and accessible semantics.
- **Reserve Wizard (`reserve/pages/*.tsx`, `reserve/features/*`)**: Apply tokens and spacing normalization for multi-step forms and side panels.
- **Shared Components (`components/ui/*.tsx`, `components/ops/*`, `components/marketing/*`)**: Add tokens-based classnames, ensure focus-visible states, unify typography.

## Data Flow

- No backend changes. Styling is applied via CSS; dynamic imports/granular bundles rely on Next.js/Vite data flow already in place.
- Performance metrics captured via DevTools traces and stored as JSON/markdown under `/reports/perf-traces`.

## API Contracts

- Unchanged. If any client components require new props (e.g., `aria-label` parameters), ensure backwards compatibility or add sensible defaults.

## UI/UX Considerations

- Apply 4/8-pt spacing scale for vertical stacks (`stack-xs` = 4px, `stack-sm` = 8px, `stack-md` = 12px, etc.) and enforce consistent section padding (mobile-first).
- Maintain heading hierarchy (`h1` per page, descending order without skipping levels). Use tokens to define font sizes (`var(--font-size-heading-lg)` etc.).
- Guarantee interactive targets ≥ 44px, visible focus outlines, and consistent button/icon sizing.
- Provide placeholders or `aspect-ratio` containers to prevent layout shifts for images/videos.
- Ensure states (loading, empty, error) have consistent spacing & messaging; align to `aria-live` region strategy for toasts.

## Testing Strategy

- **Automated**: Re-run existing lint/typecheck pipelines (`pnpm lint`, `pnpm typecheck`) after changes. Add targeted unit tests if new utilities introduced (e.g., token helper functions).
- **Manual**: Keyboard navigation sweeps across key routes, responsive inspection at mobile/tablet/desktop breakpoints, screen reader spot checks (VoiceOver quick nav), form validation flows.
- **Tooling**: Lighthouse (mobile+desktop), Chrome Performance traces, axe scans, CSS Coverage, color/typography reports, all captured via MCP.
- **Regression**: Spot-check reserve wizard to ensure dynamic imports or CSS changes do not break multi-step flows.

## Edge Cases

- Long restaurant names/descriptions causing wrapping—verify new spacing accommodates multi-line content without clipping.
- Low connectivity scenarios—confirm skeleton loaders or placeholders do not shift layout when content arrives.
- Dark mode (if toggled elsewhere) should still obey tokens; verify contrast ratios meet WCAG AA.
- Authentication-gated routes (if accessed) should maintain focus management and consistent tokens.

## Rollout Plan

- Develop behind feature branches; once local verification passes, compile `PATCH_NOTES.md` with key changes.
- Coordinate with stakeholders for review of before/after artifacts.
- Deploy with monitoring via existing analytics; ensure Plausible script remains intact but optimized (e.g., `defer`).
