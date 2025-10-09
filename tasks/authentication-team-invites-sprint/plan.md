# Implementation Plan: Authentication & Team Invites

## Objective

Deliver a cohesive authentication + team management experience that leverages Supabase for identity, enforces refreshed role-based access, and enables invitation-driven onboarding for restaurant staff.

## Success Criteria

- [ ] Supabase schema + RLS support `Owner`, `Manager`, `Host`, `Server` roles without breaking existing data.
- [ ] Authenticated pages can resolve the current user’s memberships/permissions without redundant network calls.
- [ ] Owners/Managers can create, revoke, and monitor invitations; invitees can complete onboarding from a tokenised link.
- [ ] Role-guarded UI and APIs block unauthorized access consistently (manual + automated tests).
- [ ] Security critical flows (signin, invite, acceptance, role changes) are covered by unit, integration, and E2E tests.

## Architecture

### Backend

- **Supabase schema**: Extend `restaurant_memberships.role` enum + policies; introduce `restaurant_invites` table with hashed tokens, expiry, status, `invited_by`, and audit timestamps.
- **Server utilities**: New invite service layer co-located with `server/supabase.ts` helpers for creating tokens, upserting memberships, and logging events.
- **API routes**:
  - `/api/team/memberships/me` – current memberships snapshot.
  - `/api/team/invitations` – owners/managers CRUD; pagination + revoke.
  - `/api/team/invitations/[token]` – validation + accept actions.
- **Email delivery**: Reuse `libs/resend.ts`, supply HTML + text templates under `server/emails`.

### Frontend

- **Providers**: Extend `app/providers.tsx` with `AuthContext` bundling Supabase user, resolved memberships, and role helpers.
- **Hooks**: `useMemberships`, `useInvitations` built on TanStack Query to manage caching, optimistic updates, and invalidation.
- **UI**: New `app/(authed)/team` route using Shadcn primitives (table, dialogs, form) for invitation management and team roster; invite acceptance page at `/invite/[token]` built with progressive enhancement.

### State Management

- TanStack Query for server interactions, keyed by `queryKeys.team.*`.
- Context for authenticated session and derived permission helpers.
- Form state handled with React Hook Form + Zod (consistent with existing patterns).

## Data Flow

1. Authenticated user hits `/app/(authed)/team`; middleware verifies session, component resolves `useMemberships`.
2. Invitation creation calls POST `/api/team/invitations`; API validates role, persists hashed token, dispatches Resend email; query cache updates optimistically.
3. Invitee visits `/invite/[token]`; page validates token server-side, renders sign-up form prefilled with email; on submission, Supabase `auth.signUp` + membership linkage executes; token marked accepted.
4. Role edits/removals trigger API calls that update membership row, emit audit logs, and invalidate cached queries across team views.

## API Contracts

- `GET /api/team/memberships/me` → `{ memberships: { restaurantId, role, restaurantName }[] }`
- `POST /api/team/invitations` → body `{ email, role, expiresAt?, restaurantId? }`, response `{ invitationId, inviteUrl }`
- `DELETE /api/team/invitations/:id` → revokes pending invite
- `GET /api/team/invitations` → query params `status`, `page`, `limit`; response includes pagination metadata
- `POST /api/team/invitations/:token/accept` → body `{ name, password }`, response `{ sessionResolved: boolean }`

All endpoints enforce ownership/manager permissions via Supabase RLS and server-side checks.

## UI/UX Considerations

- Mobile-first layouts with responsive tables converted to cards below `md`.
- Inline validation (field-level errors, focus management, `aria-live` updates).
- Loading states: skeletons for team roster, disabled buttons with spinners.
- Error handling: toast + inline messaging, recovery actions (retry, contact support).
- Accessibility: keyboard navigable dialogs, focus-trap for modals, descriptive labels for icon buttons.

## Implementation Steps

1. **Schema Migration** – Update role enum, policies, backfill legacy roles, create `restaurant_invites` table + indexes.
2. **Type Generation & Fixtures** – Regenerate `types/supabase.ts`, update Playwright test helper roles, refresh seed data if required.
3. **Membership API** – Build `/api/team/memberships/me` with service abstraction and TanStack query hook.
4. **Invitation API + Email** – Implement CRUD endpoints, Resend templates, analytics instrumentation.
5. **Team UI** – Build roster + invitation management pages, integrate hooks, wire optimistic updates.
6. **Invite Acceptance Flow** – Create `/invite/[token]`, Supabase sign-up logic, success redirects, failure states.
7. **RBAC Enforcement** – Audit existing route handlers/UI, block unauthorized actions, adjust analytics to capture failures.
8. **Security + Password Recovery** – Add forgot-password entry points, event logging, optional email verification toggle.
9. **Testing & Hardening** – Unit tests (Zod, hooks), integration tests (API routes with Supabase emulator), Playwright E2E for invite lifecycle, accessibility checks.

## Edge Cases

- Token reuse or tampering → reject with 410/403, surface refetch guidance.
- Email already linked to existing member → surface actionable error; optionally resend welcome instructions.
- Supabase downtime or Resend failure → log, return actionable error, provide manual invite fallback (copy link).
- Ownership transfer ensures at least one owner remains; self-removal disallowed.

## Testing Strategy

- **Unit**: Zod schemas, invitation token utilities, permission guards.
- **Integration**: API route tests with Supabase test helpers to validate RLS + data mutations.
- **E2E**: Playwright flows for invite creation → acceptance → role update.
- **Accessibility**: Storybook/Playwright a11y scan, manual keyboard walkthrough.
- **Performance**: Confirm major pages load within existing budgets using React Profiler (goal <200 ms blocking render).

## Rollout Plan

- Feature flag invite UI + role enforcement for gradual enablement.
- Migrate staging database first; run regression suite + manual QA with seeded roles.
- Monitor Resend deliverability logs, Supabase auth events, and analytics for invite completion metrics.
- Roll into production after stakeholder sign-off; maintain rollback script for enum backfill if needed.

## Open Questions

- Should Supabase-managed invitation emails remain enabled as fallback?
- Do restaurants require multi-restaurant memberships at launch or single assignment?
- Are audit logs sufficient in Supabase, or do we need an external log sink (e.g., Inngest)?
