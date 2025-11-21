---
task: fix-terms-unescaped-entities
timestamp_utc: 2025-11-21T22:31:00Z
owner: github:@assistant
reviewers: [github:@maintainers]
risk: low
flags: []
related_tickets: []
---

# Implementation Plan: Fix unescaped quotes in terms page

## Objective

Ensure the Terms marketing page renders the same legal text while complying with `react/no-unescaped-entities` so lint and pre-commit succeed.

## Success Criteria

- [ ] `pnpm lint` (or husky hook) passes without `react/no-unescaped-entities` errors.
- [ ] Terms page copy remains unchanged to readers.

## Architecture & Components

- `src/app/(marketing)/terms/page.tsx`: static page content within `MarketingLayout`. Only update text nodes to escape problematic quotes; no structural or styling changes.

## Data Flow & API Contracts

- Static content only; no data/API changes.

## UI/UX States

- Single static view; no loading/error/success variance.

## Edge Cases

- Avoid introducing HTML entities in a way that double-escapes or alters rendering.
- Keep accessibility intact (semantic headings/paragraphs).

## Testing Strategy

- Manual review of the updated copy to confirm rendered quotes look correct.
- Run `pnpm lint` (or equivalent) to verify lint passes.

## Rollout

- No feature flag; change is safe to ship immediately once lint passes.
