# Implementation Plan: Secure Sensitive Routes & Webhooks

**Epic**: EPIC A — Secure sensitive routes & webhooks  
**Created**: 2025-01-15 06:19 UTC  
**Estimated Effort**: 16 SP total (5 + 3 + 3 + 5)  
**Team Capacity**: 2 BE, 1 FE, 1 SRE/DevOps, 1 QA (~32-36 SP available)

---

## Objective

Eliminate 4 critical security gaps in SajiloReserveX API routes and webhook handlers by implementing authentication, rate limiting, environment gating, and signature verification. Enable secure operations without breaking existing functionality.

---

## Success Criteria

### Must Have (P0)

- [ ] Unauthenticated requests to GET /api/bookings/[id] return 401
- [ ] Unauthenticated requests to GET /api/bookings/[id]/history return 401
- [ ] Authenticated users can only view bookings they own (email match)
- [ ] POST /api/bookings rate limited to 60 req/min per (restaurant, IP)
- [ ] All /api/test/\* and /api/test-email return 404 in production
- [ ] Mailgun webhook rejects requests with invalid HMAC signature
- [ ] Inngest webhook rejects requests with invalid signature (via SDK)
- [ ] No regressions in existing authenticated booking flows
- [ ] Rate limit headers (Retry-After) present on 429 responses
- [ ] All changes have unit tests with >80% coverage
- [ ] E2E tests updated and passing

### Should Have (P1)

- [ ] Observability events logged for auth failures, rate limits, signature rejections
- [ ] Structured audit logs for webhook verification failures
- [ ] Quick Reference and Comprehensive docs updated
- [ ] API documentation reflects new auth requirements
- [ ] Performance overhead <100ms per request for auth checks

### Nice to Have (P2)

- [ ] Feature flag for gradual rollout of booking auth
- [ ] Dashboard/metrics for auth denial rates
- [ ] Automated security regression tests

---

## Architecture & Components

### Task 1: Lock Down Booking Details Endpoints (5 SP)

#### Affected Files

- `src/app/api/bookings/[id]/route.ts` (GET, PUT, DELETE handlers)
- `src/app/api/bookings/[id]/history/route.ts` (GET handler)
- `server/bookings/index.ts` (helper functions if needed)

#### Design

**Authentication Flow**:

```
Client Request → GET /api/bookings/[id]
    ↓
1. Extract session via getRouteHandlerSupabaseClient().auth.getUser()
2. If no user → 401 Unauthorized
3. Load booking from database (service client)
4. Normalize user.email and booking.customer_email
5. If emails don't match → 403 Forbidden
6. Return booking data
```

**Code Changes**:

```typescript
// src/app/api/bookings/[id]/route.ts

export async function GET(req: NextRequest, { params }: RouteParams) {
  const bookingId = await resolveBookingId(params);

  if (!bookingId) {
    return NextResponse.json({ error: 'Missing booking id' }, { status: 400 });
  }

  // NEW: Require authentication
  const tenantSupabase = await getRouteHandlerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await tenantSupabase.auth.getUser();

  if (authError || !user?.email) {
    return NextResponse.json(
      { error: 'Authentication required', code: 'UNAUTHENTICATED' },
      { status: 401 },
    );
  }

  const normalizedUserEmail = normalizeEmail(user.email);

  // Use service client to bypass RLS
  const serviceSupabase = getServiceSupabaseClient();
  const { data, error } = await serviceSupabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  // NEW: Verify ownership
  if (data.customer_email !== normalizedUserEmail) {
    // Log unauthorized access attempt
    void recordObservabilityEvent({
      source: 'api.bookings',
      eventType: 'booking_details.access_denied',
      severity: 'warning',
      context: {
        booking_id: bookingId,
        user_email: normalizedUserEmail,
        booking_email: data.customer_email,
      },
    });

    return NextResponse.json(
      { error: 'You can only view your own bookings', code: 'FORBIDDEN' },
      { status: 403 },
    );
  }

  return NextResponse.json({ booking: data });
}
```

