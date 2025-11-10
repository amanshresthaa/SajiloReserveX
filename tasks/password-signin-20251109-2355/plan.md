# Implementation Plan: password-based sign-in

## Objective

Allow operators/devs to authenticate with an email + password (in addition to magic links) so guarded pages can be accessed without waiting for email OTPs.

## Success Criteria

- [ ] `/signin` and `/ops/login` show a mode switch for Magic Link vs Password.
- [ ] Password submissions call Supabase `signInWithPassword`, redirect on success, and surface clear errors on failure.
- [ ] Magic-link UX remains unchanged (cooldown, analytics, ARIA status messages).
- [ ] Component tests cover both flows.

## Architecture & Components

- `components/auth/SignInForm`: add UI toggle, password field, shared state for submission, and a new handler for password login.
- `SignInForm` tests ensure both flows behave correctly.
- Router handling: after password success, use Next router to redirect/refresh.

## Data Flow & API Contracts

1. User selects mode (default `magic_link`).
2. For password mode, form requires both email and password.
3. Submit triggers `supabase.auth.signInWithPassword({ email, password })`.
4. On success: track/emit analytics, push user to `redirectedFrom` (defaults to `/my-bookings`), refresh router for SSR hydration.
5. On error: show inline status + analytics error event.

## UI/UX States

- Toggle control (likely two buttons) indicates the active method.
- Password field only visible/enabled in password mode.
- Submit button label mirrors mode (`Send magic link` vs `Sign in with password`).
- Status region maintains existing focus/ARIA behavior.

## Edge Cases

- Invalid password or missing password should show validation error without hitting Supabase.
- Magic-link cooldown shouldn’t affect password submissions.
- Redirect targets must be sanitized (must begin with `/`).

## Testing Strategy

- Extend React Testing Library tests to cover password success + error cases alongside existing magic-link assertions.
- Rely on existing ESLint/typecheck during verification.

## Rollout

- No feature flag; change is additive.
- Document new capability in task notes; warn stakeholders they must provision password-enabled Supabase accounts.
