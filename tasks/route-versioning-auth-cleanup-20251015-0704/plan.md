# Implementation Plan: Route Versioning & Auth Cleanup

**Task ID**: route-versioning-auth-cleanup-20251015-0704  
**EPICs**: B (Versioning & Path Consistency) + C (Auth Clarity)  
**Story Points**: 16 total (breakdown below)  
**Owner**: Backend + Docs  
**Dependencies**: None

---

## Objective

Fix route versioning inconsistencies, resolve endpoint documentation conflicts, improve authentication UX for guest booking flow, and harden authorization checks across privileged API routes to ensure security and consistency.

**We will enable:**

- Clients to reliably migrate from unversioned to versioned API routes
- Guests to complete booking flow without forced authentication
- Clear separation between public invitation acceptance and admin management
- Consistent RBAC enforcement across all owner/ops routes
- Complete and accurate route documentation

**So that:**

- API deprecation headers lead to working endpoints (not 404s)
- Guest booking conversion rate improves (no auth friction)
- Security is hardened with explicit role checks
- Team can maintain routes confidently with clear patterns

---

## Success Criteria

### EPIC B: Versioning & Path Consistency

- [x] **B1: /api/restaurants versioning**
  - [ ] `GET /api/v1/restaurants` returns 200 with restaurant list
  - [ ] `GET /api/v1/restaurants/[slug]/schedule` returns 200 with schedule
  - [ ] Deprecation header on `/api/restaurants` points to working `/api/v1/restaurants`
  - [ ] v1 mapping table updated in documentation

- [x] **B2: Invitation endpoint unification**
  - [ ] Documentation correctly reflects actual routes (no `/api/owner/.../accept`)
  - [ ] Quick Reference shows token-based public route for acceptance
  - [ ] Comprehensive doc clarifies flow: create → email → accept (token) → revoke (ID)
  - [ ] E2E invitation test passes

- [x] **B3: /thank-you reconciliation**
  - [ ] Guest can complete booking and see confirmation without signin
  - [ ] Confirmation shows booking-specific details (reference, date, time)
  - [ ] No PII exposed without proper authorization
  - [ ] Auth users can still access generic `/thank-you` page

- [x] **B4: /pricing validation**
  - [ ] Either `/pricing` returns 200 page OR directory removed from codebase
  - [ ] Documentation reflects actual state (live or removed)
  - [ ] Sitemap updated accordingly

### EPIC C: Auth Clarity

- [x] **C1: Owner/staff authorization audit**
  - [ ] All `/api/ops/*` routes enforce staff membership via `requireMembershipForRestaurant`
  - [ ] All `/api/owner/*` routes enforce admin role via `requireAdminMembership` (where appropriate)
  - [ ] Restaurant-modifying endpoints require admin role (not just any membership)
  - [ ] Unit tests cover positive and negative auth cases
  - [ ] 403 decisions logged for security monitoring

### Sprint 1 Deliverables

- [ ] Code changes merged and deployed
- [ ] Documentation updated (Quick Reference + Comprehensive)
- [ ] Runbook created: PII access rules, webhook verification, test endpoint gating
- [ ] All acceptance criteria verified

---

## Architecture & Components

### Component Breakdown

#### 1. API Version Re-Exports

**Files**:

- `src/app/api/v1/restaurants/route.ts` (new)
- `src/app/api/v1/restaurants/[slug]/schedule/route.ts` (new)

**Pattern**: Re-export existing unversioned routes

```typescript
export { GET } from '../../restaurants/route';
```

**State**: Stateless, delegates to unversioned implementation

---

#### 2. Thank-You Page Authentication

**Files**:

- `src/app/thank-you/page.tsx` (modify)
- `middleware.ts` (modify - remove from PROTECTED_MATCHERS)
- `src/app/api/bookings/route.ts` (modify - return confirmation token)
- Database: Add `confirmation_token` + `confirmation_token_expires_at` to `bookings` table (migration)

**Chosen Solution: Option A - One-Time Token**

**Flow**:

```
POST /api/bookings
  ↓
Generate short-lived token (1 hour)
  ↓
Store in booking record
  ↓
Return { booking, confirmationToken }
  ↓
Frontend redirects to /thank-you?token={token}
  ↓
Page fetches booking via token (no auth)
  ↓
Display booking details
```

**New API Endpoint**:

```typescript
GET /api/bookings/confirm?token={token}
// Returns booking details if token valid and not expired
// Rate limited: 20/min per IP
```

**Security**:

