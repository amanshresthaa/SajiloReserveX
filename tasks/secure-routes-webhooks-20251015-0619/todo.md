# Implementation Checklist

**Epic**: EPIC A — Secure sensitive routes & webhooks  
**Created**: 2025-01-15 06:19 UTC  
**Total**: 16 SP

---

## Phase 0: Setup & Preparation

- [ ] Review research.md and plan.md with team
- [ ] Obtain MAILGUN_SIGNING_KEY from DevOps/Infrastructure team
- [ ] Verify INNGEST_SIGNING_KEY is configured in production environment
- [ ] Verify Upstash Redis is accessible and healthy
- [ ] Create feature branch: `task/secure-routes-webhooks-20251015-0619`

---

## Task 3: Gate Test/Dev Endpoints (3 SP) - Priority 1

### Implementation

- [ ] Create `server/guards/test-endpoints.ts` with `guardTestEndpoint()` function
- [ ] Add `recordObservabilityEvent` call for blocked access attempts
- [ ] Update `src/app/api/test/leads/route.ts` - add guard to GET and POST
- [ ] Update `src/app/api/test/invitations/route.ts` - add guard to all handlers
- [ ] Update `src/app/api/test/bookings/route.ts` - add guard to POST
- [ ] Update `src/app/api/test/playwright-session/route.ts` - add guard to POST
- [ ] Update `src/app/api/test/reservations/[reservationId]/confirmation/route.ts` - add guard to GET
- [ ] Update `src/app/api/test-email/route.ts` - strengthen existing guard or replace with new pattern

### Testing

- [ ] Unit test: `guardTestEndpoint()` returns null when `NODE_ENV=development`
- [ ] Unit test: `guardTestEndpoint()` returns 404 when `NODE_ENV=production`
- [ ] Unit test: Each test endpoint returns 404 in production
- [ ] Integration test: Mock `NODE_ENV` and verify behavior
- [ ] Manual test: Build production locally (`pnpm build && pnpm start`) and curl test endpoints
- [ ] E2E test: Update tests to skip test endpoint calls when running against production

### Deployment

- [ ] Deploy to staging environment
- [ ] Verify test endpoints return 404 in staging (if staging uses `NODE_ENV=production`)
- [ ] Monitor logs for any errors or unexpected behavior
- [ ] Deploy to production
- [ ] Verify test endpoints return 404 in production via curl/Postman
- [ ] Monitor observability events for blocked access attempts

---

## Task 2: Rate-Limit Booking Creation (3 SP) - Priority 2

### Implementation

- [ ] Import `consumeRateLimit` from `server/security/rate-limit.ts` into `src/app/api/bookings/route.ts`
- [ ] Import `extractClientIp` and `anonymizeIp` from `server/security/request.ts`
- [ ] Import `recordObservabilityEvent` from `server/observability`
- [ ] Add rate limit check in POST handler (after validation, before booking creation)
- [ ] Set rate limit: `identifier: "bookings:create:${restaurantId}:${clientIp}", limit: 60, windowMs: 60_000`
- [ ] Handle rate limit exceeded: return 429 with Retry-After header
- [ ] Add X-RateLimit-\* headers (Limit, Remaining, Reset) to 429 response
- [ ] Log rate limit event to observability system with anonymized IP
- [ ] Verify idempotency key logic still works within rate limit

### Testing

- [ ] Unit test: First 60 requests succeed
- [ ] Unit test: 61st request returns 429 with correct headers
- [ ] Unit test: Rate limit resets after window (mock time)
- [ ] Unit test: Different restaurantIds have separate rate limits
- [ ] Unit test: Different IPs have separate rate limits
- [ ] Integration test: Real rate limit with Redis (or memory fallback)
- [ ] Integration test: Idempotency key prevents duplicate bookings within rate limit
- [ ] Load test: Simulate 100 concurrent booking requests, verify rate limit behavior
- [ ] Manual test: Send 61 booking requests via Postman, verify 429 on 61st

### Deployment

- [ ] Deploy to staging environment
- [ ] Monitor rate limit hit rate in staging
- [ ] Adjust limit if necessary based on staging metrics
- [ ] Deploy to production with monitoring enabled
- [ ] Set up alert: >10% of booking requests hit rate limit in 1 hour
- [ ] Monitor observability dashboard for rate limit events
- [ ] Validate Redis is being used (not memory fallback) in production logs

---

## Task 4A: Mailgun Webhook Signature Verification (3 SP) - Priority 3

### Environment Setup

