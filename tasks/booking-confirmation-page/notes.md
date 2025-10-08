# Notes & Risks — Booking Confirmation Page

## Verification Summary

- `pnpm vitest run tests/features/reservation-detail.analytics.test.tsx --config reserve/vitest.config.ts` ✅
- `pnpm test:e2e -- tests/e2e/reservations/reservation-detail.spec.ts` ⚠️ blocked — browsers not installed (`pnpm exec playwright install`) and local API server (`http://localhost:3000`) unavailable during global setup.

## Residual Risks

- JSON-LD schema currently limited to `Reservation`/`FoodEstablishment`; consider extending with `underName`, `provider`, `startTime` timezone nuance for richer SEO.
- Playwright coverage requires seeded session + installed browsers; manual rerun recommended after provisioning (`pnpm exec playwright install && pnpm dev` or equivalent).
- Clipboard fallback in headless browsers relies on stubbed `navigator.clipboard`; if production runtime revokes clipboard permission, share message downgrades to text output—acceptable but worth monitoring.
- Offline analytics payload uses `Date.now()` delta without clocks skew guard; double-check downstream analytics pipeline tolerates undefined `wasOnlineForMs`.