- Token: Crypto-random 32 bytes, base64url-encoded
- Expiry: 1 hour from booking creation
- One-time use: Mark as `used` after first fetch
- Rate limit: 20 requests per minute per IP

---

#### 3. Documentation Updates

**Files**:

- `ROUTE_QUICK_REFERENCE.md`
- `COMPREHENSIVE_ROUTE_ANALYSIS.md`

**Changes**:

- Fix invitation routes table
- Add `/api/v1/restaurants` to v1 mapping
- Update `/thank-you` flow description
- Remove or update `/pricing` entry
- Add auth audit findings

---

#### 4. Authorization Audit & Fixes

**Files to Audit** (read and verify auth checks):

- `/api/ops/bookings/[id]/status/route.ts`
- `/api/ops/customers/route.ts`
- `/api/ops/customers/export/route.ts`
- `/api/ops/restaurants/route.ts`
- `/api/ops/restaurants/[id]/route.ts`
- `/api/ops/dashboard/*/route.ts` (5 files)
- `/api/owner/team/memberships/route.ts`
- `/api/owner/restaurants/[id]/hours/route.ts`
- `/api/owner/restaurants/[id]/service-periods/route.ts`

**Fix Pattern**:

```typescript
// Before (inconsistent)
const user = await getUser();
// Missing membership check!

// After (consistent)
const user = await getUser();
if (!user) return 401;

await requireMembershipForRestaurant({
  userId: user.id,
  restaurantId,
});
```

**Instrument Logging**:

```typescript
// In server/team/access.ts
export async function requireMembershipForRestaurant(...) {
  // ... existing logic

  if (!data) {
    console.warn('[auth] Membership denied', {
      userId,
      restaurantId,
      requiredRoles: allowedRoles,
      route: 'caller-provided',
    });
    throw ...;
  }
}
```

---

#### 5. Database Migration

**Migration**: Add confirmation token fields to bookings table

```sql
-- Migration: add_booking_confirmation_token
ALTER TABLE bookings
ADD COLUMN confirmation_token VARCHAR(64) UNIQUE,
ADD COLUMN confirmation_token_expires_at TIMESTAMPTZ,
ADD COLUMN confirmation_token_used_at TIMESTAMPTZ;

CREATE INDEX idx_bookings_confirmation_token
ON bookings(confirmation_token)
WHERE confirmation_token IS NOT NULL;
```

**Rollback**:

```sql
ALTER TABLE bookings
DROP COLUMN confirmation_token,
DROP COLUMN confirmation_token_expires_at,
DROP COLUMN confirmation_token_used_at;

DROP INDEX IF EXISTS idx_bookings_confirmation_token;
```

---

#### 6. Runbook Document

**File**: `docs/runbooks/security-operations.md` (new)

**Sections**:

1. **PII Access Rules**
   - Who can access customer data (staff with membership)
   - Audit logging requirements
   - GDPR compliance notes

2. **Webhook Verification**
   - Mailgun signature verification process
   - Inngest authentication
   - Replay attack prevention

3. **Test Endpoint Gating**
   - How `/api/test/*` routes are protected
   - Environment variable checks
   - Feature flag configuration

4. **Incident Response**
   - Unauthorized access detected (403 spike)
   - Data leak investigation
   - Revoking compromised tokens

---

## Data Flow

### Thank-You Page Flow (Before)

```
Guest → POST /api/bookings → Booking created
         ↓
      Redirect to /thank-you
         ↓
      Middleware: No session → Redirect /signin
         ↓
      Guest must create account
         ↓
      After signin → /thank-you shows generic page
         ❌ Friction, no booking details
```

### Thank-You Page Flow (After)

```
Guest → POST /api/bookings → Booking created + token
         ↓
      Response: { booking, confirmationToken: "abc123..." }
         ↓
      Redirect to /thank-you?token=abc123...
         ↓
      Middleware: /thank-you not protected (removed from PROTECTED_MATCHERS)
         ↓
      Page: GET /api/bookings/confirm?token=abc123
         ↓
      API validates token (not expired, not used)
         ↓
      Return booking details
         ↓
      Page shows: reference, date, time, restaurant, party size
         ✅ Seamless, booking-specific
```

---

## API Contracts

### New Endpoint: GET /api/bookings/confirm

**Request**:

```http
GET /api/bookings/confirm?token=abc123xyz
```

**Response** (200 OK):

