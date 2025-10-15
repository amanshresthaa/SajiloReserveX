# Research: Secure Sensitive Routes & Webhooks

**Epic**: EPIC A — Secure sensitive routes & webhooks  
**Created**: 2025-01-15 06:19 UTC  
**Estimated Effort**: 16 SP (5 + 3 + 3 + 5)

---

## Executive Summary

Analysis of SajiloReserveX codebase reveals **4 critical security gaps** in API routes and webhook handlers:

1. **Booking details endpoints expose PII without authentication** (5 SP fix)
2. **Booking creation lacks rate limiting** (3 SP fix)
3. **Test/dev endpoints accessible in production** (3 SP fix)
4. **Webhooks missing signature verification** (5 SP fix)

All gaps are documented in ROUTE_QUICK_REFERENCE.md and COMPREHENSIVE_ROUTE_ANALYSIS.md. This research identifies existing patterns, reusable utilities, and implementation strategies.

---

## 1. Current Security Landscape

### Authentication Infrastructure

- **Provider**: Supabase Auth (magic link, passwordless)
- **Session Storage**: HTTP-only cookies via Supabase SSR
- **Middleware**: `middleware.ts` - protects `/my-bookings`, `/profile`, `/thank-you`
- **Client Types**:
  - Service Client: `getServiceSupabaseClient()` - bypasses RLS
  - Route Handler Client: `getRouteHandlerSupabaseClient()` - user session
  - Server Component Client: `getServerComponentSupabaseClient()` - user session

### Authorization Patterns

Located in `server/auth/guards.ts`:

- `requireSession()` - Ensures user is authenticated
- `listUserRestaurantMemberships()` - Get staff memberships
- `requireMembershipForRestaurant()` - Verify staff access to restaurant
- `GuardError` - Standardized error class with status, code, message, details

### Rate Limiting Infrastructure

**Location**: `server/security/rate-limit.ts`

**Storage**:

- Production: Upstash Redis (distributed)
- Development: In-memory Map (single-instance fallback)

**API**: `consumeRateLimit({ identifier, limit, windowMs })`

**Current Usage**:

- Guest booking lookup: 20 req/60s per (restaurant, IP)
- Ops bookings list: 120 req/60s per user
- Ops booking create: 60 req/60s per (user, restaurant)

**Response Pattern**:

```typescript
if (!rateResult.ok) {
  const retryAfterSeconds = Math.max(1, Math.ceil((rateResult.resetAt - Date.now()) / 1000));
  return NextResponse.json(
    { error: 'Too many requests', code: 'RATE_LIMITED' },
    { status: 429, headers: { 'Retry-After': retryAfterSeconds.toString() } },
  );
}
```

### Request Security Utilities

**Location**: `server/security/request.ts`

- `extractClientIp(req)` - Extracts IP from headers (x-forwarded-for, x-real-ip)
- `anonymizeIp(ip)` - Anonymizes IP for logging (masks last octet)

---

## 2. Security Gap Analysis

### Gap 1: Booking Details Endpoints (5 SP)

#### Routes Affected

- `GET /api/bookings/[id]` - `src/app/api/bookings/[id]/route.ts`
- `GET /api/bookings/[id]/history` - `src/app/api/bookings/[id]/history/route.ts`

#### Current State

**`GET /api/bookings/[id]`** (Lines 323-348):

```typescript
export async function GET(req: NextRequest, { params }: RouteParams) {
  const bookingId = await resolveBookingId(params);

  const supabase = await getRouteHandlerSupabaseClient();
  const { data, error } = await supabase
    .from('bookings')
    .select('id,restaurant_id,booking_date,...,customer_email,customer_phone,...')
    .eq('id', bookingId)
    .maybeSingle();

  if (!data) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  return NextResponse.json({ booking: data }); // ⚠️ NO AUTH CHECK
}
```

**`GET /api/bookings/[id]/history`** (Lines 37-78):

