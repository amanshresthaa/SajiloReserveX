# Research: Route Versioning & Auth Cleanup

**Task**: EPIC B (Versioning & Path Consistency) + EPIC C (Auth Clarity)  
**Date**: 2025-01-15  
**Repository**: SajiloReserveX

---

## Executive Summary

Investigated 5 issues across route versioning, endpoint conflicts, authentication flow, and authorization patterns. All issues confirmed. Key findings:

1. **Critical**: `/api/v1/restaurants` route doesn't exist but middleware references it
2. **Documentation**: Invitation endpoint conflict is in docs, not code
3. **UX Blocker**: `/thank-you` requires auth but guest bookings don't create accounts
4. **404**: `/pricing` directory exists but has no page.tsx
5. **Security**: Owner/ops auth pattern is consistent but needs comprehensive audit

---

## 1. /api/restaurants Versioning Drift

### Current State

**Unversioned Route Exists**:

- File: `src/app/api/restaurants/route.ts`
- Methods: GET (list restaurants with filters)
- Status: ✅ Working

**v1 Route Missing**:

- Expected: `src/app/api/v1/restaurants/route.ts`
- Actual: ❌ Does not exist (confirmed via Glob)

**Middleware Behavior** (`middleware.ts` lines 20-32):

```typescript
if (!isVersioned) {
  const successor = pathname.replace(/^\/api\//, '/api/v1/');
  response.headers.set('Link', `<${successor}>; rel="successor-version"`);
}
```

- ✅ Correctly adds deprecation headers to `/api/restaurants`
- ❌ Points to `/api/v1/restaurants` which returns 404

### Observed Pattern for v1 Routes

Other endpoints use re-export pattern:

```typescript
// src/app/api/v1/bookings/route.ts
export { GET, POST } from '../../bookings/route';
```

**Existing v1 Re-exports**:

- `/api/v1/bookings` → `/api/bookings` ✅
- `/api/v1/profile` → `/api/profile` ✅
- `/api/v1/events` → `/api/events` ✅
- `/api/v1/lead` → `/api/lead` ✅

### Impact

- Clients following deprecation header get 404
- Migration path broken
- Documentation (COMPREHENSIVE_ROUTE_ANALYSIS.md) notes the discrepancy but route remains missing

### Recommended Fix

1. Create `src/app/api/v1/restaurants/route.ts` with re-export
2. Create `src/app/api/v1/restaurants/[slug]/schedule/route.ts` (sub-route)
3. Update route mapping tables in docs
4. Test successor link resolves correctly

---

## 2. Invitation Acceptance Endpoint Conflict

### Documented Conflict

EPIC B task states:

> Conflict: /api/team/invitations/[token]/accept vs /api/owner/team/invitations/[id]/accept (and "Public").

### Actual Code State

**Public Invitation Routes** (token-based):

1. `GET /api/team/invitations/[token]/route.ts`
   - Purpose: Get invitation details by token
   - Auth: None (public)
   - Status: ✅ Exists, working

2. `POST /api/team/invitations/[token]/accept/route.ts`
   - Purpose: Accept invitation and create account
   - Auth: None (public, token validates)
   - Payload: `{ name, password }`
   - Creates auth user + restaurant membership
   - Status: ✅ Exists, working

**Owner Admin Routes** (ID-based):

1. `GET /api/owner/team/invitations/route.ts`
   - Purpose: List invitations (with filters)
   - Auth: Required (owner/admin)
   - Status: ✅ Exists, working

2. `POST /api/owner/team/invitations/route.ts`
   - Purpose: Create new invitation
   - Auth: Required (owner/admin)
   - Status: ✅ Exists, working

3. `DELETE /api/owner/team/invitations/[inviteId]/route.ts`
   - Purpose: **Revoke** invitation (NOT accept!)
   - Auth: Required (owner/admin)
   - Status: ✅ Exists, working

### Finding: No Actual Conflict in Code

- `/api/owner/team/invitations/[id]/accept` **does not exist**
- Quick Reference incorrectly documents: `POST /api/owner/team/invitations/[id]/accept` as "Accept invite"
- Actual flow:
  1. Owner creates invite → POST `/api/owner/team/invitations` (returns token)
  2. Email sent with token link → `/invite/{token}`
  3. Recipient accepts → POST `/api/team/invitations/{token}/accept` (public)
  4. Owner can revoke → DELETE `/api/owner/team/invitations/{inviteId}`

