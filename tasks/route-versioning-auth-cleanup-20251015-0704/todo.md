# Implementation Checklist

**Task**: route-versioning-auth-cleanup-20251015-0704  
**Status**: In Progress  
**Last Updated**: 2025-01-15 07:04 UTC

---

## Phase 1: Quick Wins (B1, B2, B4)

### B1: Create /api/v1/restaurants Routes

- [ ] Create `src/app/api/v1/restaurants/route.ts`
  - [ ] Export GET from `../../restaurants/route`
  - [ ] Verify no other methods needed
- [ ] Create `src/app/api/v1/restaurants/[slug]/schedule/route.ts`
  - [ ] Export GET from `../../../restaurants/[slug]/schedule/route`
- [ ] Test manually:
  ```bash
  curl http://localhost:3000/api/v1/restaurants
  curl http://localhost:3000/api/v1/restaurants/sample-restaurant/schedule
  ```
- [ ] Verify deprecation headers on unversioned route:
  ```bash
  curl -i http://localhost:3000/api/restaurants | grep -i "link:"
  ```
- [ ] Confirm Link header points to `/api/v1/restaurants` and returns 200

### B2: Fix Invitation Documentation

- [ ] Open `ROUTE_QUICK_REFERENCE.md`
- [ ] Find table entry: `POST /api/owner/team/invitations/[id]/accept`
- [ ] Replace with:
  ```markdown
  | POST | `/api/team/invitations/[token]/accept` | Public | Accept team invitation |
  | DELETE | `/api/owner/team/invitations/[inviteId]` | Owner | Revoke invitation |
  ```
- [ ] Open `COMPREHENSIVE_ROUTE_ANALYSIS.md`
- [ ] Search for "Team Invitation" or "invitation acceptance"
- [ ] Update flow description:
  - Owner creates invite → POST `/api/owner/team/invitations` (returns token)
  - Email sent with `/invite/{token}` link
  - Recipient accepts → POST `/api/team/invitations/{token}/accept`
  - Owner can revoke → DELETE `/api/owner/team/invitations/{inviteId}`
- [ ] Add note: "No endpoint at `/api/owner/.../accept` - documented conflict was in docs only"
- [ ] Commit changes

### B4: Resolve /pricing Page

- [ ] Check for any UI links to `/pricing`:
  ```bash
  grep -r 'href="/pricing"' src/
  grep -r 'href="/pricing"' components/
  ```
- [ ] If no links found:
  - [ ] Delete `src/app/pricing/` directory
  - [ ] Remove `/pricing` entry from Quick Reference (line ~21)
  - [ ] Remove `/pricing` entry from Comprehensive doc
  - [ ] Commit changes
- [ ] If links found:
  - [ ] Create placeholder `src/app/pricing/page.tsx`:
    ```typescript
    export default function PricingPage() {
      return (
        <main>
          <h1>Pricing</h1>
          <p>Coming soon. Contact us for pricing information.</p>
        </main>
      );
    }
    ```
  - [ ] Update metadata
  - [ ] Commit changes

---

## Phase 2: Database Migration (B3 Prep)

### Migration: Add Confirmation Token

- [ ] Create migration file: `supabase/migrations/YYYYMMDD_add_booking_confirmation_token.sql`

  ```sql
  -- Add confirmation token columns to bookings table
  ALTER TABLE bookings
  ADD COLUMN confirmation_token VARCHAR(64) UNIQUE,
  ADD COLUMN confirmation_token_expires_at TIMESTAMPTZ,
  ADD COLUMN confirmation_token_used_at TIMESTAMPTZ;

  -- Index for token lookup
  CREATE INDEX idx_bookings_confirmation_token
  ON bookings(confirmation_token)
  WHERE confirmation_token IS NOT NULL;

  -- Comment
  COMMENT ON COLUMN bookings.confirmation_token IS
    'One-time token for guest confirmation page (expires in 1 hour)';
  ```

- [ ] Create rollback file: `YYYYMMDD_add_booking_confirmation_token_rollback.sql`

  ```sql
  ALTER TABLE bookings
  DROP COLUMN IF EXISTS confirmation_token,
  DROP COLUMN IF EXISTS confirmation_token_expires_at,
  DROP COLUMN IF EXISTS confirmation_token_used_at;

  DROP INDEX IF EXISTS idx_bookings_confirmation_token;
  ```

