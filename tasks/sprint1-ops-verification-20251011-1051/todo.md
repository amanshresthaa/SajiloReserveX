# Implementation Checklist

## Setup & Infrastructure

- [x] Audit existing test helpers (`tests/helpers`, `tests/fixtures`) and identify reusable factories for Ops scenarios.
- [x] Create Supabase client mocks/factories for unit tests (auth, bookings, customers).
- [x] Ensure queue toggles and env stubs allow deterministic side-effect testing.

## Unit Test Coverage

- [x] Add auth & membership unit tests (requireMembershipForRestaurant, role matrix).
- [x] Extend dashboard summary tests (totals, heatmap range, date fallback).
- [x] Add bookings helper tests (time utilities, audit snapshot diffing).
- [x] Add bookings API tests (walk-in validations, idempotency, audit logging).
- [x] Add customer list/export unit tests (aggregates, CSV golden file).
- [x] Add side-effect + email template tests (confirmation/update/cancellation).

## Playwright Ops Suite

- [x] Implement login/session helper for Ops staff.
- [x] Add auth redirect and logout scenarios (V-AUTH-01/V-AUTH-04).
- [x] Script dashboard/date navigation tests (V-DASH-01..03, V-NAV-01).
- [ ] Cover bookings CRUD e2e chain (create → filter → update → status → cancel).
- [ ] Automate customer export download validation.

## Verification & Documentation

- [ ] Run `pnpm test` and `pnpm test:e2e` locally; resolve failures/flakes.
- [ ] Perform manual QA in Chrome DevTools (accessibility, performance, responsive states).
- [ ] Summarize outcomes, coverage metrics, and risks in `verification.md`.

## Questions / Blockers

- [ ] Confirm availability of Ops test user seed or create new fixtures.
- [ ] Determine approach for validating outbound emails within Playwright (mock inbox vs job spy).
