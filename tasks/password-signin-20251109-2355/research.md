# Research: password-based sign-in

## Requirements

- Functional: add a password-based login path so authorized users (and ops) can sign in without magic links, unlocking all supabase-guarded pages for screenshots/QA.
- Non-functional: preserve existing magic-link flow, keep analytics/events accurate, and avoid exposing secrets (password stored only by user).

## Existing Patterns & Reuse

- `/signin` and `/ops/login` render `components/auth/SignInForm`, which currently sends Supabase magic links via `supabase.auth.signInWithOtp`.
- Auth gating in SSR routes (`getServerComponentSupabaseClient`) already relies on Supabase sessions, so leveraging `supabase.auth.signInWithPassword` will immediately unlock all existing guards without further changes.
- Tests under `components/auth/__tests__/SignInForm.test.tsx` cover the current magic-link behavior; we can extend these to cover the password mode.

## External Resources

- [Supabase JS docs – signInWithPassword](https://supabase.com/docs/reference/javascript/auth-signinwithpassword) (available client-side via anon key).

## Constraints & Risks

- Supabase must have at least one user with a password set; otherwise this flow will still fail. Keep UX messaging clear when credentials are invalid.
- Form UX needs to accommodate two auth methods without confusing users; defaulting to magic links maintains current behavior.
- Password errors should not leak exact reasons (Supabase already returns generic messages, but we should sanitize fallback copy).

## Open Questions (owner, due)

- Q: Should password mode be hidden behind an env flag? (owner: engineering, due: before rollout)
  A: default to always-on; revisit if product pushes back.

## Recommended Direction (with rationale)

- Enhance `SignInForm` with a simple toggle (Magic link vs Password) and add a password field when appropriate.
- Reuse the existing Supabase browser client; in password mode call `supabase.auth.signInWithPassword`, then route to the destination and refresh.
- Extend existing unit tests to cover the new flow and ensure analytics hooks are exercised.
