# Verification Report

**Epic**: EPIC A — Secure sensitive routes & webhooks  
**Created**: 2025-01-15 06:19 UTC  
**Total Effort**: 16 SP (5 + 3 + 3 + 5)

---

## Overview

This document defines the verification strategy, acceptance criteria, and sign-off process for securing SajiloReserveX API routes and webhooks. All changes must pass these criteria before being marked complete.

---

## Test Strategy

### Test Pyramid

```
         ▲
        / \
       /   \        E2E Tests (~10%)
      /     \       - Critical user flows
     /       \      - Security bypass attempts
    /_________\     - Performance smoke tests
   /           \
  /             \   Integration Tests (~30%)
 /               \  - Auth + DB + Redis
/                 \ - Webhook processing
/__________________\

    Unit Tests (~60%)
    - Auth guards
    - Rate limiting
    - Signature verification
    - Edge cases
```

### Testing Levels

#### 1. Unit Tests (Target: >80% coverage)

- **Scope**: Individual functions, guards, utilities
- **Tools**: Vitest
- **Run**: `pnpm test`
- **Focus**: Business logic, edge cases, error handling

#### 2. Integration Tests (Target: All critical paths)

- **Scope**: API routes + Supabase + Redis
- **Tools**: Vitest with test database
- **Run**: `pnpm test:integration`
- **Focus**: Full request/response cycles, database operations

#### 3. End-to-End Tests (Target: Critical flows)

- **Scope**: Full user journeys via browser
- **Tools**: Playwright
- **Run**: `pnpm test:e2e`
- **Focus**: Real-world scenarios, regressions

#### 4. Security Tests (Target: All attack vectors)

- **Scope**: Bypass attempts, timing attacks, replay attacks
- **Tools**: Custom scripts, manual testing
- **Focus**: Vulnerability validation

#### 5. Performance Tests (Target: <100ms overhead)

- **Scope**: Latency impact, throughput
- **Tools**: Artillery, k6, or manual profiling
- **Focus**: No degradation vs. baseline

---

## Acceptance Criteria

### Task 1: Lock Down Booking Details Endpoints (5 SP)

#### Functional Requirements

- [x] **AC-1.1**: GET /api/bookings/[id] returns 401 when no session present
- [x] **AC-1.2**: GET /api/bookings/[id] returns 403 when user email doesn't match booking email
- [x] **AC-1.3**: GET /api/bookings/[id] returns 200 with full data when user owns booking
- [x] **AC-1.4**: GET /api/bookings/[id]/history returns 401 when no session present
- [x] **AC-1.5**: GET /api/bookings/[id]/history returns 403 when user doesn't own booking
- [x] **AC-1.6**: GET /api/bookings/[id]/history returns 200 when user owns booking
- [x] **AC-1.7**: Email comparison is case-insensitive (uses `normalizeEmail()`)
- [x] **AC-1.8**: Error responses include `code` field ("UNAUTHENTICATED", "FORBIDDEN")

#### Non-Functional Requirements

- [x] **AC-1.9**: Auth check adds <50ms latency at p95
- [x] **AC-1.10**: No PII in logs (use anonymized user IDs)
- [x] **AC-1.11**: Observability events logged for denied access attempts

#### Test Coverage

- [x] Unit tests for auth check with/without session
- [x] Unit tests for ownership check with matching/non-matching emails
- [x] Integration tests with real Supabase auth
- [x] E2E test: User can access own booking
- [x] E2E test: User cannot access other user's booking

#### Status

- [ ] **Implementation**: Not started
- [ ] **Unit Tests**: 0% passing
- [ ] **Integration Tests**: Not run
- [ ] **E2E Tests**: Not run
- [ ] **Code Review**: Pending
- [ ] **QA Sign-off**: Pending

---

### Task 2: Rate-Limit Booking Creation (3 SP)

#### Functional Requirements