### Documentation Issues

**ROUTE_QUICK_REFERENCE.md** (line ~110):

```markdown
| POST | `/api/owner/team/invitations/[id]/accept` | Public | Accept invite |
```

Should be:

```markdown
| POST | `/api/team/invitations/[token]/accept` | Public | Accept invite |
| DELETE | `/api/owner/team/invitations/[inviteId]` | Owner | Revoke invite |
```

### Recommended Fix

1. **Code**: No changes needed (routes are correct)
2. **Docs**:
   - Fix Quick Reference table entry
   - Clarify flow in Comprehensive doc
   - Remove "Public" label from owner routes
3. **Email templates**: Verify they link to `/invite/{token}` (not `/api/...`)

---

## 3. /thank-you Protection vs Customer Flow

### Current State

**Page Implementation** (`src/app/thank-you/page.tsx`):

```typescript
export default async function ThankYouPage() {
  const supabase = await getServerComponentSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect(`/signin?redirectedFrom=/thank-you`);
  }
  // ... render confirmation
}
```

- ✅ Requires authenticated user
- ❌ Redirects to signin if no session

**Middleware Protection** (`middleware.ts`):

```typescript
const PROTECTED_MATCHERS = [
  /^\/my-bookings(\/.*)?$/,
  /^\/profile(\/.*)?$/,
  /^\/thank-you(\/.*)?$/, // ← Protected
];
```

- ✅ Middleware also enforces auth
- Same redirect behavior

### Guest Booking Flow Issue

**Typical Customer Journey**:

1. Guest browses `/browse` (no account)
2. Makes booking via `POST /api/bookings` (no auth required)
3. Booking created with confirmation email
4. UI redirects to `/thank-you` ❌ **Auth required!**
5. Guest redirected to `/signin?redirectedFrom=/thank-you`
6. Guest must create account/sign in to see confirmation
7. After signin, `/thank-you` page shows **generic** content (not booking-specific)

**Current `/thank-you` Content**:

- Generic "Thanks for booking" message
- No booking details (reference, date, time)
- No access to booking data
- Links: "Return home" / "Make another booking"

### Problems

1. **UX Friction**: Guest must create account post-booking to see confirmation
2. **No Booking Context**: Page doesn't show specific booking details
3. **Email Sufficient?**: Confirmation email may be only receipt
4. **Inconsistent Auth**: Booking API is public, but confirmation page is protected

### Existing Patterns

**Booking Lookup** (no auth):

- `GET /api/bookings?email={email}&phone={phone}`
- Returns booking details for guests
- Rate limited (20/min)

**Reservation Confirmation** (test endpoint):

- `GET /api/test/reservations/[reservationId]/confirmation`
- Public route for specific booking confirmation

### Recommended Solutions

**Option A: Public Thank-You with One-Time Token** (Preferred)

1. Booking creation returns short-lived token (e.g., 1 hour expiry)
2. Redirect to `/thank-you?token={token}` instead of `/thank-you`
3. Page fetches booking via token (no auth required)
4. Token stored in bookings table: `confirmation_token`, `confirmation_token_expires_at`
5. Rate limit token endpoint

**Option B: Public with Ephemeral Session Data**

1. Store booking ID in HTTP-only cookie (short-lived, 10 min)
2. `/thank-you` reads cookie, fetches booking
3. Cookie auto-expires
4. No PII in cookie (just booking ID)

**Option C: Remove Protection, Show Generic Page**

1. Make `/thank-you` fully public
2. Remove from PROTECTED_MATCHERS
3. Show only generic "check your email" message
4. No booking details on page

**Option D: Email-Only Confirmation**

1. Remove `/thank-you` page entirely
2. Rely solely on email confirmation
3. Update booking flow to stay on `/browse` or `/`
4. Show toast/banner: "Booking confirmed! Check your email."

### Constraints

- Must not expose PII without auth
- Rate limiting required for any public booking lookup
- GDPR: Minimal data exposure
- Token approach aligns with secure booking lookup pattern

