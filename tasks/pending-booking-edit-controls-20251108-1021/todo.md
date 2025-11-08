# Implementation Checklist

## Config & Utilities

- [x] Add `NEXT_PUBLIC_BOOKING_PENDING_GRACE_MINUTES` to env schema and expose via `env.featureFlags`.
- [x] Create shared pending-lock helper for client usage.

## API Enforcement

- [x] Gate `/api/bookings/[id]` PUT/DELETE when pending lock expires.
- [x] Return deterministic `PENDING_LOCKED` errors and document copy in dialogs.
- [x] Extend Vitest suite for pending-lock PUT/DELETE scenarios.

## UI/UX

- [x] Disable edit/cancel actions when lock is active and show explanatory alert.
- [x] Add support CTA + mailto helper for locked guests.
- [x] Wire new error copy into dialogs/hooks.

## Verification

- [ ] `pnpm lint`
- [ ] `pnpm vitest run src/app/api/bookings/[id]/route.test.ts`
- [ ] Manual Chrome DevTools QA on reservation detail (pending locked vs unlocked).