```json
{
  "booking": {
    "id": "uuid",
    "reference": "AB1234",
    "restaurantName": "Sample Restaurant",
    "date": "2025-01-20",
    "startTime": "19:00",
    "endTime": "21:00",
    "partySize": 4,
    "bookingType": "dinner",
    "seating": "indoor",
    "notes": "Window seat preferred",
    "status": "confirmed"
  }
}
```

**Error Responses**:

- `400 Bad Request`: Missing or malformed token
- `404 Not Found`: Token not found or booking deleted
- `410 Gone`: Token expired or already used
- `429 Too Many Requests`: Rate limit exceeded

**Rate Limit**: 20 requests per minute per IP

---

### Modified Endpoint: POST /api/bookings

**Response Change** (add `confirmationToken`):

```json
{
  "booking": {
    /* existing fields */
  },
  "confirmationToken": "abc123xyz456...", // NEW
  "loyaltyPointsAwarded": 10,
  "bookings": [
    /* customer's bookings */
  ],
  "clientRequestId": "uuid",
  "idempotencyKey": "uuid"
}
```

---

## UI/UX States

### /thank-you Page States

1. **Loading (with token)**:
   - Show spinner
   - Fetch booking via token

2. **Success (booking loaded)**:
   - Heading: "Booking Confirmed!"
   - Subheading: "Reference: {reference}"
   - Details card:
     - Restaurant name
     - Date: {date}
     - Time: {startTime} - {endTime}
     - Party size: {partySize} guests
     - Seating: {seating}
     - Notes: {notes}
   - Call-to-action:
     - "View in My Bookings" (if signed in)
     - "Make Another Booking"
     - "Return Home"
   - Footer: "Confirmation email sent to {email}"

3. **Error (token invalid/expired)**:
   - Heading: "Confirmation Unavailable"
   - Message: "This confirmation link has expired or is invalid."
   - Suggestion: "Check your email for booking details, or look up your booking below."
   - Fallback form: Guest lookup (email + phone)

4. **Fallback (no token, signed in)**:
   - Show generic "Thanks for booking!" message
   - Link to "View My Bookings"

5. **Fallback (no token, not signed in)**:
   - Show generic message
   - Suggest checking email
   - Link to signin

---

## Edge Cases

### Thank-You Token

1. **Token used twice**:
   - First request: Mark `confirmation_token_used_at`, return booking
   - Second request: Return 410 Gone
   - Reason: Prevent token replay

2. **Token expired**:
   - Check: `confirmation_token_expires_at < NOW()`
   - Return 410 Gone
   - User can look up booking via email/phone

3. **Booking cancelled after token issued**:
   - Token still valid
   - Show booking with status "cancelled"
   - Inform user: "This booking has been cancelled."

4. **Rate limit hit**:
   - Return 429 with Retry-After header
   - Frontend shows: "Too many requests. Please wait and try again."

### API Versioning

1. **Client uses deprecated route**:
   - `/api/restaurants` returns data + deprecation headers
   - Client should migrate but not forced

2. **Client migrates to v1**:
   - `/api/v1/restaurants` returns same data, no headers
   - Future-proof for v2 (if needed)

### Authorization

1. **Staff tries to access different restaurant**:
   - `requireMembershipForRestaurant` throws `MEMBERSHIP_NOT_FOUND`
   - Return 403 Forbidden
   - Log attempt for security monitoring

2. **Staff tries to modify restaurant details**:
   - If route uses `requireMembershipForRestaurant` (any role)
   - Should be fixed to `requireAdminMembership`
   - Staff gets 403, owner/admin succeeds

---

## Testing Strategy

### Unit Tests

#### 1. Authorization Functions

**File**: `tests/server/team/access.test.ts` (new)

```typescript
describe('requireMembershipForRestaurant', () => {
  test('allows staff with membership', async () => {
    // Setup: User is staff for restaurant A
    const membership = await requireMembershipForRestaurant({
      userId: 'staff-uuid',
      restaurantId: 'restaurant-a-uuid',
    });
    expect(membership.role).toBe('staff');
  });

  test('denies user without membership', async () => {
    await expect(
      requireMembershipForRestaurant({
        userId: 'random-user',
        restaurantId: 'restaurant-a-uuid',
      }),
    ).rejects.toThrow('MEMBERSHIP_NOT_FOUND');
  });

  test('denies staff accessing different restaurant', async () => {
    await expect(
      requireMembershipForRestaurant({
        userId: 'staff-restaurant-a',
        restaurantId: 'restaurant-b-uuid',
      }),
    ).rejects.toThrow('MEMBERSHIP_NOT_FOUND');
  });
});

describe('requireAdminMembership', () => {
  test('allows owner', async () => {
    const membership = await requireAdminMembership({
      userId: 'owner-uuid',
      restaurantId: 'restaurant-a-uuid',
    });
    expect(membership.role).toBe('owner');
  });

  test('denies staff (non-admin)', async () => {
    await expect(
      requireAdminMembership({
        userId: 'staff-uuid',
        restaurantId: 'restaurant-a-uuid',
      }),
    ).rejects.toThrow('MEMBERSHIP_ROLE_DENIED');
  });
});
```

