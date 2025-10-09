# Research: Authentication & Team Invites Sprint

## Existing Patterns

- Supabase handles auth lifecycle end-to-end (`components/auth/SignInForm.tsx`, `server/supabase.ts`, `middleware.ts`), including magic-link flows, cookie-based sessions, and automatic refresh.
- Role gating already exists through `restaurant_memberships` with enum roles (`owner`, `admin`, `staff`, `viewer`) and comprehensive RLS policies (`supabase/migrations/20251006170446_remote_schema.sql`, `types/supabase.ts`).
- Profile data and membership hydration follow `/api/profile` backed by `ensureProfileRow` helpers and TanStack Query hooks (`app/api/profile/route.ts`, `hooks/useProfile.ts`), providing a template for additional team APIs.
- Testing utilities provision Supabase users plus memberships for Playwright via `app/api/test/playwright-session/route.ts`, illustrating how to create users/memberships with the admin client.
- Resend is wired as the transactional email channel (`libs/resend.ts`), used by booking emails and test-email routes, ready to power invitation delivery.

## External Resources

- Supabase Auth admin API for invites and user management: <https://supabase.com/docs/reference/javascript/auth-admin-api>
- Supabase row level security best practices: <https://supabase.com/docs/guides/database/postgres/row-level-security>
- Resend email design guidelines: <https://resend.com/docs/emails/send-with-nodejs>

## Technical Constraints

- Role enum changes require coordinated updates to Supabase migrations, generated types, and every policy referencing `restaurant_memberships.role`.
- Supabase manages sessions via cookies; duplicating JWT/token storage would conflict with existing middleware.
- Invitation flow must respect existing RLS—owners/admins can manage memberships, staff/viewer cannot.
- React 19 + Next.js 15 App Router mandate async server components and suspense-aware data fetching; UI should reuse Shadcn primitives already in the repo.
- Email delivery leverages Resend; local development without API keys should degrade gracefully.

## Open Questions

- Do we adopt Supabase's native `auth.admin.inviteUserByEmail` or a custom invitation token flow for finer-grained UI control?
- Should the revised role taxonomy expand beyond the current enum or map existing `staff`/`viewer` to `Host`/`Server`?
- How do we stage migrations to avoid locking out current users if role strings change in-place?

## Recommendations

- Reuse Supabase auth; focus on enriching profile/membership APIs and UI rather than building parallel JWT systems.
- Introduce a dedicated `restaurant_invites` table with hashed tokens, expiry, and audit fields so the UI can manage invitation lifecycle independently of Supabase system emails.
- Rename/extend role enum via migration + backfill, updating policies atomically to keep RLS aligned with the new permissions matrix.
- Layer TanStack Query hooks for memberships/roles, mirroring `useProfile`, to keep client state consistent and cache-aware.
- Lean on Resend for all invitation communications, supplying branded HTML plus plain-text fallbacks and logging send attempts for auditability.