**History Endpoint**: Already has auth, just needs ownership check refinement.

#### Edge Cases

1. **Staff Access**: Ops console uses different endpoints (/api/ops/bookings/[id])
2. **Confirmation Pages**: Use reservation tokens, not booking IDs directly
3. **Email Case Sensitivity**: Use `normalizeEmail()` consistently
4. **Missing Email**: Reject if user.email is null/undefined

#### Rollback Plan

- Keep old endpoint logic in commented code block
- Feature flag: `FEATURE_REQUIRE_BOOKING_AUTH=true`
- If issues: toggle flag to false, redeploy

---

### Task 2: Rate-Limit Booking Creation (3 SP)

#### Affected Files

- `src/app/api/bookings/route.ts` (POST handler)
- `server/security/rate-limit.ts` (already exists, no changes)

#### Design

**Rate Limit Configuration**:

- **Identifier**: `bookings:create:{restaurantId}:{clientIp}`
- **Limit**: 60 requests
- **Window**: 60,000 ms (1 minute)
- **Response**: 429 with Retry-After header

**Code Changes**:

```typescript
// src/app/api/bookings/route.ts (POST handler, after validation)

export async function POST(req: NextRequest) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const parsed = bookingSchema.safeParse(payload);
  if (!parsed.success) {
    return handleZodError(parsed.error);
  }

  const data = parsed.data;
  const restaurantId = data.restaurantId ?? (await getDefaultRestaurantId());
  const clientIp = extractClientIp(req);

  // NEW: Rate limiting
  const rateResult = await consumeRateLimit({
    identifier: `bookings:create:${restaurantId}:${clientIp}`,
    limit: 60,
    windowMs: 60_000,
  });

  if (!rateResult.ok) {
    const retryAfterSeconds = Math.max(1, Math.ceil((rateResult.resetAt - Date.now()) / 1000));

    // Log rate limit event
    void recordObservabilityEvent({
      source: 'api.bookings',
      eventType: 'booking_creation.rate_limited',
      severity: 'warning',
      context: {
        restaurant_id: restaurantId,
        ip_scope: anonymizeIp(clientIp),
        reset_at: new Date(rateResult.resetAt).toISOString(),
        limit: rateResult.limit,
        window_ms: 60_000,
        rate_source: rateResult.source,
      },
    });

    return NextResponse.json(
      {
        error: 'Too many booking requests. Please try again in a moment.',
        code: 'RATE_LIMITED',
        retryAfter: retryAfterSeconds,
      },
      {
        status: 429,
        headers: {
          'Retry-After': retryAfterSeconds.toString(),
          'X-RateLimit-Limit': rateResult.limit.toString(),
          'X-RateLimit-Remaining': rateResult.remaining.toString(),
          'X-RateLimit-Reset': rateResult.resetAt.toString(),
        },
      },
    );
  }

  // Continue with existing booking creation logic...
}
```

#### Edge Cases

1. **Legitimate Retries**: Idempotency keys prevent duplicate bookings even within rate limit
2. **Shared IPs**: Corporate/NAT IPs may hit limit faster → monitored via observability
3. **Redis Failure**: Falls back to in-memory limiter (warns in logs)
4. **Clock Skew**: Upstash handles timestamp windows internally

#### Monitoring

- Alert if >10% of booking attempts hit rate limit in 1 hour
- Dashboard showing rate limit hits by restaurant and time of day

---

### Task 3: Gate Test/Dev Endpoints in Production (3 SP)

#### Affected Files

- `src/app/api/test/leads/route.ts`
- `src/app/api/test/invitations/route.ts`
- `src/app/api/test/bookings/route.ts`
- `src/app/api/test/playwright-session/route.ts`
- `src/app/api/test/reservations/[reservationId]/confirmation/route.ts`
- `src/app/api/test-email/route.ts`

#### Design

**Environment Guard Pattern**:

```typescript
import { env } from '@/lib/env';

function guardProductionAccess(): NextResponse | null {
  if (env.node.env === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return null;
}

export async function POST(req: NextRequest) {
  const guard = guardProductionAccess();
  if (guard) return guard;

  // Proceed with test logic...
}

export async function GET(req: NextRequest) {
  const guard = guardProductionAccess();
  if (guard) return guard;

  // Proceed with test logic...
}
```

**Shared Utility** (create `server/guards/test-endpoints.ts`):

```typescript
import { NextResponse } from 'next/server';
import { env } from '@/lib/env';

/**
 * Guards test/dev endpoints from production access.
 * Returns 404 in production, null otherwise.
 */
export function guardTestEndpoint(): NextResponse | null {
  const isProd = env.node.env === 'production';

  if (isProd) {
    // Log unauthorized test endpoint access attempt
    void recordObservabilityEvent({
      source: 'security.test_endpoints',
      eventType: 'test_endpoint.access_blocked',
      severity: 'warning',
      context: {
        environment: 'production',
      },
    });

    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return null;
}
```

#### Implementation Steps

1. Create `server/guards/test-endpoints.ts` with `guardTestEndpoint()`
2. Add guard to **every handler** (GET, POST, PUT, DELETE) in each file
3. Add unit tests to verify 404 in production
4. Update E2E tests to skip test endpoint calls in production builds

#### Edge Cases

1. **CI/CD**: Tests run in `NODE_ENV=test`, not production
2. **Staging**: Uses `NODE_ENV=production` → test endpoints will be blocked
3. **Local Production Build**: `pnpm build && pnpm start` should block endpoints

#### Acceptance Criteria

- [ ] Manual test: `curl -X POST https://production-domain.com/api/test/leads` → 404
- [ ] CI check: Script that verifies 404 response in production build
- [ ] No log errors from missing environment variables

---

### Task 4: Webhook Signature Verification (5 SP)

#### 4A: Mailgun Webhook (3 SP)

##### Affected Files

- `src/app/api/webhook/mailgun/route.ts`
- `config/env.schema.ts` (add MAILGUN_SIGNING_KEY)
- `lib/env.ts` (expose signing key)

##### Design

**Environment Variable**:

```typescript
// config/env.schema.ts
export const baseSchema = z.object({
  // ... existing fields
  MAILGUN_SIGNING_KEY: z.string().optional(),
});
```

```typescript
// lib/env.ts
get mailgun() {
  const parsed = parseEnv();
  return {
    apiKey: parsed.MAILGUN_API_KEY,
    signingKey: parsed.MAILGUN_SIGNING_KEY,
  } as const;
}
```

**Verification Utility** (create `server/webhooks/mailgun.ts`):

```typescript
import crypto from 'crypto';
import { env } from '@/lib/env';

export type MailgunWebhookHeaders = {
  timestamp: string;
  token: string;
  signature: string;
};

export function verifyMailgunSignature(headers: MailgunWebhookHeaders): boolean {
  const signingKey = env.mailgun.signingKey;

  if (!signingKey) {
    console.warn('[mailgun] MAILGUN_SIGNING_KEY not configured, skipping verification');
    return true; // Allow in development/staging without key
  }

  const { timestamp, token, signature } = headers;

  if (!timestamp || !token || !signature) {
    return false;
  }

  // Replay protection: reject if >5 minutes old
  const timestampMs = parseInt(timestamp, 10) * 1000;
  const age = Date.now() - timestampMs;
  if (age > 5 * 60 * 1000) {
    console.warn('[mailgun] Webhook timestamp too old:', age / 1000, 'seconds');
    return false;
  }

  // Compute HMAC
  const data = timestamp + token;
  const hmac = crypto.createHmac('sha256', signingKey);
  hmac.update(data);
  const computedSignature = hmac.digest('hex');

  // Timing-safe comparison
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(computedSignature, 'hex'),
    );
  } catch {
    return false;
  }
}
```

**Updated Route Handler**:

