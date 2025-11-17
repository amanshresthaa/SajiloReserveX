---
task: guest-account-revamp
timestamp_utc: 2025-11-17T00:54:03Z
owner: github:@assistant
reviewers: [github:@maintainers]
risk: high
flags: [feat.guest_account_revamp]
related_tickets: []
---

# Implementation Plan: Guest Account Revamp

## Objective

Enable guests to quickly access invites, bookings, and profile with a modern, trustworthy UX while meeting accessibility and performance goals.

## Success Criteria

- [ ] Improved completion rate invite → account → booking view (track via analytics).
- [ ] Clear primary actions on bookings and profile; reduced drop-off/errors on core actions.
- [ ] WCAG 2.1 AA focus/contrast/labels verified.
- [ ] Feature flag `feat.guest_account_revamp` controlling rollout.

## Architecture & Components

- IA: top-level guest layout with clear sections for Invites, Bookings, Profile.
- Components: reuse shadcn/buttons, cards, tabs or segmented controls, status chips, list/detail cards, form controls, toasts, dialogs/modals where needed for cancel/reschedule.
- State: keep existing data-fetching hooks/services; enhance UI state (loading/empty/error) per page.
- URL/state: preserve existing routes; consider query params for filters (past/upcoming) if available.

## Data Flow & API Contracts

- Reuse existing services for invites/bookings/profile updates; no contract changes planned initially.
- Add error handling surfaces and optimistic/confirm flows where appropriate (respect business rules).

## UI/UX States

- Invite: success, expired/invalid, already used; CTA to sign in/create account.
- Bookings: loading, empty, upcoming/past tabs; card list; detail view with status, itinerary, guests, payment summary; actions for reschedule/cancel/support/print.
- Profile: view/edit forms with validation; preferences toggles; language/communication choices; password reset handoff.
- Global: inline errors, toasts, focus management; skeletons/placeholders for loading.

## Edge Cases

- Invite expired/invalid/already used; offline/network errors; missing booking; restricted actions (cancellation cutoff); partial profile data; localization fallback.

## Testing Strategy

- Unit: UI logic for status chips, formatting, and form validation.
- Integration: booking list/detail flows, invite states, profile save with API mocks.
- Accessibility: axe where applicable; manual keyboard checks per page.
- Manual QA: Chrome DevTools MCP with mobile/tablet/desktop emulation; perf snapshot.

## Rollout

- Feature flag: `feat.guest_account_revamp` (default off). Gradual enablement or A/B.
- Monitoring: existing analytics + error logging; track invite completion, booking action clicks, profile save success.
- Kill-switch: disable flag to revert to current experience.

## DB Change Plan (if applicable)

- None expected (UI-only). If contracts change, follow staging-first remote migration plan.