- [x] **AC-2.1**: POST /api/bookings allows first 60 requests per (restaurant, IP) per minute
- [x] **AC-2.2**: POST /api/bookings returns 429 on 61st request within window
- [x] **AC-2.3**: 429 response includes `Retry-After` header (seconds until reset)
- [x] **AC-2.4**: 429 response includes `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- [x] **AC-2.5**: Rate limit resets after 60-second window
- [x] **AC-2.6**: Different restaurants have separate rate limit buckets
- [x] **AC-2.7**: Different IPs have separate rate limit buckets
- [x] **AC-2.8**: Idempotency keys still prevent duplicate bookings within rate limit

#### Non-Functional Requirements

- [x] **AC-2.9**: Rate limit check adds <20ms latency at p95 (Redis)
- [x] **AC-2.10**: Falls back to in-memory limiter if Redis unavailable (with warning log)
- [x] **AC-2.11**: Observability event logged for rate limit hits

#### Test Coverage

- [x] Unit test: 60 requests succeed, 61st fails
- [x] Unit test: Rate limit resets after window
- [x] Unit test: Different restaurants/IPs have separate limits
- [x] Integration test: Real Redis rate limiting
- [x] Integration test: Memory fallback when Redis unavailable
- [x] Load test: 100 concurrent requests, verify rate limit behavior

#### Status

- [ ] **Implementation**: Not started
- [ ] **Unit Tests**: 0% passing
- [ ] **Integration Tests**: Not run
- [ ] **Load Tests**: Not run
- [ ] **Code Review**: Pending
- [ ] **QA Sign-off**: Pending

---

### Task 3: Gate Test/Dev Endpoints (3 SP)

#### Functional Requirements

- [x] **AC-3.1**: All /api/test/\* endpoints return 404 when `NODE_ENV=production`
- [x] **AC-3.2**: /api/test-email returns 404 when `NODE_ENV=production`
- [x] **AC-3.3**: All test endpoints work normally when `NODE_ENV=development`
- [x] **AC-3.4**: 404 response is indistinguishable from non-existent route (security by obscurity)
- [x] **AC-3.5**: Observability event logged for blocked test endpoint access

#### Affected Endpoints

- [x] `/api/test/leads` (GET, POST)
- [x] `/api/test/invitations` (POST)
- [x] `/api/test/bookings` (POST)
- [x] `/api/test/playwright-session` (POST)
- [x] `/api/test/reservations/[reservationId]/confirmation` (GET)
- [x] `/api/test-email` (GET, POST)

#### Test Coverage

- [x] Unit test: `guardTestEndpoint()` returns null in development
- [x] Unit test: `guardTestEndpoint()` returns 404 in production
- [x] Integration test: All endpoints return 404 in production
- [x] Manual test: Production build locally and curl all endpoints

#### Status

- [ ] **Implementation**: Not started
- [ ] **Unit Tests**: 0% passing
- [ ] **Manual Tests**: Not run
- [ ] **Code Review**: Pending
- [ ] **QA Sign-off**: Pending

---

### Task 4A: Mailgun Webhook Signature Verification (3 SP)

#### Functional Requirements

- [x] **AC-4A.1**: POST /api/webhook/mailgun verifies HMAC-SHA256 signature
- [x] **AC-4A.2**: Rejects requests with invalid signature (401)
- [x] **AC-4A.3**: Rejects requests with missing signature headers (401)
- [x] **AC-4A.4**: Rejects requests with timestamp >5 minutes old (401, replay protection)
- [x] **AC-4A.5**: Allows requests in development when `MAILGUN_SIGNING_KEY` not set (with warning log)
- [x] **AC-4A.6**: Uses `crypto.timingSafeEqual()` for signature comparison (timing attack protection)

#### Environment Variables

- [x] **AC-4A.7**: `MAILGUN_SIGNING_KEY` added to env schema
- [x] **AC-4A.8**: `MAILGUN_SIGNING_KEY` exposed in `env.mailgun.signingKey`
- [x] **AC-4A.9**: `.env.example` updated with placeholder

#### Test Coverage

- [x] Unit test: Valid signature passes
- [x] Unit test: Invalid signature fails
- [x] Unit test: Missing signature headers fail
- [x] Unit test: Expired timestamp fails
- [x] Unit test: Missing key logs warning and allows (development)
- [x] Integration test: Mock Mailgun webhook with real signature
- [x] Manual test: Send webhook from Mailgun dashboard

#### Status

- [ ] **Environment Setup**: MAILGUN_SIGNING_KEY not obtained
- [ ] **Implementation**: Not started
- [ ] **Unit Tests**: 0% passing
- [ ] **Integration Tests**: Not run
- [ ] **Manual Tests**: Not run
- [ ] **Code Review**: Pending
- [ ] **QA Sign-off**: Pending

---

### Task 4B: Inngest Webhook Signature Verification (2 SP)

#### Functional Requirements

- [x] **AC-4B.1**: POST /api/inngest passes `signingKey` to `serve()` function
- [x] **AC-4B.2**: SDK automatically verifies `X-Inngest-Signature` header
- [x] **AC-4B.3**: SDK returns 401 for invalid signatures (automatic)
- [x] **AC-4B.4**: Throws error at startup if `INNGEST_SIGNING_KEY` missing in production

#### Environment Variables

- [x] **AC-4B.5**: `INNGEST_SIGNING_KEY` already in env schema
- [x] **AC-4B.6**: `INNGEST_SIGNING_KEY` exposed in `env.queue.inngest.signingKey`
- [x] **AC-4B.7**: Production deployment has `INNGEST_SIGNING_KEY` set

#### Test Coverage

- [x] Unit test: Startup throws error if key missing in production
- [x] Unit test: Startup succeeds if key present
- [x] Integration test: Mock valid Inngest request (SDK verifies)
- [x] Integration test: Mock invalid Inngest request → 401 (SDK verifies)
- [x] Manual test: Trigger job from Inngest dashboard

#### Status

- [ ] **Environment Setup**: INNGEST_SIGNING_KEY verification pending
- [ ] **Implementation**: Not started
- [ ] **Unit Tests**: 0% passing
- [ ] **Integration Tests**: Not run
- [ ] **Manual Tests**: Not run
- [ ] **Code Review**: Pending
- [ ] **QA Sign-off**: Pending

---

## Manual QA Procedures

### QA-1: Booking Details Authentication

**Environment**: Staging  
**Prerequisites**: 2 test users (User A, User B), 1 booking owned by User A

**Steps**:

1. **Scenario 1: Unauthenticated Access**
   - Open incognito browser
   - Navigate to `GET /api/bookings/[booking-id]`
   - **Expected**: 401 Unauthorized with `{"error": "Authentication required", "code": "UNAUTHENTICATED"}`

2. **Scenario 2: Authenticated, Wrong User**
   - Sign in as User B
   - Navigate to `GET /api/bookings/[booking-id]` (User A's booking)
   - **Expected**: 403 Forbidden with `{"error": "You can only view your own bookings", "code": "FORBIDDEN"}`

3. **Scenario 3: Authenticated, Correct User**
   - Sign in as User A
   - Navigate to `GET /api/bookings/[booking-id]` (User A's booking)
   - **Expected**: 200 OK with full booking data

4. **Scenario 4: Booking History - Unauthenticated**
   - Open incognito browser
   - Navigate to `GET /api/bookings/[booking-id]/history`
   - **Expected**: 401 Unauthorized

5. **Scenario 5: Booking History - Wrong User**
   - Sign in as User B
   - Navigate to `GET /api/bookings/[booking-id]/history` (User A's booking)
   - **Expected**: 403 Forbidden

6. **Scenario 6: Booking History - Correct User**
   - Sign in as User A
   - Navigate to `GET /api/bookings/[booking-id]/history` (User A's booking)
   - **Expected**: 200 OK with history events

**Sign-off**:

- [ ] QA Engineer: Name, Date
- [ ] Security Review: Name, Date

---

### QA-2: Rate Limiting

**Environment**: Staging  
**Prerequisites**: REST client (Postman, curl)

**Steps**:

1. **Scenario 1: Within Limit**
   - Send 60 POST /api/bookings requests (with unique idempotency keys)
   - **Expected**: All return 201 Created

2. **Scenario 2: Exceeding Limit**
   - Send 61st POST /api/bookings request
   - **Expected**: 429 Too Many Requests with headers:
     ```
     Retry-After: <seconds>
     X-RateLimit-Limit: 60
     X-RateLimit-Remaining: 0
     X-RateLimit-Reset: <timestamp>
     ```

3. **Scenario 3: Rate Limit Reset**
   - Wait for `Retry-After` seconds
   - Send another POST /api/bookings request
   - **Expected**: 201 Created (rate limit reset)

4. **Scenario 4: Different Restaurants**
   - Send 60 requests to restaurant A
   - Send 1 request to restaurant B
   - **Expected**: Restaurant B request succeeds (separate rate limit buckets)

5. **Scenario 5: Idempotency Within Limit**
   - Send 10 requests with same idempotency key
   - **Expected**: All succeed (idempotency prevents duplicates, rate limit still applies)

**Sign-off**:

- [ ] QA Engineer: Name, Date
- [ ] Performance Review: Name, Date

---

### QA-3: Test Endpoint Gating

**Environment**: Production (or local production build)  
**Prerequisites**: Production deployment or `pnpm build && pnpm start`

**Steps**:

1. **Scenario 1: Test Leads Endpoint**
   - curl `POST https://production-domain.com/api/test/leads`
   - **Expected**: 404 Not Found