```typescript
// src/app/api/webhook/mailgun/route.ts
import { verifyMailgunSignature } from "@/server/webhooks/mailgun";

export async function POST(req: NextRequest) {
  try {
    // Extract signature headers
    const headers = {
      timestamp: req.headers.get("X-Mailgun-Timestamp") ?? "",
      token: req.headers.get("X-Mailgun-Token") ?? "",
      signature: req.headers.get("X-Mailgun-Signature") ?? "",
    };

    // Verify signature
    const isValid = verifyMailgunSignature(headers);

    if (!isValid) {
      // Log security event
      void recordObservabilityEvent({
        source: "webhook.mailgun",
        eventType: "signature_verification.failed",
        severity: "error",
        context: {
          timestamp: headers.timestamp,
          has_token: !!headers.token,
          has_signature: !!headers.signature,
        },
      });

      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 }
      );
    }

    // Continue with existing logic...
    const formData = await req.formData();
    const sender = formData.get("From");
    const subject = formData.get("Subject");
    const html = formData.get("body-html");

    if (config.mailgun.forwardRepliesTo && html && subject && sender) {
      await sendEmail({ ... });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = stringifyError(error);
    console.error("[mailgun][webhook]", message);
    return NextResponse.json(
      { error: "Failed to handle webhook" },
      { status: 500 }
    );
  }
}
```

##### Edge Cases

1. **Missing Key**: Logs warning, allows request (development mode)
2. **Invalid Hex**: `timingSafeEqual` throws → caught and returns false
3. **Replay Attacks**: 5-minute window prevents old requests
4. **Clock Skew**: Server and Mailgun clocks may differ slightly (5min buffer accounts for this)

#### 4B: Inngest Webhook (2 SP)

##### Affected Files

- `src/app/api/inngest/route.ts`
- `server/queue/inngest.ts` (already has signingKey available)

##### Design

**Code Changes**:

```typescript
// src/app/api/inngest/route.ts
import { serve } from 'inngest/next';
import { env } from '@/lib/env';
import { bookingSideEffectFunctions } from '@/server/jobs/booking-side-effects';
import { inngest } from '@/server/queue/inngest';

const signingKey = env.queue.inngest.signingKey;

if (!signingKey && env.node.env === 'production') {
  throw new Error('INNGEST_SIGNING_KEY is required in production');
}

const handler = serve({
  client: inngest,
  functions: bookingSideEffectFunctions,
  signingKey: signingKey, // SDK automatically verifies signature
});

export const GET = handler.GET;
export const POST = handler.POST;
export const PUT = handler.PUT;
```

**SDK Behavior**:

- If `signingKey` provided: Automatically verifies `X-Inngest-Signature` header
- If invalid: SDK returns 401 before executing functions
- If missing key: SDK warns but allows requests (development)

##### Edge Cases

1. **Development Mode**: Inngest Dev Server doesn't send signatures → SDK allows
2. **Production Without Key**: Throws error at startup (fail-fast)
3. **Signature Rotation**: SDK supports multiple keys during rotation (check SDK version)

##### Testing

- Mock Inngest requests with valid/invalid signatures
- Verify 401 response for invalid signatures
- Verify function execution for valid signatures

---

## Data Flow & State Management

### Authentication Flow (Tasks 1 & 4A)

```
Request → Middleware (session refresh)
    ↓
Route Handler
    ↓
getRouteHandlerSupabaseClient().auth.getUser()
    ↓
If user → Extract email → Normalize
    ↓
Load booking (service client)
    ↓
Compare emails → Allow/Deny
```

### Rate Limiting Flow (Task 2)

```
Request → Extract restaurantId, clientIp
    ↓
consumeRateLimit({ identifier, limit, windowMs })
    ↓
Redis: INCR key (or memory fallback)
    ↓
If count > limit → 429 with Retry-After
    ↓
Else → Continue
```

### Webhook Verification Flow (Task 4)

```
Webhook Request → Extract signature headers
    ↓
Compute HMAC with signing key
    ↓
Timing-safe comparison
    ↓
If invalid → 401 + audit log
    ↓
Else → Process webhook
```

