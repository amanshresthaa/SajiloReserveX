# Implementation Checklist

## Setup

- [ ] Confirm `.env.local` ready and `pnpm install` already satisfied.
- [ ] Start Next dev server (`pnpm dev`) and keep running.
- [ ] Gather required session token(s) for guarded routes.

## Core

- [ ] Generate ordered list of routes from `route-map.json`.
- [ ] For each public route, capture screenshot via Playwright MCP.
- [ ] For each guarded route, inject token + capture screenshot.
- [ ] Save outputs under `screenshots/sessions/capture-site-screenshots-20251109-2338/`.

## UI/UX

- [ ] Wait for steady state before capturing (no skeletons in frame).
- [ ] Confirm responsive layout by spot-checking mobile vs desktop (if required by stakeholders).
- [ ] Ensure pages with dynamic data (booking/reserve) show representative content.

## Tests

- [ ] Manual review of exported PNGs.

## Notes

- Assumptions: All required data seeded locally; authentication tokens provided by requestor.
- Deviations: _tbd_

## Batched Questions

- Provide the session cookie(s) needed to access `/my-bookings`, `/ops`, `/checkout`, `/create`, and other guarded flows?
