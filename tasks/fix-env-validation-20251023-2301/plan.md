# Implementation Plan: Fix Env Validation

## Objective

Ensure the My Bookings dashboard renders without crashing by sourcing the `editScheduleParity` flag on the server and passing it to client components safely.

## Success Criteria

- [ ] Navigating to `/my-bookings` no longer throws the environment validation error.
- [ ] `EditBookingDialog` still respects the `FEATURE_EDIT_SCHEDULE_PARITY` flag when deciding which picker UI to show.

## Architecture & Components

- `src/app/(authed)/my-bookings/page.tsx`: resolve `env.featureFlags.editScheduleParity` server-side and pass it to the client module.
- `src/app/(authed)/my-bookings/MyBookingsClient.tsx`: accept `scheduleParityEnabled` prop and forward it to dialog components.
- `components/dashboard/EditBookingDialog.tsx`: read the boolean prop instead of importing `lib/env`.

## Data Flow & API Contracts

- Flag value flows: Server env → page component → client component → dialog. No external API contracts affected.

## UI/UX States

- Loading/empty/error/success states remain unchanged; only the internal feature toggle source changes.

## Edge Cases

- When the flag is undefined server-side, default to `false` so the dialog falls back to the existing schedule picker behaviour.

## Testing Strategy

- Manual: load `/my-bookings` in dev and verify the dialog opens without errors.
- Script: `pnpm validate:env` (already green) ensures env parsing still works after refactor.

## Rollout

- Feature flag: existing `FEATURE_EDIT_SCHEDULE_PARITY`.
- Exposure: immediate once deployed (pure refactor).
- Monitoring: watch for client console errors related to env parsing.
