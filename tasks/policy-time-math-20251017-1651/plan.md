# Implementation Plan: Policy & Time Math (TZ-aware, buffers, service windows)

## Objective

Deliver a timezone-aware seating-policy layer so the capacity engine derives compliant dining/buffer intervals per service, preventing bookings that overrun service close and enforcing the mandated 15 minute clean-down window.

## Success Criteria

- [ ] `whichService(DateTime.fromISO("2025-05-10T20:30:00Z").setZone("Europe/London"))` resolves to `dinner`, and `bandDuration("dinner", 8)` returns 150.
- [ ] `computeBookingWindow({ startISO: "2025-05-10T20:00:00+01:00", partySize: 8 })` throws a policy error because the computed dining end would exceed 22:00.
- [ ] With a noon seating producing a dining window `[12:00,13:30)` and a 15 m post-buffer, `windowsOverlap` flags a conflict for a second request at 13:30 (blocked interval extends to 13:45).

## Architecture & Components

- **server/capacity/policy.ts (new)**  
  Define `VenuePolicy`, `ServiceDefinition`, `TurnBand`, `BufferConfig`, and export:
  - `defaultVenuePolicy` (initially Europe/London).
  - `getVenuePolicy(restaurantId?)` placeholder helper for future overrides.
  - `whichService(DateTime, policy)`, `serviceEnd(serviceKey, DateTime, policy)`, `bandDuration(serviceKey, partySize, policy)`, `getTurnBand`.
    The module owns Luxon imports and isolates all policy math.

- **server/capacity/tables.ts (existing)**
  - Remove `parseTimeToMinutes`/`DEFAULT_BOOKING_DURATION_MINUTES`.
  - Refactor `BookingWindow` to shape `{ dining: IntervalMs; block: IntervalMs; service: ServiceKey; durationMinutes: number }` where `IntervalMs` stores `{ start: number; end: number }` using epoch milliseconds.
  - Update `computeBookingWindow` signature to accept `{ startISO, partySize, policy? }`, use Luxon + policy helpers, and throw descriptive errors (`ServiceOverrunError`).
  - Modify `windowsOverlap` to operate on half-open intervals with millisecond precision.
  - Adjust schedule building (`TableScheduleEntry`) and sort logic to consume `startISO`.

- **server/capacity/index.ts**  
  Re-export policy helpers if they are needed externally (evaluate during coding; keep internal if not).

- **Types & Utilities**  
  Extend `BookingRecordForAssignment` to include `start_at`/`booking_date` (needed for Luxon). Introduce lightweight error classes for policy violations to keep skip reasons clear.

- **Dependencies**  
  Add `luxon` to `package.json`/`pnpm-lock.yaml`; ensure no conflicting date libs remain.

## Data Flow & API Contracts

- `computeBookingWindow({ startISO, partySize, policy })`
  1. Parse start ISO using `DateTime.fromISO(startISO, { zone: policy.timezone, setZone: true })`.
  2. Resolve service via `whichService`.
  3. Lookup duration using `bandDuration`.
  4. Compute `diningEnd = start.plus({ minutes: duration })`.
  5. Clamp: if `diningEnd > serviceEnd`, throw `ServiceOverrunError`.
  6. Build `block` interval with buffer: `blockStart = diningStart.minus({ minutes: buffer.pre })`, `blockEnd = diningEnd.plus({ minutes: buffer.post })`; also ensure `blockEnd` ≤ `serviceEnd`.
  7. Return object containing both intervals (DateTimes) plus raw millisecond numbers for scheduling.

- `windowsOverlap(a, b)`  
  Accepts `{ start: number; end: number }` and returns `true` when the half-open intervals intersect (`a.start < b.end && b.start < a.end`). Use block intervals for comparisons.

- Booking context loader (`loadAssignmentContext`)
  - Supabase query selects `start_at`, `end_at`, `booking_date`.
  - When `start_at` missing, fallback to `booking_date + start_time` (explicit branch).
  - Pass `startISO` to `computeBookingWindow`; persist returned block interval into `TableScheduleEntry`.

- Assignment flow
  - `tableWindowIsFree` uses block intervals for conflicts.
  - `assignTablesForBooking` surfaces policy error messages (`reason`) so ops can see when a booking exceeds service limits.

## UI/UX States

No UI directly changes. API-layer errors should remain user-friendly; ensure any new error message is routed through existing skip reporting.

## Edge Cases

- **DST transitions**: Validate bookings on 2025-03-30 (spring forward) and 2025-10-26 (fall back) with Luxon to guarantee duration math remains accurate.
- **Boundary start times**: Bookings exactly at service start allowed; at service end rejected; outside any service returns descriptive error.
- **Oversized parties**: When party size exceeds highest band, use max duration and log/warn for ops follow-up.
- **Missing data**: If a booking lacks `start_at` and `start_time`, skip with explicit reason rather than generating a zero-length window.
- **Cross-day**: Support bookings that end after midnight by relying on absolute DateTimes instead of minutes-from-midnight.

## Testing Strategy

- **Unit (new)**
  - `server/capacity/__tests__/policy.test.ts`: service detection, duration lookup, buffer handling, DST safety.
  - `server/capacity/__tests__/tables.computeWindow.test.ts`: acceptance cases (dinner overrun, buffer conflict, half-open intervals).

- **Unit (existing updates)**
  - Extend `tests/server/capacity/autoAssignTables.test.ts` to assert buffer enforcement and policy-based refusals (e.g., 20:00 party=8 skip).

- **Integration**
  - If necessary, add a regression test around `autoAssignTablesForDate` to confirm schedule loading respects `startISO`.

- **No UI/E2E/A11y** impact.

## Rollout

- No feature flag; ship once tests pass.
- Document behaviour in `verification.md` (manual QA slots to re-check midday + evening operations).
- Monitor booking skip reasons post-deploy to ensure new overrun errors align with expectations; raise follow-up task if volumes spike.
