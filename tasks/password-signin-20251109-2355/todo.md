# Implementation Checklist

## Setup

- [x] Update `SignInForm` component to support dual auth modes.

## Core

- [x] Add UI toggle + password field bound to form state.
- [x] Implement Supabase `signInWithPassword` handler with analytics, routing, and status messaging.
- [x] Preserve existing magic-link logic (cooldown, messaging).

## Tests

- [x] Extend `components/auth/__tests__/SignInForm.test.tsx` to cover password success/failure flows.

## Notes

- Assumptions: Supabase already has at least one password-enabled user.
- Deviations: none yet.