```typescript
export async function GET(req: NextRequest, { params }: RouteParams) {
  // ✅ Has auth check
  const {
    data: { user },
    error: authError,
  } = await tenantSupabase.auth.getUser();
  if (authError || !user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ✅ Verifies ownership
  const normalizedEmail = normalizeEmail(user.email);
  if (bookingRow.customer_email !== normalizedEmail) {
    return NextResponse.json(
      { error: 'You can only view history for your own reservation' },
      { status: 403 },
    );
  }

  // However, uses service client which bypasses RLS
  const events = await getBookingHistory(serviceSupabase, bookingId, parsedQuery.data);
  return NextResponse.json({ events, pagination });
}
```

#### Risk Assessment

- **PII Exposure**: `customer_name`, `customer_email`, `customer_phone`, `notes`, `marketing_opt_in`
- **Operational Data**: `party_size`, `booking_date`, `start_time`, `end_time`, `seating_preference`
- **Attack Vector**: Enumerate booking IDs (UUIDs are predictable with enough samples)
- **Compliance**: GDPR, CCPA violations if PII accessible without consent

#### Existing Patterns to Reuse

**Email Ownership Check** (from `/api/bookings/[id]/route.ts` DELETE):

```typescript
const {
  data: { user },
  error: authError,
} = await tenantSupabase.auth.getUser();
if (authError || !user?.email) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

const normalizedEmail = normalizeEmail(user.email);
if (existingBooking.customer_email !== normalizedEmail) {
  return NextResponse.json({ error: 'You can only cancel your own reservation' }, { status: 403 });
}
```

**Redacted DTO Pattern** (potential approach):

```typescript
type PublicBookingDTO = {
  id: string;
  restaurant_id: string;
  booking_date: string;
  start_time: string;
  party_size: number;
  status: string;
  // NO PII fields
};
```

---

### Gap 2: Booking Creation Rate Limiting (3 SP)

#### Route Affected

- `POST /api/bookings` - `src/app/api/bookings/route.ts`

#### Current State

**Lines 292-737** (POST handler):

- ✅ Has idempotency key handling
- ✅ Validates operating hours
- ✅ Prevents duplicate bookings
- ❌ **NO RATE LIMITING** on creation

**Contrast with GET** (Lines 259-290):

```typescript
// Guest lookup HAS rate limiting
const rateResult = await consumeRateLimit({
  identifier: `bookings:lookup:${targetRestaurantId}:${clientIp}`,
  limit: 20,
  windowMs: 60_000,
});
```

#### Risk Assessment

- **Attack Vector**: Spam bookings, capacity exhaustion
- **Business Impact**: Overbooked restaurants, customer dissatisfaction
- **Resource Cost**: Database writes, email sending, Inngest jobs
- **Existing Mitigation**: Idempotency keys help but don't prevent repeated requests with new keys

#### Recommended Limit

Based on existing patterns and normal user behavior:

- **Limit**: 30-60 requests per minute per IP
- **Identifier**: `bookings:create:{restaurantId}:{clientIp}`
- **Rationale**:
  - Guest lookup uses 20/min (read)
  - Ops create uses 60/min (authenticated)
  - 30-60/min balances protection vs. legitimate retries

---

### Gap 3: Test/Dev Endpoints in Production (3 SP)

#### Routes Affected

All files in:

- `/api/test/*` - `src/app/api/test/`
  - `leads/route.ts`
  - `invitations/route.ts`
  - `bookings/route.ts`
  - `playwright-session/route.ts`
  - `reservations/[reservationId]/confirmation/route.ts`
- `/api/test-email` - `src/app/api/test-email/route.ts`

#### Current State

**`/api/test-email/route.ts`** (Lines 25-46):

```typescript
const isProd = env.node.env === 'production';
const accessToken = runtimeEnv.TEST_EMAIL_ACCESS_TOKEN ?? '';

function guardRequest(req: NextRequest): NextResponse | null {
  if (!isOriginAllowed(req)) {
    return NextResponse.json({ error: 'Origin not permitted' }, { status: 403 });
  }

  if (accessToken) {
    const token = extractToken(req);
    if (!token || token !== accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  } else if (isProd) {
    return NextResponse.json({ error: 'Endpoint disabled' }, { status: 403 });
  }
  // ... rate limiting in prod
}
```