2. **Scenario 2: Test Invitations Endpoint**
   - curl `POST https://production-domain.com/api/test/invitations`
   - **Expected**: 404 Not Found

3. **Scenario 3: Test Bookings Endpoint**
   - curl `POST https://production-domain.com/api/test/bookings`
   - **Expected**: 404 Not Found

4. **Scenario 4: Test Email Endpoint**
   - curl `POST https://production-domain.com/api/test-email`
   - **Expected**: 404 Not Found

5. **Scenario 5: Playwright Session Endpoint**
   - curl `POST https://production-domain.com/api/test/playwright-session`
   - **Expected**: 404 Not Found

6. **Scenario 6: Test Confirmation Endpoint**
   - curl `GET https://production-domain.com/api/test/reservations/test-id/confirmation`
   - **Expected**: 404 Not Found

7. **Scenario 7: Development Environment**
   - Set `NODE_ENV=development`
   - curl `POST http://localhost:3000/api/test/leads` with valid payload
   - **Expected**: 200 OK (endpoint works in development)

**Sign-off**:

- [ ] QA Engineer: Name, Date
- [ ] Security Review: Name, Date

---

### QA-4: Mailgun Webhook Verification

**Environment**: Staging  
**Prerequisites**: Mailgun account, webhook URL configured

