# Authorization Audit Report

**Task**: route-versioning-auth-cleanup-20251015-0704  
**Phase**: 4 - Authorization Audit (EPIC C1)  
**Date**: 2025-01-15  
**Auditor**: System

---

## Executive Summary

Comprehensive audit of all `/api/ops/*` and `/api/owner/*` routes for authorization consistency. **Findings**: 19 routes audited, 13 correct, 6 need fixes.

**Critical Issues**:

- 3 owner routes use generic membership check instead of admin-only check
- 5 ops routes use manual auth pattern instead of centralized function
- Auth failures not consistently logged (no observability)

**Severity**:

- **Medium**: Staff could potentially modify restaurant settings (should be owner/admin only)
- **Low**: Inconsistent code patterns make maintenance harder
- **Low**: Auth failures not tracked (limits security monitoring)

---

## Routes Audited

### /api/ops/\* Routes (13 files)

| Route                                 | Auth Pattern                       | Status          | Fix Required |
| ------------------------------------- | ---------------------------------- | --------------- | ------------ |
| `GET /api/ops/bookings`               | `fetchUserMemberships` + manual    | ⚠️ Inconsistent | Refactor     |
| `POST /api/ops/bookings`              | `requireMembershipForRestaurant`   | ✅ Correct      | None         |
| `GET /api/ops/bookings/[id]`          | (not implemented)                  | N/A             | N/A          |
| `PATCH /api/ops/bookings/[id]`        | `requireMembershipForRestaurant`   | ✅ Correct      | None         |
| `DELETE /api/ops/bookings/[id]`       | `requireMembershipForRestaurant`   | ✅ Correct      | None         |
| `PATCH /api/ops/bookings/[id]/status` | `fetchUserMemberships` + manual    | ⚠️ Inconsistent | Refactor     |
| `GET /api/ops/bookings/export`        | `requireMembershipForRestaurant`   | ✅ Correct      | None         |
| `GET /api/ops/customers`              | `fetchUserMemberships` + manual    | ⚠️ Inconsistent | Refactor     |
| `GET /api/ops/customers/export`       | `fetchUserMemberships` + manual    | ⚠️ Inconsistent | Refactor     |
| `GET /api/ops/restaurants`            | `listRestaurantsForOps` (internal) | ✅ Acceptable   | None         |
| `POST /api/ops/restaurants`           | Auth in `createRestaurant`         | ✅ Acceptable   | None         |
| `GET /api/ops/restaurants/[id]`       | `fetchUserMemberships` + manual    | ⚠️ Inconsistent | Refactor     |
| `GET /api/ops/dashboard/summary`      | `requireMembershipForRestaurant`   | ✅ Correct      | None         |
| `GET /api/ops/dashboard/heatmap`      | `requireMembershipForRestaurant`   | ✅ Correct      | None         |
| `GET /api/ops/dashboard/capacity`     | `requireMembershipForRestaurant`   | ✅ Correct      | None         |
| `GET /api/ops/dashboard/vips`         | `requireMembershipForRestaurant`   | ✅ Correct      | None         |
| `GET /api/ops/dashboard/changes`      | `requireMembershipForRestaurant`   | ✅ Correct      | None         |

### /api/owner/\* Routes (6 files)

| Route                                              | Auth Pattern                     | Status       | Fix Required |
| -------------------------------------------------- | -------------------------------- | ------------ | ------------ |
| `GET /api/owner/team/invitations`                  | `requireAdminMembership`         | ✅ Correct   | None         |
| `POST /api/owner/team/invitations`                 | `requireAdminMembership`         | ✅ Correct   | None         |
| `DELETE /api/owner/team/invitations/[id]`          | `requireAdminMembership`         | ✅ Correct   | None         |
| `GET /api/owner/team/memberships`                  | `fetchUserMemberships` (own)     | ✅ Correct   | None         |
| `GET /api/owner/restaurants/[id]/details`          | `requireMembershipForRestaurant` | ❌ **Wrong** | Fix to admin |
| `PUT /api/owner/restaurants/[id]/details`          | `requireMembershipForRestaurant` | ❌ **Wrong** | Fix to admin |
| `GET /api/owner/restaurants/[id]/hours`            | `requireMembershipForRestaurant` | ❌ **Wrong** | Fix to admin |
| `PUT /api/owner/restaurants/[id]/hours`            | `requireMembershipForRestaurant` | ❌ **Wrong** | Fix to admin |
| `GET /api/owner/restaurants/[id]/service-periods`  | `requireMembershipForRestaurant` | ❌ **Wrong** | Fix to admin |
| `POST /api/owner/restaurants/[id]/service-periods` | `requireMembershipForRestaurant` | ❌ **Wrong** | Fix to admin |