- [ ] Apply migration to local dev DB:
  ```bash
  # If using Supabase CLI (remote)
  supabase db push
  ```
- [ ] Verify columns exist:
  ```sql
  SELECT column_name, data_type, is_nullable
  FROM information_schema.columns
  WHERE table_name = 'bookings' AND column_name LIKE 'confirmation_%';
  ```
- [ ] Update TypeScript types:
  ```bash
  # Regenerate Supabase types
  supabase gen types typescript --local > types/supabase.ts
  ```

---

## Phase 3: Thank-You Flow Implementation (B3)

### Server: Token Generation Utility

- [ ] Create `server/bookings/confirmation-token.ts`

  ```typescript
  import { randomBytes } from 'crypto';

  export function generateConfirmationToken(): string {
    return randomBytes(32).toString('base64url');
  }

  export function computeTokenExpiry(hours = 1): Date {
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + hours);
    return expiry;
  }
  ```

- [ ] Add tests: `tests/server/bookings/confirmation-token.test.ts`
  - [ ] Test: Token is 64 characters (base64url)
  - [ ] Test: Tokens are unique
  - [ ] Test: Expiry is 1 hour from now

### Server: Token Validation

- [ ] Add to `server/bookings/confirmation-token.ts`:

  ```typescript
  export async function validateConfirmationToken(token: string): Promise<BookingRecord> {
    const supabase = getServiceSupabaseClient();

    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('confirmation_token', token)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      throw Object.assign(new Error('Token not found'), {
        code: 'TOKEN_NOT_FOUND',
      });
    }

    // Check expiry
    if (
      data.confirmation_token_expires_at &&
      new Date(data.confirmation_token_expires_at) < new Date()
    ) {
      throw Object.assign(new Error('Token expired'), {
        code: 'TOKEN_EXPIRED',
      });
    }

    // Check if used
    if (data.confirmation_token_used_at) {
      throw Object.assign(new Error('Token already used'), {
        code: 'TOKEN_USED',
      });
    }

    return data as BookingRecord;
  }

  export async function markTokenUsed(token: string): Promise<void> {
    const supabase = getServiceSupabaseClient();
    await supabase
      .from('bookings')
      .update({ confirmation_token_used_at: new Date().toISOString() })
      .eq('confirmation_token', token);
  }
  ```

- [ ] Add tests:
  - [ ] Test: Valid token returns booking
  - [ ] Test: Invalid token throws TOKEN_NOT_FOUND
  - [ ] Test: Expired token throws TOKEN_EXPIRED
  - [ ] Test: Used token throws TOKEN_USED

### API: Modify POST /api/bookings

- [ ] Open `src/app/api/bookings/route.ts`
- [ ] Import token utilities:
  ```typescript
  import {
    generateConfirmationToken,
    computeTokenExpiry,
  } from '@/server/bookings/confirmation-token';
  ```
- [ ] After `insertBookingRecord`, add token generation:

  ```typescript
  // Generate confirmation token
  const confirmationToken = generateConfirmationToken();
  const tokenExpiry = computeTokenExpiry(1); // 1 hour

  // Update booking with token
  await supabase
    .from('bookings')
    .update({
      confirmation_token: confirmationToken,
      confirmation_token_expires_at: tokenExpiry.toISOString(),
    })
    .eq('id', booking.id);
  ```

- [ ] Add `confirmationToken` to response:
  ```typescript
  return NextResponse.json(
    {
      booking,
      confirmationToken, // NEW
      loyaltyPointsAwarded,
      bookings,
      clientRequestId,
      idempotencyKey,
    },
    { status: 201 },
  );
  ```
- [ ] Update tests: `src/app/api/bookings/route.test.ts`
  - [ ] Verify response includes `confirmationToken`
  - [ ] Verify token is 64 chars

### API: Create GET /api/bookings/confirm

