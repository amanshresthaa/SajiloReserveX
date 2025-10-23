# SajiloReserveX Booking Flow QA Test Plan

## Table of Contents

- [Section 1: System Overview](#section-1-system-overview)
- [Section 2: Test Environment Setup](#section-2-test-environment-setup)
- [Section 3: CREATE Operation Tests](#section-3-create-operation-tests)
- [Section 4: READ Operation Tests](#section-4-read-operation-tests)
- [Section 5: UPDATE Operation Tests](#section-5-update-operation-tests)
- [Section 6: DELETE Operation Tests](#section-6-delete-operation-tests)
- [Section 7: Integration Tests](#section-7-integration-tests)
- [Section 8: Security Tests](#section-8-security-tests)
- [Section 9: Performance Tests](#section-9-performance-tests)
- [Section 10: Cross-Cutting Concerns](#section-10-cross-cutting-concerns)
- [Section 11: API Test Cases](#section-11-api-test-cases)
- [Section 12: Automation Recommendations](#section-12-automation-recommendations)
- [Section 13: Test Data Requirements](#section-13-test-data-requirements)
- [Section 14: Regression Test Suite](#section-14-regression-test-suite)
- [Section 15: Known Issues & Limitations](#section-15-known-issues--limitations)

---

## Section 1: System Overview

**Estimated execution time:** 20m

- Architecture spans Next.js 15 App Router UI (`src/app`), a dedicated React/Vite booking wizard (`reserve/features/reservations/wizard`), and Supabase Postgres via server utilities in `server/`.
- Tech stack: React 19 + Tailwind + React Hook Form, Next route handlers (`src/app/api/bookings/route.ts`, `src/app/api/bookings/[id]/route.ts`, `src/app/api/availability/route.ts`), Supabase client (`server/supabase.ts`), Redis rate limiting (`server/security/rate-limit.ts`), Resend emails (`libs/resend.ts`).
- Key booking features: multi-step wizard (Plan → Details → Review → Confirmation), live availability (`checkSlotAvailability` in `server/capacity/service.ts`), loyalty awards (`server/loyalty.ts`), confirmation token issuance (`server/bookings/confirmation-token.ts`), analytics + observability events (`server/analytics.ts`, `server/observability.ts`).
- Core data entities (`types/supabase.ts`): `bookings`, `waiting_list`, `booking_table_assignments`, `analytics_events`, `observability_events`, customer profiles; enums defined in `lib/enums.ts`.
- External integrations: Resend (transactional email), Upstash Redis (rate limit), Supabase remote DB (migrations in `supabase/migrations`), optional web share / calendar downloads (`lib/reservations/share.ts`).

## Section 2: Test Environment Setup

**Estimated execution time:** 25m

- Prerequisites: Node >= 20.11, PNPM >= 9, Supabase service role key and anon key, Upstash Redis REST credentials, Resend API key/from address, feature flags in `.env.local` aligned with test scenario (e.g., `BOOKING_VALIDATION_UNIFIED`, `BOOKING_PAST_TIME_BLOCKING`).
- Commands: `pnpm install`, `pnpm dev` (Next), `pnpm reserve:dev` (wizard preview), `pnpm test` (Vitest for booking services), `pnpm test:e2e` (Playwright).
- Database: Use Supabase remote; seed via `pnpm db:reset` (invokes `supabase/utilities/init-database.sql` + `supabase/utilities/init-seeds.sql`) or run `supabase/seeds/seed.sql` manually.
- Test accounts: Owner seed (`owner@lapeninns.com` / hashed password placeholder) with memberships; default restaurant ID `39cb1346-20fb-4fa2-b163-0230e1caf749` (`reserve/shared/config/venue.ts`).
- Configuration: Ensure rate-limit bypass for dev if required (`ENABLE_RATE_LIMIT_IN_DEV=true`), Resend fallback aware, and feature flags toggled explicitly in env to document behaviour per test.

## Section 3: CREATE Operation Tests

**Estimated execution time:** 2h 10m

- [ ] (P0, ~25m) API happy path — `POST /api/bookings` with valid payload (restaurantId default, lunch slot) should return 201, `booking.status` `confirmed`, `confirmationToken` issued, loyalty awarded when program active (`server/loyalty.ts`).
- [ ] (P0, ~35m) Wizard end-to-end happy path — simulate Plan→Details→Review→Confirmation in Playwright (customer mode) verifying validations, sticky confirmation, calendar download, offline banner dismissed.
- [ ] (P0, ~15m) Required field validations — assert 400 with flattened errors when omitting `date`, invalid `time`, `party` out of range, missing terms acceptance (see `bookingSchema` and `createDetailsFormSchema`).
- [ ] (P0, ~20m) Past-time blocking — with `BOOKING_PAST_TIME_BLOCKING=true`, attempt booking earlier than current venue time to trigger 422 `BOOKING_IN_PAST` (source `server/bookings/pastTimeValidation.ts`).
- [ ] (P0, ~20m) Operating window guard — choose closed day/time to exercise `OperatingHoursError` paths returning 400 (file `server/bookings/timeValidation.ts`).
- [ ] (P1, ~20m) Capacity conflict — mock RPC via Supabase (seat limit) to validate graceful failure message and analytics event `booking.create.failure` recorded (`server/capacity/transaction.ts`, `server/observability.ts`).
- [ ] (P1, ~20m) Idempotent retry — replay identical `POST` with same `Idempotency-Key`; expect 200 `duplicate: true`, no new email.
- [ ] (P1, ~15m) Rate limit handling — exceed 60 req/min to confirm 429 response with `Retry-After`, headers from `consumeRateLimit`.
- [ ] (P2, ~15m) Loyalty fallback — inject failure in `applyLoyaltyAward` to ensure booking remains confirmed with `loyalty_points_awarded` reset and error logged.
- [ ] (P2, ~10m) Missing confirmation token path — simulate failure in `attachTokenToBooking` to verify booking success without token.
- [ ] (P3, ~15m) Marketing opt-in persistence — confirm `marketing_opt_in` stored true and customer profile updated (`server/customers.ts`).

## Section 4: READ Operation Tests

**Estimated execution time:** 1h 30m

- [ ] (P0, ~20m) Authenticated `GET /api/bookings?me=1` — ensures 200, pagination metadata, respects `status=active` using `current_bookings` view, requires Supabase session (`handleMyBookings`).
- [ ] (P0, ~15m) Guest lookup `GET /api/bookings` with email/phone — expect bookings filtered by `BOOKING_BLOCKING_STATUSES`; verify rate limit event and hashed policy when `guestLookupPolicy` flag enabled.
- [ ] (P0, ~20m) Unauthorized access — no session for `?me=1` returns 401; mismatched contact info returns empty array.
- [ ] (P1, ~15m) Date range filters — supply `from`/`to` ISO strings; ensure inclusive/exclusive behaviour (`toIsoStringOrThrow`).
- [ ] (P1, ~15m) Sorting toggle — `sort=desc` orders by start time descending, cross-verify DB.
- [ ] (P2, ~10m) Pagination — request page >1 with `pageSize=5`; confirm `pageInfo.hasNext` accurate.
- [ ] (P2, ~15m) Roles enforcement — attempt to fetch unrelated booking via `/api/bookings/{id}` and expect 403 with observability event.

## Section 5: UPDATE Operation Tests

**Estimated execution time:** 1h 45m

- [ ] (P0, ~25m) Customer update (full schema) — `PUT /api/bookings/{id}` adjusting time and party; expect normalized time, `buildBookingAuditSnapshot` recorded, email update triggered.
- [ ] (P0, ~20m) Dashboard patch payload — send `{ startIso, partySize, notes }`; ensure route detects dashboard schema, membership required (`processDashboardUpdate`).
- [ ] (P0, ~20m) Authorization — user with different email receives 403 “You can only update your own reservation”.
- [ ] (P1, ~20m) Past-time validation on update — moving booking into past with flag enabled returns 400/422 accordingly.
- [ ] (P1, ~15m) Capacity enforcement on update — attempt to move to fully booked slot; expect validation failure or 409-style response from validation service.
- [ ] (P1, ~15m) Idempotent PUT — reuse `Idempotency-Key`; verify duplicate detection and no double side-effects.
- [ ] (P2, ~15m) Loyalty untouched — ensure loyalty points not double-applied on update (no change to `loyalty_points_awarded`).
- [ ] (P2, ~15m) Error handling — simulate Supabase failure to ensure 500 response with logged observability event.

## Section 6: DELETE Operation Tests

**Estimated execution time:** 1h 10m

- [ ] (P0, ~20m) Authenticated cancellation — `DELETE /api/bookings/{id}` as booking owner returns success, updates status to `cancelled`, triggers cancellation email, analytics event.
- [ ] (P0, ~15m) Unauthorized cancellation — different email returns 403, ensures audit not recorded.
- [ ] (P1, ~15m) Already-cancelled booking — expect idempotent success or informative message (validate response structure).
- [ ] (P1, ~10m) Cut-off enforcement — simulate DB raising code `42501` to confirm friendly `CUTOFF_PASSED` message.
- [ ] (P2, ~10m) Bookings list refresh — check response `bookings` array excludes cancelled booking unless statuses allow.

## Section 7: Integration Tests

**Estimated execution time:** 1h 20m

- [ ] (P0, ~20m) Resend confirmation email — capture outbound payload when booking created; verify template fields (status badge, calendar attachment) from `server/emails/bookings.ts`.
- [ ] (P0, ~15m) Resend cancellation/update emails — confirm triggered via `enqueueBookingCancelledSideEffects` / `enqueueBookingUpdatedSideEffects`.
- [ ] (P0, ~15m) Analytics events — inspect `analytics_events` insert on create/cancel (`server/analytics.ts`).
- [ ] (P1, ~10m) Observability event logging — ensure `booking.create.failure` or rate-limit events appear in `observability_events` table.
- [ ] (P1, ~10m) Rate limiter using Upstash — with real credentials confirm counts increment/decrement correctly.
- [ ] (P2, ~10m) Loyalty award entry — check Supabase table updated with `points` and metadata.
- [ ] (P2, ~10m) Calendar & Share flows — verify ICS download and navigator share fallback messaging in supported browsers.

## Section 8: Security Tests

**Estimated execution time:** 1h 25m

- [ ] (P0, ~20m) Authentication enforcement — confirm `GET/PUT/DELETE /api/bookings/{id}` and `GET /api/bookings?me=1` deny unauthenticated users.
- [ ] (P0, ~15m) Authorization boundaries — ensure restaurant membership required for dashboard updates (`GuardError` paths in `server/auth/guards.ts`).
- [ ] (P0, ~15m) Guest lookup hash — with `guestLookupPolicy` enabled, verify unhashed fallback disabled (requires `GUEST_LOOKUP_PEPPER`).
- [ ] (P1, ~15m) Rate limit abuse — attempt burst traffic to assert 429 and absence of server crashes.
- [ ] (P1, ~10m) Input sanitization — inject HTML/script in `notes`; ensure stored value escaped in email/confirmation page (HTML escaping in `server/emails/bookings.ts`).
- [ ] (P1, ~10m) SQL injection hardening — validate Supabase parameterization prevents `' OR '1'='1` injections (expect 400/validation errors).
- [ ] (P2, ~10m) Confirmation token replay — confirm `GET /api/bookings/confirm` with used token yields 410 `TOKEN_USED` and cannot access PII.
- [ ] (P3, ~10m) Session fixation — ensure Supabase session rotation on login (verify cookies).

## Section 9: Performance Tests

**Estimated execution time:** 1h 40m

- [ ] (P0, ~30m) Load test booking creation — simulate 30 req/s for 5 min respecting rate limits; monitor response times (<500 ms) and Supabase CPU.
- [ ] (P0, ~20m) Availability endpoint stress — 20 concurrent users hitting `/api/availability` with `includeAlternatives=true`; ensure <300 ms median.
- [ ] (P1, ~20m) Concurrent booking conflict — orchestrate 10 simultaneous bookings for same slot verifying capacity conflict path handles gracefully (no duplicate reservations).
- [ ] (P1, ~20m) Database query profiling — measure Supabase query plan for `bookings` with pagination; confirm indexes used (`idx_booking_table_assignments_*`).
- [ ] (P2, ~10m) Confirmation page response — check `/api/bookings/confirm` latency including Redis rate limit round-trip.
- [ ] (P3, ~10m) Wizard client performance — Lighthouse run focusing on wizard page FCP/LCP (<2.5s on mobile).

## Section 10: Cross-Cutting Concerns

**Estimated execution time:** 1h 15m

- [ ] (P0, ~20m) Accessibility — run axe + manual keyboard checks on wizard steps and reservation detail page (`reserve/features/reservations/wizard/ui` components).
- [ ] (P0, ~15m) Mobile responsiveness — validate layout at 375px, 768px, 1280px; confirm sticky confirmation adapts.
- [ ] (P1, ~15m) Offline handling — simulate offline mid-wizard verifying `WizardOfflineBanner` focus and analytics event.
- [ ] (P1, ~10m) Error surfaces — ensure API errors surface as banners/toasts (PlanStep alerts, Confirmation feedback component).
- [ ] (P2, ~15m) Data integrity — verify `booking_state_history`, `booking_table_assignments` triggers fire (requires DB inspection).

## Section 11: API Test Cases

**Estimated execution time:** 1h 30m

### POST /api/bookings

- Request (JSON):

```json
{
  "restaurantId": "39cb1346-20fb-4fa2-b163-0230e1caf749",
  "date": "2025-10-30",
  "time": "19:00",
  "party": 4,
  "bookingType": "dinner",
  "seating": "indoor",
  "notes": "Birthday surprise",
  "name": "Amelia Pond",
  "email": "amelia@example.com",
  "phone": "+447712345678",
  "marketingOptIn": true
}
```

- Expected: 201; body includes `booking`, `confirmationToken`, `bookings` array, `duplicate` flag, `loyaltyPointsAwarded`.
- Error codes: 400 (validation), 422 (`BOOKING_IN_PAST`), 429 (rate limit), 500 (capacity failure fallback).

### GET /api/bookings?me=1

- Requires Supabase session; supports `status`, `from`, `to`, `sort`, `page`, `pageSize`, `restaurantId`.
- Response: `{ items: BookingDTO[], pageInfo: { page, pageSize, total, hasNext } }`.

### GET /api/bookings?email&phone

- Requires `email`, `phone`; optional `restaurantId`.
- Response: `{ bookings: BookingRecord[] }`; filters to `BOOKING_BLOCKING_STATUSES`.

### PUT /api/bookings/{id}

- Accepts dashboard payload or full booking payload. Return 200 with `{ booking, bookings }` or 404/403 as applicable.
- Headers: `Idempotency-Key` recommended; unified validation sets `X-Booking-Validation-*` via `withValidationHeaders`.

### DELETE /api/bookings/{id}

- Returns `{ success: true, bookings }` on success; 401/403/404/500 as described.

### GET /api/availability

- Parameters: `restaurantId?`, `date` (YYYY-MM-DD), `time` (HH:MM), `partySize` (1-50), `seating` optional, `includeAlternatives` optional.
- Response: `available`, `reason`, `metadata` (servicePeriod, booked/available covers), optional `alternatives` array.

### GET /api/bookings/confirm?token

- Returns `{ booking: PublicBookingConfirmation }` on success; 404 `TOKEN_NOT_FOUND`, 410 `TOKEN_EXPIRED`/`TOKEN_USED`, 429 rate-limited.

## Section 12: Automation Recommendations

**Estimated execution time:** 25m

- Unit/validation: Vitest + Zod schema tests for `createDetailsFormSchema`, `planFormSchema`, `BookingValidationService` (mock Supabase/Capacity).
- API integration: Vitest + Supertest or Next test utilities hitting route handlers with Supabase test doubles/MSW; include rate limit and feature-flag toggles.
- UI/E2E: Playwright (already configured via `playwright.config.ts`) for wizard flow, My Bookings dashboard, cancellation; use `test:e2e` pipeline.
- Contract tests: Dredd/Postman/Newman using `openapi.yaml` once expanded to assert status codes and JSON schema.
- Performance: k6 or Artillery for HTTP load; store scripts referencing rate limit thresholds.
- Accessibility: axe-playwright or storybook a11y add-on for wizard components.

## Section 13: Test Data Requirements

**Estimated execution time:** 20m

- Restaurants: `DEFAULT_RESTAURANT_ID=39cb1346-20fb-4fa2-b163-0230e1caf749` (`reserve/shared/config/venue.ts`); additional sample IDs from `supabase/seeds/seed.sql`.
- Users: Seed owner `owner@lapeninns.com`; create customer emails per test (unique) to avoid duplicates; phone numbers UK format `+4477XXXXXXX`.
- Booking payload permutations: party sizes 1–12, booking types `lunch/dinner/drinks`, seating preferences `any/indoor/outdoor` (others map to indoor).
- Feature flag matrices: record runs with `bookingValidationUnified` on/off, `bookingPastTimeBlocking` on/off, `guestLookupPolicy` on/off.
- Confirmation tokens: capture from create response for token tests; expire by manually updating `confirmation_token_expires_at` in DB.

## Section 14: Regression Test Suite

**Estimated execution time:** 45m

- [ ] (P0) Wizard happy path create → confirmation (UI automation).
- [ ] (P0) API create & cancellation smoke (POST + DELETE) with idempotency header.
- [ ] (P0) `GET /api/bookings?me=1` listing and detail fetch (auth required).
- [ ] (P1) Availability check with alternatives.
- [ ] (P1) Update existing booking (time change) verifies audit + email.
- [ ] (P1) Confirmation token validation (valid + used).
- [ ] (P2) Rate limit guard (Expect 429 after threshold).
- [ ] (P2) Accessibility quick scan on wizard landing (axe).

## Section 15: Known Issues & Limitations

**Estimated execution time:** 15m

- Capacity RPC fallback path creates bookings without enforcement when database function missing (`server/capacity/transaction.ts`); staging must ensure RPC deployed to avoid false positives.
- Rate limiting relies on Upstash; without credentials tests fall back to in-memory limiter, reducing fidelity.
- Resend integration requires valid API key; otherwise tests should stub via mocked `sendEmail` exports.
- Web Share / clipboard APIs may be unavailable in CI browsers; treat as best-effort manual validation.
- No payment/refund implementation despite `stripe_events` table; booking cancellations do not process refunds.
- Confirmation tokens expire after 1 hour; long-running test suites must refresh tokens or adjust expiry.
- Offline banner analytics rely on browser `navigator.onLine`; automation must force offline via CDP for accuracy.

---

**Prepared by:** Codex QA Agent 2025-10-22
