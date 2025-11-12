# Implementation Checklist

## Setup

- [x] Split `(guest-public)` layout into neutral wrapper + two sub-layouts (`(marketing)`, `(guest-experience)`).
- [x] Move existing guest routes (blog/browse/etc.) under `(guest-experience)` to inherit legacy chrome without URL changes.

## Core

- [x] Build shared marketing primitives (`OwnerMarketingNavbar`, `OwnerMarketingFooter`, CTA helpers, shell).
- [x] Implement new `/` landing content (hero, features, CTA band).
- [x] Add `/product`, `/pricing`, `/contact` pages with required sections/theme.
- [x] Update `/partners` route to 308 redirect and delete unused restaurant partner components.
- [x] Restyle `/ops/login` per new requirements (back link, remove guest switch, dark palette).

## UI/UX

- [x] Ensure marketing nav + footer responsive (desktop + mobile) with accessible focus states.
- [x] Verify guest routes still show CustomerNavbar + Footer.
- [x] Update documentation (`src/app/(guest-public)/README.md`) with routing/entry-point description.

## Tests

- [x] Unit (typecheck via `pnpm run typecheck`)
- [x] Integration (lint via `pnpm run lint`)
- [ ] E2E (critical flows)
- [ ] Axe/Accessibility checks

## Notes

- Assumptions:
- Deviations:

## Batched Questions (if any)

-