- [ ] Add `MAILGUN_SIGNING_KEY: z.string().optional()` to `config/env.schema.ts`
- [ ] Add `signingKey` field to `env.mailgun()` in `lib/env.ts`
- [ ] Update `.env.example` with `MAILGUN_SIGNING_KEY=your_signing_key_here`
- [ ] Obtain actual MAILGUN_SIGNING_KEY from Mailgun dashboard
- [ ] Set MAILGUN_SIGNING_KEY in staging environment
- [ ] Set MAILGUN_SIGNING_KEY in production environment

### Implementation

- [ ] Create `server/webhooks/mailgun.ts` file
- [ ] Implement `verifyMailgunSignature()` function with HMAC-SHA256
- [ ] Add timestamp validation (reject if >5 minutes old)
- [ ] Use `crypto.timingSafeEqual()` for signature comparison
- [ ] Handle missing signing key (log warning, allow in development)
- [ ] Update `src/app/api/webhook/mailgun/route.ts` to extract signature headers
- [ ] Add signature verification check before processing webhook
- [ ] Return 401 if signature invalid
- [ ] Log security event to observability system on signature failure
- [ ] Test with/without signing key (development vs. production behavior)

### Testing

- [ ] Unit test: Valid signature passes verification
- [ ] Unit test: Invalid signature fails verification
- [ ] Unit test: Missing signature headers fail verification
- [ ] Unit test: Expired timestamp (>5 min) fails verification
- [ ] Unit test: Missing signing key logs warning and allows (development mode)
- [ ] Integration test: Mock Mailgun webhook with real signature computation
- [ ] Manual test: Send test webhook from Mailgun dashboard, verify processing
- [ ] Manual test: Send forged webhook, verify 401 response

### Deployment

- [ ] Deploy to staging environment
- [ ] Configure Mailgun webhook URL to staging endpoint
- [ ] Send test email, verify webhook received and processed
- [ ] Check logs for any signature verification failures
- [ ] Deploy to production
- [ ] Verify production webhook URL is configured in Mailgun
- [ ] Send test email, verify webhook received and processed
- [ ] Monitor observability events for signature verification failures

---

## Task 4B: Inngest Webhook Signature Verification (2 SP) - Priority 3

### Implementation

- [ ] Verify `INNGEST_SIGNING_KEY` is present in `config/env.schema.ts` (already exists)
- [ ] Verify `signingKey` is exposed in `env.queue.inngest` (already exists)
- [ ] Update `src/app/api/inngest/route.ts` to import signing key from env
- [ ] Add startup check: throw error if signing key missing in production
- [ ] Pass `signingKey` to `serve()` function from inngest SDK
- [ ] Test that SDK automatically verifies X-Inngest-Signature header
- [ ] Verify SDK returns 401 for invalid signatures (automatic behavior)

### Testing

- [ ] Unit test: Startup throws error if signing key missing in production
- [ ] Unit test: Startup succeeds if signing key present
- [ ] Integration test: Mock Inngest request with valid signature (SDK handles)
- [ ] Integration test: Mock Inngest request with invalid signature → 401 (SDK handles)
- [ ] Manual test: Trigger Inngest function from dashboard, verify execution
- [ ] Manual test: Send forged Inngest request, verify 401 response

### Deployment

- [ ] Verify INNGEST_SIGNING_KEY is set in staging environment
- [ ] Deploy to staging environment
- [ ] Trigger test job from Inngest dashboard, verify execution
- [ ] Check logs for any signature verification issues
- [ ] Verify INNGEST_SIGNING_KEY is set in production environment
- [ ] Deploy to production
- [ ] Trigger test job from Inngest dashboard, verify execution
- [ ] Monitor logs for signature verification failures

---

## Task 1: Lock Down Booking Details Endpoints (5 SP) - Priority 4

### Implementation - GET /api/bookings/[id]

- [ ] Import `getRouteHandlerSupabaseClient`, `getServiceSupabaseClient` (already imported)
- [ ] Import `normalizeEmail` from `server/customers` (already imported)
- [ ] Import `recordObservabilityEvent` from `server/observability`
- [ ] Add auth check at start of GET handler: `tenantSupabase.auth.getUser()`
- [ ] Return 401 if `authError` or no `user.email`
- [ ] Load booking using service client (already uses service client)
- [ ] Normalize user.email and booking.customer_email
- [ ] Compare emails, return 403 if mismatch
- [ ] Log observability event for denied access (anonymized)
- [ ] Return booking data if email matches

### Implementation - GET /api/bookings/[id]/history

- [ ] Review existing auth check (already has `getUser()`)
- [ ] Ensure ownership check uses normalized emails (already does)
- [ ] Add observability logging for denied access attempts
- [ ] Verify error responses match standardized format