- [ ] Create `src/app/api/bookings/confirm/route.ts`:

  ```typescript
  import { NextRequest, NextResponse } from 'next/server';
  import { z } from 'zod';
  import { validateConfirmationToken, markTokenUsed } from '@/server/bookings/confirmation-token';
  import { consumeRateLimit } from '@/server/security/rate-limit';
  import { extractClientIp, anonymizeIp } from '@/server/security/request';

  const querySchema = z.object({
    token: z.string().min(64).max(64),
  });

  export async function GET(req: NextRequest) {
    // Rate limit
    const clientIp = extractClientIp(req);
    const rateResult = await consumeRateLimit({
      identifier: `bookings:confirm:${anonymizeIp(clientIp)}`,
      limit: 20,
      windowMs: 60_000,
    });

    if (!rateResult.ok) {
      const retryAfter = Math.ceil((rateResult.resetAt - Date.now()) / 1000);
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': retryAfter.toString() } },
      );
    }

    // Validate query
    const parsed = querySchema.safeParse({
      token: req.nextUrl.searchParams.get('token'),
    });

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid or missing token' }, { status: 400 });
    }

    try {
      // Validate token
      const booking = await validateConfirmationToken(parsed.data.token);

      // Mark as used
      await markTokenUsed(parsed.data.token);

      // Return booking details (safe subset)
      return NextResponse.json({
        booking: {
          id: booking.id,
          reference: booking.reference,
          restaurantName: booking.restaurants?.name ?? 'Unknown',
          date: booking.booking_date,
          startTime: booking.start_time,
          endTime: booking.end_time,
          partySize: booking.party_size,
          bookingType: booking.booking_type,
          seating: booking.seating_preference,
          notes: booking.notes,
          status: booking.status,
        },
      });
    } catch (error: unknown) {
      const code = (error as { code?: string }).code;

      if (code === 'TOKEN_NOT_FOUND') {
        return NextResponse.json({ error: 'Invalid token' }, { status: 404 });
      }
      if (code === 'TOKEN_EXPIRED' || code === 'TOKEN_USED') {
        return NextResponse.json({ error: 'Token expired or already used' }, { status: 410 });
      }

      console.error('[bookings/confirm] Unexpected error', error);
      return NextResponse.json({ error: 'Unable to confirm booking' }, { status: 500 });
    }
  }
  ```

- [ ] Create tests: `tests/api/bookings/confirm.test.ts`
  - [ ] Test: Valid token returns booking
  - [ ] Test: Invalid token returns 404
  - [ ] Test: Expired token returns 410
  - [ ] Test: Used token returns 410
  - [ ] Test: Rate limit returns 429

### Frontend: Update Booking Flow

- [ ] Find booking form component (likely in `components/reserve/` or `src/app/reserve/`)
- [ ] After successful booking POST:

  ```typescript
  const response = await fetch('/api/bookings', { method: 'POST', body: ... });
  const data = await response.json();

  if (response.ok && data.confirmationToken) {
    // Redirect to thank-you with token
    router.push(`/thank-you?token=${data.confirmationToken}`);
  }
  ```

### Frontend: Update /thank-you Page

- [ ] Open `src/app/thank-you/page.tsx`
- [ ] Remove auth check (make public)
- [ ] Add token-based loading:

  ```typescript
  'use client';

  import { useSearchParams } from 'next/navigation';
  import { useEffect, useState } from 'react';

  export default function ThankYouPage() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
      if (!token) {
        setLoading(false);
        return;
      }

      fetch(`/api/bookings/confirm?token=${token}`)
        .then(res => res.json())
        .then(data => {
          if (data.booking) {
            setBooking(data.booking);
          } else {
            setError(data.error || 'Unable to load confirmation');
          }
          setLoading(false);
        })
        .catch(err => {
          setError('Network error');
          setLoading(false);
        });
    }, [token]);

    if (loading) {
      return <div>Loading confirmation...</div>;
    }

    if (error) {
      return (
        <main>
          <h1>Confirmation Unavailable</h1>
          <p>{error}</p>
          <p>Check your email for booking details.</p>
        </main>
      );
    }

    if (booking) {
      return (
        <main>
          <h1>Booking Confirmed!</h1>
          <p>Reference: <strong>{booking.reference}</strong></p>
          <div>
            <p>Restaurant: {booking.restaurantName}</p>
            <p>Date: {booking.date}</p>
            <p>Time: {booking.startTime} - {booking.endTime}</p>
            <p>Party Size: {booking.partySize} guests</p>
            {booking.notes && <p>Notes: {booking.notes}</p>}
          </div>
          <a href="/">Make Another Booking</a>
        </main>
      );
    }

    // Fallback: No token
    return (
      <main>
        <h1>Thank You</h1>
        <p>Check your email for booking confirmation.</p>
      </main>
    );
  }
  ```

- [ ] Add loading spinner component
- [ ] Add proper styling (match existing design)
- [ ] Add accessibility attributes (ARIA labels, focus management)

### Middleware: Remove /thank-you Protection