---

## API Contracts

### GET /api/bookings/[id] (Updated)

**Request**:

```
GET /api/bookings/[id]
Headers:
  Cookie: sb-access-token=XXX (Supabase session)
```

**Response (Success)**:

```json
{
  "booking": {
    "id": "uuid",
    "restaurant_id": "uuid",
    "customer_email": "user@example.com",
    "customer_name": "John Doe",
    "party_size": 4,
    "start_at": "2025-09-25T19:00:00Z",
    "status": "confirmed",
    ...
  }
}
```

**Response (Unauthenticated)**:

```json
{
  "error": "Authentication required",
  "code": "UNAUTHENTICATED"
}
```

Status: 401

**Response (Forbidden)**:

```json
{
  "error": "You can only view your own bookings",
  "code": "FORBIDDEN"
}
```

Status: 403

### POST /api/bookings (Updated)

**Request**:

```json
POST /api/bookings
Headers:
  Idempotency-Key: uuid
Body: { ... existing booking payload ... }
```

**Response (Rate Limited)**:

```json
{
  "error": "Too many booking requests. Please try again in a moment.",
  "code": "RATE_LIMITED",
  "retryAfter": 45
}
```

Status: 429
Headers:

```
Retry-After: 45
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1735123456789
```

### POST /api/test/\* (Updated)

**Request**:

```
POST /api/test/leads
Body: { "email": "test@example.com" }
```

**Response (Production)**:

```json
{
  "error": "Not found"
}
```

Status: 404

### POST /api/webhook/mailgun (Updated)

**Request**:

```
POST /api/webhook/mailgun
Headers:
  X-Mailgun-Timestamp: 1735123456
  X-Mailgun-Token: abc123
  X-Mailgun-Signature: hex_signature
Body: (form-data with email content)
```

**Response (Invalid Signature)**:

```json
{
  "error": "Invalid webhook signature"
}
```

Status: 401

---

## UI/UX States

**Not applicable** - All changes are backend API routes. Frontend remains unchanged, except:

- If booking details page relies on unauthenticated GET, will need to ensure user is signed in
- Rate limit errors (429) should show user-friendly message: "Too many requests. Please wait and try again."

---

## Edge Cases

### Cross-Cutting

1. **Clock Skew**: Webhook timestamps use 5-minute buffer
2. **Redis Downtime**: Rate limiter falls back to in-memory (logs warning)
3. **Session Expiry**: Middleware refreshes session automatically
4. **Concurrent Requests**: Idempotency keys prevent duplicate bookings even within rate limit

### Booking Auth

1. **Staff vs. Customer**: Ops endpoints (/api/ops/bookings/\*) remain unchanged
2. **Email Case**: Always normalize via `normalizeEmail()`
3. **Missing Email**: User without email cannot access bookings (edge case, should not occur with Supabase Auth)

### Rate Limiting

1. **Shared IPs**: May hit limit faster, but legitimate users have idempotency keys to retry safely
2. **Distributed Systems**: Redis ensures consistency across instances
3. **Burst Traffic**: 60/min allows legitimate retries during network issues

### Test Endpoints

1. **CI/CD**: Tests run in `NODE_ENV=test`, not blocked
2. **Local Production**: `next build && next start` will block test endpoints

### Webhooks

1. **Mailgun Development**: No signing key → allows requests with warning
2. **Inngest Development**: Dev Server doesn't sign requests → SDK allows
3. **Key Rotation**: Inngest SDK supports multiple keys (if version >= 2.5.0)

---

## Testing Strategy

### Unit Tests

#### Task 1: Booking Auth

- [ ] `GET /api/bookings/[id]` with no session → 401
- [ ] `GET /api/bookings/[id]` with session but wrong email → 403
- [ ] `GET /api/bookings/[id]` with session and matching email → 200
- [ ] `GET /api/bookings/[id]/history` with ownership → 200
- [ ] Normalize email case sensitivity handling

#### Task 2: Rate Limiting