**Status**: Partially guarded but **not hard-disabled** in production.

**`/api/test/leads/route.ts`** (example):

```typescript
export async function POST(req: NextRequest) {
  // ❌ NO ENVIRONMENT CHECK
  const { email } = await req.json();
  // ... creates test data
}
```

#### Risk Assessment

- **Data Pollution**: Test data mixed with production
- **Attack Vector**: Unauthorized access to test utilities
- **Discovery Risk**: Security by obscurity (paths are predictable)

#### Existing Patterns

**Environment Check**:

```typescript
import { env } from '@/lib/env';

if (env.node.env === 'production') {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
```

**Feature Flag**:

```typescript
if (!env.featureFlags.enableTestApi) {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
```

---

### Gap 4: Webhook Signature Verification (5 SP)

#### Routes Affected

- `POST /api/webhook/mailgun` - `src/app/api/webhook/mailgun/route.ts`
- `POST /api/inngest` - `src/app/api/inngest/route.ts`

#### Current State

**Mailgun Webhook** (Lines 15-34):

```typescript
export async function POST(req: NextRequest) {
  try {
    // ❌ NO SIGNATURE VERIFICATION
    const formData = await req.formData();
    const sender = formData.get("From");
    const subject = formData.get("Subject");
    const html = formData.get("body-html");

    // Forward to support email
    if (config.mailgun.forwardRepliesTo && html && subject && sender) {
      await sendEmail({ to: config.mailgun.forwardRepliesTo, ... });
    }

    return NextResponse.json({});
  } catch (error: unknown) {
    console.error(message);
    return NextResponse.json({ error: message || "Failed to handle webhook" }, { status: 500 });
  }
}
```

**Inngest Serve** (`src/app/api/inngest/route.ts`):

```typescript
import { serve } from 'inngest/next';

const handler = serve({
  client: inngest,
  functions: bookingSideEffectFunctions,
  // ❌ NO SIGNING KEY PROVIDED
});

export const GET = handler.GET;
export const POST = handler.POST;
export const PUT = handler.PUT;
```

**Inngest Client** (`server/queue/inngest.ts`):

```typescript
export const inngest = new Inngest({
  id: inngestAppId,
  name: 'SajiloReserveX',
  // ❌ NO SIGNING KEY PROVIDED
});
```

**Environment Variables** (`lib/env.ts`):

```typescript
queue() {
  return {
    inngest: {
      appId: parsed.INNGEST_APP_ID,
      eventKey: parsed.INNGEST_EVENT_KEY,
      signingKey: parsed.INNGEST_SIGNING_KEY,  // ✅ AVAILABLE
    },
  };
}
```

#### Risk Assessment

**Mailgun**:

- **Attack Vector**: Forged webhooks can trigger email forwarding, log spam
- **Impact**: Low (only forwards emails, no data modification)
- **HMAC Algorithm**: SHA256 with signature in headers
- **Required Headers**: `X-Mailgun-Signature`, `X-Mailgun-Timestamp`, `X-Mailgun-Token`

**Inngest**:

- **Attack Vector**: Forged job requests can execute arbitrary side effects
- **Impact**: HIGH - booking emails, SMS, analytics, webhook triggers
- **Signature Algorithm**: HMAC-SHA256, managed by SDK
- **SDK Handling**: `serve()` automatically verifies if `signingKey` provided

#### Mailgun Signature Verification Pattern

**Documentation**: https://documentation.mailgun.com/en/latest/api-webhooks.html#webhooks

**Algorithm**:

```typescript
import crypto from 'crypto';

function verifyMailgunSignature(params: {
  timestamp: string;
  token: string;
  signature: string;
  signingKey: string;
}): boolean {
  const data = params.timestamp + params.token;
  const hmac = crypto.createHmac('sha256', params.signingKey);
  hmac.update(data);
  const computedSignature = hmac.digest('hex');

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computedSignature));
}
```

