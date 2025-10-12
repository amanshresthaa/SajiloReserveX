# Research: Secure & Stabilize Supabase-Backed Booking Flows

## Task Outline & Decomposition

- **Primary objective:** Address audit findings by hardening Supabase-backed booking flows without regressing staff UX.
- **Subtasks** (derived from sprint stories):
  1. Gate `/api/bookings/[id]` mutations behind authenticated restaurant membership (S1.1).
  2. Decide strategy for guest booking lookup under RLS constraints (S1.2) and produce ADR/PoC.
  3. Add monitoring + rate limiting to booking/ops routes (S1.3).
  4. Deliver guest lookup end-to-end once strategy chosen (S2.1).
  5. Fix invitation acceptance pagination & duplication handling (S2.2).
  6. Harmonize ops booking status guard to eliminate info leaks (S2.3).
- **Cross-cutting requirements:** Structured audit logging, feature flags, regression tests, observability, Supabase remote safety, Chrome DevTools QA.

## Existing Patterns & Code References

- **Authorization helpers:** `server/team/access.ts` exposes `requireMembershipForRestaurant` & `fetchUserMemberships`, currently used across `/api/ops/*` routes (`app/api/ops/bookings/[id]/route.ts`, etc.). Confirms we can build guard utilities around these patterns instead of reinventing membership lookups.
- **Supabase client factories:** `server/supabase.ts` supplies `getRouteHandlerSupabaseClient()` (session-aware anon client) and `getServiceSupabaseClient()` (service role). Critical for ensuring tenant checks precede elevated access.
- **Current `/api/bookings/[id]` flow:** `handleDashboardUpdate` immediately creates service client and mutates bookings prior to any auth (`app/api/bookings/[id]/route.ts:63-134`). No membership check, enabling unauthenticated mutation—the audit’s critical finding.
- **UI mutation hook:** `hooks/useUpdateBooking.ts` calls `fetchJson` (which surfaces HTTP status + message via `HttpError`). `components/dashboard/EditBookingDialog.tsx` already handles server errors via toast + inline messaging. This means returning 401/403 with descriptive bodies will flow to UI without extra work.
- **Guest lookup data model:** `public.customers` stores normalized projections (`email_normalized`, `phone_normalized`) but no hash; PII is exposed unless filtered. RLS permits only staff (`user_restaurants()`), so anon guest access currently fails—migration needed for hashed contact view if we adopt Option A.
- **Ops guard precedent:** `/api/ops/bookings/[id]/route.ts` resolves tenant client, fetches current booking with service client, then enforces membership using `requireMembershipForRestaurant` (`app/api/ops/bookings/[id]/route.ts:79-120`). This pattern is close to what we need but must be strengthened (S2.3).
- **Observability hook:** `server/observability.ts` writes to `observability_events` via service client; available for instrumentation during monitoring tasks.
- **Rate limiting utility:** `server/security/rate-limit.ts` centralizes request throttling with optional Upstash Redis backing and an in-memory fallback, while `server/security/request.ts` offers helpers to extract/anonymise client IPs for metrics.

## Verification Methods & Cross-Checks

1. **Static code inspection** using `sed` on target routes validated absence/presence of auth checks (`app/api/bookings/[id]/route.ts`).
2. **Search-based verification** with `rg` ensured no existing guard util (e.g., `requireSession`) and located membership helper usage to avoid duplicating logic.
3. **Test surface review** by reading `app/api/bookings/[id]/route.test.ts` confirmed current coverage lacks unauthenticated/forbidden scenarios, supporting need for new tests.
4. **Front-end error flow review** via inspecting `hooks/useUpdateBooking.ts` + `EditBookingDialog.tsx` to confirm UI already interprets `HttpError` payloads.
5. **Schema awareness** from `supabase/migrations/20250204114500_fix_membership_policy.sql` shows `user_restaurants` helper and RLS constraints; verifies the importance of performing membership checks with tenant client.
6. **Role definitions cross-check** in `lib/owner/auth/roles.ts` ensures we can reference canonical allowed roles when introducing guard helpers.

