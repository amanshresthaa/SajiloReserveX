# Research: Ops restaurant PATCH requires nonexistent admin role

## Requirements

- Functional:
  - `/api/ops/restaurants/:id` PATCH should accept updates from users with `owner` or `manager` memberships (same as other admin-only ops features).
  - GET/DELETE behavior must remain unchanged (DELETE still owner-only; GET remains any member).
  - Error responses should stay consistent (`{ error: string }` JSON).
- Non-functional:
  - Keep Supabase access checks centralized and reuse existing utilities to prevent role drift.
  - Avoid leaking role names for users without permission beyond the existing “Forbidden” message.

## Existing Patterns & Reuse

- `server/team/access.ts` exposes `requireAdminMembership` (owner+manager) and `requireMembershipForRestaurant` with configurable role lists.
- We already reused that helper in `/api/ops/restaurants/[id]/logo/route.ts` moments ago.
- PATCH route currently calls a bespoke `verifyRestaurantAccess`, duplicating queries and hardcoding an `admin` role that isn’t part of `RESTAURANT_ROLES`, causing 403s after successful uploads.

## External Resources

- Not needed; all logic and role definitions live in-repo (`lib/owner/auth/roles.ts`).

## Constraints & Risks

- Must not relax DELETE owner-only requirement.
- Need to ensure we still return 403 for unauthorized roles and keep 500 logging for Supabase failures.
- Changing helper usage should not add extra Supabase round trips beyond existing service client usage.

## Open Questions

- None at this time; assumption is that `RESTAURANT_ADMIN_ROLES` (owner, manager) is the authoritative list.

## Recommended Direction

- Remove `verifyRestaurantAccess` and instead use the shared helpers per verb:
  - GET: `requireMembershipForRestaurant` to capture role and gate membership existence.
  - PATCH: `requireAdminMembership` (owner+manager) to allow updates.
  - DELETE: `requireMembershipForRestaurant` with `allowedRoles: ['owner']` to keep owner-only semantics.
- Map known membership error codes (`MEMBERSHIP_NOT_FOUND`, `MEMBERSHIP_ROLE_DENIED`) to 403 responses; log and 500 for unexpected failures.
- Keep existing shape of `RestaurantDTO` payloads by threading the membership role returned from helper.