**Timestamp Validation**: Reject requests older than 5 minutes (replay protection).

#### Inngest Signature Verification

**Documentation**: https://www.inngest.com/docs/platform/signing-keys

**Implementation**:

```typescript
import { serve } from 'inngest/next';
import { env } from '@/lib/env';

const handler = serve({
  client: inngest,
  functions: bookingSideEffectFunctions,
  signingKey: env.queue.inngest.signingKey, // ✅ ADD THIS
});
```

**SDK Behavior**:

- If `signingKey` provided: Automatically verifies `X-Inngest-Signature` header
- If signature invalid: Returns 401 before executing functions
- Timestamps embedded in signature prevent replay attacks

---

## 3. Existing Reusable Patterns

### Authentication Utilities (`server/auth/guards.ts`)

```typescript
// Session requirement
export async function requireSession(): Promise<{ supabase: SupabaseClient; user: User }> {
  const supabase = await getRouteHandlerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new GuardError({
      status: 401,
      code: 'UNAUTHENTICATED',
      message: 'Authentication required',
    });
  }

  return { supabase, user };
}

// Staff access check
export async function requireMembershipForRestaurant(params: {
  userId: string;
  restaurantId: string;
}): Promise<void> {
  // Throws GuardError if not a member
}
```

### Error Response Patterns

```typescript
// From booking endpoints
function respondWithGuardError(error: GuardError) {
  return NextResponse.json(
    { error: error.message, code: error.code, details: error.details ?? null },
    { status: error.status },
  );
}
```

### Environment Checks

```typescript
import { env } from '@/lib/env';

const isProd = env.node.env === 'production';
const isTestApiEnabled = env.featureFlags.enableTestApi;
```

### Observability

```typescript
import { recordObservabilityEvent } from '@/server/observability';

await recordObservabilityEvent({
  source: 'api.bookings',
  eventType: 'auth.denied',
  severity: 'warning',
  context: {
    booking_id: bookingId,
    ip_scope: anonymizeIp(clientIp),
  },
});
```

---

## 4. External Dependencies

### Required for Mailgun Verification

- **Native Module**: `crypto` (Node.js built-in)
- **Environment Variable**: `MAILGUN_SIGNING_KEY` (not currently in schema)

### Required for Inngest Verification

- **Environment Variable**: `INNGEST_SIGNING_KEY` (✅ already in `config/env.schema.ts`)
- **SDK**: `inngest` package (✅ already installed)
- **Version**: Check minimum version for signature support (>= v2.0.0)

### Rate Limiting (Already Available)

- **Redis**: Upstash Redis (production)
- **Fallback**: In-memory Map (development)
- **Environment Variables**: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

---

## 5. Constraints & Risks

### Technical Constraints

1. **RLS Bypass**: Service client bypasses RLS, so ownership checks must be explicit
2. **UUID Enumeration**: Booking IDs are UUIDs but can be discovered via timing attacks
3. **Backward Compatibility**: Existing clients depend on unauthenticated GET /api/bookings/[id]
4. **Rate Limit Storage**: Memory fallback only works for single-instance deployments

### Operational Constraints

1. **Zero Downtime**: Must not break existing bookings or integrations
2. **Logging Compliance**: Cannot log full PII, must use anonymization
3. **Performance**: Auth checks add ~50-100ms latency per request
4. **Monitoring**: Need alerts for rate limit hits and auth failures

### Security Constraints

1. **Key Rotation**: Webhook signing keys must be rotatable without downtime
2. **Timing Attacks**: Use `crypto.timingSafeEqual()` for signature comparison
3. **Replay Protection**: Timestamp validation for webhooks (5-minute window)

### Migration Risks

1. **Breaking Change**: GET /api/bookings/[id] will 401 for unauthenticated requests
2. **Client Updates**: Frontend may need to pass session cookies
3. **Testing**: E2E tests may break if they rely on unauthenticated access
4. **Documentation**: API docs need updates with new auth requirements

---

## 6. Open Questions & Decisions

### Questions