### Testing

- [ ] Unit test: GET /api/bookings/[id] with no session → 401
- [ ] Unit test: GET /api/bookings/[id] with session but wrong email → 403
- [ ] Unit test: GET /api/bookings/[id] with session and matching email → 200
- [ ] Unit test: GET /api/bookings/[id]/history with no session → 401
- [ ] Unit test: GET /api/bookings/[id]/history with wrong email → 403
- [ ] Unit test: GET /api/bookings/[id]/history with matching email → 200
- [ ] Unit test: Email comparison is case-insensitive (via normalizeEmail)
- [ ] Integration test: Create booking as user A, attempt to access as user B → 403
- [ ] Integration test: Create booking as user A, access as user A → 200
- [ ] E2E test: Update `tests/e2e/bookings/*.spec.ts` to ensure user authenticated
- [ ] E2E test: Create new test for cross-user access denial

### Deployment Planning

- [ ] Review all frontend code that calls GET /api/bookings/[id]
- [ ] Ensure session cookies are sent with requests (should be automatic)
- [ ] Identify any third-party integrations calling this endpoint
- [ ] Create communication plan for breaking change
- [ ] Consider feature flag for gradual rollout (optional)

### Deployment

- [ ] Deploy to staging environment
- [ ] Manual QA: Access own booking → success
- [ ] Manual QA: Attempt to access another user's booking → 403
- [ ] Manual QA: Access without authentication → 401
- [ ] Monitor auth denial rate in staging
- [ ] Deploy to production with monitoring enabled
- [ ] Set up alert: Spike in 401/403 errors (>100/min)
- [ ] Monitor observability dashboard for auth denial events
- [ ] Verify no regression in authenticated booking access

---

## Documentation

### Code Documentation

- [ ] Add JSDoc comments to `guardTestEndpoint()` function
- [ ] Add JSDoc comments to `verifyMailgunSignature()` function
- [ ] Add inline comments for rate limit configuration
- [ ] Add inline comments for webhook signature verification

### Project Documentation

- [ ] Update `COMPREHENSIVE_ROUTE_ANALYSIS.md`:
  - [ ] Mark GET /api/bookings/[id] as "Auth: User (email ownership)"
  - [ ] Mark GET /api/bookings/[id]/history as "Auth: User (email ownership)"
  - [ ] Add rate limit info for POST /api/bookings (60 req/min)
  - [ ] Mark all /api/test/\* as "Production: Blocked (404)"
  - [ ] Add Mailgun webhook signature verification status
  - [ ] Add Inngest webhook signature verification status
- [ ] Update `ROUTE_QUICK_REFERENCE.md`:
  - [ ] Change auth column for booking details endpoints to "User"
  - [ ] Add rate limit column for POST /api/bookings
  - [ ] Mark test endpoints as "Prod: Blocked"
- [ ] Update `.env.example`:
  - [ ] Add MAILGUN_SIGNING_KEY with description
  - [ ] Add note about INNGEST_SIGNING_KEY requirement
- [ ] Create or update `docs/webhooks.md`:
  - [ ] Document Mailgun webhook configuration
  - [ ] Document Inngest webhook configuration
  - [ ] Document signing key rotation process
- [ ] Update `README.md` if needed:
  - [ ] Add webhook security section
  - [ ] Add environment variable requirements

### API Documentation

- [ ] Update API docs (if exists) for GET /api/bookings/[id]:
  - [ ] Add "Authentication: Required" section
  - [ ] Add "Authorization: Must own booking (email match)" section
  - [ ] Add 401 and 403 error response examples
- [ ] Update API docs for POST /api/bookings:
  - [ ] Add rate limit section (60 req/min per restaurant+IP)
  - [ ] Add 429 error response example with headers
- [ ] Update API docs for test endpoints:
  - [ ] Mark as "Development only - returns 404 in production"

---

## Testing & QA

### Pre-Deployment Testing

- [ ] Run all unit tests: `pnpm test`
- [ ] Run all integration tests
- [ ] Run all E2E tests: `pnpm test:e2e`
- [ ] Run type checking: `pnpm tsc --noEmit`
- [ ] Run linter: `pnpm lint`
- [ ] Run build: `pnpm build`
- [ ] Test local production build: `pnpm start` and manual testing

### Staging QA

- [ ] Verify all test endpoints return 404
- [ ] Send 61 booking requests, verify rate limit on 61st
- [ ] Access own booking details → success
- [ ] Attempt to access other user's booking → 403
- [ ] Send test Mailgun webhook, verify processing
- [ ] Send forged Mailgun webhook, verify 401
- [ ] Trigger Inngest job, verify execution
- [ ] Monitor logs for any unexpected errors
- [ ] Check performance metrics (latency, error rates)