- [ ] Open `middleware.ts`
- [ ] Remove `/thank-you` from `PROTECTED_MATCHERS`:
  ```typescript
  const PROTECTED_MATCHERS = [
    /^\/my-bookings(\/.*)?$/,
    /^\/profile(\/.*)?$/,
    // Removed: /^\/thank-you(\/.*)?$/,
  ];
  ```
- [ ] Update `config.matcher`:
  ```typescript
  export const config = {
    matcher: [
      '/api/:path*',
      '/my-bookings/:path*',
      '/profile/:path*',
      // Removed: "/thank-you/:path*",
    ],
  };
  ```
- [ ] Verify middleware still protects other routes

---

## Phase 4: Authorization Audit (C1)

### Audit Ops Routes

- [ ] Read `src/app/api/ops/bookings/[id]/status/route.ts`
  - [ ] Verify: Calls `getUser()` → check user exists → `requireMembershipForRestaurant`
  - [ ] If missing, add auth check
- [ ] Read `src/app/api/ops/customers/route.ts`
  - [ ] Verify auth
  - [ ] If missing, add
- [ ] Read `src/app/api/ops/customers/export/route.ts`
  - [ ] Verify auth
- [ ] Read `src/app/api/ops/restaurants/route.ts`
  - [ ] Verify auth
- [ ] Read `src/app/api/ops/restaurants/[id]/route.ts`
  - [ ] Verify auth
- [ ] Read `src/app/api/ops/dashboard/summary/route.ts`
  - [ ] Verify auth
- [ ] Read `src/app/api/ops/dashboard/heatmap/route.ts`
  - [ ] Verify auth
- [ ] Read `src/app/api/ops/dashboard/capacity/route.ts`
  - [ ] Verify auth
- [ ] Read `src/app/api/ops/dashboard/vips/route.ts`
  - [ ] Verify auth
- [ ] Read `src/app/api/ops/dashboard/changes/route.ts`
  - [ ] Verify auth

### Audit Owner Routes

- [ ] Read `src/app/api/owner/team/memberships/route.ts`
  - [ ] Verify: Uses `requireAdminMembership` (not just requireMembership)
  - [ ] If using wrong check, update
- [ ] Read `src/app/api/owner/restaurants/[id]/hours/route.ts`
  - [ ] Should use `requireAdminMembership`
  - [ ] If using `requireMembershipForRestaurant`, change to admin
- [ ] Read `src/app/api/owner/restaurants/[id]/service-periods/route.ts`
  - [ ] Should use `requireAdminMembership`
  - [ ] Update if needed

### Fix: Restaurant Details Endpoint

- [ ] Open `src/app/api/owner/restaurants/[id]/details/route.ts`
- [ ] Find: `await requireMembershipForRestaurant({ userId, restaurantId })`
- [ ] Replace with: `await requireAdminMembership({ userId, restaurantId })`
- [ ] Reason: Only owners/admins should modify restaurant details, not staff

### Instrument Auth Logging

- [ ] Open `server/team/access.ts`
- [ ] In `requireMembershipForRestaurant`, add logging before throw:

  ```typescript
  if (!data) {
    console.warn('[auth] Membership denied', {
      userId,
      restaurantId,
      requiredRoles: allowedRoles,
      timestamp: new Date().toISOString(),
    });
    throw Object.assign(new Error('Membership not found'), {
      code: 'MEMBERSHIP_NOT_FOUND',
    });
  }

  if (!allowedRoles.includes(casted.role as RestaurantRole)) {
    console.warn('[auth] Role denied', {
      userId,
      restaurantId,
      requiredRoles: allowedRoles,
      actualRole: casted.role,
      timestamp: new Date().toISOString(),
    });
    throw Object.assign(new Error('Insufficient permissions'), {
      code: 'MEMBERSHIP_ROLE_DENIED',
      role: casted.role,
    });
  }
  ```

---

## Phase 5: Testing

### Unit Tests

- [ ] Run existing tests:
  ```bash
  npm test -- server/team/access.test.ts
  ```
