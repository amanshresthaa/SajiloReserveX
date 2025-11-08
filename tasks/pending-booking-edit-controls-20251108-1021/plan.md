# Implementation Plan: Pending Booking Edit Controls

## Objective

Lock guest self-serve editing/cancellation for `pending` bookings once a configurable grace window expires, while providing a documented support path and enforcing the rule server-side.

## Success Criteria

- [ ] Configurable `pending` grace minutes exposed via env + defaults to 10 without extra setup.
- [ ] `/api/bookings/[id]` PUT/DELETE reject locked pending bookings with a deterministic error code.
- [ ] Reservation detail UI disables Edit/Cancel when locked, displays guidance, and offers a support CTA.
- [ ] Dialog hooks surface a friendly error message when the server reports the new code.
- [ ] Lint/tests pass; manual UI QA confirms a11y (buttons disabled, alert announced, support link focusable).

## Architecture & Components

- **Config/env**: extend `config/env.schema.ts` and `lib/env.ts` with `NEXT_PUBLIC_BOOKING_PENDING_GRACE_MINUTES` → `env.featureFlags.pendingSelfServeGraceMinutes` (clamped 0–60, default 10). Also expose a lightweight helper for client usage (e.g., `lib/bookings/pendingLock.ts`) that simply reads `Number(process.env.NEXT_PUBLIC_BOOKING_PENDING_GRACE_MINUTES ?? 10)` so client bundles avoid importing the heavy env parser.
- **Server helper**: add `isPendingSelfServeLocked(booking, now = new Date())` near `/api/bookings/[id]/route.ts` (or shared util) that checks status + created_at against grace. Respond with `{ error: 'Pending bookings are locked...', code: 'PENDING_LOCKED' }` and HTTP 403. Reuse in both dashboard + legacy PUT branches and DELETE.
- **Client logic** (`ReservationDetailClient`):
  - Compute `pendingLocked` via `useMemo` using reservation fields + client helper.
  - Update `actionDisabled` to include `(pendingLocked || reservation.status === 'cancelled')`.
  - Prevent `handleEdit`/`handleCancel` from opening dialogs when locked.
  - Show an `Alert` explaining the lock (aria-live polite) with copy referencing host review timeline + instructions.
  - Add a `Button` (or `Link`) to "Request change" which uses `mailto:config.email.supportEmail?...` (prefill with reservation info). Keep accessible text, open in new tab if necessary.
- **Dialogs/hooks**: update `errorCopy` maps in `EditBookingDialog` + `CancelBookingDialog` to include `PENDING_LOCKED` friendly message.

## Data Flow & API Contracts

- **Env**: `NEXT_PUBLIC_BOOKING_PENDING_GRACE_MINUTES` (string) parsed into number on both server & client.
- **API** (`/api/bookings/[id]`):
  - **Error**: `code: 'PENDING_LOCKED'`, `status: 403`, `message`: "This reservation can't be changed while the restaurant is reviewing it.".
  - **Trigger**: request method PUT/DELETE, booking status `pending`, `created_at` older than configured minutes by server clock.

## UI/UX States

- Loading skeleton unaffected.
- When locked: display inline warning alert above card (copies referencing timeline), Edit/Cancel buttons disabled, new support button enabled (outlined or ghost variant) with tooltip? (optional) and accessible label.
- When not locked: current layout remains unchanged.

## Edge Cases

- Missing/invalid `createdAt`: treat as locked and still display alert (copy can mention "we're reviewing" instead of time delta).
- `reservation.status !== 'pending'`: skip lock logic.
- `pending` but created < grace: keep actions enabled; no alert.
- Support email missing: fall back to `mailto:support@example.com` via config default.

## Testing Strategy

- **Unit**: add tests for helper that determines lock status (if helper lives in standalone module). At minimum, add coverage around new util to avoid regressions.
- **API**: extend `/api/bookings/[id]/route.test.ts` to cover PUT/DELETE returning 403 for locked pending bookings.
- **UI/manual**: run `pnpm lint` & targeted tests; use Chrome DevTools MCP to verify: buttons disabled after manually forcing `createdAt` older (mock data or story), alert semantics, support link accessible.

## Rollout

- No new flags; behavior controlled by env knob. Default lock (10 min) is safe to ship behind config.
- Document new env var in README/CONFIG docs if required.
- Monitor API logs for `PENDING_LOCKED` spikes to validate assumption; adjust env if necessary.
