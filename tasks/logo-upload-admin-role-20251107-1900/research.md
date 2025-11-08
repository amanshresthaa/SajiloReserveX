# Research: Ops restaurant logo uploads are rejected

## Requirements

- Functional:
  - Operations users with restaurant-level access (owners, managers) must upload/replace/remove logos via `/ops/restaurant-settings` without needing a separate `admin` role.
  - Unauthorized users (no membership or insufficient role) must continue to receive a 403.
- Non-functional (a11y, perf, security, privacy, i18n):
  - Keep existing 2 MB size cap and MIME allowlist enforced server- and client-side.
  - File uploads continue using Supabase storage bucket `restaurant-branding` with public URLs.
  - Do not leak membership details in error messages or logs.

## Existing Patterns & Reuse

- UI already uses `RestaurantLogoUploader` (`src/components/features/restaurant-settings/RestaurantLogoUploader.tsx`) and `useOpsRestaurantLogoUpload` hook to POST to `/api/ops/restaurants/:id/logo`.
- Server route `src/app/api/ops/restaurants/[id]/logo/route.ts` currently calls a bespoke `ensureAdminAccess` helper that checks Supabase membership rows for a literal `'admin'` role (which is not part of `RESTAURANT_ROLES`).
- We already have centralized membership/role guards in `server/team/access.ts`, including `requireAdminMembership` that accepts `RESTAURANT_ADMIN_ROLES` (`owner`, `manager`).

## External Resources

- None needed; behavior is fully defined in-repo via Supabase schema and access helpers.

## Constraints & Risks

- Buckets must remain public + pre-created when first upload happens. Any refactor must keep `ensureBucketExists` behavior intact.
- We cannot broaden access beyond the intended admin roles (owners + managers) without PM approval.
- Need to avoid duplicating role lists; rely on shared constants to prevent drift.

## Open Questions (owner, due)

- Do ops-specific roles beyond `owner`/`manager` need access? **Assumption**: no, because `RESTAURANT_ADMIN_ROLES` already reflect PM-approved set. Will confirm if new bug reports appear.

## Recommended Direction (with rationale)

- Remove the bespoke `ensureAdminAccess` function and instead call `requireAdminMembership({ userId, restaurantId })` from `server/team/access`. This reuses the canonical role list and prevents future drift.
- Map membership errors to the existing 403 responses so UI keeps displaying “admin access required,” but ensure managers now pass the check.
- Leave the rest of the upload code untouched to minimize risk.
