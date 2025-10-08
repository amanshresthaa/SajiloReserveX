# Research – Magic Link Auth Reset

## Current Sign-in UX

- **Primary user sign-in (`/signin`)**
  - Implemented via `components/auth/SignInForm.tsx`.
  - Form currently supports **magic-link only**: single email field + “Send magic link” button, cooldown and analytics events.
  - Calls `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin + targetPath } })`. `targetPath` defaults to `/dashboard` or provided `redirectedFrom`.
  - No use of `/auth/callback`; magic link lands directly on target route, so Supabase never executes `exchangeCodeForSession`, causing errors like `"User from sub claim in JWT does not exist"` on protected pages.
- **Owner auth (`/owner/sign-in`)**
  - Located in `app/(public)/owner/sign-in/page.tsx`. Uses password inputs + `supabase.auth.signInWithPassword`.
  - References schema in `lib/owner/auth/schema.ts` (password validations).
  - Provides reset/verify flows; this is likely the “legacy” password experience to deprecate in favour of unified magic-link.
- **Auth callback route**
  - `app/api/auth/callback/route.ts` expects `?code=` and exchanges it via `supabase.auth.exchangeCodeForSession(code)` before redirecting to `config.auth.callbackUrl`. Currently unused because magic link skip this path.

## Server Usage & Errors

- Protected pages (`app/(authed)/profile/manage/page.tsx`, etc.) call `getServerComponentSupabaseClient().auth.getUser()`. Missing session after magic-link redirect triggers Supabase error: `"User from sub claim in JWT does not exist"` which is logged at `[profile/manage] auth resolution failed`.
- API routes also call `getRouteHandlerSupabaseClient()` and expect valid JWT in cookies.
- `server/supabase.ts` configures `DEFAULT_RESTAURANT_FALLBACK_ID` and caches default restaurant IDs; relevant for ensuring auth session resolves before hitting DB.

## Legacy / Mismatched Artefacts

- `components/auth/__tests__/SignInForm.test.tsx` and `docs/auth-signin.md` still describe dual-mode (password + magic link) flows, including toggles and analytics events `auth_signin_success`. Tests mock `signInWithPassword`, `signInWithOtp`, router replace/refresh.
- `lib/owner/auth/schema.ts`, `/owner/reset-password` etc. provide password logic inconsistent with current product direction.
- `app/(public)/owner/sign-in` references `AuthPage` layout and toast-driven password errors; should be removed or redesigned if we consolidate flows.
- Analytics events in `lib/analytics.ts` expect both password + magic link outcomes; removing password may require pruning `'auth_signin_success'` (password-specific) or redefining semantics.

## Supabase Client Patterns

- Browser client created via `lib/supabase/browser.ts` using singleton `createBrowserClient`.
- Server helpers (`getServerComponentSupabaseClient`, `getRouteHandlerSupabaseClient`, `getServiceSupabaseClient`) centralised in `server/supabase.ts`.
- Test utilities (`app/api/test/playwright-session/route.ts`) still use `signInWithPassword` for generating sessions; may need alternative if password login removed.

## Outstanding Questions / Risks

- Need to confirm desired redirect location after magic link sign-in (e.g., should respect `redirectedFrom` or default to dashboard?).
- Owner dashboard: do we still support dedicated owner login, or unify with general sign-in? If deprecated, remove related routes & schemas.
- How to seed or manage Supabase users for tests when only magic links exist? `signInWithOtp` can still be used for integration, but test helpers may need update.
