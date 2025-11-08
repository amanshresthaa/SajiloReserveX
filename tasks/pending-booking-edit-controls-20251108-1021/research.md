# Research: Pending Booking Edit Controls

## Requirements

- Functional:
  - Guests should only be able to edit or cancel a reservation while it is `pending` within a short self-serve grace window after creation; after that window they must route through support.
  - Once a reservation moves out of `pending`, existing edit/cancel controls must keep working (confirmed, etc.).
  - After the grace window expires (and while status remains pending) the UI must communicate why actions are blocked and surface a "request change" or support path.
  - API enforcement must mirror the UI so requests that bypass the UI are rejected with a clear, typed error.
- Non-functional / constraints:
  - Follow AGENTS SDLC (task artifacts, plan before code, manual DevTools QA for UI surface).
  - No local Supabase migrations; only remote databases via MCP (not needed here but constraint noted).
  - Accessibility: disabled actions need context + keyboard-accessible fallback (e.g., support link button).
  - Config should be tunable; default grace window should be reasonable without redeploy (ideally via env).

## Existing Patterns & Reuse

- `src/app/reserve/[reservationId]/ReservationDetailClient.tsx` renders the guest dashboard with Edit/Cancel buttons. `actionDisabled` currently only checks `reservation?.status === 'cancelled'`, so pending bookings remain fully editable. Buttons rely on shared `Button` component plus `CancelBookingDialog` & `EditBookingDialog` from `components/dashboard`.
- `CancelBookingDialog` (`components/dashboard/CancelBookingDialog.tsx`) and `EditBookingDialog` (`components/dashboard/EditBookingDialog.tsx`) call `/api/bookings/[id]` via `useCancelBooking` / `useUpdateBooking`. Neither hook knows about pending locks, so the dialog always submits.
- `/api/bookings/[id]` (`src/app/api/bookings/[id]/route.ts`) handles guest GET/PUT/DELETE. The PUT path first tries the "dashboard" schema (same payload as `EditBookingDialog`) via `processDashboardUpdate`. Regardless of branch, the route only validates session + ownership; there is no status-based restriction.
- Reservation payloads already expose `status` and `createdAt` via `reservationAdapter` (`reserve/entities/reservation/adapter.ts`), so the UI has the inputs required to compute a grace period.
- Config/env infrastructure (`config/env.schema.ts`, `lib/env.ts`) already models many booking knobs (e.g., `BOOKING_PAST_TIME_GRACE_MINUTES`), so adding a similar knob keeps things consistent.

## External Resources

- None needed; behavior is internal to this app and API.

## Constraints & Risks

- `createdAt` may be missing/null for some imported records; we need a safe fallback (treat as expired) to avoid letting old bookings slip through.
- Client-side time comparisons rely on the user's clock; server enforcement must remain the source of truth to avoid tampering.
- Need to make sure staff/admin flows under `/api/ops` stay unaffected (changes must be scoped to `/api/bookings`).
- Introducing a new env var requires updating schema + docs; missing values must not break prod (default fallback required).

## Open Questions

- Exact grace window length? The earlier discussion suggested "5–10 minutes". Without additional guidance, we will default to 10 minutes and make it env-configurable (`NEXT_PUBLIC_BOOKING_PENDING_GRACE_MINUTES`).
- What support path should be offered after lock? Assumption: mailto link to `config.email.supportEmail` with helpful subject/body. If a richer workflow exists later we can plug it in.

## Recommended Direction

1. **Config knob**: add `NEXT_PUBLIC_BOOKING_PENDING_GRACE_MINUTES` (0–60) to `config/env.schema.ts` and surface it through `env.featureFlags.pendingSelfServeGraceMinutes` (default 10). Reuse the same value on both server and client to keep behavior aligned.
2. **Server guard**: in `/api/bookings/[id]/route.ts`, introduce a helper that returns `true` when a booking is `pending` and `created_at` is older than the configured grace window. Call it before handling PUT/DELETE (both dashboard + legacy branches) and return a 403 with a deterministic code such as `PENDING_LOCKED` plus a helpful error. This prevents API misuse regardless of UI.
3. **UI logic**: in `ReservationDetailClient`, compute `isPendingLocked` using `reservation.status`, `reservation.createdAt`, and the same grace minutes. Disable Edit/Cancel buttons when locked, show an explanatory `Alert`, and add a "Request change" button that opens a support email (includes reservation ID/reference).
4. **Dialog safety**: guard the `handleEdit`/`handleCancel` callbacks so they early-return when locked (prevents dialogs from opening via keyboard even if button disabled for some reason).
5. **Hooks messaging**: optionally map the new `PENDING_LOCKED` code in dialog error copy so the toast copies match the blocking reason.
6. **Verification**: add unit coverage for the helper (if practical) and run lint/tests; perform manual DevTools QA on reservation detail page (focus, disabled state, support link, etc.).