> Intentional challenge: verified assumption “Ops guard already prevents leaks” is false by re-reading `/api/ops/bookings/[id]/route.ts`—service client fetch precedes guard, confirming S2.3 risk.

## Technical Constraints & Considerations

- **Supabase remote only:** All DB operations must target remote instance; guard utilities should remain tenant-client compatible to align with RLS.
- **Service-role usage:** Must only occur after session + membership validated to avoid cross-tenant leakage.
- **Feature flags:** Required for guest lookup rollout (`FEATURE_GUEST_LOOKUP_POLICY`) and ops guard refactor (`FEATURE_OPS_GUARD_V2`). Need to confirm existing flag infrastructure (todo: inspect `config/featureFlags` during planning).
- **Rate limiting middleware:** Need to locate or introduce existing pattern; search pending.
- **RLS design:** Guest lookup decision must avoid exposing PII; hashed contact or service-role with compensating controls per audit.
- **Audit logging:** `logAuditEvent` currently writes generic metadata; we must ensure we capture `actor_user_id`, `restaurant_id`, etc., perhaps via enriched metadata payload.

## Open Questions / Ambiguities

- Do we have an existing rate limiting utility (e.g., edge middleware) to leverage for story S1.3, or do we need to introduce one? → Need to investigate during planning (`rg "rate limit"`).
- Guest lookup hashing: do we already store hashed contact info or will a migration be required? Current schema likely lacks `contact_hash`; implies migration & RLS update (flag for coordination with DBA/RLS).
- Invitation acceptance: Do we have local fixtures >100 users to reuse, or must we enhance seed scripts? Need to inspect `tests` or `supabase/seeds`.

## Risks & Failure Modes Identified

- **Regression risk:** New guard could block legitimate staff if membership query or role mapping mismatches; mitigated by reusing `requireMembershipForRestaurant` and writing integration tests mocking membership success/failure.
- **Timing sensitivity:** Switching to tenant client for read before membership may impact performance; need to measure in verification.
- **Guest lookup enumeration:** If hashing approach chosen, must ensure hashing algorithm + salting strategy prevents cross-tenant inference; if service-role path chosen, must pair with aggressive rate limiting + anomaly detection.
- **Invitation pagination:** Potential Supabase Admin API rate/limit issues when paginating; prefer minimizing API calls by querying app DB first.

## Recommended Research Follow-ups

- Inventory feature flag implementation (likely `config/featureFlags.ts`) to prepare for gating new behavior.
- Identify existing middleware for rate limiting/metrics; if absent, evaluate third-party libs (e.g., Upstash Ratelimit, but confirm licensing) vs in-house solution.
- Review `tests/server/ops/bookings-route.test.ts` to align new guard tests with existing testing style.
- For guest lookup ADR, gather references from Supabase docs on RLS with security-definer functions and hashed columns; consider referencing `pgcrypto` availability.

## Preliminary Approach Thoughts (subject to plan phase validation)

- **Guard util:** Introduce `server/auth/guards.ts` exposing `requireSession` (returns `{ supabase, user }`) and `requireRestaurantMember` (wraps `requireMembershipForRestaurant` using tenant client first, optional role filter). Ensure errors throw typed `HttpError` for reuse in routes.
- **`/api/bookings/[id]` fix:** Resolve session upfront, require membership using tenant client + sanitized restaurant ID, only then obtain service client for mutation. Audit event should include `actor_user_id = user.id` and membership info.
- **Monitoring:** Evaluate using `recordObservabilityEvent` + Next.js middleware for rate limiting. Possibly centralize stats emission via `server/metrics` module.
- **Guest lookup:** During spike, build minimal PoC calling Supabase via hashed contact function; stub tests verifying policy behavior.

## Confidence & Remaining Uncertainties

- Confident about S1.1 path due to established patterns and accessible tests.
- Moderate uncertainty around guest lookup schema changes and rate limiting infrastructure—requires deeper investigation in planning.
- Need confirmation on existing alerting stack (Prometheus/Grafana vs Supabase logs). Should surface in planning.