- [ ] First 60 requests succeed
- [ ] 61st request returns 429
- [ ] Retry-After header present
- [ ] Rate limit resets after window
- [ ] Different restaurants have separate limits
- [ ] Idempotency key prevents duplicate bookings within limit

#### Task 3: Test Endpoints

- [ ] All test endpoints return 404 when `NODE_ENV=production`
- [ ] All test endpoints work when `NODE_ENV=development`
- [ ] Guard function returns correct responses

#### Task 4A: Mailgun Verification

- [ ] Valid signature passes
- [ ] Invalid signature fails
- [ ] Missing signature fails
- [ ] Expired timestamp (>5 min) fails
- [ ] Missing signing key logs warning and allows (development)

#### Task 4B: Inngest Verification

- [ ] Valid signature passes (SDK handles)
- [ ] Invalid signature returns 401 (SDK handles)
- [ ] Missing signing key throws error in production

### Integration Tests

- [ ] Full booking creation flow with rate limiting
- [ ] Authenticated user can view own booking
- [ ] Authenticated user cannot view other user's booking
- [ ] Mailgun webhook with real signature verification
- [ ] Inngest job execution with signature verification

### E2E Tests (Playwright)

**Update Existing Tests**:

- [ ] `tests/e2e/bookings/*.spec.ts` - Ensure user is authenticated before accessing booking details
- [ ] `tests/e2e/ops/*.spec.ts` - Verify ops endpoints still work (different routes)

**New Tests**:

- [ ] `tests/e2e/security/booking-auth.spec.ts` - Attempt to access other user's booking → 403
- [ ] `tests/e2e/security/rate-limiting.spec.ts` - Send 61 booking requests → 429
- [ ] `tests/e2e/security/test-endpoints.spec.ts` - Verify 404 in production build

### Security Tests

- [ ] **Timing Attack**: Measure response time for valid vs. invalid signatures (should be constant)
- [ ] **Replay Attack**: Reuse old Mailgun webhook → rejected
- [ ] **Session Hijack**: Attempt to use expired session token → 401
- [ ] **Enumeration**: Try random booking UUIDs without auth → 401

### Accessibility Tests

**Not applicable** - Backend API changes only.

---

## Rollout Strategy

### Phase 0: Preparation (Week 1)

- [ ] Create task directory and documentation
- [ ] Obtain MAILGUN_SIGNING_KEY from DevOps
- [ ] Confirm INNGEST_SIGNING_KEY is configured
- [ ] Review plan with team

### Phase 1: Test Endpoints (Week 1)

- [ ] Implement `guardTestEndpoint()` utility
- [ ] Apply to all test endpoints
- [ ] Unit tests
- [ ] Deploy to staging → verify 404
- [ ] Deploy to production → verify 404
- [ ] Monitor for errors (should be none)

**Rollback**: Revert commit if any issues.

### Phase 2: Rate Limiting (Week 1-2)

- [ ] Add rate limiting to POST /api/bookings
- [ ] Unit tests
- [ ] Integration tests with real Redis
- [ ] Deploy to staging → monitor rate limit hits
- [ ] Deploy to production with monitoring
- [ ] Alert if >10% of requests hit rate limit

**Rollback**: Remove rate limit check, redeploy.

### Phase 3: Webhook Verification (Week 2)

- [ ] Implement Mailgun signature verification
- [ ] Implement Inngest signing key configuration
- [ ] Unit tests
- [ ] Test webhooks in staging
- [ ] Deploy to production
- [ ] Monitor webhook logs for signature failures

**Rollback**: Remove verification checks, redeploy.

### Phase 4: Booking Auth (Week 2-3)

- [ ] Implement auth checks on GET /api/bookings/[id]
- [ ] Refine GET /api/bookings/[id]/history ownership check
- [ ] Unit tests
- [ ] Integration tests
- [ ] Update frontend if needed (ensure session cookies sent)
- [ ] Update E2E tests
- [ ] Deploy to staging → manual QA
- [ ] Deploy to production with gradual rollout (feature flag if possible)
- [ ] Monitor auth denial rates