---

## 4. /pricing Page Existence

### Current State

**Directory**:

- Path: `src/app/pricing/`
- Status: ✅ Exists (confirmed via LS)
- Contents: ❌ Empty (no page.tsx)

**Documentation Claims**:

- ROUTE_QUICK_REFERENCE.md (line 21): Lists `/pricing` as public page
- COMPREHENSIVE_ROUTE_ANALYSIS.md (line 178): "Pricing page (directory exists)"

**Expected File**: `src/app/pricing/page.tsx`

### Impact

- Navigating to `/pricing` returns 404
- Sitemap may include broken link
- Navbar/footer links may break (if they exist)

### Investigation

**Check for References**:

```bash
# Links to /pricing in components?
grep -r "href.*pricing" src/
```

Result: Only in documentation files (not in actual UI components)

**Sitemap Configuration** (`next-sitemap.config.js`):

- No explicit exclusion of `/pricing`
- May be auto-generated in sitemap.xml

### Recommended Fix

**Option A: Create Pricing Page**

1. Design pricing page (requires product/marketing input)
2. Create `src/app/pricing/page.tsx`
3. Add metadata (title, description)
4. Include pricing tiers, CTA buttons
5. Link from homepage/navbar

**Option B: Remove from Documentation**

1. Delete empty `/pricing` directory
2. Remove from Quick Reference
3. Remove from Comprehensive doc
4. Verify sitemap doesn't include it
5. Check 404 logs for traffic (if any)

**Recommendation**: Option B (remove) unless pricing page is immediate priority.

---

## 5. Owner/Staff Authorization Patterns

### Current Authorization System

**Centralized Guards** (`server/team/access.ts`):

```typescript
// 1. Fetch user memberships
fetchUserMemberships(userId: string): Promise<RestaurantMembershipWithDetails[]>

// 2. Require membership for any role
requireMembershipForRestaurant({
  userId,
  restaurantId,
  allowedRoles = RESTAURANT_ROLES,  // ['owner', 'admin', 'staff']
  client?
}): Promise<RestaurantMembershipWithDetails>

// 3. Require admin/owner role
requireAdminMembership({
  userId,
  restaurantId,
  client?
}): Promise<RestaurantMembershipWithDetails>
```

**Role Hierarchy** (from `lib/owner/auth/roles.ts`):

```typescript
RESTAURANT_ROLES = ['owner', 'admin', 'staff'];
RESTAURANT_ADMIN_ROLES = ['owner', 'admin'];
```

**Error Codes**:

- `MEMBERSHIP_NOT_FOUND`: User not a member of restaurant
- `MEMBERSHIP_ROLE_DENIED`: User has membership but insufficient role

### Usage Patterns Observed

**Pattern 1: Staff Access (Ops Routes)**

```typescript
// Example: /api/ops/bookings/route.ts
const {
  data: { user },
} = await supabase.auth.getUser();
if (!user) return 401;

await requireMembershipForRestaurant({
  userId: user.id,
  restaurantId,
});
// Allows any role (owner/admin/staff)
```

**Pattern 2: Admin Access (Owner Routes)**

```typescript
// Example: /api/owner/team/invitations/route.ts
const {
  data: { user },
} = await supabase.auth.getUser();
if (!user) return 401;

await requireAdminMembership({
  userId: user.id,
  restaurantId,
});
// Requires owner or admin role
```

**Pattern 3: Error Handling**

```typescript
try {
  await requireAdminMembership({ userId, restaurantId });
} catch (error) {
  if (error.code === 'MEMBERSHIP_NOT_FOUND' || error.code === 'MEMBERSHIP_ROLE_DENIED') {
    return 403;
  }
  return 500;
}
```

### Audit of Protected Routes

**Ops Routes** (`/api/ops/*`) - Should require staff membership:

| Route                             | Auth Check                        | Status  |
| --------------------------------- | --------------------------------- | ------- |
| GET /api/ops/bookings             | ✅ requireMembershipForRestaurant | Correct |
| POST /api/ops/bookings            | ✅ requireMembershipForRestaurant | Correct |
| PUT /api/ops/bookings/[id]/status | Need to verify                    | Unknown |
| GET /api/ops/customers            | Need to verify                    | Unknown |
| GET /api/ops/restaurants          | Need to verify                    | Unknown |
| GET /api/ops/dashboard/\*         | Need to verify                    | Unknown |

