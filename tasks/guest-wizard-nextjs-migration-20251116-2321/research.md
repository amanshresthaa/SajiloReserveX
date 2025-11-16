---
task: guest-wizard-nextjs-migration
timestamp_utc: 2025-11-16T23:21:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: high
flags: []
related_tickets: []
---

# Research: Migrate guest booking wizard from Vite to Next.js

## Requirements

- Functional:
  - Serve the customer booking wizard from the Next.js App Router with URL parity to the current Vite `reserve` app.
  - Preserve guest marketing and account flows already in `src/app/(guest-public)` and `(guest-account)`.
- Non-functional (a11y, perf, security, privacy, i18n):
  - Maintain existing accessibility baselines (keyboard navigation, focus, ARIA where needed).
  - Keep or improve performance budgets; avoid excessive bundle bloat when moving client-heavy flows.
  - Keep secrets out of source; reuse existing auth/session patterns.

## Existing Patterns & Reuse

- Next.js App Router is already used for guest marketing and account routes under `src/app/(guest-public)` and `src/app/(guest-account)`.
- Vite `reserve` app implements booking wizard with React Router, shared UI/utilities in `reserve/shared/*`, and tests via Vitest/Playwright.
- Shared UI primitives in `reserve/shared/ui` mirror Shadcn-style components; may be reusable as a shared package/module in Next.js.

## External Resources

- Internal codebase only; no external docs currently referenced.

## Constraints & Risks

- Large interactive surface (wizard) may increase Next.js bundle size if not code-split/client-only appropriately.
- React Router-specific patterns need rewriting for Next.js routing/data fetching.
- Testing parity required (Vitest + Playwright equivalents).
- Potential SEO/SSR considerations for entry pages; wizard likely client-heavy.

## Open Questions (owner, due)

- Desired final URL shape parity with Vite (`/`, `/new`, `/r/:slug`, `/:reservationId`)? (owner: product/design, due: ASAP)
- Do we deprecate the Vite app immediately or operate both during transition? (owner: eng, due: ASAP)
- Preferred placement in Next.js route tree (e.g., under `(guest-experience)/reserve` or new segment)? (owner: eng/design, due: ASAP)

## Recommended Direction (with rationale)

- Consolidate the booking wizard into Next.js to unify the guest surface, improve SEO/SSR options, and reduce maintenance of two stacks.
- Keep wizard UI primarily client components with lazy-loaded chunks to control bundle size; use server routes/actions for data fetching where appropriate.
- Extract reusable `reserve/shared` pieces into a shared module consumable by Next.js pages to minimize rewrite effort.
