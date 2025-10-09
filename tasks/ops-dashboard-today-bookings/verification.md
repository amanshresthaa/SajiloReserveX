# Verification Report

## Manual QA

- [ ] Visit `/ops` as an owner/manager; confirm summary renders for primary restaurant.
- [ ] Validate counts vs Supabase data (pending/confirmed/cancelled totals, cover sum).
- [ ] Ensure schedule list sorted by start time and status badge colors align with expectations.
- [ ] Confirm empty states (no bookings, no membership) display appropriate guidance.

## Automation & Tooling

- [x] `pnpm lint`
- [ ] `pnpm typecheck` _(fails due to pre-existing issues in `reserve` tests; unchanged by this feature)_
- [ ] Add integration tests when Playwright scenarios for `/ops` exist.
