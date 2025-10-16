# Implementation Plan: Fix Test Email Booking Record

## Objective

We will enable the build to succeed by aligning the mock booking record used by the test email route with the current BookingRecord type so that TypeScript validation passes.

## Success Criteria

- [ ] `pnpm run build` completes without type errors.
- [ ] Mock booking data for the test email route remains representative of real booking records.

## Architecture & Components

- `src/app/api/test-email/route.ts`: ensure mock booking object satisfies `BookingRecord`.
  State: static mock data used only for email preview route | Routing/URL state: n/a

## Data Flow & API Contracts

Endpoint: GET /api/test-email
Request: {}
Response: HTML email preview payload
Errors: { status, message }

## UI/UX States

- Loading: n/a
- Empty: n/a
- Error: return JSON error response
- Success: returns rendered email

## Edge Cases

- Booking type variants other than `dinner` should be representable.
- Optional token fields may be null in production records.

## Testing Strategy

- Unit: rely on TypeScript compile-time checks.
- Integration: `pnpm run build`.
- E2E: n/a.
- Accessibility: n/a.

## Rollout

- Feature flag: n/a
- Exposure: immediate
- Monitoring: none required