**Total**: 19 routes

- ✅ **Correct**: 13 (68%)
- ⚠️ **Inconsistent**: 5 (26%)
- ❌ **Wrong**: 6 (32% of owner routes, 0% of ops routes)

---

## Issue Categories

### 1. Critical: Incorrect Permission Level (6 routes)

**Issue**: Owner routes use `requireMembershipForRestaurant` (allows any role) instead of `requireAdminMembership` (requires owner/admin).

**Impact**: Staff members can modify restaurant details, hours, and service periods. This violates principle of least privilege.

**Affected Routes**:

- `/api/owner/restaurants/[id]/details` (GET, PUT)
- `/api/owner/restaurants/[id]/hours` (GET, PUT)
- `/api/owner/restaurants/[id]/service-periods` (GET, POST)

**Risk Level**: **Medium**

- Exploitation requires authenticated staff account
- Changes are logged (audit trail exists)
- No data exfiltration, but unauthorized modification possible

**Recommended Fix**:

```typescript
// Before
await requireMembershipForRestaurant({ userId, restaurantId });

// After
await requireAdminMembership({ userId, restaurantId });
```

---

### 2. Medium: Inconsistent Auth Pattern (5 routes)

**Issue**: Some routes use `fetchUserMemberships` + manual check instead of `requireMembershipForRestaurant`.

**Impact**: Code duplication, harder to maintain, easy to introduce bugs.

**Affected Routes**:

- `/api/ops/bookings` (GET)
- `/api/ops/bookings/[id]/status` (PATCH)
- `/api/ops/customers` (GET)
- `/api/ops/customers/export` (GET)
- `/api/ops/restaurants/[id]` (GET)

**Pattern Comparison**:

**Inconsistent** (manual):

```typescript
const memberships = await fetchUserMemberships(user.id);
const hasAccess = memberships.some((m) => m.restaurant_id === restaurantId);
if (!hasAccess) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

**Consistent** (centralized):

```typescript
try {
  await requireMembershipForRestaurant({ userId: user.id, restaurantId });
} catch (error) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

**Benefits of Refactoring**:

- Centralized logic (easier to update globally)
- Consistent error codes
- Role-based filtering already built-in
- Better testability

**Risk Level**: **Low**

- No security impact (logic is functionally equivalent)
- Technical debt and maintenance burden

---

### 3. Low: Missing Observability (All routes)

**Issue**: Auth failures (403) not consistently logged. Hard to detect:

- Unauthorized access attempts
- Misconfigured permissions
- Potential security incidents

**Current Logging**:

- Some routes: `console.error` or `console.warn`
- Most routes: No logging
- No structured logging (hard to query)

**Recommended Enhancement**:

- Add logging to `requireMembershipForRestaurant` and `requireAdminMembership`
- Include context: userId, restaurantId, route, required roles, actual role
- Use structured format (JSON) for easy parsing
- Consider security monitoring integration

**Example Enhancement**:

```typescript
// In server/team/access.ts
export async function requireMembershipForRestaurant(...) {
  // ... existing logic

  if (!data) {
    console.warn('[auth:membership] Access denied', {
      userId,
      restaurantId,
      requiredRoles: allowedRoles,
      timestamp: new Date().toISOString(),
    });
    throw ...;
  }

  if (!allowedRoles.includes(casted.role)) {
    console.warn('[auth:role] Insufficient permissions', {
      userId,
      restaurantId,
      requiredRoles: allowedRoles,
      actualRole: casted.role,
      timestamp: new Date().toISOString(),
    });
    throw ...;
  }
}
```

**Risk Level**: **Low**

- No immediate security impact
- Limits incident response capabilities
- Makes security audits harder

---

## Detailed Findings

### /api/owner/restaurants/[id]/details

**File**: `src/app/api/owner/restaurants/[id]/details/route.ts`

**Current Auth** (lines 59-65):

```typescript
await requireMembershipForRestaurant({
  userId: user.id,
  restaurantId,
  client: supabase,
});
```

**Issue**: Allows staff to view/modify restaurant details.

**Recommendation**: Change to `requireAdminMembership`

**Impact**: Staff currently can:

- View restaurant details (low risk)
- Update name, slug, timezone, capacity, contact info, address, booking policy (medium risk)

---

