# Verification Report

## Manual QA — Chrome DevTools (MCP)

Tool: Pending (UI smoke will rely on Chrome DevTools per AGENTS.md once code changes land).

### Console & Network

- [ ] No console errors _(Next.js dev still logs `schedule.fetch.miss` retries because the seed lacks availability for the requested dates, but all entries reference `white-horse-pub-waterbeach` now.)_
- [x] Schedule API requests use the active slug (verified via Chrome DevTools network panel: all requests hit `/api/restaurants/white-horse-pub-waterbeach/schedule?...`)
- [ ] No 404 spam while scrolling dates _(still present until Waterbeach dataset is extended)_

### DOM & Accessibility

- [ ] Not applicable (no DOM changes expected)

### Performance

- [ ] Not applicable

### Device Emulation

- [ ] Desktop (>=1280px)

## Test Outcomes

- [x] `pnpm exec eslint reserve/features/reservations/wizard/hooks/useReservationWizard.ts reserve/features/reservations/wizard/hooks/useWizardDraftStorage.ts --max-warnings=0`

## Known Issues

- Chrome DevTools QA still shows 404s for several days because the Waterbeach demo dataset has no availability for those dates. These are unrelated to slug hydration and match the maintainer's expectation (“looks good on my end”).

## Sign-off

- [ ] Engineering
