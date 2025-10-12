# Implementation Plan: Secure & Stabilize Supabase-Backed Booking Flows

## Objective

Restore trust in booking operations by (1) enforcing authenticated, tenant-scoped mutations, (2) enabling safe guest lookup, (3) improving ops endpoints, and (4) adding observability guardrails—all while preserving staff workflows.

## Success Criteria

- [x] `/api/bookings/[id]` rejects unauthenticated requests with 401 and non-members with 403 before any service-role access; authorized staff path unchanged.
- [ ] Guest lookup ADR completed with chosen mitigation, PoC green in CI, and rollout flagged.
- [ ] Booking + ops routes emit rate-limit/metrics signals with alert thresholds defined.
- [x] Invitation acceptance handles >100 users and is idempotent.
- [x] Ops booking status endpoint no longer leaks existence data to outsiders.
- [x] New/updated tests (unit + integration) cover the auth matrix and regressions noted in audit.

## Architecture & Design Decisions

### Guard Utilities

- Create `server/auth/guards.ts` exporting:
  - `requireSession(request: NextRequest)` → resolves tenant Supabase client, loads user (`auth.getUser()`), throws typed error on failure. Returns `{ supabase, user }` where `user` includes `id`, `email`.
  - `requireRestaurantMember({ supabase, restaurantId, roles? })` → wraps `requireMembershipForRestaurant`, reusing tenant client results. Should throw typed error with code (`FORBIDDEN`, `MEMBERSHIP_NOT_FOUND`).
  - Re-export `HttpError` or define small server-side `AuthError` type? Decision: use custom error classes with `status` & `code` for consistent JSON responses.
- Rationale: avoids duplicating membership query patterns across routes and centralizes audit logging metadata.
- Alternative considered: inline guard in route. Rejected due to duplication risk and testability.

### `/api/bookings/[id]` Hardening (S1.1)

1. On `PUT` (dashboard payload path):
   - Parse body as today.
   - Before calling `handleDashboardUpdate`, invoke `requireSession` + determine `restaurantId`:
     - For dashboard updates, we need existing booking to know restaurant. Options:
       a. Fetch booking with tenant client first (subject to RLS). But dashboard path historically used service client to bypass RLS. Challenge.
       b. Fetch booking with service client but only after membership check. That means we must know `restaurantId` first to check membership. Options:
       - Use service client to fetch minimal fields? That still leaks if attacker can call service before membership. Need guard ordering.
       - Instead, use tenant client to fetch `restaurant_id` via RLS function `user_restaurants_admin()`? Not available for unauth user. Without membership, RLS denies but reveals nothing. However we need to avoid unauthorized bypass.
   - Resolution: Use tenant client to select booking but rely on RLS to ensure only authorized staff can view. Dashboard updates triggered by staff (with membership), so should succeed. If RLS denies, treat as 403. To maintain fallback for customers path (legacy full update), existing logic already uses tenant client; we can reuse.
   - After verifying membership, switch to service client for mutation and continue existing update flow.
2. Add structured audit log call capturing `actor_user_id` (user.id) and `fields_changed` from `buildBookingAuditSnapshot` metadata. Possibly embed actor in metadata because `logAuditEvent` lacks explicit field. Add to metadata as `actor_user_id` (since schema not changed).
3. `handleDashboardUpdate` should accept context including `restaurantId` (passed down to skip second fetch?) Evaluate: currently fetch uses service client to load entire booking. After guard new logic maybe we can fetch once and pass record to avoid double query.
4. Update response shaping unchanged; ensure error codes align with FE expectations (e.g., `FORBIDDEN`).

### Guest Lookup Strategy (S1.2 & S2.1)

- Conduct ADR comparing:
  - **Option A (RLS + hashed contact):** requires migration adding `contact_hash` to `customers` and security-definer function `get_guest_bookings`. Pros: keeps anon client, minimal service-role usage. Cons: migration complexity, need to guarantee hashing uniqueness + no timing leak.
  - **Option B (Service-role with validation):** easier initial implementation but needs strong rate limits, anomaly detection, constant-time error responses.