**Owner Routes** (`/api/owner/*`) - Should require admin role:

| Route                                            | Auth Check                        | Status                             |
| ------------------------------------------------ | --------------------------------- | ---------------------------------- |
| GET /api/owner/team/invitations                  | ✅ requireAdminMembership         | Correct                            |
| POST /api/owner/team/invitations                 | ✅ requireAdminMembership         | Correct                            |
| DELETE /api/owner/team/invitations/[id]          | ✅ requireAdminMembership         | Correct                            |
| GET /api/owner/team/memberships                  | Need to verify                    | Unknown                            |
| PUT /api/owner/restaurants/[id]/details          | ✅ requireMembershipForRestaurant | Should use requireAdminMembership? |
| PUT /api/owner/restaurants/[id]/hours            | Need to verify                    | Unknown                            |
| POST /api/owner/restaurants/[id]/service-periods | Need to verify                    | Unknown                            |

### Issues Identified

1. **Inconsistent Admin Checks**:
   - `/api/owner/restaurants/[id]/details` uses `requireMembershipForRestaurant` (any role)
   - Should likely use `requireAdminMembership` (owner/admin only)
   - Staff shouldn't be able to edit restaurant details

2. **Incomplete Audit**:
   - Not all `/api/ops/*` routes verified
   - Not all `/api/owner/*` routes verified
   - Dashboard endpoints (`/api/ops/dashboard/*`) not checked

3. **No Centralized Middleware**:
   - Each route manually calls auth checks
   - Risk of forgetting auth in new routes
   - No automatic instrumentation of 403 decisions

4. **Missing Restaurant Scoping**:
   - Some routes may not verify user has access to specific restaurant
   - Could leak data across restaurants if restaurantId not validated

5. **No Observability**:
   - 403 errors not logged consistently
   - No metrics for auth failures
   - Hard to detect unauthorized access attempts

### Recommended Fixes

**1. Comprehensive Route Audit**:

- Read all `/api/ops/*` routes, verify membership check
- Read all `/api/owner/*` routes, verify admin check
- Create matrix of route → auth requirement → current check → correct check

**2. Centralize Auth Middleware** (Future Enhancement):

- Create route handler wrapper: `withAuth()`, `withAdminAuth()`
- Automatic auth + role checking
- Example:
  ```typescript
  export const GET = withAuth(async (req, { user, membership }) => {
    // user and membership guaranteed
  });
  ```

**3. Instrument 403 Decisions**:

- Add logging in `requireMembershipForRestaurant` / `requireAdminMembership`
- Log: userId, restaurantId, requiredRole, actualRole, route
- Send to observability system

**4. Add Negative Tests**:

- Unit tests: Staff accessing admin routes (should 403)
- E2E tests: User A accessing User B's restaurant (should 403)
- Missing auth header tests

**5. Security Review Checklist**:

- [ ] All `/api/owner/*` routes use `requireAdminMembership`
- [ ] All `/api/ops/*` routes use `requireMembershipForRestaurant`
- [ ] All routes validate `restaurantId` matches user's membership
- [ ] 403 responses don't leak sensitive data
- [ ] Rate limiting on privileged routes
- [ ] Audit log for sensitive operations (team changes, restaurant config)

---

## Existing Patterns to Reuse

### API Versioning (from /api/v1/bookings)

```typescript
// src/app/api/v1/bookings/route.ts
export { GET, POST } from '../../bookings/route';
```

Simple re-export pattern. Zero duplication.

### Idempotency (from /api/profile)

```typescript
// Check for duplicate request
const hash = crypto.createHash('sha256').update(canonicalPayload).digest('hex');
const { data: existing } = await supabase
  .from('profile_update_requests')
  .select('*')
  .eq('profile_id', user.id)
  .eq('idempotency_key', idempotencyKey)
  .maybeSingle();

if (existing) {
  return 200; // Idempotent response
}
```

