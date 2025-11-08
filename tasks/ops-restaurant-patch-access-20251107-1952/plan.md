# Implementation Plan: Ops restaurant PATCH access

## Objective

Allow restaurant managers (in addition to owners) to PATCH restaurant settings via `/api/ops/restaurants/:id`, eliminate the bespoke role logic, and keep GET/DELETE authorization consistent using shared helpers.

## Success Criteria

- [ ] PATCH endpoint succeeds for owner and manager roles, fails for others with 403.
- [ ] GET still works for any member and includes their role in response.
- [ ] DELETE remains owner-only.
- [ ] No changes to response payloads apart from role accuracy.

## Architecture & Components

- `src/app/api/ops/restaurants/[id]/route.ts`
  - Replace `verifyRestaurantAccess` with helper calls from `server/team/access.ts`.
  - Add shared error-normalization helper (reuse from logo route) to interpret Supabase membership errors.

## Data Flow & API Contracts

- Requests/responses remain the same; only auth gating changes.
- Error responses stay `{ error: string }`.

## UI/UX States

- No UI work; ensure API errors stay consistent so existing toasts continue to work.

## Edge Cases

- Missing memberships → 403.
- Auth resolution failures → 500 (existing behavior).
- Unexpected Supabase issues when fetching membership also → 500.

## Testing Strategy

- `pnpm lint` (required for bug fixes; same as repo standard).
- Manual API verification deferred (server-only change) but log instructions in verification doc.

## Rollout

- No feature flag. Deploy normally; managers should now be able to save restaurant settings.
