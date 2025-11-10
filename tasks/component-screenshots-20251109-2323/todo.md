# Implementation Checklist

## Setup

- [x] Create `screenshots/components/` to store the new assets.

## Capture

- [x] Launch `pnpm dev` (uses `.env.local`). _(Port 3000 already hosting another dev instance; validated env + reused existing server.)_
- [x] Load `http://localhost:3000/` via Chrome DevTools MCP and ensure no console errors.
- [x] Capture hero section screenshot.
- [x] Capture the next component (RestaurantBrowser / features module) screenshot.
- [x] Stop the dev server cleanly. _(No standalone process remained after reuse fallback.)_

## Documentation

- [x] Record capture details + manual QA evidence in `verification.md`.
- [x] Share file paths + context in final response for stakeholder review.

## Notes

- Assumptions: homepage components satisfy the "available components" request unless clarified otherwise.
- Deviations: Port 3000 lock forced reuse of existing `next dev` instance rather than starting a new server.