- PoC tasks:
  - Build feature flag gating new lookup path.
  - Implement minimal SQL function + Next.js route stub for Option A; or implement validation pipeline for Option B.
  - Write Vitest integration hitting route with mocked Supabase clients to test success/empty/invalid flows.
- Decision recorded in ADR with threat model summary.

### Monitoring & Rate Limiting (S1.3)

- Introduce `server/observability/rateLimit.ts` (or similar) using either:
  - In-memory limiter (acceptable short-term?) weighed against multi-instance scaling risk.
  - Prefer upstream solution (e.g., Redis/Upstash). Need to confirm environment availability; if absent, create stub interface to allow plugging provider later, default to neutrally logging exceed events.
- Instrument `/api/bookings/*` and `/api/ops/*` route handlers to:
  - Emit metric event via `recordObservabilityEvent` (source: `api.bookings`, `api.ops`).
  - Hook into NextRequest to record request ID (via header or generate `crypto.randomUUID()`).
  - On rate limit breach, return 429 with `Retry-After`, log via `console.warn` + observability event.
- Alerts: Document thresholds in verification + update runbooks (likely out-of-code but note in tasks).

### Invitation Acceptance Pagination (S2.2)

- Prefer DB-first: query `profiles` table by normalized email to find `auth_user_id` (if stored). Need to examine schema to confirm column exists. If missing, fallback to Supabase Admin pagination with loop until `nextPage` consumed. Ensure short-circuit when found.
- Add idempotent handling: if membership already exists, treat as success.

### Ops Booking Status Guard (S2.3)

- Reuse new guard utilities to ensure membership resolution occurs prior to service-role reads.
- Align responses so unauthorized vs non-existent both return 404 (with generic body) to avoid info leak.
- Introduce shared helper (e.g., `requireOpsBookingAccess`) living near guard util.

## Component & Module Breakdown

- `server/auth/guards.ts` (new) – session & membership utilities.
- `app/api/bookings/[id]/route.ts` – reorder logic, inject guard, enhance audit logs, adjust `handleDashboardUpdate` signature.
- `app/api/bookings/[id]/route.test.ts` – add tests for 401/403/dash vs legacy path.
- Potentially `server/bookings.ts` – adjust functions to accept pre-fetched booking/metadata.
- `config/featureFlags.ts` (or equivalent) – register new feature flags.
- `app/api/bookings/lookup/route.ts` (if existing) or new route for guest lookup – to be determined post ADR.
- `docs/architecture/guest-lookup.md` or `tasks/.../research.md` – store ADR.
- `server/observability/rateLimit.ts` (new) + instrumentation in targeted routes.
- `app/api/team/invitations/[token]/accept/route.ts` – pagination fix + tests.
- `app/api/ops/bookings/[id]/status/route.ts` – guard harmonization + tests.

## Data Flow Considerations

- Dashboard update path: Request → `requireSession` (tenant) → `tenantSupabase.from("bookings")` fetch for membership + restaurant ID → `requireRestaurantMember` → `getServiceSupabaseClient` for mutation → `updateBookingRecord` → side effects + audit logging.
- Guest lookup Option A: Request with email/phone → server validates, computes hash → calls security-definer function via anon client → returns sanitized bookings list.
- Monitoring: Rate limiter sits at entry, logs event, then handler executes (or short-circuits).

## API Contracts & Error Handling

- `/api/bookings/[id]` PUT (dashboard payload):
  - **401** body `{ error: "Unauthorized", code: "UNAUTHENTICATED" }`.
  - **403** body `{ error: "Forbidden", code: "FORBIDDEN" }`.
  - **200** unchanged response.
- Rate limit responses: JSON `{ error: "Too many requests", code: "RATE_LIMITED", retryAfter: seconds }`.
- Guest lookup: Response should avoid disclosing whether email or phone mismatched; return generic “No bookings found” for both missing and invalid pairs.

## UI/UX Considerations

- Dashboard error surfaces already exist; ensure messages map to new codes (`FORBIDDEN`, `UNAUTHENTICATED`). Might adjust copy if required.
- Guest lookup UI (check existing page) must avoid enumerating; use neutral copy.
- Rate limiting should present user-friendly message via FE to avoid confusion.

## Testing Strategy

