# Dashboard Auth Guard — Research

## Task Outline & Subtasks

- Inspect current middleware & Supabase helpers to understand existing session refresh patterns.
- Identify project conventions for authenticated layouts/routes (none yet for `(authed)` segment).
- Gather requirements from sprint brief for Story A1: gate `/dashboard` with Supabase session, redirect unauthenticated users to `/login`, ensure we preserve other middleware functionality.

## Findings

- `middleware.ts` currently only refreshes the Supabase session via `getMiddlewareSupabaseClient` and returns `NextResponse.next()` – no auth gating yet.
- `server/supabase.ts` exposes `getMiddlewareSupabaseClient` which wraps `createServerClient` using request/response cookies; we should reuse this to check session inside middleware.
- No `app/(authed)` segment exists yet; `app` directory currently lacks `/dashboard`, so Story A1 will introduce `(authed)/dashboard` layout + page while keeping middleware lean.
- Existing auth flows (e.g., `app/api/stripe/...`) use Supabase clients from `server/supabase.ts` – consistent pattern to follow.
- Sprint acceptance criteria call for redirecting unauthenticated visitors hitting `/dashboard` to `/login` while authenticated users proceed normally.

## Considerations & Risks

- Middleware already executes `supabase.auth.getSession()`; we must avoid duplicate calls but can reuse the result to branch on session presence.
- Need to ensure we don’t break other routes (keep default `NextResponse.next()` for non-dashboard paths).
- Middleware in Next.js runs edge runtime; keep logic minimal (no heavy fetches beyond session call).
- When redirecting, preserve original `request.nextUrl` to optionally pass `redirect` param? Spec doesn’t require yet; keep simple 302 to `/login`.
- Need to add `config.matcher` to target `/dashboard/:path*` while leaving existing middleware behavior for other routes unchanged.

## Open Questions

- None pending; requirements are clear per sprint brief.
