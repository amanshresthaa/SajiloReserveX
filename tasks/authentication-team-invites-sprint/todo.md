# Implementation Checklist

## Setup

- [x] Draft Supabase migration for role enum + `restaurant_invites` table
- [ ] Run local `supabase db reset` + regenerate `types/supabase.ts`
- [ ] Create feature flag scaffold for team invites UI

## Core Functionality

- [x] Implement `/api/team/memberships/me` endpoint + hook
- [x] Build invitation CRUD endpoints with Resend integration
- [x] Add invite acceptance flow tying Supabase auth signup + membership linkage
- [ ] Update RBAC enforcement across existing APIs/UI for new role set

## UI/UX

- [x] Ship team roster & invite management page (mobile-first, Shadcn components)
- [x] Create invitation dialogs/forms with inline validation & loading states
- [x] Implement `/invite/[token]` signup experience with error handling + success redirect

## Testing

- [ ] Write unit tests for validation, hooks, and token utilities
- [ ] Add integration tests for invitation + membership endpoints
- [ ] Extend Playwright suite to cover invite creation → acceptance → role change
- [ ] Perform accessibility audit (keyboard, screen reader) on new pages

## Documentation

- [ ] Update README/docs with new roles + invite workflow
- [ ] Add API reference entries for new endpoints
- [ ] Record deployment/rollback runbook for schema changes

## Questions/Blockers

- Confirm role mapping strategy between legacy `staff/viewer` and new `Host/Server`
- Decide on Supabase native invites vs bespoke token emails for production rollout