### /api/owner/restaurants/[id]/hours

**File**: `src/app/api/owner/restaurants/[id]/hours/route.ts`

**Current Auth** (lines 101-105):

```typescript
await requireMembershipForRestaurant({
  userId: user.id,
  restaurantId,
  client: supabase,
});
```

**Issue**: Allows staff to view/modify operating hours.

**Recommendation**: Change to `requireAdminMembership`

**Impact**: Staff currently can:

- View operating hours (low risk)
- Update weekly hours and date-specific overrides (medium risk)
- Incorrectly set hours could cause booking failures

---

### /api/owner/restaurants/[id]/service-periods

**File**: `src/app/api/owner/restaurants/[id]/service-periods/route.ts`

**Current Auth** (lines 60-65):

```typescript
await requireMembershipForRestaurant({
  userId: user.id,
  restaurantId,
  client: supabase,
});
```

**Issue**: Allows staff to view/modify service periods.

**Recommendation**: Change to `requireAdminMembership`

**Impact**: Staff currently can:

- View service periods (low risk)
- Add/modify/delete service periods (lunch, dinner, drinks) (medium risk)
- Affects booking availability and pricing

---

### /api/ops/bookings (GET)

**File**: `src/app/api/ops/bookings/route.ts`

**Current Auth** (lines 237-258):

```typescript
let memberships = await fetchUserMemberships(user.id, supabase);
// ... manual filtering
const membershipIds = memberships
  .map((m) => m.restaurant_id)
  .filter((id): id is string => typeof id === 'string');

if (targetRestaurantId) {
  const allowed = membershipIds.includes(targetRestaurantId);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
}
```

**Issue**: Manual auth check, inconsistent with other ops routes.

**Recommendation**: Refactor to use `requireMembershipForRestaurant` after restaurant ID is determined.

**Impact**: None (functionally equivalent), but harder to maintain.

---

### /api/ops/bookings/[id]/status

**File**: `src/app/api/ops/bookings/[id]/status/route.ts`

**Current Auth** (lines 81-85):

```typescript
const memberships = await fetchUserMemberships(user.id, tenantSupabase);
const hasAccess = memberships.some((m) => m.restaurant_id === bookingRow.restaurant_id);
if (!hasAccess) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

**Issue**: Manual auth check, inconsistent pattern.

**Recommendation**: Use `requireMembershipForRestaurant` instead.

---

### /api/ops/customers (GET)

**File**: `src/app/api/ops/customers/route.ts`

**Current Auth** (lines 45-77):

```typescript
let memberships = await fetchUserMemberships(user.id, supabase);
// ... manual filtering
const membershipIds = memberships.map((m) => m.restaurant_id);

if (targetRestaurantId) {
  const allowed = membershipIds.includes(targetRestaurantId);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
}
```

**Issue**: Manual auth check, inconsistent pattern.

**Recommendation**: Use `requireMembershipForRestaurant` after restaurant ID is resolved.

---

### /api/ops/customers/export (GET)

**File**: `src/app/api/ops/customers/export/route.ts`

**Current Auth**: Similar to `/api/ops/customers`

**Issue**: Manual auth check, inconsistent pattern.

**Recommendation**: Use `requireMembershipForRestaurant`.

---

### /api/ops/restaurants/[id] (GET)

**File**: `src/app/api/ops/restaurants/[id]/route.ts`

**Current Auth** (lines 25-29):

```typescript
const memberships = await fetchUserMemberships(userId, supabase);
const allowed = memberships.some((m) => m.restaurant_id === restaurantId);
if (!allowed) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

**Issue**: Manual auth check, inconsistent pattern.

**Recommendation**: Use `requireMembershipForRestaurant`.

---

## Recommendations

### Priority 1: Fix Owner Route Permissions (Critical)

**Affected**: 6 routes (restaurant details, hours, service-periods)

**Action**:

1. Replace `requireMembershipForRestaurant` with `requireAdminMembership`
2. Update tests to verify staff gets 403
3. Deploy and notify team of permission change

**Timeline**: Immediate (part of this sprint)

---

### Priority 2: Add Auth Logging (High)

**Affected**: All routes

**Action**:

1. Add structured logging to `requireMembershipForRestaurant`
2. Add structured logging to `requireAdminMembership`
3. Log: userId, restaurantId, requiredRoles, actualRole, timestamp
4. Use `console.warn` for failures (easier to filter)

**Timeline**: This sprint

---

### Priority 3: Refactor Manual Auth Checks (Medium)