#### 2. Confirmation Token Logic

**File**: `tests/server/bookings/confirmation-token.test.ts` (new)

```typescript
describe('generateConfirmationToken', () => {
  test('generates unique 64-char token', () => {
    const token1 = generateConfirmationToken();
    const token2 = generateConfirmationToken();
    expect(token1).toHaveLength(64);
    expect(token1).not.toBe(token2);
  });
});

describe('validateConfirmationToken', () => {
  test('returns booking if token valid', async () => {
    const booking = await validateConfirmationToken('valid-token');
    expect(booking.id).toBeDefined();
  });

  test('throws if token expired', async () => {
    await expect(validateConfirmationToken('expired-token')).rejects.toThrow('TOKEN_EXPIRED');
  });

  test('throws if token already used', async () => {
    await expect(validateConfirmationToken('used-token')).rejects.toThrow('TOKEN_USED');
  });
});
```

---

### Integration Tests

#### 1. Booking Confirmation Flow

**File**: `tests/api/bookings/confirmation.test.ts` (new)

```typescript
describe('POST /api/bookings → GET /api/bookings/confirm', () => {
  test('creates booking and confirms with token', async () => {
    // Step 1: Create booking
    const response = await request(app).post('/api/bookings').send(validBookingPayload);

    expect(response.status).toBe(201);
    const { booking, confirmationToken } = response.body;
    expect(confirmationToken).toBeTruthy();

    // Step 2: Confirm with token
    const confirmResponse = await request(app).get(
      `/api/bookings/confirm?token=${confirmationToken}`,
    );

    expect(confirmResponse.status).toBe(200);
    expect(confirmResponse.body.booking.reference).toBe(booking.reference);
  });

  test('rejects expired token', async () => {
    // Setup: Booking with expired token
    const expiredToken = await createBookingWithExpiredToken();

    const response = await request(app).get(`/api/bookings/confirm?token=${expiredToken}`);

    expect(response.status).toBe(410);
  });

  test('rejects used token', async () => {
    const token = await createBookingWithToken();

    // Use once
    await request(app).get(`/api/bookings/confirm?token=${token}`);

    // Try again
    const response = await request(app).get(`/api/bookings/confirm?token=${token}`);

    expect(response.status).toBe(410);
  });
});
```

#### 2. Authorization Checks

**File**: `tests/api/ops/auth.test.ts`, `tests/api/owner/auth.test.ts`

```typescript
describe('Ops API Authorization', () => {
  test('allows staff to list bookings for their restaurant', async () => {
    const response = await authenticatedRequest('staff-user').get(
      '/api/ops/bookings?restaurantId=restaurant-a',
    );

    expect(response.status).toBe(200);
  });

  test('denies staff listing bookings for other restaurant', async () => {
    const response = await authenticatedRequest('staff-restaurant-a').get(
      '/api/ops/bookings?restaurantId=restaurant-b',
    );

    expect(response.status).toBe(403);
  });

  test('denies unauthenticated access', async () => {
    const response = await request(app).get('/api/ops/bookings?restaurantId=restaurant-a');

    expect(response.status).toBe(401);
  });
});

describe('Owner API Authorization', () => {
  test('allows owner to update restaurant details', async () => {
    const response = await authenticatedRequest('owner-user')
      .put('/api/owner/restaurants/restaurant-a/details')
      .send({ name: 'Updated Name' });

    expect(response.status).toBe(200);
  });

  test('denies staff updating restaurant details', async () => {
    const response = await authenticatedRequest('staff-user')
      .put('/api/owner/restaurants/restaurant-a/details')
      .send({ name: 'Updated Name' });

    expect(response.status).toBe(403);
  });
});
```

---

### E2E Tests

#### 1. Guest Booking Flow

**File**: `tests/e2e/bookings/guest-confirmation.spec.ts` (new)

