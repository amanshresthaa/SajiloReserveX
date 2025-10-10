# Verification Report

## Automated Tests

- [x] `pnpm vitest run reserve/features/reservations/wizard/model/__tests__/transformers.test.ts reserve/features/reservations/wizard/model/__tests__/schemas.test.ts app/api/ops/bookings/route.test.ts`

## Manual QA

- [ ] Create ops walk-in booking with email omitted; verify dashboard badge and absence of confirmation email
- [ ] Create ops walk-in booking with email provided; confirm email delivered and dashboard badge present

## Notes

- Ops API unit tests stub schema parse to bypass NextRequest streaming in Vitest.