- [ ] Create `tests/server/team/access.test.ts` (if doesn't exist)
  - [ ] Test: `requireMembershipForRestaurant` allows staff
  - [ ] Test: Denies user without membership
  - [ ] Test: Denies staff accessing different restaurant
  - [ ] Test: `requireAdminMembership` allows owner
  - [ ] Test: Denies staff (non-admin)
- [ ] Create `tests/server/bookings/confirmation-token.test.ts`
  - [ ] Test: Token generation
  - [ ] Test: Token validation (valid, expired, used)
- [ ] Run all server tests:
  ```bash
  npm test -- server/
  ```

### Integration Tests

- [ ] Create `tests/api/bookings/confirmation.test.ts`
  - [ ] Test: POST /api/bookings returns token
  - [ ] Test: GET /api/bookings/confirm with valid token
  - [ ] Test: GET /api/bookings/confirm with expired token (410)
  - [ ] Test: GET /api/bookings/confirm with used token (410)
  - [ ] Test: Rate limit (429 after 20 requests)
- [ ] Create `tests/api/ops/auth.test.ts`
  - [ ] Test: Staff can access their restaurant's bookings
  - [ ] Test: Staff cannot access other restaurant's bookings (403)
  - [ ] Test: Unauthenticated request returns 401
- [ ] Create `tests/api/owner/auth.test.ts`
  - [ ] Test: Owner can update restaurant details
  - [ ] Test: Staff cannot update restaurant details (403)
- [ ] Run integration tests:
  ```bash
  npm test -- tests/api/
  ```

### E2E Tests

- [ ] Create `tests/e2e/bookings/guest-confirmation.spec.ts`
  - [ ] Test: Guest booking flow with confirmation
  - [ ] Test: Expired token shows error
  - [ ] Test: Keyboard navigation on confirmation page
- [ ] Run existing invitation test:
  ```bash
  npm run test:e2e -- tests/e2e/invitations/
  ```
- [ ] Verify: Invitation flow still works
- [ ] Create `tests/e2e/ops/unauthorized-access.spec.ts`
  - [ ] Test: Staff A cannot access Staff B's restaurant
  - [ ] Test: Staff cannot modify restaurant details (403)
- [ ] Run all E2E tests:
  ```bash
  npm run test:e2e
  ```

### Accessibility Tests

- [ ] Run axe on `/thank-you` page:
  ```bash
  npm run test:e2e -- tests/e2e/a11y/thank-you.spec.ts
  ```
- [ ] Verify: No critical violations
- [ ] Test keyboard navigation:
  - [ ] Tab through all interactive elements
  - [ ] Focus indicators visible
  - [ ] Can navigate with Enter/Space

---

## Phase 6: Documentation & Runbook

### Update Route Documentation

- [ ] Open `COMPREHENSIVE_ROUTE_ANALYSIS.md`
- [ ] Add entry for `GET /api/bookings/confirm`:
  ```markdown
  | GET | `/api/bookings/confirm?token=` | None | Get booking by confirmation token |
  ```
- [ ] Add entry for `/api/v1/restaurants`:
  ```markdown
  | GET | `/api/v1/restaurants` | None | List restaurants (v1) |
  ```
- [ ] Update `/thank-you` entry:
  ```markdown
  | `/thank-you` | Public | Post-booking confirmation (token-based) |
  ```
- [ ] Add section on confirmation token flow under "Business Logic"
- [ ] Commit changes

### Update Quick Reference

- [ ] Open `ROUTE_QUICK_REFERENCE.md`
- [ ] Add to Core API Endpoints:
  ```markdown
  | GET | `/api/bookings/confirm?token` | None | Confirm booking with token |
  ```
- [ ] Update Thank-You description
- [ ] Commit changes

### Create Runbook

- [ ] Create `docs/runbooks/security-operations.md`:

  ````markdown
  # Security Operations Runbook

  ## PII Access Rules

  ### Who Can Access Customer Data

  - **Staff**: Can view customers for their assigned restaurant(s)
  - **Owner/Admin**: Full access to their restaurant's customer data
  - **System**: Service role for background jobs, integrations

  ### Authorization Pattern

  All ops/owner routes must call:

  - `requireMembershipForRestaurant()` for staff access
  - `requireAdminMembership()` for owner/admin-only operations

  ### Audit Logging

  All 403 decisions logged with:

  - User ID
  - Restaurant ID
  - Required roles
  - Actual role (if any)
  - Route attempted

  ### GDPR Compliance

  - Customer email/phone never logged in plain text
  - Use hashed identifiers for logs
  - PII must not appear in error messages

  ---

  ## Webhook Verification

  ### Mailgun Webhooks (`/api/webhook/mailgun`)

  - **Verification**: HMAC signature in `X-Mailgun-Signature` header
  - **Secret**: `env.email.mailgunWebhookSecret`
  - **Algorithm**: HMAC-SHA256
  - **Replay Prevention**: Check timestamp within 5 minutes

  ### Inngest Jobs (`/api/inngest`)

  - **Verification**: Inngest SDK automatic signature verification
  - **Key**: `env.inngest.signingKey`
  - **Docs**: https://www.inngest.com/docs/security

  ---

  ## Test Endpoint Gating

  ### Routes: `/api/test/*`

  - **Purpose**: E2E test helpers (create test data, auth sessions)
  - **Protection**: Must NOT be accessible in production

  ### Current Gating

  ```typescript
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 });
  }
  ```
  ````

  ### Verification

  ```bash
  # Should return 404 in production
  curl https://production.example.com/api/test/bookings
  ```

  ### Alternative: Feature Flag

  ```typescript
  if (!env.features.testEndpoints) {
    return 404;
  }
  ```

  ***

  ## Incident Response

  ### Unauthorized Access Detected (403 Spike)
  1. Check logs for patterns:
     ```
     [auth] Membership denied - userId: xxx, restaurantId: yyy
     ```
  2. Identify if single user or distributed attack
  3. If single user: Verify their memberships, check if revoked
  4. If distributed: Check for credential stuffing, enable IP-based rate limiting
  5. Notify security team if sustained attack

  ### Data Leak Investigation
  1. Identify which endpoint was accessed
  2. Check auth logs for bypass (should have 403)
  3. If auth bypassed: Emergency fix required
  4. Query database for audit_events: `action = 'unauthorized_access'`
  5. Notify affected customers per GDPR requirements

  ### Compromised Token
  1. If confirmation token leaked:
     - Token is one-time use (automatically marked used)
     - Expires in 1 hour
     - Limited damage (single booking)
  2. If auth session compromised:
     - Revoke user session via Supabase Admin API
     - Force re-authentication
     - Check for unauthorized operations in audit log

  ```

  ```

- [ ] Commit runbook

---

## Phase 7: Deployment & Verification

### Staging Deployment

- [ ] Merge all changes to `staging` branch
- [ ] Deploy to staging environment
- [ ] Run database migration:
  ```bash
  supabase db push --remote staging
  ```
- [ ] Verify migration applied:
  ```bash
  supabase db inspect --remote staging
  ```
- [ ] Manual smoke tests:
  - [ ] Create booking → Should return confirmationToken
  - [ ] Visit `/thank-you?token=xxx` → Should show booking
  - [ ] Try expired token → Should show error
  - [ ] Try `/api/v1/restaurants` → Should return 200
  - [ ] Try staff accessing other restaurant → Should 403
- [ ] Run E2E tests against staging:
  ```bash
  npm run test:e2e -- --baseURL=https://staging.example.com
  ```

### Production Deployment

- [ ] Merge to `main` branch
- [ ] Deploy to production
- [ ] Run migration:
  ```bash
  supabase db push --remote production
  ```
- [ ] Verify migration
- [ ] Monitor logs for:
  - [ ] `POST /api/bookings` response time
  - [ ] `GET /api/bookings/confirm` rate (410, 429 errors)
  - [ ] 403 rate on ops/owner routes (should not spike)
- [ ] Create booking manually (production)
- [ ] Verify confirmation flow

### Acceptance Criteria Verification

- [ ] **B1**: Deprecation header points to working v1 route ✅
- [ ] **B2**: Documentation reflects actual routes ✅
- [ ] **B3**: Guest booking flow completes without signin ✅
- [ ] **B4**: /pricing resolved (removed or page added) ✅
- [ ] **C1**: All ops/owner routes enforce RBAC ✅
- [ ] All tests passing ✅
- [ ] Runbook created ✅

---

## Notes

### Assumptions

- Supabase remote-only (no local migrations)
- Feature flag system exists (via `env.features`)
- Rate limiting via Upstash Redis (production) or in-memory (dev)

### Deviations from Plan

- (None yet)

### Blocked/Waiting

- (None yet)

### Questions for Team

1. Should confirmation token expiry be configurable? (Currently hardcoded 1 hour)
2. Do we want email notification when 403 rate exceeds threshold?
3. Should `/api/test/*` routes use feature flag or NODE_ENV check?

---

**Status**: Ready to begin implementation  
**Next Step**: Start with Phase 1 (Quick Wins)