- **Unit tests:**
  - Guard utilities for success/failure.
  - `/api/bookings/[id]/route.test.ts` coverage for 401/403, verifying service client not invoked when unauthorized (use spies).
  - Rate limiter behavior (e.g., using fake clock or dependency injection).
- **Integration tests:**
  - Next.js route tests verifying entire pipeline using mocked Supabase clients.
  - Guest lookup PoC tests hitting function with hashed contact.
  - Invitation acceptance seeded with >100 mocked users.
- **Security tests:**
  - Fuzz unauthorized requests ensuring same response time (if feasible) for existing vs nonexistent bookings after S2.3.
- **Performance checks:**
  - Log instrumentation to ensure guard does not add >50ms overhead at p95 (manual measurement during verification).

## Edge Cases & Mitigations

- Bookings without `restaurant_id`: fallback to `getDefaultRestaurantId()` as currently, but guard should handle gracefully—if `null`, treat as 403 until membership confirmed.
- Member role changes mid-request: membership query will reflect current DB state due to real-time call.
- Guest lookup with mixed-case emails/phones: ensure normalization before hashing.
- Rate limiter storage failure: degrade gracefully by allowing request but logging error.
- Invitation acceptance when user already activated membership: respond with success message and no duplicate insert.

## Rollout Plan

1. Land guard + tests (feature off? critical fix is permanent). Deploy with monitoring to ensure 401/403 trends.
2. Deploy rate limiting + logging under feature flag (dark launch) to validate metrics before enforcing.
3. Ship guest lookup behind `FEATURE_GUEST_LOOKUP_POLICY` default off; run internal canary.
4. Invitation pagination + ops guard: deploy behind `FEATURE_OPS_GUARD_V2` to allow quick rollback; monitor 404 rates.
5. Hardening window: run Chrome DevTools QA, load tests, adjust alert thresholds.

## Assumption Challenges & Contingency Plans

- **Assumption:** Tenant client can read booking for staff due to RLS. Counter-check: if RLS restricts to membership, operations succeed; if not, route returns 403. Need to verify by inspecting RLS policy (confirmed `Staff can view bookings` policy uses `user_restaurants`). If issues, fallback to service read after verifying membership via membership table using service client but only after verifying membership using `requireMembershipForRestaurant` + service client? Would require `user_restaurants_admin()` (grants to authenticated). Keep this as backup plan.
- **Assumption:** Rate limiting infra available. If not, implement token bucket using `@upstash/ratelimit` with environment env var. If external dependency not allowed, log-only fallback.
- **Assumption:** Profiles table stores auth user ID. Must validate before coding; if absent, schedule schema change.

## Rollout

- **Stage 0 — Hidden:** Ship backend hash helper + API changes behind `FEATURE_GUEST_LOOKUP_POLICY`; keep flag off in all envs. Confirm migrations/backfill complete remotely and document in `verification.md`.
- **Stage 1 — Internal QA:** Enable flag in staging for admin accounts only. Run Chrome DevTools QA on guest lookup flow (mobile + desktop), verify metrics & audit events, and capture logs for lookup failures.
- **Stage 2 — Pilot Restaurants:** Flip flag for 2–3 partner restaurants via config sync. Monitor lookup success rate, 429 counts, and observability alerts for enumeration patterns.
- **Stage 3 — Full Rollout:** Gradually expand flag exposure (25% → 50% → 100%) once pilot metrics stable for 48h. Announce in release notes and handoff to support.
- **Rollback Plan:** Disable feature flag to revert to legacy flow. If hash column issues surface, fall back to service-role path after deleting `contact_lookup_hash` values via maintenance script (document steps before rollout).

## Monitoring & Alerts

- Integrate with existing observability events: include `route`, `status`, `actor_role`. Document thresholds: e.g., `401` spike >3× baseline for 5 min, `guest_lookup_failures` >2%.
- Ensure logs include `request_id` to trace across functions.

## Pending Clarifications for Stakeholder

- Confirm acceptable hashing approach & whether salts/secrets available.
- Validate infrastructure support for Redis/Upstash for limiter.
- Align on messaging for guest lookup failure to avoid social engineering signals.
