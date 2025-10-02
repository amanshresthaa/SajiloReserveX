# Implementation TODO

- [x] Add test API guard helper (`server/test-api.ts`).
- [x] Implement `/api/test/playwright-session` for seeding auth + cookies.
- [x] Add `/api/test/leads` cleanup endpoint.
- [x] Add `/api/test/bookings` seed endpoint and `/api/test/reservations/[reservationId]/confirmation` download endpoint.
- [x] Update `ReservationDetailClient` to expose download button behind test flag.
- [x] Create pricing page for checkout coverage.
- [x] Extend Stripe library to support mock mode.
- [x] Update Playwright global setup to auto-bootstrap storage state.
- [x] Revise E2E specs: payments (no route mocking), lead API (no skip), replace download spec, remove websocket placeholder.
- [x] Update Playwright docs for new env toggles and cleanup instructions.
- [x] Run `pnpm playwright test --list` to validate discovery.
