# Verification Report

## Manual QA

- Not applicable – change limited to backend flows and emails.

## Automated Tests

- `pnpm lint`
- `pnpm vitest run src/app/api/bookings/[id]/route.test.ts src/app/api/ops/bookings/[id]/route.test.ts tests/server/bookings/modification-flow.test.ts`