**Steps**:

1. **Scenario 1: Valid Webhook from Mailgun**
   - Send test email via Mailgun dashboard
   - **Expected**: Webhook received, processed, 200 OK logged

2. **Scenario 2: Forged Webhook (Invalid Signature)**
   - Use curl to send POST /api/webhook/mailgun with fake signature
   - **Expected**: 401 Unauthorized
   - **Expected**: Security event logged in observability system

3. **Scenario 3: Expired Timestamp**
   - Use curl to send POST /api/webhook/mailgun with timestamp >5 minutes old
   - **Expected**: 401 Unauthorized

4. **Scenario 4: Missing Signature Headers**
   - Use curl to send POST /api/webhook/mailgun without X-Mailgun-Signature
   - **Expected**: 401 Unauthorized

5. **Scenario 5: Development Without Key**
   - In development environment, remove MAILGUN_SIGNING_KEY
   - Send POST /api/webhook/mailgun
   - **Expected**: 200 OK (allowed) with warning log

**Sign-off**:

- [ ] QA Engineer: Name, Date
- [ ] Security Review: Name, Date

---

### QA-5: Inngest Webhook Verification

**Environment**: Staging  
**Prerequisites**: Inngest account, signing key configured

**Steps**:

1. **Scenario 1: Valid Job Trigger**
   - Trigger booking confirmation job from Inngest dashboard
   - **Expected**: Job executes successfully, email sent

2. **Scenario 2: Forged Request (Invalid Signature)**
   - Use curl to send POST /api/inngest with fake X-Inngest-Signature
   - **Expected**: 401 Unauthorized (SDK handles)

3. **Scenario 3: Production Without Key**
   - Remove INNGEST_SIGNING_KEY from production environment
   - Attempt to start application
   - **Expected**: Startup error (application fails to start)