**Rollback**: Toggle feature flag or revert commit.

### Monitoring

**Metrics to Track**:

- Auth denial rate (target: <1% of requests)
- Rate limit hit rate (target: <5% of requests)
- Webhook signature failure rate (target: <0.1%)
- API response time (target: p95 <500ms)

**Alerts**:

- Spike in 401/403 errors (>100/min)
- Spike in 429 errors (>50/min)
- Webhook signature failures (>10/hour)

**Dashboards**:

- Grafana/DataDog with panels for:
  - Auth success/failure by endpoint
  - Rate limit hits by restaurant
  - Webhook verification status

---

## Performance Considerations

### Latency Impact

| Operation                 | Overhead | Mitigation             |
| ------------------------- | -------- | ---------------------- |
| Auth check (getUser)      | ~30-50ms | Cached in Supabase SDK |
| Email normalization       | <1ms     | Pure function          |
| Rate limit check (Redis)  | ~10-20ms | Fast Redis ops         |
| Rate limit check (memory) | <1ms     | In-memory Map          |
| HMAC computation          | ~1-2ms   | Native crypto module   |

**Total per request**: ~50-100ms worst case

### Optimization Strategies

- Auth check result could be cached per request lifecycle (not across requests)
- Rate limit uses Redis pipelining (already implemented)
- Webhook verification uses timing-safe comparison (constant time)

### Scalability

- Redis rate limiter handles millions of requests/sec
- Supabase Auth handles 1000s of concurrent sessions
- Webhook verification is CPU-bound but very fast (<2ms)

---

## Security Considerations

### Threat Model

| Threat              | Mitigation                | Residual Risk |
| ------------------- | ------------------------- | ------------- |
| PII exposure        | Auth + ownership check    | Low           |
| Booking spam        | Rate limiting             | Low-Medium    |
| Test endpoint abuse | Production gate           | Low           |
| Forged webhooks     | Signature verification    | Low           |
| Session hijacking   | HTTP-only cookies + HTTPS | Low           |
| Timing attacks      | `crypto.timingSafeEqual`  | Very Low      |
| Replay attacks      | Timestamp validation      | Low           |

### Compliance

- **GDPR**: PII now protected by authentication
- **CCPA**: User data access controlled
- **PCI-DSS**: Not applicable (no payment data in these endpoints)

---

## Documentation Updates

### Files to Update

- [ ] `COMPREHENSIVE_ROUTE_ANALYSIS.md` - Update auth status for affected routes
- [ ] `ROUTE_QUICK_REFERENCE.md` - Mark booking endpoints as "Auth: User"
- [ ] API documentation (if exists) - Add auth requirements and rate limits
- [ ] README.md - Add webhook configuration instructions
- [ ] `.env.example` - Add MAILGUN_SIGNING_KEY and INNGEST_SIGNING_KEY

### Developer Notes

Add to repository docs:

```markdown
## Webhook Security

### Mailgun

Set `MAILGUN_SIGNING_KEY` to your Mailgun signing key (found in Mailgun dashboard under Webhooks).

### Inngest

Set `INNGEST_SIGNING_KEY` to your Inngest signing key (found in Inngest dashboard under Signing Keys).

Both keys are **required in production**. Missing keys will cause startup errors.
```

---

## Dependencies & Prerequisites

### Environment Variables

- [ ] `MAILGUN_SIGNING_KEY` - Obtain from Mailgun dashboard
- [ ] `INNGEST_SIGNING_KEY` - Confirm configured (already in schema)
- [ ] `UPSTASH_REDIS_REST_URL` - Already configured
- [ ] `UPSTASH_REDIS_REST_TOKEN` - Already configured

### External Services

- [ ] Supabase Auth - Already configured
- [ ] Upstash Redis - Already configured
- [ ] Mailgun - Signing key needed
- [ ] Inngest - Signing key needed

### Code Dependencies

