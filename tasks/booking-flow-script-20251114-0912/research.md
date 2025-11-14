---
task: booking-flow-script
timestamp_utc: 2025-11-14T09:12:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Research: Booking Flow Orchestrator Script

## Requirements

- Functional:
  - Trigger `POST /api/bookings` with a fully valid payload (restaurant id/slug, date, time, booking type, seating, party, notes optional, customer contact, marketing opt-in) per `bookingSchema` in `src/app/api/bookings/route.ts` (lines ~60-130, 496) to create bookings.
  - Observe the booking end-to-end through capacity creation, inline assignment (`quoteTablesForBooking` + `atomicConfirmAndTransition` inside POST) and, if necessary, background job (`autoAssignAndConfirmIfPossible`) invoking Assignment Coordinator V3 / legacy pipeline.
  - Poll booking + assignments (status must become `confirmed` and table assignments exist in `booking_table_assignments`) via service Supabase client or public API equivalent.
  - Provide structured, JSON logging with phases (`submit`, `inline_poll`, `background_job`, `final_summary`, `error`). Optional `--pretty` flag.
  - Accept CLI overrides (`--date`, `--time`, `--party-size`, `--booking-type`, `--seating`, `--restaurant-slug/id`). Default to demo restaurant slug `demo-restaurant` (ID `8dcb19c3-d767-4993-9b91-4655a4d95921`).
  - Support environment variable `BOOKING_API_BASE_URL` default `http://localhost:3000`.
  - Ensure script exits non-zero if booking fails to reach confirmed state within ~60-90 seconds.
- Non-functional:
  - Logging must capture correlationId, bookingId (once known), HTTP metrics, durations, and meta details. Provide `phase_started`/`phase_completed` entries.
  - Must be TypeScript (ts-node/tsx runnable) without modifying existing API/server logic.
  - Comply with AGENTS SDLC (task artifacts, structured plan, documentation). No secrets in logs.
  - Externally triggered job invocation should be safe/idempotent; script should degrade gracefully if background job disabled.

## Existing Patterns & Reuse

- API contract defined in `src/app/api/bookings/route.ts` (bookingSchema + POST handler). We'll reuse enumerations from `@/lib/enums` via `BOOKING_TYPES_UI`, `SEATING_PREFERENCES_UI` or rely on raw strings.
- Demo restaurant metadata available in `DEMO_RESTAURANT_QUICK_REF.md` (slug/id) — ensures bookings succeed under seeded environment.
- Background auto assignment entry point `autoAssignAndConfirmIfPossible` in `server/jobs/auto-assign.ts` — script can import and call directly, matching existing job runner scripts (e.g., `scripts/jobs/run-hold-sweeper.ts`). We'll adopt same `tsx -r tsconfig-paths/register` pattern for path resolution.
- Supabase service client helper `getServiceSupabaseClient` (server/supabase) returns privileged client for direct DB queries; use to poll bookings & assignments similar to server jobs.
- Logging style inspiration from `server/jobs/auto-assign.ts` (structured stage logs). We'll design our own JSON logger since requirement is more opinionated.

## External Resources

- `DEMO_RESTAURANT_QUICK_REF.md` — ensures we use valid restaurant slug/ID.
- route docs (`ROUTE_QUICK_REFERENCE.md`, `COMPREHENSIVE_ROUTE_ANALYSIS.md`) to confirm API path, though `route.ts` is source of truth.

## Constraints & Risks

- GET `/api/bookings/[id]` requires authenticated Supabase session → not viable for script polling; must rely on service-level Supabase client (requires env credentials). Risk: env missing `SUPABASE_SERVICE_ROLE_KEY` leads to failure; script should fail-fast with clear error.
- Inline assignment may be disabled via feature flags; script must detect absence and fallback to `autoAssignAndConfirmIfPossible`. Must monitor statuses `pending`, `pending_allocation`, `confirmed` per `BOOKING_BLOCKING_STATUSES` (server/bookings).
- Booking creation requires valid date/time per restaurant schedule. Need to ensure default date/time falls within open hours: e.g., choose tomorrow 19:00 local/timezone (restaurant uses schedule timezone). We'll default to next day at 19:00 local to avoid past-time rejections.
- Rate limiting (60/min per IP) exists; repeated script runs might hit limit. Should log 429 and exit gracefully.
- Job invocation may send emails (Resend). Must document expectation (developers should set `SUPPRESS_EMAILS=true` if needed). We'll avoid modifying email triggers but warn in docs.
- Table assignments may take >30s; script must maintain overall timeout (≥60s) yet avoid infinite loop. We'll implement two-phase polling (pre-job & post-job) with overall 90s max.
- Need to avoid logging PII beyond necessary (customer email is provided but acceptable since test email). We'll mask phone partially in logs.

## Open Questions (owner, due)

- Q: Is there an existing public endpoint to fetch a booking without auth tokens? (owner: agent, due: before implementation). Investigation suggests no; fallback to service client.
- Q: Should script clean up previous test bookings for the email? Not strictly required; rely on new date/time to avoid duplication. Document assumption.
- Q: Are there other restaurants/feature flags required? assume demo restaurant is default accessible. If not, developer must override env/flags manually.

## Recommended Direction (with rationale)

- Build single `scripts/run-booking-flow.ts` executed via `tsx -r tsconfig-paths/register`. This allows importing server modules/feature flags as needed.
- Use `luxon` for default scheduling to ensure proper ISO formatting; allow CLI overrides via minimal parser (e.g., `yargs` or manual). Avoid bringing heavy dependencies; simple custom parser + `process.argv` is enough.
- HTTP interactions via native `fetch` (Node 20). Wrap in helper capturing timing/responses.
- Poll booking by calling helper `loadBookingStatus` that uses service Supabase client to fetch booking row + `booking_table_assignments` join (maybe `eq` + `select`). Provide summary struct with status, assignments (table_id, zone_id, table_number). Reuse existing DB functions if available; otherwise query directly (since script is part of repo, direct query acceptable).
- Logging: build small `Logger` with JSON output by default, `--pretty` toggles to human-friendly text. Provide `withMeta` helper.
- Flow: (1) log phase start, (2) submit booking, (3) poll inline up to e.g., 20 seconds, (4) if not confirmed -> log and call `autoAssignAndConfirmIfPossible`, (5) poll for up to 60 seconds more, (6) log final summary or error.
- Document usage in final response + add `pnpm run run:booking-flow` script entry for discoverability.