4. **Scenario 4: Development Mode**
   - In development, trigger Inngest Dev Server job
   - **Expected**: Job executes (Dev Server doesn't sign requests, SDK allows)

**Sign-off**:

- [ ] QA Engineer: Name, Date
- [ ] Security Review: Name, Date

---

## Performance Testing

### Baseline Metrics (Before Changes)

**Captured**: [Date]  
**Environment**: Staging

| Endpoint                       | p50 Latency | p95 Latency | p99 Latency | Error Rate |
| ------------------------------ | ----------- | ----------- | ----------- | ---------- |
| GET /api/bookings/[id]         | TBD         | TBD         | TBD         | TBD        |
| POST /api/bookings             | TBD         | TBD         | TBD         | TBD        |
| GET /api/bookings/[id]/history | TBD         | TBD         | TBD         | TBD        |
| POST /api/webhook/mailgun      | TBD         | TBD         | TBD         | TBD        |
| POST /api/inngest              | TBD         | TBD         | TBD         | TBD        |

### Post-Implementation Metrics

**Captured**: [Date]  
**Environment**: Staging

| Endpoint                       | p50 Latency | p95 Latency | p99 Latency | Δ p95 | Error Rate |
| ------------------------------ | ----------- | ----------- | ----------- | ----- | ---------- |
| GET /api/bookings/[id]         | TBD         | TBD         | TBD         | TBD   | TBD        |
| POST /api/bookings             | TBD         | TBD         | TBD         | TBD   | TBD        |
| GET /api/bookings/[id]/history | TBD         | TBD         | TBD         | TBD   | TBD        |
| POST /api/webhook/mailgun      | TBD         | TBD         | TBD         | TBD   | TBD        |
| POST /api/inngest              | TBD         | TBD         | TBD         | TBD   | TBD        |

**Acceptance Criteria**: Δ p95 latency <100ms for all endpoints

### Load Testing

**Tool**: Artillery or k6  
**Scenario**: Booking Creation Under Load

**Test Plan**:

1. Ramp up to 100 virtual users over 2 minutes
2. Each user sends POST /api/bookings every 10 seconds
3. Run for 10 minutes
4. Measure:
   - Rate limit hit rate
   - 4xx error rate
   - 5xx error rate
   - Response time distribution

**Results**:

- [ ] Rate limit hit rate: <10% (TBD %)
- [ ] 4xx error rate: <1% (TBD %)
- [ ] 5xx error rate: <0.1% (TBD %)
- [ ] p95 latency: <500ms (TBD ms)

**Sign-off**:

- [ ] Performance Engineer: Name, Date

---

## Security Testing

### SEC-1: Timing Attack Prevention

**Objective**: Verify signature comparison is constant-time

**Method**:

1. Send 100 requests with valid signature to /api/webhook/mailgun
2. Measure response time distribution
3. Send 100 requests with invalid signature (first byte different)
4. Measure response time distribution
5. Send 100 requests with invalid signature (last byte different)
6. Measure response time distribution

**Expected**: All distributions have same mean ± 5ms (no timing leak)

**Results**:

- Valid signature: Mean TBD ms, StdDev TBD ms
- Invalid (first byte): Mean TBD ms, StdDev TBD ms
- Invalid (last byte): Mean TBD ms, StdDev TBD ms

**Sign-off**:

- [ ] Security Engineer: Name, Date

---

### SEC-2: Replay Attack Prevention

**Objective**: Verify Mailgun webhook rejects old requests

**Method**:

1. Capture valid Mailgun webhook request (headers + body)
2. Wait 6 minutes
3. Replay exact request to /api/webhook/mailgun

**Expected**: 401 Unauthorized (timestamp too old)

**Results**:

- [ ] Replay rejected: Yes/No (TBD)
- [ ] Security event logged: Yes/No (TBD)

**Sign-off**:

- [ ] Security Engineer: Name, Date

---

### SEC-3: Session Hijacking Prevention

**Objective**: Verify expired sessions cannot access bookings

**Method**:

1. Sign in as User A, capture session token
2. Access GET /api/bookings/[id] → succeeds
3. Sign out User A (invalidates session)
4. Use captured session token to access GET /api/bookings/[id]

**Expected**: 401 Unauthorized (session invalid)

**Results**:

- [ ] Expired session rejected: Yes/No (TBD)

**Sign-off**:

- [ ] Security Engineer: Name, Date

---

### SEC-4: Booking Enumeration Prevention

**Objective**: Verify attacker cannot enumerate bookings

**Method**:

1. Generate 100 random UUIDs
2. Attempt to access GET /api/bookings/[uuid] for each
3. Measure how many return 404 vs. 401

**Expected**: All return 401 (no booking found vs. unauthorized are indistinguishable)

**Results**:

- 401 responses: TBD / 100
- 404 responses: TBD / 100

**Note**: Some 404s may occur if UUIDs don't exist in DB, which is acceptable.

**Sign-off**:

- [ ] Security Engineer: Name, Date

---

## Observability Verification

### Logs to Verify

#### 1. Booking Auth Denials

```json
{
  "source": "api.bookings",
  "eventType": "booking_details.access_denied",
  "severity": "warning",
  "context": {
    "booking_id": "uuid",
    "user_email": "user@example.com",
    "booking_email": "other@example.com"
  },
  "timestamp": "2025-01-15T12:34:56Z"
}
```

**Verification**:

- [ ] Event logged when user tries to access other's booking
- [ ] No full email addresses in logs (only normalized/hashed)
- [ ] User ID anonymized if possible

---

#### 2. Rate Limit Hits

```json
{
  "source": "api.bookings",
  "eventType": "booking_creation.rate_limited",
  "severity": "warning",
  "context": {
    "restaurant_id": "uuid",
    "ip_scope": "192.168.1.x",
    "reset_at": "2025-01-15T12:35:00Z",
    "limit": 60,
    "window_ms": 60000,
    "rate_source": "redis"
  },
  "timestamp": "2025-01-15T12:34:56Z"
}
```

**Verification**:

- [ ] Event logged when rate limit exceeded
- [ ] IP address anonymized (last octet masked)
- [ ] Rate limit source logged (redis or memory)

---

#### 3. Webhook Signature Failures

```json
{
  "source": "webhook.mailgun",
  "eventType": "signature_verification.failed",
  "severity": "error",
  "context": {
    "timestamp": "1735123456",
    "has_token": true,
    "has_signature": true
  },
  "timestamp": "2025-01-15T12:34:56Z"
}
```

**Verification**:

- [ ] Event logged when webhook signature invalid
- [ ] No sensitive data (signature value, email content) in logs
- [ ] Timestamp included for replay attack tracking

---

#### 4. Test Endpoint Access Attempts

```json
{
  "source": "security.test_endpoints",
  "eventType": "test_endpoint.access_blocked",
  "severity": "warning",
  "context": {
    "environment": "production"
  },
  "timestamp": "2025-01-15T12:34:56Z"
}
```

**Verification**:

- [ ] Event logged when test endpoint accessed in production
- [ ] No user agent or IP logged (avoid log pollution)

---

## Monitoring Dashboard Verification

### Dashboard: Booking Security

**Panels**:

1. Auth Denials Over Time (401, 403 by endpoint)
2. Auth Denial Rate (% of total booking requests)
3. Top Denied Users (anonymized IDs)
4. Auth Check Latency (p50, p95, p99)

**Verification**:

- [ ] Dashboard created
- [ ] Data populates from observability events
- [ ] Alerts configured for spikes

---

### Dashboard: Rate Limiting

**Panels**:

1. Rate Limit Hits Over Time (by restaurant)
2. Rate Limit Hit Rate (% of booking creation attempts)
3. Top Rate-Limited IPs (anonymized)
4. Rate Limit Source (redis vs. memory)

**Verification**:

- [ ] Dashboard created
- [ ] Data populates from observability events
- [ ] Alert configured for high hit rate (>10%)

---

### Dashboard: Webhook Security

**Panels**:

1. Webhook Signature Failures Over Time (Mailgun, Inngest)
2. Webhook Failure Rate (% of webhook requests)
3. Webhook Processing Latency (p50, p95, p99)

**Verification**:

- [ ] Dashboard created
- [ ] Data populates from observability events
- [ ] Alert configured for failure spikes

---

## Known Issues

_Document any known issues that don't block release:_

### Issue 1: [Example]

**Description**: Rate limit may occasionally fail over to memory store if Redis has transient issues  
**Impact**: Low - memory store functional for single-instance deployments  
**Workaround**: Redis health monitoring and auto-recovery  
**Tracked**: [Link to ticket]

---

## Deviations from Plan

_Document any deviations from the original plan:_

### Deviation 1: [Example]

**Original Plan**: Use feature flag for booking auth rollout  
**Actual**: Deployed without feature flag (low risk, easy rollback via git revert)  
**Reason**: Feature flag infrastructure not available, rollback plan sufficient  
**Approved By**: Engineering Lead, Date

---

## Sign-Off

### Engineering

- [ ] **Backend Engineer 1**: Name, Date
- [ ] **Backend Engineer 2**: Name, Date
- [ ] **SRE/DevOps**: Name, Date

### Quality Assurance

- [ ] **QA Engineer**: Name, Date
  - [ ] All manual QA procedures completed
  - [ ] All E2E tests passing
  - [ ] Performance tests within acceptable thresholds

### Security

- [ ] **Security Engineer**: Name, Date
  - [ ] Security tests passed
  - [ ] No PII leaks in logs
  - [ ] Signature verification validated
  - [ ] Timing attack prevention confirmed

### Product/Business

- [ ] **Product Lead**: Name, Date
  - [ ] User impact acceptable
  - [ ] No blocking customer issues
  - [ ] Success metrics defined and tracked

### Final Approval

- [ ] **Engineering Lead**: Name, Date
- [ ] **Release Manager**: Name, Date

---

## Post-Release Monitoring (First 7 Days)

### Day 1 (First 24 Hours)

- [ ] No increase in overall error rate (>2x baseline)
- [ ] Auth denial rate <5% of booking requests
- [ ] Rate limit hit rate <10% of booking requests
- [ ] Webhook signature failure rate <1%
- [ ] No P0/P1 incidents reported
- [ ] No rollback triggered

### Day 3 (72 Hours)

- [ ] Metrics stable at Day 1 levels
- [ ] No customer complaints about booking access
- [ ] No false positive rate limit blocks reported
- [ ] Webhook processing normal
- [ ] Performance within SLA

### Day 7 (One Week)

- [ ] Success metrics achieved (see below)
- [ ] No security incidents related to changes
- [ ] All alerts functioning correctly
- [ ] Dashboard data accurate
- [ ] Documentation accurate and complete

---

## Success Metrics

### Immediate (Week 1)

- [x] **Zero PII exposure incidents** after booking auth deployment
- [x] **<5%** of booking requests hit rate limit
- [x] **<0.1%** of webhooks fail signature verification
- [x] **All test endpoints** return 404 in production
- [x] **Auth check latency** <100ms at p95
- [x] **Overall error rate** within 2x baseline

### Medium-Term (Month 1)

- [x] **Zero security incidents** related to affected routes
- [x] **Rate limit alerts** <5 per week
- [x] **All E2E tests** passing consistently
- [x] **No customer complaints** about booking access issues

### Long-Term (Quarter 1)

- [x] **Security audit** passes with no findings
- [x] **Compliance approval** for PII protection
- [x] **Performance SLA** maintained (<500ms p95)
- [x] **Zero rollbacks** due to security issues

---

## Appendices

### A. Test Data

**Test Users**:

- User A: test-user-a@example.com (owns booking A)
- User B: test-user-b@example.com (owns booking B)

**Test Bookings**:

- Booking A: [UUID] owned by User A
- Booking B: [UUID] owned by User B

**Test Restaurants**:

- Restaurant A: [UUID]
- Restaurant B: [UUID]

---

### B. Environment Variables Checklist

**Staging**:

- [ ] MAILGUN_SIGNING_KEY set
- [ ] INNGEST_SIGNING_KEY set
- [ ] UPSTASH_REDIS_REST_URL set
- [ ] UPSTASH_REDIS_REST_TOKEN set
- [ ] NODE_ENV=production (to test prod behavior)

**Production**:

- [ ] MAILGUN_SIGNING_KEY set
- [ ] INNGEST_SIGNING_KEY set
- [ ] UPSTASH_REDIS_REST_URL set
- [ ] UPSTASH_REDIS_REST_TOKEN set
- [ ] NODE_ENV=production

---

### C. Rollback Verification

**If rollback is triggered**:

- [ ] Metrics return to baseline within 5 minutes
- [ ] All functionality restored
- [ ] No data corruption
- [ ] Postmortem scheduled within 24 hours
- [ ] Root cause identified
- [ ] Fix plan created before retry

---

**Last Updated**: 2025-01-15 06:19 UTC  
**Status**: Ready for implementation  
**Version**: 1.0