```typescript
test('guest books and sees confirmation without signin', async ({ page }) => {
  // Navigate to restaurant page
  await page.goto('/reserve/r/sample-restaurant');

  // Fill booking form
  await page.fill('[name="name"]', 'John Doe');
  await page.fill('[name="email"]', 'john@example.com');
  await page.fill('[name="phone"]', '+1234567890');
  // ... other fields

  // Submit booking
  await page.click('button[type="submit"]');

  // Should redirect to /thank-you with token
  await expect(page).toHaveURL(/\/thank-you\?token=/);

  // Confirmation page loads without signin
  await expect(page.locator('h1')).toContainText('Booking Confirmed');

  // Shows booking details
  await expect(page.locator('[data-testid="booking-reference"]')).toBeVisible();
  await expect(page.locator('[data-testid="booking-date"]')).toContainText('2025-01-20');
});

test('expired token shows fallback message', async ({ page }) => {
  // Navigate with expired token
  await page.goto('/thank-you?token=expired-token-xyz');

  // Shows error message
  await expect(page.locator('h1')).toContainText('Confirmation Unavailable');
  await expect(page.locator('text=expired or is invalid')).toBeVisible();

  // Shows guest lookup form
  await expect(page.locator('form[aria-label="Look up booking"]')).toBeVisible();
});
```

#### 2. Team Invitation Flow

**File**: `tests/e2e/invitations/accept-invite.spec.ts` (existing, verify)

```typescript
test('invited user accepts invitation via token link', async ({ page }) => {
  // Setup: Create invitation (via API or admin UI)
  const { token } = await createInvitation({
    email: 'newstaff@example.com',
    role: 'staff',
    restaurantId: 'restaurant-a',
  });

  // Navigate to invitation page
  await page.goto(`/invite/${token}`);

  // Shows invitation details
  await expect(page.locator('h1')).toContainText('Team Invitation');
  await expect(page.locator('text=Sample Restaurant')).toBeVisible();

  // Fill acceptance form
  await page.fill('[name="name"]', 'New Staff Member');
  await page.fill('[name="password"]', 'secure-password-123');

  // Accept invitation
  await page.click('button:has-text("Accept Invitation")');

  // Redirects to ops dashboard
  await expect(page).toHaveURL('/ops');
  await expect(page.locator('text=Welcome')).toBeVisible();
});
```

---

### Accessibility Tests

#### 1. Thank-You Page

**File**: `tests/e2e/a11y/thank-you.spec.ts` (new)

```typescript
import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test('thank-you page meets WCAG AA', async ({ page }) => {
  // Navigate with valid token
  await page.goto('/thank-you?token=valid-test-token');

  // Inject axe
  await injectAxe(page);

  // Run accessibility checks
  await checkA11y(page, null, {
    detailedReport: true,
    detailedReportOptions: {
      html: true,
    },
  });

  // Keyboard navigation
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toBeVisible();
});
```

---

## Rollout Plan

### Phase 1: Infrastructure (No User Impact)

**Estimated Time**: 1 day

1. ✅ Create `/api/v1/restaurants` re-exports
2. ✅ Run database migration (add confirmation token columns)
3. ✅ Deploy to staging
4. ✅ Verify v1 routes work (manual curl test)
5. ✅ Verify migration applied (check DB schema)

**Rollback**: Delete v1 route files, rollback migration

---

### Phase 2: Documentation Fixes (Immediate)

**Estimated Time**: 2 hours

1. ✅ Fix Quick Reference invitation routes
2. ✅ Update Comprehensive doc with audit findings
3. ✅ Remove `/pricing` from docs (or add placeholder page)
4. ✅ Commit and merge docs PR

**Rollback**: Git revert

---

### Phase 3: Thank-You Flow (Gradual)

**Estimated Time**: 2 days

1. ✅ Implement `generateConfirmationToken()` utility
2. ✅ Modify `POST /api/bookings` to generate + return token
3. ✅ Create `GET /api/bookings/confirm` endpoint
4. ✅ Add rate limiting to confirm endpoint
5. ✅ Deploy to staging
6. ✅ Test booking flow end-to-end
7. ✅ Modify `/thank-you` page to use token
8. ✅ Remove `/thank-you` from middleware PROTECTED_MATCHERS
9. ✅ Deploy to production
10. ✅ Monitor error rates (404, 410, 429)

**Feature Flag**: `env.features.bookingConfirmationToken` (default: false)

- Enable on staging
- Enable on production after successful staging tests
- If issues, disable flag (fallback to old flow)

**Rollback**:

- Disable feature flag
- Revert code changes
- Thank-you page reverts to auth-required

**Monitoring**:

- `GET /api/bookings/confirm` response times
- 410 rate (expired/used tokens)
- 429 rate (rate limiting)
- Conversion: % of bookings followed by thank-you page view

---

### Phase 4: Authorization Audit & Fixes (Gradual)

**Estimated Time**: 3 days

1. ✅ Audit all `/api/ops/*` routes (checklist in todo.md)
2. ✅ Audit all `/api/owner/*` routes
3. ✅ Fix inconsistent auth checks (e.g., restaurant details)
4. ✅ Add logging to auth functions
5. ✅ Write unit tests for auth
6. ✅ Deploy auth fixes to staging
7. ✅ Run E2E tests (including negative cases)
8. ✅ Deploy to production
9. ✅ Monitor 403 rates (should not spike)

**Rollback**: Revert auth check changes per route

**Monitoring**:

- 403 error count by route
- Auth function latency
- Logs: `[auth] Membership denied` events

---

### Phase 5: Runbook & Final Verification

**Estimated Time**: 1 day

1. ✅ Create security operations runbook
2. ✅ Document PII access rules
3. ✅ Document webhook verification
4. ✅ Document test endpoint gating
5. ✅ Verify all acceptance criteria
6. ✅ Update CHANGELOG.md
7. ✅ Notify team of changes

---

## Monitoring & Observability

### Metrics to Track

| Metric                               | Threshold | Alert                           |
| ------------------------------------ | --------- | ------------------------------- |
| `GET /api/bookings/confirm` 410 rate | < 5%      | Warning if > 10%                |
| `GET /api/bookings/confirm` 429 rate | < 1%      | Warning if > 3%                 |
| `/api/ops/*` 403 rate                | < 2%      | Alert if > 5% (possible attack) |
| `/api/owner/*` 403 rate              | < 2%      | Alert if > 5%                   |
| Thank-you page bounce rate           | < 20%     | Warning if > 30%                |
| Auth function latency (p95)          | < 200ms   | Warning if > 500ms              |

### Log Events

**Auth Denial**:

```json
{
  "level": "warn",
  "message": "[auth] Membership denied",
  "userId": "uuid",
  "restaurantId": "uuid",
  "requiredRoles": ["owner", "admin"],
  "actualRole": "staff",
  "route": "/api/owner/restaurants/uuid/details",
  "timestamp": "2025-01-15T12:00:00Z"
}
```

**Token Validation Failure**:

```json
{
  "level": "info",
  "message": "[booking] Confirmation token validation failed",
  "reason": "TOKEN_EXPIRED",
  "tokenPrefix": "abc123...",
  "ip": "203.0.113.1",
  "timestamp": "2025-01-15T12:00:00Z"
}
```

---

## Dependencies

### External

- Supabase: Database migration (confirmation token columns)
- No external API changes required

### Internal

- None (self-contained changes)

---

## Risks & Mitigations

| Risk                            | Impact | Probability | Mitigation                                 |
| ------------------------------- | ------ | ----------- | ------------------------------------------ |
| Token replay attack             | Medium | Low         | One-time use flag, rate limiting           |
| Token expiry too short          | Low    | Medium      | Set 1 hour expiry (reasonable window)      |
| Auth check breaks existing flow | High   | Low         | Gradual rollout, feature flag              |
| Documentation out of sync       | Low    | Medium      | Update docs in same PR as code             |
| Migration fails                 | High   | Low         | Test on staging first, rollback plan ready |
| 403 spike on auth hardening     | Medium | Medium      | Monitor logs, revert per route if needed   |

---

## Open Questions & Decisions

### Decided

1. **Thank-You Solution**: ✅ Option A (one-time token) - best UX, secure
2. **Pricing Page**: ✅ Remove from docs (no design/copy ready)
3. **Token Expiry**: ✅ 1 hour (balance between UX and security)
4. **Token Length**: ✅ 64 characters (base64url-encoded 32 bytes)
5. **Feature Flag**: ✅ Yes, `env.features.bookingConfirmationToken`

### Pending

1. **Email Templates**: Need to verify invitation URLs are correct (blocked on email template location)
2. **Test Endpoint Gating**: How are `/api/test/*` routes currently protected? (investigate in implementation)
3. **Dashboard Role Requirements**: Should ops dashboard have different permissions for read vs write? (clarify with PM)

---

## Implementation Checklist

See `todo.md` for detailed step-by-step checklist.

---

**Last Updated**: 2025-01-15 07:04 UTC  
**Next Step**: Create todo.md with atomic implementation steps
