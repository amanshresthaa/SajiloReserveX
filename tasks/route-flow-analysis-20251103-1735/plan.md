# Implementation Plan: Route & Flow Analysis

## Objective

Provide an in-depth analysis of all routes, their start→finish flows, redirects, and E2E coverage to enable alignment and targeted fixes.

## Success Criteria

- [ ] Clear mapping of major flows (customer, marketing, invitee, ops)
- [ ] Guard/redirect rules summarized with code refs
- [ ] E2E coverage gaps and concrete next steps listed

## Architecture & Components

- App Router server components for guard redirects
- Booking wizard (`components/reserve/**`, `reserve/features/**`)
- Thank-you page (`src/app/thank-you/page.tsx`) with optional token fetch
- Ops pages under `src/app/(ops)/ops/(app)/**`

## Data Flow & API Contracts (Key)

- POST `/api/bookings` → `{ booking, bookings[], confirmationToken? }`
- GET `/api/bookings/confirm?token=...` → `{ booking } | { error, code }`
- POST `/api/team/invitations/:token/accept` → `{ email, role, ... } | { error }`

## UI/UX States (Key)

- Wizard: inline success, then Close → `/thank-you`
- Thank-you: loading/error/success (with token) and generic idle state

## Edge Cases

- Missing/expired/used confirmation token on thank-you
- Invite acceptance error paths (network/server/validation)

## Testing Strategy

- Smoke tests for uncovered marketing/content routes
- Add E2E click-through for wizard Close → `/thank-you`
- Fix restaurant-settings route in E2E

## Rollout

- If changing thank-you gating or token deep-link, introduce behind a feature flag and update tests accordingly.