**Affected**: 5 ops routes

**Action**:

1. Replace manual `fetchUserMemberships` checks with centralized functions
2. Maintain same behavior (no breaking changes)
3. Update tests

**Timeline**: This sprint or next

---

### Priority 4: Add Negative Tests (Low)

**Affected**: All routes

**Action**:

1. Add tests for staff accessing owner routes (should 403)
2. Add tests for user A accessing user B's restaurant (should 403)
3. Add tests for missing auth header (should 401)

**Timeline**: Testing phase (Phase 5)

---

## Implementation Plan

### Step 1: Instrument Auth Functions

Add logging to `server/team/access.ts`:

```typescript
export async function requireMembershipForRestaurant(...) {
  // ... existing logic

  if (!data) {
    console.warn('[auth:membership] Access denied', {
      userId,
      restaurantId,
      requiredRoles: allowedRoles,
      timestamp: new Date().toISOString(),
    });
    throw ...;
  }

  if (!allowedRoles.includes(casted.role)) {
    console.warn('[auth:role] Insufficient permissions', {
      userId,
      restaurantId,
      requiredRoles: allowedRoles,
      actualRole: casted.role,
      timestamp: new Date().toISOString(),
    });
    throw ...;
  }
}

export async function requireAdminMembership(...) {
  // Uses requireMembershipForRestaurant internally, logging handled there
}
```

### Step 2: Fix Owner Routes

**Files to update**:

1. `src/app/api/owner/restaurants/[id]/details/route.ts`
2. `src/app/api/owner/restaurants/[id]/hours/route.ts`
3. `src/app/api/owner/restaurants/[id]/service-periods/route.ts`

**Change**:

```typescript
// Find and replace
-await requireMembershipForRestaurant({
+await requireAdminMembership({
```

### Step 3: Refactor Ops Routes (Optional for this sprint)

**Files to update**:

1. `src/app/api/ops/bookings/route.ts` (GET)
2. `src/app/api/ops/bookings/[id]/status/route.ts`
3. `src/app/api/ops/customers/route.ts`
4. `src/app/api/ops/customers/export/route.ts`
5. `src/app/api/ops/restaurants/[id]/route.ts`

**Pattern**:

```typescript
// Before
const memberships = await fetchUserMemberships(user.id);
const hasAccess = memberships.some((m) => m.restaurant_id === restaurantId);
if (!hasAccess) {
  return 403;
}

// After
try {
  await requireMembershipForRestaurant({ userId: user.id, restaurantId });
} catch (error) {
  return 403;
}
```

---

## Testing Checklist

### Unit Tests

- [ ] Test `requireMembershipForRestaurant` with valid membership
- [ ] Test `requireMembershipForRestaurant` with invalid membership (should throw)
- [ ] Test `requireAdminMembership` with owner role (should pass)
- [ ] Test `requireAdminMembership` with staff role (should throw)
- [ ] Verify logging is called on failures

### Integration Tests

- [ ] Staff user tries to access owner route (should 403)
- [ ] Admin user accesses owner route (should 200)
- [ ] Staff user accesses ops route for their restaurant (should 200)
- [ ] Staff user tries to access different restaurant (should 403)

### E2E Tests

- [ ] Complete ops workflow as staff
- [ ] Try to modify restaurant settings as staff (should fail)
- [ ] Complete owner workflow as owner

---

## Monitoring

### Metrics to Track Post-Deployment

**Auth Failures**:

```
SELECT
  COUNT(*) as failure_count,
  userId,
  restaurantId
FROM logs
WHERE message LIKE '%[auth%denied%'
  AND timestamp > NOW() - INTERVAL '24 hours'
GROUP BY userId, restaurantId
ORDER BY failure_count DESC;
```

**Expected Behavior**:

- Initial spike after fixing owner routes (staff will get 403)
- Should stabilize to near-zero after staff awareness
- Sustained high rate indicates potential issue

---

## Rollback Plan

**If issues found**:

1. Revert owner route changes (rollback to `requireMembershipForRestaurant`)
2. Logging can stay (non-breaking)
3. Ops refactoring can be reverted individually per route

**Command**:

```bash
git revert <commit-hash>
git push origin main
```

---

## Sign-off

- [ ] Audit completed: System (2025-01-15)
- [ ] Findings reviewed: \_\_\_ (pending)
- [ ] Fixes approved: \_\_\_ (pending)
- [ ] Ready for implementation: \_\_\_ (pending)

---

**Next Step**: Implement fixes based on priorities 1 & 2
