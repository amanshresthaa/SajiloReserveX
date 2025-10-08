# Plan – Magic Link Auth Reset

## Goal

Stabilise the authentication experience by making magic-link the single entry path, fixing session establishment, and deleting stale password-based code. Target outcome: all sign-ins route through a reliable Supabase OTP callback that respects redirects, with updated UI/tests/docs reflecting the new flow.

## Key Decisions

1. **Magic link redirect** — Use `/api/auth/callback` as the email redirect URI, append `redirectedFrom` as a query param, and let the callback route exchange the session before forwarding to the intended page.
2. **Unified sign-in component** — Keep `SignInForm` as the canonical form for all public/owner sign-ins; expose props for heading/description/redirect copy if the owner experience needs custom messaging.
3. **Remove password flows** — Eliminate owner password login, password reset, schemas, and any `signInWithPassword` references/tests/docs.
4. **Analytics simplification** — Update analytics to remove password-specific events (`auth_signin_success` / password method tags) while retaining `auth_signin_viewed`, `auth_signin_attempt`, `auth_magiclink_sent`, and `auth_signin_error`.
5. **Testing** — Rewrite unit tests for `SignInForm` to assert OTP flow, cooldown, and error handling only. Add integration-style test for the callback redirect (e.g., Next route handler unit test).

## Implementation Steps

1. **Refactor magic link target**
   - Update `SignInForm` to compute `emailRedirectTo` as `${origin}/api/auth/callback?redirectedFrom=${encodeURIComponent(targetPath)}`.
   - Guard against non-browser usage (fallback to config domain if `window` undefined).
   - Adjust success status copy if needed (e.g., emphasise check inbox).

2. **Enhance auth callback route**
   - Accept optional `redirectedFrom` param, default to `/dashboard`.
   - After `exchangeCodeForSession`, redirect to decoded destination (validate to avoid open redirect).
   - Provide fallback to `config.auth.callbackUrl` if param missing/invalid.
   - Add explicit error logging when code is missing/invalid (for debugging) but still redirect user gracefully.

3. **Unify owner experience**
   - Replace `/owner/sign-in` page with wrapper around `SignInForm`, reusing `AuthPage` layout but removing password inputs.
   - Remove `/owner/reset-password/*` routes, `lib/owner/auth/schema` password bits, and password-specific copy.
   - For `/owner/sign-up`, switch to invite / call-to-action (if sign-up is no longer self-service) or convert to simple CTA instructing to request access (confirm with product). If sign-up retained, update to magic link request rather than password creation. (Pending confirmation—document assumption.)

4. **Cleanup dependencies & docs**
   - Delete password validation helpers/tests referencing `signInWithPassword`.
   - Update `docs/auth-signin.md` to reflect single-mode flow.
   - Adjust analytics typings (`lib/analytics.ts`, emitter union) to remove unused events or update descriptions.
   - Ensure `app/api/test/playwright-session/route.ts` uses service-role `admin.generateLink` / direct OTP if still needed for tests; otherwise document manual sign-in for tests.

5. **Testing strategy (TDD)**
   - Rewrite `components/auth/SignInForm.test.tsx` to cover: initial render, OTP submission success, error path, cooldown disabling button.
   - Add unit test for `app/api/auth/callback` route verifying redirect logic and session exchange invocation.
   - Update e2e fixtures if they rely on password login (e.g., `tests/e2e/profile/auth-session.spec.ts`); switch to seeding Supabase session via tokens or service client.

6. **Manual verification checklist**
   - Run `pnpm vitest components/auth/__tests__/SignInForm.test.tsx`.
   - Run route handler tests (new) via `pnpm vitest app/api/auth/callback.test.ts`.
   - Smoke test locally: request magic link, ensure redirect hits callback then land on `/dashboard`, confirm server page loads without auth error.
   - Ensure owner sign-in page routes to same flow and no password UI remains.

## Open Questions

- Should owner self-serve sign-up remain (with passwordless invites) or be deferred? (Assume deprecation unless user clarifies.)
- For existing seeded Supabase users with passwords, do we need migration messaging?
- How should Playwright tests authenticate without password (reuse service role to create session cookie?).
