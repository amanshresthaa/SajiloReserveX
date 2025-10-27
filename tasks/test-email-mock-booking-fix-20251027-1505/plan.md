# Implementation Plan: Test Email Mock Booking Fix

## Objective

We will restore the `pnpm run build` pipeline by aligning the test email mock booking object with the Supabase-generated `BookingRecord` shape so that the build can succeed.

## Success Criteria

- [ ] `pnpm run build` completes without TypeScript errors.
- [ ] Source change limited to mock data; no runtime regression in email sending logic.

## Architecture & Components

- `src/app/api/test-email/route.ts`: ensure the mock `BookingRecord` includes mandatory fields defined by Supabase (`table_id` in this case).

## Data Flow & API Contracts

Endpoint: `POST /api/test-email`
Request: `{ type: "simple" | "booking"; email: string; restaurantId?: string }`
Response: `{ success: boolean; message: string; bookingReference?: string; restaurantId?: string }`
Errors: `{ error: string; details?: string }`

## UI/UX States

- Loading: N/A (API route).
- Empty: N/A.
- Error: Build errors prevented deployment—resolved via type fix.
- Success: Build passes, API route unchanged functionally.

## Edge Cases

- Supabase schema changes may add more required fields; ensure mock stays updated with row definition.

## Testing Strategy

- Unit: N/A.
- Integration: Rely on existing tests.
- E2E: N/A.
- Accessibility: N/A.
- Manual: Re-run `pnpm run build` to confirm type checking passes.

## Rollout

- Feature flag: N/A.
- Exposure: N/A.
- Monitoring: N/A.
