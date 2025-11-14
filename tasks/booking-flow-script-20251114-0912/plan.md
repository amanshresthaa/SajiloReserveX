---
task: booking-flow-script
timestamp_utc: 2025-11-14T09:12:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Implementation Plan: Booking Flow Script

## Objective

We will provide a TypeScript CLI (`scripts/run-booking-flow.ts`) that drives a single booking from public API submission all the way to confirmed table assignments, emitting structured telemetry so engineers can validate the entire booking+assignment stack quickly.

## Success Criteria

- [ ] Booking payload hits `POST /api/bookings` with schema-compliant body for demo restaurant, using `TEST_CUSTOMER_EMAIL`.
- [ ] Script detects inline assignment success within 20–30s or triggers background job when needed.
- [ ] Booking eventually reaches `status === "confirmed"` with ≥1 table assignments; summary printed.
- [ ] Logs include JSON objects with timestamp, level, phase, correlationId, bookingId, durations, HTTP metadata; `--pretty` renders readable text.
- [ ] Script surfaces failures with non-zero exit and actionable error messages.

## Architecture & Components

- **CLI argument parser**: lightweight manual parser reading `process.argv` for `--date`, `--time`, `--party-size`, `--booking-type`, `--seating`, `--restaurant-id`, `--restaurant-slug`, `--pretty`, `--timeout`.
- **Config**: base URL from `BOOKING_API_BASE_URL` env (default `http://localhost:3000`). Validate.
- **Logger utility**: `createLogger({ pretty })` returning `log(level, phase, message, meta)`; includes correlationId (uuid) and optional bookingId.
- **HTTP client helper**: wraps `fetch` with timeout + metrics logging (method, url, status, duration, requestId).
- **Booking request builder**: builds payload from defaults (tomorrow 19:00, dinner, seating `any`, party 2) plus CLI overrides. Name/phone static but realistic.
- **Inline polling loop**: `pollBooking({ phase, timeoutMs })` using Supabase service client to query `bookings` and `booking_table_assignments`. Poll every ~2s, track durations.
- **Background job path**: import `autoAssignAndConfirmIfPossible` from `@/server/jobs/auto-assign`; call once with `bypassFeatureFlag: true` to guarantee attempt (safe because job already supports bypass). Log start/end/duration.
- **Final summary**: gather booking + assignments (table_id, zone_id, table_number, capacity). Format friendly table.

## Data Flow & API Contracts

- HTTP `POST ${baseUrl}/api/bookings` body per `bookingSchema`:
  ```json
  {
    "restaurantSlug": "demo-restaurant",
    "date": "YYYY-MM-DD",
    "time": "HH:MM",
    "party": <number>,
    "bookingType": "dinner"|"lunch"|"drinks",
    "seating": "any"|"indoor"|"outdoor",
    "notes": null,
    "name": "Test Booker",
    "email": "amanshresthaaaaa@gmail.com",
    "phone": "+441234567890",
    "marketingOptIn": false
  }
  ```
- Polling query: `supabase.from("bookings").select("id,status,restaurant_id,booking_date,start_time,end_time,party_size,booking_type,seating_preference,reference,customer_name,customer_email")` + `booking_table_assignments` join via `.from("booking_table_assignments").select("table_id,table_inventory!inner(table_number,zone_id,capacity),zone_id")`.
- Background job invocation: `await autoAssignAndConfirmIfPossible(bookingId, { bypassFeatureFlag: true, reason: "creation", emailVariant: "standard" });` (options optional but set to bypass feature flag to guarantee run).

## UI/UX States

Not applicable (CLI). Provide CLI output states: `submit` (request+response), `inline_poll` (attempted / success), `background_job`, `final_summary`, `error`.

## Edge Cases

- HTTP failure / 4xx (log and exit).
- Booking stuck pending_allocation beyond timeout: log timed-out error.
- Supabase env missing service role: detect on first poll and fail with instructions.
- Rate limit hit: show 429 details and exit.
- Background job throws: log error + continue polling until timeout, but exit with failure if still unconfirmed.

## Testing Strategy

- Manual CLI dry-run against local dev server to ensure booking completes.
- Type safety: rely on TypeScript compilation via `tsx`.
- Potential follow-ups: add unit tests (not in scope) – manual verification acceptable.

## Rollout

- Add npm script `