- [x] `inngest` SDK (>= v2.0.0 for signature support)
- [x] `crypto` module (Node.js built-in)
- [x] `@upstash/redis` (already installed)

---

## Risks & Mitigation

### High Risk

1. **Breaking Change**: Booking auth may break existing clients
   - **Mitigation**: Feature flag + gradual rollout + monitoring
   - **Fallback**: Revert via feature flag toggle

2. **Rate Limit False Positives**: Legitimate users blocked
   - **Mitigation**: Monitor rate limit hit rate, adjust limits if needed
   - **Fallback**: Increase limit or disable temporarily

### Medium Risk

1. **Performance Degradation**: Auth checks add latency
   - **Mitigation**: Monitor p95 latency, optimize if >100ms overhead
   - **Fallback**: Remove auth checks if critical

2. **Redis Downtime**: Rate limiting fails over to memory
   - **Mitigation**: Memory fallback functional, alerts on Redis issues
   - **Fallback**: N/A (automatic fallback)

### Low Risk

1. **Webhook Key Rotation**: May cause temporary failures
   - **Mitigation**: Inngest SDK supports multiple keys during rotation
   - **Fallback**: Temporarily disable verification during rotation

2. **Test Endpoint Discovery**: Attackers probe for test endpoints
   - **Mitigation**: 404 response (indistinguishable from missing route)
   - **Fallback**: N/A (already mitigated)

---

## Success Metrics

### Immediate (Week 1-2)

- [ ] Zero PII exposure incidents after booking auth deployment
- [ ] <5% of booking requests hit rate limit
- [ ] <0.1% of webhooks fail signature verification
- [ ] All test endpoints return 404 in production

### Medium-Term (Month 1)

- [ ] Auth check latency <100ms at p95
- [ ] Zero security incidents related to affected routes
- [ ] Rate limit alerts <5 per week
- [ ] All E2E tests passing

### Long-Term (Quarter 1)

- [ ] Security audit passes with no findings on these routes
- [ ] Compliance team approves PII protection measures
- [ ] Performance metrics within SLA (<500ms p95)

---

## Appendices

### A. Code Review Checklist

- [ ] All auth checks use `getUser()` not just session check
- [ ] Email comparison uses `normalizeEmail()` consistently
- [ ] Rate limit identifiers include both restaurantId and IP
- [ ] Error responses include `code` field for client handling
- [ ] Observability events logged for security failures
- [ ] Unit tests cover edge cases (no session, wrong email, expired timestamp)
- [ ] No PII in logs (use `anonymizeIp()`)

### B. Testing Checklist

- [ ] Unit tests for each route change
- [ ] Integration tests with real Supabase/Redis
- [ ] E2E tests updated for auth requirements
- [ ] Security tests for bypass attempts
- [ ] Performance tests for latency impact
- [ ] Staging deployment verified
- [ ] Production deployment monitored

### C. Rollback Checklist

- [ ] Feature flags toggled
- [ ] Git revert commit prepared
- [ ] Deployment pipeline ready for emergency rollback
- [ ] Communication plan for downtime (if needed)

---

## Timeline

**Total Effort**: 16 SP  
**Team Capacity**: 32-36 SP (2 BE, 1 SRE, 1 QA)  
**Duration**: 2 sprints (4 weeks)

### Sprint 1 (Week 1-2)

- **Week 1**: Tasks 3 (Test Endpoints) + Task 2 (Rate Limiting)
- **Week 2**: Task 4 (Webhooks)

### Sprint 2 (Week 3-4)

- **Week 3-4**: Task 1 (Booking Auth) + QA + Documentation

---

## Sign-Off

- [ ] Engineering Lead: Implementation plan approved
- [ ] Security Lead: Security measures approved
- [ ] Product Lead: User impact acceptable
- [ ] DevOps Lead: Infrastructure ready (Redis, signing keys)
- [ ] QA Lead: Testing strategy approved

---

**Last Updated**: 2025-01-15 06:19 UTC  
**Version**: 1.0  
**Status**: Ready for implementation