### Auth Error Handling (from /api/ops routes)

```typescript
try {
  await requireMembershipForRestaurant({ userId, restaurantId });
} catch (error) {
  if (error.code === 'MEMBERSHIP_NOT_FOUND' || error.code === 'MEMBERSHIP_ROLE_DENIED') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  throw error;
}
```

### Rate Limiting (from /api/ops/bookings)

```typescript
const rateResult = await consumeRateLimit({
  identifier: `ops:bookings:get:${user.id}`,
  limit: 120,
  windowMs: 60_000,
});

if (!rateResult.ok) {
  return NextResponse.json(
    { error: 'Too many requests' },
    { status: 429, headers: { 'Retry-After': '60' } },
  );
}
```

---

## External References

### Documentation

- [COMPREHENSIVE_ROUTE_ANALYSIS.md](../COMPREHENSIVE_ROUTE_ANALYSIS.md) - Full route catalog
- [ROUTE_QUICK_REFERENCE.md](../ROUTE_QUICK_REFERENCE.md) - Quick lookup

### Code Files

- `middleware.ts` - Auth + versioning middleware
- `server/team/access.ts` - Authorization utilities
- `src/app/api/restaurants/route.ts` - Unversioned restaurants API
- `src/app/api/team/invitations/[token]/accept/route.ts` - Public invitation acceptance
- `src/app/api/owner/team/invitations/route.ts` - Admin invitation management
- `src/app/thank-you/page.tsx` - Protected confirmation page

### Tests

- `tests/e2e/ops/team-management.spec.ts` - Team E2E tests
- Need to find unit tests for authorization functions

---

## Constraints & Risks

### Technical Constraints

1. **Supabase Auth**: Session-based, can't easily pass one-time tokens via cookies
2. **Next.js Middleware**: Runs on edge, limited APIs available
3. **Rate Limiting**: Upstash Redis required for production, in-memory for dev
4. **GDPR**: `/thank-you` page must not expose PII without proper auth

### Migration Risks

1. **API Versioning**: Breaking change if clients already adapted to 404 successor links
2. **Invitation Flow**: Email templates may have hardcoded URLs
3. **Thank-You Page**: Changing auth may break existing bookmarks/links
4. **Pricing Page**: Creating page requires design/copy (scope creep)

### Security Considerations

1. **Token Expiry**: Short-lived tokens for `/thank-you` must not be reusable
2. **Rate Limiting**: Public booking lookup must remain heavily rate-limited
3. **403 Logging**: Must not log PII in error messages
4. **Test Endpoints**: `/api/test/*` routes must be disabled in production

---

## Open Questions

1. **Pricing Page**: Is there a design/copy ready? Or remove from docs?
2. **Thank-You Token**: Should booking confirmation token be added to DB schema? (Migration required)
3. **Email Templates**: Where are they stored? Need to verify invitation URLs.
4. **Ops Dashboard Auth**: Do dashboard endpoints need different role requirements? (Read-only for staff, write for admin?)
5. **Restaurant Scoping**: Should staff be able to modify restaurant details, or only owner/admin?
6. **Test Endpoints**: How are `/api/test/*` routes currently gated? (Feature flag? Env check?)

---

## Recommended Approach

### Phase 1: Quick Wins (1-2 SP each)

1. ✅ Create `/api/v1/restaurants` re-export
2. ✅ Fix invitation documentation (no code changes)
3. ✅ Remove `/pricing` from docs or add placeholder page
4. ✅ Update Quick Reference + Comprehensive docs

### Phase 2: Auth Fixes (3-4 SP)

5. 🔧 Implement `/thank-you` solution (Option A: token-based)
6. 🔧 Audit all `/api/ops/*` and `/api/owner/*` routes for auth
7. 🔧 Add unit tests for authorization functions
8. 🔧 Fix any inconsistent auth checks (e.g., restaurant details)

### Phase 3: Observability (2-3 SP)

9. 📊 Instrument 403 decisions with logging
10. 📊 Add negative auth tests (E2E + unit)
11. 📊 Create runbook for PII access, webhook verification, test endpoints

---

**Last Updated**: 2025-01-15 07:04 UTC  
**Next Step**: Create plan.md with implementation details