1. ✅ **Resolved**: Should GET /api/bookings/[id] support a "redacted" public mode?
   - **Decision**: No, require full authentication. Public confirmation pages use different flow.

2. ✅ **Resolved**: What rate limit for POST /api/bookings?
   - **Decision**: 30-60 req/min per (restaurant, IP) - align with ops endpoints.

3. ✅ **Resolved**: Hard 404 or 403 for test endpoints in production?
   - **Decision**: 404 (security by obscurity + discoverability reduction).

4. ⏳ **Pending**: Do we have MAILGUN_SIGNING_KEY available?
   - **Action**: Check with DevOps/infra team for key availability.

5. ⏳ **Pending**: Are there external integrations calling GET /api/bookings/[id]?
   - **Action**: Check with product team for third-party dependencies.

### Decisions Log

- **Auth Strategy**: Require user session + email ownership verification
- **Rate Limit**: 60 req/min per (restaurant, IP) for POST /api/bookings
- **Test Endpoints**: Hard-gate on `NODE_ENV === "production"` → 404
- **Webhook Verification**: Implement HMAC validation with audit logging
- **Rollout**: Feature flag controlled, gradual exposure with monitoring

---

## 7. Recommended Approach

### Priority Order (by Risk × Effort)

1. **High Risk, Low Effort** (do first):
   - Gate test endpoints in production (3 SP)
   - Add rate limiting to POST /api/bookings (3 SP)

2. **High Risk, Medium Effort** (do next):
   - Lock down booking details endpoints (5 SP)
   - Implement webhook signature verification (5 SP)

### Implementation Sequence

1. Test endpoint gating → prevents data pollution immediately
2. Booking creation rate limiting → prevents abuse vectors
3. Webhook signature verification → secures background job triggering
4. Booking details authentication → protects PII (requires coordination)

### Testing Strategy

- **Unit Tests**: Auth guard logic, rate limit calculations, signature verification
- **Integration Tests**: End-to-end flows with real Supabase sessions
- **E2E Tests**: Update existing tests to handle new auth requirements
- **Security Tests**: Attempt bypass via header manipulation, timestamp replay

---

## 8. References

### Internal Documentation

- [COMPREHENSIVE_ROUTE_ANALYSIS.md](../../COMPREHENSIVE_ROUTE_ANALYSIS.md) - Full route catalog
- [ROUTE_QUICK_REFERENCE.md](../../ROUTE_QUICK_REFERENCE.md) - Quick lookup
- [AGENTS.md](../../AGENTS.md) - Development workflow

### External Documentation

- [Mailgun Webhook Verification](https://documentation.mailgun.com/en/latest/api-webhooks.html#webhooks)
- [Inngest Signing Keys](https://www.inngest.com/docs/platform/signing-keys)
- [Inngest Serve API](https://www.inngest.com/docs/reference/serve)
- [OWASP Rate Limiting Guide](https://cheatsheetseries.owasp.org/cheatsheets/Rate_Limiting_Cheat_Sheet.html)

### Code References

- `server/auth/guards.ts` - Auth utilities
- `server/security/rate-limit.ts` - Rate limiting
- `server/security/request.ts` - IP extraction
- `server/security/guest-lookup.ts` - Hash-based lookup
- `middleware.ts` - Auth middleware

---

## 9. Summary

**Findings**:

- 4 security gaps identified, documented, and risk-assessed
- Existing patterns and utilities available for all fixes
- No new external dependencies required (crypto, inngest SDK present)
- Rate limiting infrastructure ready, just needs wider application

**Recommended Next Steps**:

1. Create implementation plan (plan.md) with detailed technical design
2. Create todo checklist (todo.md) with atomic tasks
3. Begin with test endpoint gating (lowest risk, immediate value)
4. Coordinate with product team on booking details auth (requires client changes)

**Blockers**:

- Need MAILGUN_SIGNING_KEY from DevOps
- Need confirmation on external integrations for GET /api/bookings/[id]

**Timeline**: 16 SP total → ~1.5-2 sprints with current capacity (2 BE, 1 SRE, 1 QA)