### Production Smoke Tests (Post-Deployment)

- [ ] curl test endpoints → verify 404
- [ ] Create test booking → verify success
- [ ] Access test booking → verify success
- [ ] Monitor rate limit hit rate for first hour
- [ ] Monitor auth denial rate for first hour
- [ ] Monitor webhook signature verification for first hour
- [ ] Check error logs for any issues
- [ ] Verify no increase in overall error rate

---

## Monitoring & Observability

### Metrics Setup

- [ ] Create dashboard for booking auth denials (401, 403 by endpoint)
- [ ] Create dashboard for rate limit hits (429 by restaurant)
- [ ] Create dashboard for webhook signature failures (Mailgun, Inngest)
- [ ] Create dashboard for API response times (p50, p95, p99)
- [ ] Set up baseline metrics before deployment

### Alerts Setup

- [ ] Alert: Spike in 401 errors on booking endpoints (>100/min)
- [ ] Alert: Spike in 403 errors on booking endpoints (>50/min)
- [ ] Alert: High rate limit hit rate (>10% of booking requests)
- [ ] Alert: Webhook signature failure rate (>10/hour)
- [ ] Alert: API latency increase (p95 >1s)
- [ ] Test all alerts to ensure they trigger correctly

### Log Verification

- [ ] Verify observability events are logged for:
  - [ ] Booking auth denials (anonymized user info)
  - [ ] Rate limit hits (anonymized IP)
  - [ ] Webhook signature failures (no sensitive data)
  - [ ] Test endpoint access attempts in production
- [ ] Verify no PII in logs (use anonymizeIp for IPs, no email addresses)

---

## Rollback Preparation

### Rollback Plan Documentation

- [ ] Document rollback steps for each task
- [ ] Prepare rollback commits for each task
- [ ] Test rollback procedure in staging environment
- [ ] Communicate rollback plan to team

### Rollback Triggers

- [ ] Auth denial rate >5% of booking requests
- [ ] Rate limit false positive rate >10%
- [ ] Webhook processing failure rate >5%
- [ ] API error rate increase >2x baseline
- [ ] P0 production incident related to changes

### Rollback Execution Checklist

- [ ] Toggle feature flag (if implemented)
- [ ] Execute git revert on deployment branch
- [ ] Deploy rollback commit to production
- [ ] Verify metrics return to baseline
- [ ] Communicate rollback to stakeholders
- [ ] Schedule postmortem

---

## Final Checklist

### Pre-Merge

- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] All E2E tests passing
- [ ] Type checking passes
- [ ] Linting passes
- [ ] Build succeeds
- [ ] Code review approved by 2+ engineers
- [ ] Security review approved
- [ ] Documentation updated
- [ ] Changelog updated (if applicable)

### Pre-Production Deployment

- [ ] Staging deployment successful
- [ ] Staging QA completed and signed off
- [ ] Performance testing completed
- [ ] Monitoring dashboards created
- [ ] Alerts configured and tested
- [ ] Rollback plan documented and reviewed
- [ ] Deployment runbook prepared
- [ ] Stakeholders notified of deployment window

### Post-Production Deployment

- [ ] Smoke tests passed
- [ ] Monitoring dashboards reviewed (first hour)
- [ ] No critical alerts triggered
- [ ] Error rates within acceptable thresholds
- [ ] Performance metrics within SLA
- [ ] Stakeholders notified of successful deployment
- [ ] Update task status to "Complete"
- [ ] Schedule retrospective meeting

---

## Notes & Assumptions

### Assumptions

- Supabase Auth is correctly configured and working
- Upstash Redis is available in production
- MAILGUN_SIGNING_KEY will be provided by DevOps
- INNGEST_SIGNING_KEY is already configured
- Frontend sends session cookies automatically
- No third-party integrations rely on unauthenticated booking access

### Deviations from Plan

_Document any changes from the original plan here as they occur_

### Blockers

_Track any blockers here_

- [ ] ~~Need MAILGUN_SIGNING_KEY from DevOps~~ (if blocked, document)
- [ ] ~~Confirm no external integrations for booking details endpoint~~ (if blocked, document)

---

## Batched Questions

_If any questions arise during implementation, batch them here and ask the team in one block:_

1. [No questions yet]

---

**Last Updated**: 2025-01-15 06:19 UTC  
**Status**: Ready for implementation  
**Progress**: 0% complete
